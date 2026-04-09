/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define([
  "N/currentRecord",
  "N/record",
  "N/task",
  "N/search",
  "N/email",
  "N/url",
], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record, task, search, email, url) => {
  /**
   * Defines the WorkflowAction script trigger point.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
   * @param {string} scriptContext.type - Event type
   * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
   * @since 2016.1
   */
  const onAction = (scriptContext) => {
    log.debug("WorkflowAction 2", "WorkflowAction 2");

    try {
      var projectObj = scriptContext.newRecord;
      var projectId = scriptContext.newRecord.id;

      var projectCode = projectObj.getValue({
        fieldId: "entityid",
      });
      log.debug("projectCode", projectCode);
      log.debug("scriptContext.newRecord", scriptContext.newRecord);

      sendApprovalRequest(projectId, projectCode);
    } catch (error) {
      log.debug("Error 1 : ", error.toString());
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

  function getProjectBudget(projectId, budgetType) {
    try {
      var jobSearchObj = search.create({
        type: "job",
        filters: [
          ["internalidnumber", "equalto", projectId],
          "AND",
          ["projectbudget.type", "anyof", budgetType],
          // "AND",
          // ["projectbudget.type", "anyof", "COST", "BILLING"],
        ],
        columns: [
          search.createColumn({
            name: "type",
            join: "projectBudget",
            summary: "GROUP",
            label: "Budget Type",
          }),
          search.createColumn({
            name: "amount",
            join: "projectBudget",
            summary: "SUM",
            label: "Amount",
            sort: search.Sort.ASC,
          }),
        ],
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var projectBudget = jobSearchObj.run().getRange(0, 100);

      if (searchResultCount > 0) {
        var budgetAmount = projectBudget[0].getValue({
          name: "amount",
          join: "projectBudget",
          summary: "SUM",
          label: "Amount",
          sort: search.Sort.ASC,
        });
        return budgetAmount;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error 2 : ", error.toString());
    }
  }

  function sendApprovalRequest(projectId, projectCode) {
    try {
      var projectManager;
      var projectOwner;
      var cost_projectBudget;
      var billing_projectBudget;
      var totalProfitBudget;
      var projectAlternateBudgetMail;
      cost_projectBudget = parseFloat(getProjectBudget(projectId, "COST"));
      billing_projectBudget = parseFloat(
        getProjectBudget(projectId, "BILLING")
      );
      totalProfitBudget = billing_projectBudget - cost_projectBudget;
      log.debug(" ", cost_projectBudget, " ", billing_projectBudget);
      ProjectfieldLookUp = search.lookupFields({
        type: record.Type.JOB,
        id: projectId,
        columns: [
          "projectmanager",
          "custentity_project_owner",
          "custentity_project_approval_status",
          "custentity_budget_notification"
        ],
      });

      if (_logValidation(ProjectfieldLookUp.custentity_project_owner[0])) {
        projectOwner = ProjectfieldLookUp.custentity_project_owner[0].value;
      } else {
        log.debug("Error : ", "Project Owner Not defined");
      }
      if (_logValidation(ProjectfieldLookUp.projectmanager[0])) {
        projectManager = ProjectfieldLookUp.projectmanager[0].value;
      } else {
        log.debug("Error : ", "Project Manager Not defined");
      }
      if (_logValidation(ProjectfieldLookUp.custentity_budget_notification[0])) {
        projectAlternateBudgetMail = ProjectfieldLookUp.custentity_budget_notification[0].value;
      } else {
        log.debug("Error : ", "Alternate Budget Mail Not defined");
      }
      if (
        _logValidation(ProjectfieldLookUp.custentity_project_approval_status[0])
      ) {
        var approvalStatus =
          ProjectfieldLookUp.custentity_project_approval_status[0].value;
      }

      log.debug(" Owner : Manager ", projectOwner + " " + projectManager);

      if (cost_projectBudget != 0 || billing_projectBudget != 0) {
        var SuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_pre_pl_approval",
          deploymentId: "customdeploy_sl_pre_pl_approval",
          returnExternalUrl: true,
        });
        var ApproveSuiteletUrl =
          SuiteletUrl + "&projectId=" + projectId + "&response=approve";

        var RejectSuiteletUrl =
          SuiteletUrl + "&projectId=" + projectId + "&response=reject";

        var htmlTable = "";
        htmlTable += "<html>";
        htmlTable += "<body>";
        htmlTable += "<div>";
        htmlTable += "<p>" + "Hello, " + "</p>";

        if (
          approvalStatus == "4" ||
          approvalStatus == "5" ||
          approvalStatus == "7"
        ) {
          htmlTable +=
            "<p>" +
            "Project budget has been modified for " +
            projectCode +
            " and requires your approval " +
            "</p>";
        } else {
          htmlTable +=
            "<p>" +
            "Project budget has been generated for " +
            projectCode +
            " and requires your approval " +
            "</p>";
        }

        htmlTable += "<br>";
        htmlTable += "</div>";
        htmlTable +=
          '<table style="border-collapse: collapse; width: 80%; font-family: Arial, sans-serif; font-size: 14px;border: 1px solid #505050;">';

        // Header Row
        // htmlTable += "<thead>";
        // htmlTable +=
        //   '<tr style="background-color: #f2f2f2; text-align: left; border-bottom: 1px solid #505050;">';
        // htmlTable += "<th style='padding: 10px;'>Budget Type</th>";
        // htmlTable += "<th style='padding: 10px;'>Total</th>";
        // htmlTable += "</tr>";
        // htmlTable += "</thead>";

        htmlTable += "<tbody>";

        //Billing
        htmlTable += "<tr style='border-bottom: 1px solid #505050;'>";
        htmlTable += "<td style='padding: 8px;'>Billing Budget  </td>";
        htmlTable +=
          "<td style='padding: 8px;'>" +
          formatIndianNumber(billing_projectBudget) +
          ".00" +
          "</td>";
        htmlTable += "</tr>";

        // Costing Row
        htmlTable += "<tr style='border-bottom: 1px solid #505050;'>";
        htmlTable += "<td style='padding: 8px;'>Costing Budget  </td>";
        htmlTable +=
          "<td style='padding: 8px;'>" +
          formatIndianNumber(cost_projectBudget) +
          ".00" +
          "</td>";
        htmlTable += "</tr>";

        htmlTable +=
          "<tr style='background-color: #f2f2f2; text-align: left; border-bottom: 1px solid #505050;'>";
        htmlTable += "<td style='padding: 8px;'>Profit  </td>";
        htmlTable +=
          "<td style='padding: 8px;'>" +
          formatIndianNumber(totalProfitBudget) +
          ".00" +
          "</td>";
        htmlTable += "</tr>";

        htmlTable += "</tbody>";

        htmlTable += "</table>";
        htmlTable += "</body>";
        htmlTable += "</html>";

        htmlTable += "<br>";
        htmlTable += "<br>";
        htmlTable +=
          "<a style='color:#ffffff' href='" + ApproveSuiteletUrl + "'>";
        htmlTable +=
          '<button style="border: 2px #607799; padding: 15px 25px; border-radius: 4px; background-color:#607799; " >Approve</button>';
        htmlTable += "</a>";
        htmlTable +=
          "<a style='color:#ffffff' href='" +
          RejectSuiteletUrl +
          "' onclick='window.open(this.href,'targetWindow', 'width=200, height=200'); return false;' >";
        htmlTable +=
          '<button style=" border: 2px #607799; padding: 15px 32px; border-radius: 4px; background-color:#607799; margin-left:20px ">Reject</button>';
        htmlTable += "</a>";

        // <a href="URL TO YOUR PAGE" onclick="window.open(this.href,'targetWindow', 'width=500, height=500'); return false;">Your link text</a>

        log.debug("htmlTable : ", htmlTable);
        var mailSubject = "Project Budget Approval : " + projectCode;

        if (projectManager != "" && projectOwner != "") {
          email.send({
            author: projectManager,
            recipients: projectOwner,
            subject: mailSubject,
            body: htmlTable,
          });
          log.debug("Mail Sent", "Mail Sent");

          var outOfOfficeApproverLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: projectOwner,
            columns: [
              "custentity_oof_alternate_approver",
              "custentity_oof_from_date",
              "custentity_oof_to_date",
            ],
          });

          if(_logValidation(projectAlternateBudgetMail)){
            email.send({
              author: projectManager,
              recipients: projectAlternateBudgetMail,
              subject: mailSubject,
              body: htmlTable,
            });
            log.debug("Mail Sent to alternate budget mail", "Mail Sent to alternate budget mail");
          }

          if (
            outOfOfficeApproverLookup.custentity_oof_alternate_approver.length >
              0 &&
            outOfOfficeApproverLookup.custentity_oof_from_date != "" &&
            outOfOfficeApproverLookup.custentity_oof_to_date != ""
          ) {
            var nextApprover =
              outOfOfficeApproverLookup.custentity_oof_alternate_approver[0]
                .value;
            log.debug("nextApprover", nextApprover);
            email.send({
              author: projectManager,
              recipients: nextApprover,
              subject: mailSubject,
              body: htmlTable,
            });
          }


          log.debug("Mail Sent to Next Approver", "Mail Sent to Next Approver");
        } else {
          log.debug(
            "Note : ",
            "Project Manager or Owner has not assign to project"
          );
        }
      } else {
        log.debug("Note : ", "Pre P&L has not created for project yet");
      }
    } catch (error) {
      log.debug("Error 3 ", error);
    }
  }

  function formatIndianNumber(num) {
    return num.toLocaleString("en-IN");
  }

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

  return { onAction };
});
