/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/currentRecord", "N/record", "N/ui/serverWidget", "N/search" , "N/email"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record, serverWidget, search , email) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (scriptContext) => {
    
    try {
      // log.debug("Get Trigger", "Get Trigger");
      if (scriptContext.request.method === "GET") {
        // log.debug("Get Trigger", "Get Trigger");
        var projectId = scriptContext.request.parameters.projectId;
        var response = scriptContext.request.parameters.response;
        var projectManager;
        var projectOwner;        

        log.debug("Get Trigger", projectId + " " + response);

        if (response == "approve" || response == "approveexceedbudget") {
          var cost_projectBudget = parseFloat(
            getProjectBudget(projectId, "COST")
          );
          var billing_projectBudget = parseFloat(
            getProjectBudget(projectId, "BILLING")
          );
          var ProjectfieldLookUp = search.lookupFields({
            type: search.Type.JOB,
            id: projectId,
            columns: [
              "custentity_project_approval_status",
              "projectmanager",
              "custentity_project_owner",
              "entityid",
              "companyname",
            ],
          });
          var projectCode = ProjectfieldLookUp.entityid;
          var projectName = ProjectfieldLookUp.companyname.split(":")[1];
          budgetStatus =
          ProjectfieldLookUp.custentity_project_approval_status[0].value;

          log.debug("budgetStatus", budgetStatus);

          if (budgetStatus == "1") {
            // Pending Budget Approval
            var id = record.submitFields({
              type: record.Type.JOB,
              id: projectId,
              values: {
                custentity_project_approval_status: 2, //Budget Approved
                custentity_cost_budget_history: cost_projectBudget,
                custentity_billing_budget_history: billing_projectBudget,
                custentity_rejection_reason: "",
              },
            });
            scriptContext.response.write(
              "Your record has been successfully saved."
            );
            if (
              _logValidation(ProjectfieldLookUp.custentity_project_owner[0])
            ) {
              projectOwner =
                ProjectfieldLookUp.custentity_project_owner[0].value;
            } else {
              log.debug("Error : ", "Project Owner Not defined");
            }
            if (_logValidation(ProjectfieldLookUp.projectmanager[0])) {
              projectManager = ProjectfieldLookUp.projectmanager[0].value;
            } else {
              log.debug("Error : ", "Project Manager Not defined");
            }

            if (projectManager != "" && projectOwner != "") {
              email.send({
                author: projectOwner,
                recipients: projectManager,
                subject:
                  "Project Budget Approval Status : " +
                  projectCode +
                  " " +
                  projectName,
                body: "Your project budget has been approved by the project owner.",
              });
              log.debug("Mail Sent", "Mail Sent");
            }
          }
          if (budgetStatus == "5") {
            // Pending Budget Approval
            var id = record.submitFields({
              type: record.Type.JOB,
              id: projectId,
              values: {
                custentity_project_approval_status: 6, //Modified Budget Approved
                custentity_rejection_reason: "",
              },
            });
            scriptContext.response.write(
              "Your record has been successfully saved."
            );

            if (
              _logValidation(ProjectfieldLookUp.custentity_project_owner[0])
            ) {
              projectOwner =
                ProjectfieldLookUp.custentity_project_owner[0].value;
            } else {
              log.debug("Error : ", "Project Owner Not defined");
            }
            if (_logValidation(ProjectfieldLookUp.projectmanager[0])) {
              projectManager = ProjectfieldLookUp.projectmanager[0].value;
            } else {
              log.debug("Error : ", "Project Manager Not defined");
            }

            if (projectManager != "" && projectOwner != "") {
              email.send({
                author: projectOwner,
                recipients: projectManager,
                subject:
                  "Project Budget Approval Status : " +
                  projectCode +
                  " " +
                  projectName,
                body: "Your project budget has been approved by the project owner.",
              });
              log.debug("Mail Sent", "Mail Sent");
            }
          }

          log.debug("Get id", id);

          log.debug("Get Trigger", projectId + " " + response);

          if (budgetStatus == "2") {
            scriptContext.response.write(
              "Your record has already been approved."
            );
          }
          if (budgetStatus == "6") {
            scriptContext.response.write(
              "Your record has already been approved."
            );
          }
          if (budgetStatus == "3") {
            scriptContext.response.write(
              "Your record has already been rejected."
            );
          }
          if (budgetStatus == "7") {
            scriptContext.response.write(
              "Your record has already been rejected."
            );
          }
        } else if (response == "reject" || response == "rejectexceedbudget") {
          var form = serverWidget.createForm({
            title: "Rejection Reason",
          });

          form.addField({
            id: "custpage_rejection_reason",
            type: serverWidget.FieldType.TEXT,
            label: "Enter Rejection Reason",
          });

          var field = form.addField({
            id: "custpage_projectid",
            type: serverWidget.FieldType.TEXT,
            label: "Project Id",
          });
          field.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN,
          });
          if (projectId) {
            field.defaultValue = projectId;
          }

          form.addSubmitButton({
            label: "Submit",
          });

          scriptContext.response.writePage(form);
        }
      } else if (scriptContext.request.method === "POST") {
        log.debug("Inside POST: ", "Inside POST: ");

        var rejectionReason =
          scriptContext.request.parameters.custpage_rejection_reason;
        var projectId = scriptContext.request.parameters.custpage_projectid;
        log.debug("rejectionReason: ", rejectionReason + " " + projectId);
        var projectOwner;
        var projectManager;

        var ProjectfieldLookUp = search.lookupFields({
          type: search.Type.JOB,
          id: projectId,
          columns: [
            "custentity_project_approval_status",
            "projectmanager",
            "custentity_project_owner",
            "entityid",
            "companyname",
          ],
        });
        log.debug("budgetStatusLookup", ProjectfieldLookUp);
        var projectCode = ProjectfieldLookUp.entityid;
        var projectName = ProjectfieldLookUp.companyname.split(":")[1];
        var budgetStatus =
        ProjectfieldLookUp.custentity_project_approval_status[0].value;

        var cost_projectBudget = parseFloat(
          getProjectBudget(projectId, "COST")
        );
        var billing_projectBudget = parseFloat(
          getProjectBudget(projectId, "BILLING")
        );

        log.debug("budgetStatus", budgetStatus);

        if (budgetStatus == "1") {
          //Pending Budget Approval
          var id = record.submitFields({
            type: record.Type.JOB,
            id: projectId,
            values: {
              custentity_project_approval_status: 3, //Budget Rejected
              custentity_rejection_reason: rejectionReason.toString(),
              custentity_cost_budget_history: cost_projectBudget,
              custentity_billing_budget_history: billing_projectBudget,
            },
          });
          scriptContext.response.write(
            "Your record has been successfully saved."
          );

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

          if (projectManager != "" && projectOwner != "") {
            email.send({
              author: projectOwner,
                recipients: projectManager,
              subject:
                "Project Budget Approval Status : " +
                projectCode +
                " " +
                projectName,
              body: "Your project budget has been rejected by the project owner.",
            });
            log.debug("Mail Sent", "Mail Sent");
          }
        }

        if (budgetStatus == "5") {
          // Pending Budget Approval
          var id = record.submitFields({
            type: record.Type.JOB,
            id: projectId,
            values: {
              custentity_project_approval_status: 7, //Modified Budget Rejected
              custentity_rejection_reason: rejectionReason.toString(),
            },
          });
          scriptContext.response.write(
            "Your record has been successfully saved."
          );

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

          if (projectManager != "" && projectOwner != "") {
            email.send({
              author: projectOwner,
                recipients: projectManager,
              subject:
                "Project Budget Approval Status : " +
                projectCode +
                " " +
                projectName,
              body: "Your project budget has been rejected by the project owner.",
            });
            log.debug("Mail Sent", "Mail Sent");
          }
        }

        if (budgetStatus == "2") {
          scriptContext.response.write(
            "Your record has already been approved."
          );
        }
        if (budgetStatus == "6") {
          scriptContext.response.write(
            "Your record has already been approved."
          );
        }
        if (budgetStatus == "3") {
          scriptContext.response.write(
            "Your record has already been rejected."
          );
        }
        if (budgetStatus == "7") {
          scriptContext.response.write(
            "Your record has already been rejected."
          );
        }

        log.debug("Get id", id);
        //  scriptContext.response.write(
        //    `<html><head><script>window.close()</script></head></html>`
        //  );
      } else {
        log.debug("Invalid Response", "Invalid response");
      }

      log.debug("id: ", id);
    } catch (error) {
      log.debug("Error : ", error.toString());
    }
  };

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

  return { onRequest };
});
