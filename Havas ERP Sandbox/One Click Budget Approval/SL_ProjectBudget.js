/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/record",
  "N/ui/serverWidget",
  "N/https",
  "N/task",
  "N/search",
  "N/runtime",
], /**
 * @param{record} record
 * @param{serverWidget} serverWidget
 */ (record, serverWidget, https, task, search, runtime) => {
  function onRequest(scriptContext) {
    try {
      if (scriptContext.request.method === "GET") {
        var resultSearch;
        var customerName = scriptContext.request.parameters.customer;
        var selectedProject = scriptContext.request.parameters.selectedProject;
        var flag = scriptContext.request.parameters.flag;

        log.debug("selectedProject", selectedProject);
        log.debug("flag", flag);

        if (_logValidation(selectedProject)) {
          log.debug("inside if selectedProject", selectedProject);
          var scheduledScript = task.create({
            taskType: task.TaskType.MAP_REDUCE,
          });
          scheduledScript.scriptId = "customscript2109";
          scheduledScript.deploymentId = "customdeploy1";
          scheduledScript.params = {
            custscript_project_array: selectedProject,
          };
          var scriptTaskId = scheduledScript.submit();
          if (_logValidation(scriptTaskId)) {
            scriptContext.response.write("Response has been saved");
          }
        } else {
          var form = serverWidget.createForm({
            title: "Project Budget Approval",
          });
          form.clientScriptModulePath =
            "SuiteScripts/CS_OneClick_ProjectBudget.js";

          var customerList = form.addField({
            id: "custpage_customer_list",
            type: serverWidget.FieldType.SELECT,
            label: "Customer",
            source: "customer",
          });
          if (_logValidation(customerName)) {
            customerList.defaultValue = customerName;
          }
          var projectSublist = form.addSublist({
            id: "project_sublist",
            type: serverWidget.SublistType.LIST,
            label: "Project",
          });
          projectSublist.addField({
            id: "custpage_select",
            type: serverWidget.FieldType.CHECKBOX,
            label: "Select",
          });
          projectSublist.addField({
            id: "custpage_project_internalid",
            type: serverWidget.FieldType.TEXT,
            label: "Internal Id",
          });
          projectSublist.addField({
            id: "custpage_customer_name",
            type: serverWidget.FieldType.TEXT,
            label: "Customer Name",
          });
          projectSublist.addField({
            id: "custpage_project_code",
            type: serverWidget.FieldType.TEXT,
            label: "Project Code",
          });
          projectSublist.addField({
            id: "custpage_project_name",
            type: serverWidget.FieldType.TEXT,
            label: "Project Name",
          });
          projectSublist.addField({
            id: "custpage_budget_status",
            type: serverWidget.FieldType.TEXT,
            label: "Budget Status",
          });

          if (_logValidation(customerName)) {
            resultSearch = getPendingProject(customerName);
          } else {
            resultSearch = getPendingProject(0);
          }

          if (resultSearch != 0) {
            resultSearch.forEach(function (resultSearch, i) {
              _logValidation(
                resultSearch.getValue({
                  name: "internalid",
                  label: "Internal ID",
                })
              )
                ? projectSublist.setSublistValue({
                    id: "custpage_project_internalid",
                    line: i,
                    value: resultSearch.getValue({
                      name: "internalid",
                      label: "Internal ID",
                    }),
                  })
                : projectSublist.setSublistValue({
                    id: "custpage_project_internalid",
                    line: i,
                    value: null,
                  });

              _logValidation(
                resultSearch.getValue({
                  name: "customer",
                  label: "Customer",
                })
              )
                ? projectSublist.setSublistValue({
                    id: "custpage_customer_name",
                    line: i,
                    value: resultSearch.getText({
                      name: "customer",
                      label: "Customer",
                    }),
                  })
                : projectSublist.setSublistValue({
                    id: "custpage_customer_name",
                    line: i,
                    value: null,
                  });

              _logValidation(
                getStringAfterColon(
                  resultSearch.getValue({
                    name: "formulatext",
                    formula: "{entityid}",
                    label: "Formula (Text)",
                  })
                )
              )
                ? projectSublist.setSublistValue({
                    id: "custpage_project_code",
                    line: i,
                    value: getStringAfterColon(
                      resultSearch.getValue({
                        name: "formulatext",
                        formula: "{entityid}",
                        label: "Formula (Text)",
                      })
                    ),
                  })
                : projectSublist.setSublistValue({
                    id: "custpage_project_code",
                    line: i,
                    value: null,
                  });

              _logValidation(
                resultSearch.getValue({
                  name: "companyname",
                  label: "Project Name",
                })
              )
                ? projectSublist.setSublistValue({
                    id: "custpage_project_name",
                    line: i,
                    value: resultSearch.getValue({
                      name: "companyname",
                      label: "Project Name",
                    }),
                  })
                : projectSublist.setSublistValue({
                    id: "custpage_project_name",
                    line: i,
                    value: null,
                  });

              _logValidation(
                resultSearch.getValue({
                  name: "custentity_project_approval_status",
                  label: "Budget Approval Status",
                })
              )
                ? projectSublist.setSublistValue({
                    id: "custpage_budget_status",
                    line: i,
                    value: resultSearch.getText({
                      name: "custentity_project_approval_status",
                      label: "Budget Approval Status",
                    }),
                  })
                : projectSublist.setSublistValue({
                    id: "custpage_budget_status",
                    line: i,
                    value: null,
                  });
            });
          }

          form.addButton({
            id: "approvebutton",
            label: "Approve",
            functionName: "approveProjectBudget()",
          });

          scriptContext.response.writePage(form);
        }
      }
    } catch (error) {
      log.debug("Error : ", error);
    }
  }

  function getPendingProject(customerName) {
    log.debug("customerName", customerName);
    var currentUser = runtime.getCurrentUser();
    currentUser = currentUser.id;

    var searchFilters = [
      ["custentity_project_approval_status", "anyof", "1", "5"],
      "AND",
      ["custentity_project_owner", "anyof", currentUser],
    ];
    var searchColumns = [
      search.createColumn({ name: "internalid", label: "Internal ID" }),
      search.createColumn({ name: "customer", label: "Customer" }),
      search.createColumn({
        name: "custentity_project_approval_status",
        label: "Budget Approval Status",
      }),
      search.createColumn({ name: "companyname", label: "Project Name" }),
      search.createColumn({
        name: "formulatext",
        formula: "{entityid}",
        label: "Formula (Text)",
      }),
    ];

    if (customerName != 0) {
      searchFilters.push("AND", ["customer", "anyof", customerName]);
    }

    if (_logValidation(currentUser)) {
      var jobSearchObj = search.create({
        type: "job",
        filters: searchFilters,
        columns: searchColumns,
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      if (searchResultCount > 0) {
        var searchresult = jobSearchObj.run().getRange(0, 1000);
        log.debug("searchresult", searchresult);
        return searchresult;
      } else {
        return 0;
      }
    }
  }

  function getStringAfterColon(inputString) {
    const index = inputString.indexOf(":");

    if (index !== -1) {
      return removeInitialSpace(inputString.substring(index + 1));
    } else {
      return inputString;
    }
  }

  function removeInitialSpace(str) {
    return str.trimStart();
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

  return {
    onRequest: onRequest,
  };
});
