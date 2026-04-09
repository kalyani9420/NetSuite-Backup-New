/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/ui/serverWidget", "N/error"], /**
 * @param{record} record
 */ (record, search, serverWidget, error) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {
    try {
      var projectForm = scriptContext.form;
      var projectObj = scriptContext.newRecord;
    } catch (error) {
      log.debug("Error : ", error.toString());
    }
  };

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {};

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */

  const afterSubmit = (scriptContext) => {
    try {
      var projectId = scriptContext.newRecord.id;
      var projectObj = scriptContext.newRecord;
      var budgetArray = {
        Billing: 0.0,
        Cost: 0.0,
      };

      var isInitialApproved = projectObj.getValue({
        fieldId: "custentity_inital_approved",
      });

      var approvalStatus = projectObj.getValue({
        fieldId: "custentity_project_approval_status",
      });

      var costHistory = projectObj.getValue({
        fieldId: "custentity_cost_budget_history",
      });

      var billHistory = projectObj.getValue({
        fieldId: "custentity_billing_budget_history",
      });

      var projectBudget = getProjectBudget(projectId);
      log.debug("approvalStatus", approvalStatus);
      log.debug("costHistory", costHistory);
      log.debug("billHistory", billHistory);

      //Trigger Intial Approval
      if (projectBudget != 0 && isInitialApproved == false) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: projectId,
          values: {
            custentity_pl_trigger_approval: true,
          },
        });

        log.debug("id ", id);
      } else if (projectBudget == 0) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: projectId,
          values: {
            custentity_pl_trigger_approval: false,
          },
        });

        log.debug("id ", id);
      } else {
        log.debug("invalid ", "invalid ");
      }

      if (projectBudget != 0) {
        for (var index = 0; index < projectBudget.length; index++) {
          var budgetType = projectBudget[index].getText({
            name: "type",
            join: "projectBudget",
            summary: "GROUP",
            label: "Budget Type",
            sort: search.Sort.ASC,
          });
          var budgetAmount = projectBudget[index].getValue({
            name: "amount",
            join: "projectBudget",
            summary: "SUM",
            label: "Amount",
          });

          //   log.debug("", budgetType + " " + budgetAmount);
          if (budgetType == "Billing") {
            budgetArray["Billing"] = budgetAmount;
          } else if (budgetType == "Cost") {
            budgetArray["Cost"] = budgetAmount;
          } else {
            log.debug("Invalid Category found");
          }
        }

        log.debug("budget : ", budgetArray);
      }

      //comparing history
      if (isInitialApproved == true && (approvalStatus == '2' || approvalStatus == '4' || approvalStatus == '5' || approvalStatus == '6' || approvalStatus == '7')) {
        log.debug("Log : ", "Log 1 ");
        // if (_logValidation(costHistory) || _logValidation(billHistory)) {
          log.debug("Log : ", "Log 2 ");
          if (
            parseFloat(costHistory) != budgetArray["Cost"] ||
            parseFloat(billHistory) != budgetArray["Billing"]
          ) {
            log.debug("Log : ", "Log 3 ");
            //keeping history
            var id = record.submitFields({
              type: record.Type.JOB,
              id: projectId,
              values: {
                custentity_project_approval_status: 4,
                custentity_cost_budget_history: budgetArray["Cost"],
                custentity_billing_budget_history: budgetArray["Billing"],
              },
            });
          }
        // } else {
        //   log.debug("Note :", "No budget history found");
        // }
      }
      else{
        log.debug("Note : ", "Initial Budget has not approved yet ");
      }

      log.debug("budget id : ", id);
    } catch (error) {
      log.debug("Error : ", error.toString());
    }
  };

  function _logValidation(value) {
    if (
      value != null &&
      value != "" &&
      value != "null" &&
      value != undefined &&
      value != "undefined" &&
      value != "@NONE@" &&
      value != "NaN"
    ) {
      return true;
    } else {
      return false;
    }
  }

  function getProjectBudget(projectId) {
    try {
      var jobSearchObj = search.create({
        type: "job",
        filters: [
          ["internalidnumber", "equalto", projectId],
          "AND",
          ["projectbudget.type", "anyof", "COST", "BILLING"],
        ],
        columns: [
          search.createColumn({
            name: "type",
            join: "projectBudget",
            summary: "GROUP",
            label: "Budget Type",
            sort: search.Sort.ASC,
          }),
          search.createColumn({
            name: "amount",
            join: "projectBudget",
            summary: "SUM",
            label: "Amount",
          }),
        ],
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var projectBudget = jobSearchObj.run().getRange(0, 100);

      if (searchResultCount > 0) {
        log.debug("projectBudget result ", projectBudget.length);
        return projectBudget;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error 2 : ", error.toString());
    }
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});
