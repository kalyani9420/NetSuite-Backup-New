/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/ui/serverWidget"], /**
 * @param{record} record
 */ (record, search, serverWidget) => {
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

      var isInitialApproved = projectObj.getValue({
        fieldId: "custentity_inital_approved",
      });

      var projectBudget = getProjectBudget(projectId);
      log.debug("projectBudget", projectBudget);

      if (projectBudget != 0 && isInitialApproved == false) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: projectId,
          values: {
            custentity_pl_trigger_approval: true,
          },
        });

        log.debug("id ", id);
      } 
      else if (projectBudget == 0) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: projectId,
          values: {
            custentity_pl_trigger_approval: false,
          },
        });

        log.debug("id ", id);
      }
      else {
      }
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
          ["projectbudget.type", "anyof", "BILLING", "COST"],
        ],
        columns: [
          search.createColumn({
            name: "projectcostcategory",
            join: "projectBudget",
            summary: "GROUP",
            label: "Cost Category",
            sort: search.Sort.ASC,
          }),
          search.createColumn({
            name: "amount",
            join: "projectBudget",
            summary: "GROUP",
            label: "Amount",
          }),
        ],
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var projectBudget = jobSearchObj.run().getRange(0, 100);

      if (searchResultCount > 0) {
        return projectBudget;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error : ", error.toString());
    }
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});
