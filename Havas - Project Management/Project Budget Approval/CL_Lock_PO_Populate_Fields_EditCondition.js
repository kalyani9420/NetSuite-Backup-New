/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search", "N/format"], /**
 * @param{currentRecord} currentRecord
 */ function (currentRecord, search, format) {
  function pageInit(scriptContext) {
    try {
      var poRecordObj = scriptContext.currentRecord;
      var poProject;
      var currentProject = poRecordObj.getValue({
        fieldId: "custpage_p2p_data",
      });

      var natureOfDocument = poRecordObj.getField({
        fieldId: "custbody_in_nature_of_document",
      });
      natureOfDocument.isDisplay = true;

      var purchaseDate = poRecordObj.getValue({
        fieldId: "trandate",
      });
      var test = JSON.parse(currentProject);
      poProject = test.p2pJobId;
      if (_logValidation(poProject)) {
        var projectBudgetStatus = search.lookupFields({
          type: search.Type.JOB,
          id: poProject,
          columns: [
            "custentity_project_approval_status",
            "custentity_inital_approved",
            "custentity_closure_date",
          ],
        });
        var cloureDate = projectBudgetStatus.custentity_closure_date;
        var formattedpurchaseDate = parseDate(purchaseDate);
        var formattedcloureDate = parseDate(cloureDate);
        var isprojectclose = compareDates(
          formattedpurchaseDate,
          formattedcloureDate
        );

        if (
          Object.keys(projectBudgetStatus).length != 0 &&
          (Object.keys(projectBudgetStatus.custentity_project_approval_status)
            .length != 0 ||
            projectBudgetStatus.custentity_inital_approved == false)
        ) {
          var isInitialApproved =
            projectBudgetStatus.custentity_inital_approved;

          if (
            Object.keys(projectBudgetStatus.custentity_project_approval_status)
              .length != 0
          ) {
            var projectBudgetStatus =
              projectBudgetStatus.custentity_project_approval_status[0].value;
            var alertMsg = getAlertJSON(projectBudgetStatus);
          }
          if (isInitialApproved === false) {
            alert(
              "The budget has not been generated for the selected project. Please create a project budget and obtain approval."
            );
          } else if (alertMsg != 0) {
            alert(alertMsg);
          } else if (isprojectclose === 1) {
            alert(
              "The closure date for the selected project has already passed."
            );
          } else {
          }
        } else {
        }
      } else {
      }
    } catch (error) {
      log.debug("error : ", error);
    }
  }

  function fieldChanged(scriptContext) {
    try {
      if (scriptContext.fieldId == "entity") {
        var poRecordObj = scriptContext.currentRecord;
        var poProject;
        var currentProject = poRecordObj.getValue({
          fieldId: "custpage_p2p_data",
        });
        var test = JSON.parse(currentProject);
        poProject = test.p2pJobId;

        if (_logValidation(poProject)) {
          var projectBudgetStatus = search.lookupFields({
            type: search.Type.JOB,
            id: poProject,
            columns: [
              "custentity_subsidiary_loaction",
              "custentity_line_of_business",
              "custentity_department",
              "projectedenddate",
            ],
          });
          poRecordObj.setValue({
            fieldId: "custbody_project_reference",
            value: poProject,
          });

          if (projectBudgetStatus.projectedenddate.length == 10) {
            var projectDate = parseDate(projectBudgetStatus.projectedenddate);

            poRecordObj.setValue({
              fieldId: "custbody_project_end_date",
              value: projectDate,
            });
          } else {
            poRecordObj.setValue({
              fieldId: "custbody_project_end_date",
              value: null,
            });
          }

          if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
            poRecordObj.setValue({
              fieldId: "location",
              value:
                projectBudgetStatus.custentity_subsidiary_loaction[0].value,
            });
          } else {
            poRecordObj.setValue({
              fieldId: "location",
              value: "",
            });
          }
          if (projectBudgetStatus.custentity_line_of_business.length === 1) {
            poRecordObj.setValue({
              fieldId: "class",
              value: projectBudgetStatus.custentity_line_of_business[0].value,
            });
          } else {
            poRecordObj.setValue({
              fieldId: "class",
              value: "",
            });
          }
          if (projectBudgetStatus.custentity_department.length === 1) {
            poRecordObj.setValue({
              fieldId: "department",
              value: projectBudgetStatus.custentity_department[0].value,
            });
          } else {
            poRecordObj.setValue({
              fieldId: "department",
              value: "",
            });
          }
        }
      }

      if (scriptContext.fieldId == "customer") {
        var currentRecord = scriptContext.currentRecord;
        var currentProject = currentRecord.getCurrentSublistValue({
          sublistId: "expense",
          fieldId: "customer",
        });

        if (_logValidation(currentProject)) {
          var projectClassificationLookup = search.lookupFields({
            type: search.Type.JOB,
            id: currentProject,
            columns: [
              "custentity_department",
              "custentity_line_of_business",
              "custentity_subsidiary_loaction",
            ],
          });

          if (
            projectClassificationLookup.custentity_subsidiary_loaction
              .length === 1
          ) {
            currentRecord.setCurrentSublistValue({
              sublistId: "expense",
              fieldId: "location",
              value:
                projectClassificationLookup.custentity_subsidiary_loaction[0]
                  .value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "expense",
              fieldId: "location",
              value: "",
            });
          }
          if (
            projectClassificationLookup.custentity_line_of_business.length === 1
          ) {
            currentRecord.setCurrentSublistValue({
              sublistId: "expense",
              fieldId: "class",
              value:
                projectClassificationLookup.custentity_line_of_business[0]
                  .value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "expense",
              fieldId: "class",
              value: "",
            });
          }
          if (projectClassificationLookup.custentity_department.length === 1) {
            currentRecord.setCurrentSublistValue({
              sublistId: "expense",
              fieldId: "department",
              value: projectClassificationLookup.custentity_department[0].value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "expense",
              fieldId: "department",
              value: "",
            });
          }
        } else {
          currentRecord.setCurrentSublistValue({
            sublistId: "expense",
            fieldId: "location",
            value: "",
          });
          currentRecord.setCurrentSublistValue({
            sublistId: "expense",
            fieldId: "class",
            value: "",
          });
          currentRecord.setCurrentSublistValue({
            sublistId: "expense",
            fieldId: "department",
            value: "",
          });
        }
      }

      if (
        scriptContext.fieldId == "item" &&
        scriptContext.sublistId == "item"
      ) {
        var currentLine = scriptContext.line;
        if (currentLine > 0) {
          var recordObj = scriptContext.currentRecord;
          var getPreviousProject = recordObj.getSublistValue({
            sublistId: "item",
            fieldId: "customer",
            line: currentLine - 1,
          });
          recordObj.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "customer",
            value: getPreviousProject,
            ignoreFieldChange: true,
            forceSyncSourcing: true,
          });
        }
      }
    } catch (error) {
      console.log("error : ", error);
    }
  }

  function validateLine(scriptContext) {
    try {
      var poRecordObj = scriptContext.currentRecord;
      var poRecordId = scriptContext.currentRecord.id;
      var poProjectStatus = poRecordObj.getValue({
        fieldId: "approvalstatus",
      });
      log.debug("poRecordId", poRecordId);
      log.debug("poProjectStatus", poProjectStatus);

      var lineProject = poRecordObj.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "customer",
      });
      var polineAmount = poRecordObj.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "amount",
      });

      if (poRecordId != "" && poProjectStatus == 1) {
        if (_logValidation(lineProject)) {
          var getPurchase = getPurchaseSales(
            lineProject,
            "PurchOrd",
            "ExpRept",
            poRecordId
          );
          log.debug("Except Existing : getPurchase", getPurchase);

          var getProjectCostBudget = getProjectBudget(lineProject, "COST");

          if (getPurchase != 0 || getPurchase == 0) {
            var currentSalesTotal =
              parseFloat(polineAmount) + parseFloat(getPurchase);
            if (currentSalesTotal > parseFloat(getProjectCostBudget)) {
              alert(
                "This purchase is exceeding the cost budget for the selected project."
              );
              return false;
            } else {
              return true;
            }
          } else {
            return true;
          }
        } else {
          return true;
        }
      } else {
        if (_logValidation(lineProject)) {
          var getPurchase = getPurchaseSales(
            lineProject,
            "PurchOrd",
            "ExpRept",
            0
          );
          log.debug("getPurchase", getPurchase);

          var getProjectCostBudget = getProjectBudget(lineProject, "COST");

          if (getPurchase != 0 || getPurchase == 0) {
            var currentSalesTotal =
              parseFloat(polineAmount) + parseFloat(getPurchase);
            if (currentSalesTotal > parseFloat(getProjectCostBudget)) {
              alert(
                "This purchase is exceeding the cost budget for the selected project."
              );
              return false;
            } else {
              return true;
            }
          } else {
            return true;
          }
        } else {
          return true;
        }
      }
    } catch (error) {
      console.log("Error : ", error.toString());
    }
  }

  function saveRecord(scriptContext) {
    try {
      var objRecord = scriptContext.currentRecord;
      var i = 0;
      var j = 0;
      console.log("test 1");
      var lineProject = 0;
      var purchaseAmount;

      var itemLines = objRecord.getLineCount({
        sublistId: "item",
      });
      var expenseLines = objRecord.getLineCount({
        sublistId: "expense",
      });
      var purchaseAmount = objRecord.getValue({
        fieldId: "subtotal",
      });
      var purchaseDate = objRecord.getValue({
        fieldId: "trandate",
      });
      console.log("itemLines " + itemLines);
      console.log("expenseLines " + expenseLines);

      var poRecordId = scriptContext.currentRecord.id;
      var poProjectStatus = objRecord.getValue({
        fieldId: "approvalstatus",
      });
      log.debug("poRecordId", poRecordId);
      log.debug("poProjectStatus", poProjectStatus);

      if (itemLines > 0) {
        while (i < itemLines) {
          var sublistFieldValue = objRecord.getSublistValue({
            sublistId: "item",
            fieldId: "customer",
            line: i,
          });
          console.log("item sublistFieldValue" + sublistFieldValue);
          if (sublistFieldValue != "") {
            console.log("inside if");
            lineProject = sublistFieldValue;
            break;
          }

          i++;
        }
      }
      console.log("lineProject" + lineProject);

      if (expenseLines > 0 && lineProject != 0) {
        while (j < expenseLines) {
          var sublistFieldValue = objRecord.getSublistValue({
            sublistId: "expense",
            fieldId: "customer",
            line: j,
          });
          console.log("expense sublistFieldValue" + sublistFieldValue);
          if (sublistFieldValue != "") {
            console.log("inside if");
            lineProject = sublistFieldValue;
            break;
          }

          j++;
        }
      }

      if (_logValidation(lineProject)) {
        var projectBudgetStatus = search.lookupFields({
          type: search.Type.JOB,
          id: lineProject,
          columns: [
            "custentity_project_approval_status",
            "custentity_inital_approved",
            "custentity_closure_date",
          ],
        });
        var getPurchase = getPurchaseSales(
          lineProject,
          "PurchOrd",
          "ExpRept",
          0
        );
        console.log("getPurchase");
        console.log(getPurchase);
        var getProjectCostBudget = getProjectBudget(lineProject, "COST");
        var cloureDate = projectBudgetStatus.custentity_closure_date;

        var formattedpurchaseDate = parseDate(purchaseDate);
        var formattedcloureDate = parseDate(cloureDate);
        var isprojectclose = compareDates(
          formattedpurchaseDate,
          formattedcloureDate
        );
        if (poRecordId != "" && poProjectStatus == 1) {
          if (_logValidation(lineProject)) {
            var getPurchase = getPurchaseSales(
              lineProject,
              "PurchOrd",
              "ExpRept",
              poRecordId
            );
            log.debug("Except Existing : getPurchase", getPurchase);

            var getProjectCostBudget = getProjectBudget(lineProject, "COST");
          }
        } else {
          if (_logValidation(lineProject)) {
            var getPurchase = getPurchaseSales(
              lineProject,
              "PurchOrd",
              "ExpRept",
              0
            );
            log.debug("getPurchase", getPurchase);

            var getProjectCostBudget = getProjectBudget(lineProject, "COST");
          }
        }

        if (
          Object.keys(projectBudgetStatus).length != 0 &&
          (Object.keys(projectBudgetStatus.custentity_project_approval_status)
            .length != 0 ||
            projectBudgetStatus.custentity_inital_approved == false)
        ) {
          var isInitialApproved =
            projectBudgetStatus.custentity_inital_approved;

          if (
            Object.keys(projectBudgetStatus.custentity_project_approval_status)
              .length != 0
          ) {
            var projectBudgetStatus =
              projectBudgetStatus.custentity_project_approval_status[0].value;
            var alertMsg = getAlertJSON(projectBudgetStatus);
          }

          if (isInitialApproved === false) {
            alert(
              "The budget has not been generated for the selected project. Please create a project budget and obtain approval."
            );
            return false;
          } else if (alertMsg != 0) {
            alert(alertMsg);
            return false;
          } else if (isprojectclose === 1) {
            alert(
              "The closure date for the selected project has already passed."
            );
            return false;
          }
          // else if (getPurchase != 0 || getPurchase == 0) {
          //   var currentPurchaseTotal =
          //     parseFloat(purchaseAmount) + parseFloat(getPurchase);
          //   log.debug("purchaseAmount", purchaseAmount);
          //   log.debug("getPurchase", getPurchase);
          //   if (currentPurchaseTotal > parseFloat(getProjectCostBudget)) {
          //     alert(
          //       "This purchase is exceeding the cost budget for the selected project."
          //     );
          //     return false;
          //   } else {
          //     return true;
          //   }
          // }
          else {
            return true;
          }
        } else {
          return true;
        }
      } else {
        return true;
      }
    } catch (error) {
      console.log("Error : ", error.toString());
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

  function parseDate(dateString) {
    if (
      Object.prototype.toString.call(dateString) === "[object Date]" &&
      !isNaN(dateString)
    ) {
      return dateString;
    }

    var dateParts = dateString.split("/");
    var day = parseInt(dateParts[0], 10);
    var month = parseInt(dateParts[1], 10) - 1;
    var year = parseInt(dateParts[2], 10);

    return new Date(year, month, day);
  }

  function compareDates(date1, date2) {
    var parsedDate1 = parseDate(date1);
    var parsedDate2 = parseDate(date2);

    if (parsedDate1 > parsedDate2) {
      return 1;
    } else {
      return 0;
    }
  }
  function getPurchaseSales(
    projectId,
    transactionType1,
    transactionType2,
    currentTransactionId
  ) {
    try {
      var currentTransId = currentTransactionId;
      var filter;
      var column;

      if (currentTransId == 0) {
        filter = [
          [
            ["internalidnumber", "equalto", projectId],
            "AND",
            ["transaction.type", "anyof", transactionType1, transactionType2],
            "AND",
            ["transaction.approvalstatus", "noneof", "3"],
            "AND",
            [
              "transaction.status",
              "noneof",
              "ExpRept:E",
              "ExpRept:V",
              "ExpRept:H",
              "ExpRept:D",
            ],
          ],
        ];

        column = [
          search.createColumn({
            name: "netamount",
            join: "transaction",
            summary: "SUM",
            label: "Amount (Net)",
          }),
          search.createColumn({
            name: "type",
            join: "transaction",
            summary: "GROUP",
            label: "Type",
            sort: search.Sort.ASC,
          }),
        ];
      } else {
        filter = [
          [
            ["internalidnumber", "equalto", projectId],
            "AND",
            ["transaction.type", "anyof", transactionType1, transactionType2],
            "AND",
            ["transaction.approvalstatus", "noneof", "3"],
            "AND",
            [
              "transaction.status",
              "noneof",
              "ExpRept:E",
              "ExpRept:V",
              "ExpRept:H",
              "ExpRept:D",
            ],
            "AND",
            ["transaction.internalidnumber", "notequalto", currentTransId],
          ],
        ];

        column = [
          search.createColumn({
            name: "netamount",
            join: "transaction",
            summary: "SUM",
            label: "Amount (Net)",
          }),
          search.createColumn({
            name: "type",
            join: "transaction",
            summary: "GROUP",
            label: "Type",
            sort: search.Sort.ASC,
          }),
        ];
      }
      var jobSearchObj = search.create({
        type: "job",
        filters: filter,
        columns: column,
      });

      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var searchresult = jobSearchObj.run().getRange(0, 10);
      var i = 0;
      var totalsales = 0;
      if (searchResultCount > 0) {
        while (i < searchResultCount) {
          var transactionAmount = searchresult[i].getValue({
            name: "netamount",
            join: "transaction",
            summary: "SUM",
            label: "Amount (Net)",
          });
          totalsales += parseFloat(transactionAmount);

          i++;
        }

        return totalsales;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("error : ", error.toString());
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

  function getAlertJSON(budgetStatus) {
    var alertJson = {
      1: "The budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval.",
      3: "The project owner has rejected the budget for the selected project. Kindly obtain the necessary approval.",
      4: "The budget for the selected project has been revised but not submitted to the project owner for approval. Kindly obtain the necessary approval.",
      5: "The revised budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval.",
      7: "The revised budget for the selected project has been rejected by the project owner. Kindly obtain the necessary approval.",
    };

    if (budgetStatus in alertJson) {
      return alertJson[budgetStatus];
    } else {
      return 0;
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    validateLine: validateLine,
    saveRecord: saveRecord,
  };
});
