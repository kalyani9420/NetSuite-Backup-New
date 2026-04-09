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
            summary: "SUM",
            label: "Amount",
          }),
          search.createColumn({
            name: "projectmanager",
            label: "Project Manager",
            summary: "GROUP",
          }),
          search.createColumn({
            name: "custentity_project_owner",
            label: "Project Owner",
            summary: "GROUP",
          }),
          search.createColumn({
            name: "entityid",
            label: "Job ID",
            summary: "GROUP",
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

  function sendApprovalRequest(projectId, projectCode) {
    try {
      var i = 0;
      var j = 0;
      var costRow = "";
      var billRow = "";
      var projectManager;
      var projectOwner;
      var costJSON = {
        Labor: "0.0",
        Expense: "0.0",
        Other: "0.0",
        Supplier: "0.0",
      };
      var billJSON = {
        Labor: "0.0",
        Expense: "0.0",
        Other: "0.0",
        Supplier: "0.0",
      };

      //cost budget

      var cost_projectBudget;
      var billing_projectBudget;
      cost_projectBudget = getProjectBudget(projectId, "COST");

      log.debug(" ", projectManager + " " + projectOwner + " " + projectCode);

      log.debug("cost_projectBudget", cost_projectBudget.length);

      if (cost_projectBudget != 0) {
        projectManager = cost_projectBudget[0].getValue({
          name: "projectmanager",
          label: "Project Manager",
          summary: "GROUP",
        })
          ? cost_projectBudget[0].getValue({
              name: "projectmanager",
              label: "Project Manager",
              summary: "GROUP",
            })
          : "";

        projectOwner = cost_projectBudget[0].getValue({
          name: "custentity_project_owner",
          label: "Project Owner",
          summary: "GROUP",
        })
          ? cost_projectBudget[0].getValue({
              name: "custentity_project_owner",
              label: "Project Owner",
              summary: "GROUP",
            })
          : "";

        log.debug(" if costRow", " if costRow");
        while (i < cost_projectBudget.length) {
          var budgetCost = cost_projectBudget[i].getValue({
            name: "amount",
            join: "projectBudget",
            summary: "SUM",
            label: "Amount",
          })
            ? cost_projectBudget[i].getValue({
                name: "amount",
                join: "projectBudget",
                summary: "SUM",
                label: "Amount",
              })
            : 0.0;

          var budgetCategory = cost_projectBudget[i].getText({
            name: "projectcostcategory",
            join: "projectBudget",
            summary: "GROUP",
            label: "Cost Category",
            sort: search.Sort.ASC,
          })
            ? cost_projectBudget[i].getText({
                name: "projectcostcategory",
                join: "projectBudget",
                summary: "GROUP",
                label: "Cost Category",
                sort: search.Sort.ASC,
              })
            : 0.0;

          costJSON[budgetCategory] = budgetCost;
          i++;
        }
      }

      log.debug("costJSON", costJSON);

      billing_projectBudget = getProjectBudget(projectId, "BILLING");

      log.debug("billing_projectBudget", billing_projectBudget);

      if (billing_projectBudget != 0) {
        projectManager = billing_projectBudget[0].getValue({
          name: "projectmanager",
          label: "Project Manager",
          summary: "GROUP",
        })
          ? billing_projectBudget[0].getValue({
              name: "projectmanager",
              label: "Project Manager",
              summary: "GROUP",
            })
          : "";

        projectOwner = billing_projectBudget[0].getValue({
          name: "custentity_project_owner",
          label: "Project Owner",
          summary: "GROUP",
        })
          ? billing_projectBudget[0].getValue({
              name: "custentity_project_owner",
              label: "Project Owner",
              summary: "GROUP",
            })
          : "";

        while (j < billing_projectBudget.length) {
          var budgetCost = billing_projectBudget[j].getValue({
            name: "amount",
            join: "projectBudget",
            summary: "SUM",
            label: "Amount",
          })
            ? billing_projectBudget[j].getValue({
                name: "amount",
                join: "projectBudget",
                summary: "SUM",
                label: "Amount",
              })
            : 0.0;

          var budgetCategory = billing_projectBudget[j].getText({
            name: "projectcostcategory",
            join: "projectBudget",
            summary: "GROUP",
            label: "Cost Category",
            sort: search.Sort.ASC,
          })
            ? billing_projectBudget[j].getText({
                name: "projectcostcategory",
                join: "projectBudget",
                summary: "GROUP",
                label: "Cost Category",
                sort: search.Sort.ASC,
              })
            : 0.0;

          billJSON[budgetCategory] = budgetCost;
          j++;
        }
      }

      log.debug("billJSON", billJSON);

      if (cost_projectBudget != 0 || billing_projectBudget != 0) {
        var SuiteletUrl = url.resolveScript({
          scriptId: "customscript_sl_pre_pl_approval",
          deploymentId: "customdeploy_sl_pre_pl_approval",
          returnExternalUrl: true,
        });

        // var DomainUrl = url.resolveDomain({
        //   hostType: url.HostType.APPLICATION,
        // });

        var ApproveSuiteletUrl =
          SuiteletUrl + "&projectId=" + projectId + "&response=approve";

        var RejectSuiteletUrl =
          SuiteletUrl + "&projectId=" + projectId + "&response=reject";

        var CostTotal =
          parseFloat(costJSON["Labor"]) +
          parseFloat(costJSON["Expense"]) +
          parseFloat(costJSON["Other"]) +
          parseFloat(costJSON["Supplier"]);
        var BillTotal =
          parseFloat(billJSON["Labor"]) +
          parseFloat(billJSON["Expense"]) +
          parseFloat(billJSON["Other"]) +
          parseFloat(billJSON["Supplier"]);

        log.debug("Total : ", CostTotal + " " + BillTotal);

        // var htmlTable = "";
        // htmlTable += "<html>";
        // htmlTable += "<body>";
        // htmlTable += "<div>";
        // htmlTable += "<p>" + "Hello, " + "</p>";
        // htmlTable +=
        //   "<p>" +
        //   "Please find below the project budget for your approval. " +
        //   "</p>";
        // htmlTable += "<p>" + "Project Id : " + projectCode + "</p>";
        // htmlTable += "<br>";
        // htmlTable += "</div>";
        // htmlTable +=
        //   '<table style="text-align: center; width:60% ; padding-top: 10px; font-size: 13px;">';
        // htmlTable +=
        //   '<tr style="border: 1.3px solid #000000; text-align: left; background-color: #607799";>';
        // htmlTable +=
        //   '<th style="border: 1.3px solid #000000; text-align: left; padding: 8px; width: 70px; color : #ffffff">' +
        //   "Budget Type" +
        //   "</th>";
        // htmlTable +=
        //   '<th style="border: 1.3px solid #000000; text-align: left; padding: 8px; width: 70px; color : #ffffff">' +
        //   "Labor" +
        //   "</th>";
        // htmlTable +=
        //   '<th style="border: 1.3px solid #000000; text-align: left; padding: 8px; width: 70px; color : #ffffff">' +
        //   "Expense" +
        //   "</th>";
        // htmlTable +=
        //   '<th style="border: 1.3px solid #000000; text-align: left; padding: 8px; width: 70px; color : #ffffff">' +
        //   "Supplier" +
        //   "</th>";
        // htmlTable +=
        //   '<th style="border: 1.3px solid #000000; text-align: left; padding: 8px; width: 70px; color : #ffffff">' +
        //   "Other" +
        //   "</th>";

        // htmlTable +=
        //   '<th style="border: 1.3px solid #000000; text-align: left; padding: 8px; width: 70px; color : #ffffff">' +
        //   "Total" +
        //   "</th>";
        // htmlTable += "</tr>";

        // htmlTable += '<tr style="border: 1.3px solid #000000; text-align: left;";>';
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   "Costing" +
        //   "</td>";

        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   costJSON["Labor"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   costJSON["Expense"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   costJSON["Supplier"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   costJSON["Other"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   parseFloat(CostTotal) +
        //   "</td>";

        // htmlTable += "</tr>";

        // htmlTable += '<tr style="border: 1.3px solid #000000; text-align: left;";>';
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   "Billing" +
        //   "</td>";

        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   billJSON["Labor"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   billJSON["Expense"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   billJSON["Supplier"] +
        //   "</td>";
        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   billJSON["Other"] +
        //   "</td>";

        // htmlTable +=
        //   '<td style="border: 1.3px solid #000000; text-align: left; padding: 5px; width:30%;">' +
        //   parseFloat(BillTotal) +
        //   "</td>";

        // htmlTable += "</tr>";

        // htmlTable += "</table>";
        // htmlTable += "</body>";
        // htmlTable += "</html>";

        var htmlTable = "";
        htmlTable += "<html>";
        htmlTable += "<body>";
        htmlTable += "<div>";
        htmlTable += "<p>" + "Hello, " + "</p>";
        htmlTable +=
          "<p>" +
          "Please find below the project budget for your approval. " +
          "</p>";
        htmlTable += "<p>" + "Project Id : " + projectCode + "</p>";
        htmlTable += "<br>";
        htmlTable += "</div>";
        htmlTable +=
          '<table style="border-collapse: collapse; width: 80%; font-family: Arial, sans-serif; font-size: 14px;border: 1px solid #505050;">';

        // Header Row
        htmlTable += "<thead>";
        htmlTable +=
          '<tr style="background-color: #f2f2f2; text-align: left; border-bottom: 1px solid #505050;">';
        htmlTable += "<th style='padding: 10px;'>Budget Type</th>";
        htmlTable += "<th style='padding: 10px;'>Labor</th>";
        htmlTable += "<th style='padding: 10px;'>Expense</th>";
        htmlTable += "<th style='padding: 10px;'>Supplier</th>";
        htmlTable += "<th style='padding: 10px;'>Other</th>";
        htmlTable += "<th style='padding: 10px;'>Total</th>";
        htmlTable += "</tr>";
        htmlTable += "</thead>";

        // Costing Row
        htmlTable += "<tbody>";
        htmlTable += "<tr style='border-bottom: 1px solid #505050;'>";
        htmlTable += "<td style='padding: 8px;'>Costing</td>";
        htmlTable += "<td style='padding: 8px;'>" + costJSON["Labor"] + "</td>";
        htmlTable +=
          "<td style='padding: 8px;'>" + costJSON["Expense"] + "</td>";
        htmlTable +=
          "<td style='padding: 8px;'>" + costJSON["Supplier"] + "</td>";
        htmlTable += "<td style='padding: 8px;'>" + costJSON["Other"] + "</td>";
        htmlTable +=
          "<td style='padding: 8px;'>" + parseFloat(CostTotal) + "</td>";
        htmlTable += "</tr>";

        htmlTable += "<tr style='border-bottom: 1px solid #505050;'>";
        htmlTable += "<td style='padding: 8px;'>Billing</td>";
        htmlTable += "<td style='padding: 8px;'>" + billJSON["Labor"] + "</td>";
        htmlTable +=
          "<td style='padding: 8px;'>" + billJSON["Expense"] + "</td>";
        htmlTable +=
          "<td style='padding: 8px;'>" + billJSON["Supplier"] + "</td>";
        htmlTable += "<td style='padding: 8px;'>" + billJSON["Other"] + "</td>";
        htmlTable +=
          "<td style='padding: 8px;'>" + parseFloat(BillTotal) + "</td>";
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

        if (projectManager != "" && projectOwner != "") {
          email.send({
            author: projectManager,
            recipients: projectOwner,
            subject: "Requesting for Pre P&L Approval",
            body: htmlTable,
          });
          log.debug("Mail Sent", "Mail Sent");

          var outOfOfficeApproverLookup = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: projectOwner,
            columns: ["custentity_oof_alternate_approver"],
          });

          if (outOfOfficeApproverLookup.custentity_oof_alternate_approver.length > 0) {
            var nextApprover =
              outOfOfficeApproverLookup.custentity_oof_alternate_approver[0]
                .value;
                log.debug("nextApprover", nextApprover);
            email.send({
              author: projectManager,
              recipients: nextApprover,
              subject: "Requesting for Pre P&L Approval",
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
      log.debug("Error 3 : ", error.toString());
    }
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
