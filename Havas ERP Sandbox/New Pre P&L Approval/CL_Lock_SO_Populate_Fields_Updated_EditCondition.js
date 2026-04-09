/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search"], /**
 * @param{currentRecord} currentRecord
 */ function (currentRecord, search) {
    function pageInit(scriptContext) {
      try {
        var soRecordObj = scriptContext.currentRecord;
        var natureOfDocument = soRecordObj.getField({ fieldId: "custbody_in_nature_of_document", });
        natureOfDocument.isDisplay = true;
        var soProject = soRecordObj.getValue({ fieldId: "job", });
        var salesDate = soRecordObj.getValue({ fieldId: "trandate", });

        if (_logValidation(soProject)) {
          var projectBudgetStatus = search.lookupFields({
            type: search.Type.JOB,
            id: soProject,
            columns: ["custentity_subsidiary_loaction", "custentity_line_of_business", "custentity_department", "custentity_project_approval_status", "custentity_inital_approved", "custentity_closure_date",],
          });

          if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
            soRecordObj.setValue({ fieldId: "location", value: projectBudgetStatus.custentity_subsidiary_loaction[0].value, });
          } else {
            soRecordObj.setValue({ fieldId: "location", value: "", });
          }
          if (projectBudgetStatus.custentity_line_of_business.length === 1) {
            soRecordObj.setValue({ fieldId: "class", value: projectBudgetStatus.custentity_line_of_business[0].value, });
          } else {
            soRecordObj.setValue({ fieldId: "class", value: "", });
          }
          if (projectBudgetStatus.custentity_department.length === 1) {
            soRecordObj.setValue({ fieldId: "department", value: projectBudgetStatus.custentity_department[0].value, });
          } else {
            soRecordObj.setValue({ fieldId: "department", value: "", });
          }

          var cloureDate = projectBudgetStatus.custentity_closure_date;
          var formattedpurchaseDate = parseDate(salesDate);
          var formattedcloureDate = parseDate(cloureDate);
          var isprojectclose = compareDates(formattedpurchaseDate, formattedcloureDate);

          if (
            Object.keys(projectBudgetStatus).length != 0 && (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0 || projectBudgetStatus.custentity_inital_approved == false)
          ) {
            var isInitialApproved = projectBudgetStatus.custentity_inital_approved;
            if (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0) {
              var projectBudgetStatus = projectBudgetStatus.custentity_project_approval_status[0].value;
              var alertMsg = getAlertJSON(projectBudgetStatus);
            }

            if (isInitialApproved === false) {
              alert("The budget has not been generated for the selected project. Please create a project budget and obtain approval.");
            } else if (isprojectclose === 1) {
              alert("The closure date for the selected project has already passed.");
            } else if (alertMsg != 0) {
              alert(alertMsg);
            }
            else { }
          }
        }
      } catch (error) {
        log.debug("error : ", error);
      }
    }

    function fieldChanged(scriptContext) {
      try {
        if (scriptContext.fieldId == "job") {
          var soRecordObj = scriptContext.currentRecord;
          var soProject = soRecordObj.getValue({ fieldId: "job", });
          var salesDate = soRecordObj.getValue({ fieldId: "trandate", });
          if (_logValidation(soProject)) {
            var projectBudgetStatus = search.lookupFields({
              type: search.Type.JOB,
              id: soProject,
              columns: ["custentity_subsidiary_loaction", "custentity_line_of_business", "custentity_department", "custentity_project_approval_status", "custentity_inital_approved", "custentity_closure_date",],
            });

            if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
              soRecordObj.setValue({ fieldId: "location", value: projectBudgetStatus.custentity_subsidiary_loaction[0].value, });
            } else {
              soRecordObj.setValue({ fieldId: "location", value: "", });
            }
            if (projectBudgetStatus.custentity_line_of_business.length === 1) {
              soRecordObj.setValue({ fieldId: "class", value: projectBudgetStatus.custentity_line_of_business[0].value, });
            } else {
              soRecordObj.setValue({ fieldId: "class", value: "", });
            }
            if (projectBudgetStatus.custentity_department.length === 1) {
              soRecordObj.setValue({ fieldId: "department", value: projectBudgetStatus.custentity_department[0].value, });
            } else {
              soRecordObj.setValue({ fieldId: "department", value: "", });
            }

            var cloureDate = projectBudgetStatus.custentity_closure_date;
            var formattedpurchaseDate = parseDate(salesDate);
            var formattedcloureDate = parseDate(cloureDate);
            var isprojectclose = compareDates(formattedpurchaseDate, formattedcloureDate);

            if (
              Object.keys(projectBudgetStatus).length != 0 && (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0 || projectBudgetStatus.custentity_inital_approved == false)
            ) {
              var isInitialApproved = projectBudgetStatus.custentity_inital_approved;
              if (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0) {
                var projectBudgetStatus = projectBudgetStatus.custentity_project_approval_status[0].value;
                var alertMsg = getAlertJSON(projectBudgetStatus);
              }

              if (isInitialApproved === false) {
                alert("The budget has not been generated for the selected project. Please create a project budget and obtain approval.");
              } else if (isprojectclose === 1) {
                alert("The closure date for the selected project has already passed.");
              } else if (alertMsg != 0) {
                alert(alertMsg);
              }
              else { }
            }
          } else {
            soRecordObj.setValue({ fieldId: "location", value: "", });
            soRecordObj.setValue({ fieldId: "class", value: "", });
            soRecordObj.setValue({ fieldId: "department", value: "", });
          }
        }
      } catch (error) {
        log.debug("error : ", error);
      }
    }

    function validateLine(scriptContext) {
      try {
        var soRecordObj = scriptContext.currentRecord;
        var soRecordId = scriptContext.currentRecord.id;
        var soProjectStatus = soRecordObj.getValue({ fieldId: "custbody_approval_status", });
        log.debug("soRecordId", soRecordId);
        log.debug("soProjectStatus", soProjectStatus);
        var soProject = soRecordObj.getValue({ fieldId: "job", });
        var soTotal = soRecordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "amount", });

        if (soRecordId != "") {
          if (_logValidation(soProject)) {
            var getSales = getPurchaseSales(soProject, "SalesOrd", soRecordId);
            var getProjectBillingBudget = getProjectBudget(soProject, "BILLING");
            log.debug("Existing sales : getSales ", getSales);

            if (getSales != 0 || getSales == 0) {
              var currentSalesTotal = parseFloat(soTotal) + parseFloat(getSales);
              if (currentSalesTotal > parseFloat(getProjectBillingBudget)) {
                alert("This sale is exceeding the billing budget for the selected project.");
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
          if (_logValidation(soProject)) {
            var getSales = getPurchaseSales(soProject, "SalesOrd", 0);
            var getProjectBillingBudget = getProjectBudget(soProject, "BILLING");
            log.debug("getSales ", getSales);

            if (getSales != 0 || getSales == 0) {
              var currentSalesTotal = parseFloat(soTotal) + parseFloat(getSales);
              if (currentSalesTotal > parseFloat(getProjectBillingBudget)) {
                alert("This sale is exceeding the billing budget for the selected project.");
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
        log.debug("Error : ", error.toString());
      }
    }

    function saveRecord(scriptContext) {
      try {
        var soRecordObj = scriptContext.currentRecord;
        var soProject = soRecordObj.getValue({ fieldId: "job", });
        var soTotal = soRecordObj.getValue({ fieldId: "subtotal", });
        var salesDate = soRecordObj.getValue({ fieldId: "trandate", });
        var soRecordObj = scriptContext.currentRecord;
        var soRecordId = scriptContext.currentRecord.id;
        var soProjectStatus = soRecordObj.getValue({ fieldId: "custbody_approval_status", });
        log.debug("soRecordId", soRecordId);
        log.debug("soProjectStatus", soProjectStatus);
        if (_logValidation(soProject)) {
          var projectBudgetStatus = search.lookupFields({
            type: search.Type.JOB,
            id: soProject,
            columns: ["custentity_project_approval_status", "custentity_inital_approved", "custentity_closure_date",],
          });

          var temp = projectBudgetStatus.custentity_project_approval_status;
          var cloureDate = projectBudgetStatus.custentity_closure_date;

          var formattedpurchaseDate = parseDate(salesDate);
          var formattedcloureDate = parseDate(cloureDate);
          var isprojectclose = compareDates(formattedpurchaseDate, formattedcloureDate);

          if (Object.keys(projectBudgetStatus).length != 0 && (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0 || projectBudgetStatus.custentity_inital_approved == false)) {
            var isInitialApproved = projectBudgetStatus.custentity_inital_approved;
            if (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0) {
              var projectBudgetStatus = projectBudgetStatus.custentity_project_approval_status[0].value;
            }

            var getSales = getPurchaseSales(soProject, "SalesOrd", 0);
            var getProjectBillingBudget = getProjectBudget(soProject, "BILLING");

            if (soRecordId != "") {
              if (_logValidation(soProject)) {
                var getSales = getPurchaseSales(soProject, "SalesOrd", soRecordId);
                var getProjectBillingBudget = getProjectBudget(soProject, "BILLING");
                var alertMsg = getAlertJSON(projectBudgetStatus);
                log.debug("Existing sales : getSales ", getSales);
              }
            } else {
              if (_logValidation(soProject)) {
                var getSales = getPurchaseSales(soProject, "SalesOrd", 0);
                var getProjectBillingBudget = getProjectBudget(soProject, "BILLING");
                var alertMsg = getAlertJSON(projectBudgetStatus);
                log.debug("getSales ", getSales);
              }
            }

            if (isInitialApproved === false) {
              alert("The budget has not been generated for the selected project. Please create a project budget and obtain approval.");
              return false;
            } else if (isprojectclose === 1) {
              alert("The closure date for the selected project has already passed.");
              return false;
            } else if (alertMsg != 0) {
              alert(alertMsg);
              return false;
            }
            else if (getSales != 0 || getSales == 0) {
              var currentSalesTotal = parseFloat(soTotal) + parseFloat(getSales);
              log.debug("parseFloat(soTotal)", parseFloat(soTotal));
              log.debug("parseFloat(getSales)", parseFloat(getSales));
              if (currentSalesTotal > parseFloat(getProjectBillingBudget)) {
                alert("This sale is exceeding the billing budget for the selected project.");
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
          return true;
        }
      } catch (error) {
        log.debug("Error : ", error.toString());
      }
    }

    function _logValidation(value) {
      if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "NaN") {
        return true;
      } else {
        return false;
      }
    }

    function getPurchaseSales(projectId, transactionType, transactionId) {
      try {
        var currentTransactionId = transactionId;
        var filter;
        var column;

        if (currentTransactionId == 0) {
          filter = [
            [["transaction.type", "anyof", transactionType], "AND", ["transaction.custbody_approval_status", "anyof","2","11","1","3","@NONE@"], "AND", ["internalidnumber", "equalto", projectId],],
          ];
          column = [
            search.createColumn({ name: "netamount", join: "transaction", summary: "SUM", label: "Amount (Net)", }),
            search.createColumn({ name: "type", join: "transaction", summary: "GROUP", label: "Type", sort: search.Sort.ASC, }),
          ];
        } else {
          filter = [
            [
              ["transaction.type", "anyof", transactionType], "AND", ["transaction.custbody_approval_status", "anyof","2","11","1","3","@NONE@"], "AND", ["internalidnumber", "equalto", projectId], "AND", ["transaction.internalidnumber", "notequalto", currentTransactionId,],
            ],
          ];
          column = [
            search.createColumn({ name: "netamount", join: "transaction", summary: "SUM", label: "Amount (Net)", }),
            search.createColumn({ name: "type", join: "transaction", summary: "GROUP", label: "Type", sort: search.Sort.ASC, }),
          ];
        }
        var jobSearchObj = search.create({ type: "job", filters: filter, columns: column, });
        var searchResultCount = jobSearchObj.runPaged().count;
        log.debug("jobSearchObj result count", searchResultCount);
        var searchresult = jobSearchObj.run().getRange(0, 10);
        log.debug("searchresult", searchresult);
        var i = 0;
        var totalsales = 0;
        if (searchResultCount > 0) {
          while (i < searchResultCount) {
            var transactionAmount = searchresult[i].getValue({ name: "netamount", join: "transaction", summary: "SUM", label: "Amount (Net)", });
            totalsales += parseFloat(transactionAmount);
            i++;
          }
          log.debug("totalsales", totalsales);
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
          filters: [["internalidnumber", "equalto", projectId], "AND", ["projectbudget.type", "anyof", budgetType],],
          columns: [
            search.createColumn({ name: "type", join: "projectBudget", summary: "GROUP", label: "Budget Type", }),
            search.createColumn({ name: "amount", join: "projectBudget", summary: "SUM", label: "Amount", sort: search.Sort.ASC, }),
          ],
        });
        var searchResultCount = jobSearchObj.runPaged().count;
        log.debug("jobSearchObj result count", searchResultCount);
        var projectBudget = jobSearchObj.run().getRange(0, 100);
        if (searchResultCount > 0) {
          var budgetAmount = projectBudget[0].getValue({ name: "amount", join: "projectBudget", summary: "SUM", label: "Amount", sort: search.Sort.ASC, });
          return budgetAmount;
        } else {
          return 0;
        }
      } catch (error) {
        log.debug("Error 2 : ", error.toString());
      }
    }

    function getAlertJSON(budgetStatus) {
      var alertJSON = {
        1: "The budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval.",
        3: "The project owner has rejected the budget for the selected project. Kindly obtain the necessary approval.",
        4: "The budget for the selected project has been revised but not submitted to the project owner for approval. Kindly obtain the necessary approval.",
        5: "The revised budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval.",
        7: "The revised budget for the selected project has been rejected by the project owner. Kindly obtain the necessary approval.",
      };
      if (budgetStatus in alertJSON) {
        return alertJSON[budgetStatus];
      } else {
        return 0;
      }
    }

    function parseDate(dateString) {
      if (Object.prototype.toString.call(dateString) === "[object Date]" && !isNaN(dateString)) {
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

    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      validateLine: validateLine,
      saveRecord: saveRecord,
    };
  });
