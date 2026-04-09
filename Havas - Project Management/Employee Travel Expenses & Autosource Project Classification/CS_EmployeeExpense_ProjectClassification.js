/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/record", "N/search"], function (
  currentRecord,
  record,
  search
) {
  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */

  // Account number associated with account
  // Account Name : Account Number
  const TRAVEL_EXPENSE_ACCOUNT_MAPPING = {
    "Air Fare - Events": 1042,
    "Air Travel Fare": 10149,
    "Car Hire Charges - Events": 1043,
    "Car Hire Expenses": 10152,
    "Conveyance - Events": 1044,
    "Conveyance ": 10151,
    "Stay Charges - Events": 1045,
    "Hotel & Food Expenses": 10150,
    "Train & Bus Fare - Events": 1046,
    "Travelling Exp - Events": 1047,
    "Travelling Exp Director": 10156,
    "Travelling Exp (Foreign Currency)": 10157,
  };

  const TRAVEL_EXPENSE_ACCOUNTS = [
    1042, 10149, 1043, 10152, 1044, 10151, 1045, 10150, 1046, 1047, 10156,
    10157,
  ];

  const fieldChanged = (scriptContext) => {
    // Category field is changed

    try {
      if (scriptContext.fieldId == "category") {
        var currentRecord = scriptContext.currentRecord;
        var travelCategory = currentRecord.getCurrentSublistValue({
          sublistId: "expense",
          fieldId: "category",
        });
        if (!_logValidation(travelCategory)) return; // No Category Selected
        var expenseCategoryRecord = record.load({
          type: record.Type.EXPENSE_CATEGORY,
          id: travelCategory,
        });
        var accountNumber = Number(
          expenseCategoryRecord
            .getText({ fieldId: "expenseacct" })
            .split(" ")[0]
        );
        console.log("Selected Account Number : ", accountNumber);
        if (!_logValidation(accountNumber)) return; // Not a valid account number
        var sublistObject = currentRecord.getSublist({ sublistId: "expense" });
        var employeeColumn = sublistObject.getColumn({
          fieldId: "custcol_employee_name",
        });
        var fromColumn = sublistObject.getColumn({
          fieldId: "custcol_from_place",
        });
        var toColumn = sublistObject.getColumn({ fieldId: "custcol_to_place" });
        var dateColumn = sublistObject.getColumn({
          fieldId: "custcol_travel_date",
        });
        if (TRAVEL_EXPENSE_ACCOUNTS.includes(accountNumber)) {
          employeeColumn.isDisabled = false;
          fromColumn.isDisabled = false;
          toColumn.isDisabled = false;
          dateColumn.isDisabled = false;
        } else {
          employeeColumn.isDisabled = true;
          fromColumn.isDisabled = true;
          toColumn.isDisabled = true;
          dateColumn.isDisabled = true;
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
        }
        else{
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
    } catch (error) {
      log.debug("error ", error);
    }
  };

  
  const lineInit = (scriptContext) => {
    try {
      if (scriptContext.sublistId == "expense") {
        var currentRecord = scriptContext.currentRecord;
        var travelCategory = currentRecord.getCurrentSublistValue({
          sublistId: "expense",
          fieldId: "category",
        });
        if (!_logValidation(travelCategory)) return; // No Category Selected
        var expenseCategoryRecord = record.load({
          type: record.Type.EXPENSE_CATEGORY,
          id: travelCategory,
        });
        var accountNumber = Number(
          expenseCategoryRecord
            .getText({ fieldId: "expenseacct" })
            .split(" ")[0]
        );
        console.log("Selected Account Number : ", accountNumber);
        if (!_logValidation(accountNumber)) return; // Not a valid account number
        var sublistObject = currentRecord.getSublist({ sublistId: "expense" });
        var employeeColumn = sublistObject.getColumn({
          fieldId: "custcol_employee_name",
        });
        var fromColumn = sublistObject.getColumn({
          fieldId: "custcol_from_place",
        });
        var toColumn = sublistObject.getColumn({ fieldId: "custcol_to_place" });
        var dateColumn = sublistObject.getColumn({
          fieldId: "custcol_travel_date",
        });
        if (TRAVEL_EXPENSE_ACCOUNTS.includes(accountNumber)) {
          employeeColumn.isDisabled = false;
          fromColumn.isDisabled = false;
          toColumn.isDisabled = false;
          dateColumn.isDisabled = false;
        } else {
          employeeColumn.isDisabled = true;
          fromColumn.isDisabled = true;
          toColumn.isDisabled = true;
          dateColumn.isDisabled = true;
        }
      }
      
    } catch (error) {
      log.debug("error ", error);
    }
  };


  const validateLine = (scriptContext) => {
    try {
      var expenseRecordObj = scriptContext.currentRecord;
      var expenseRecordId = scriptContext.currentRecord.id;
      log.debug("expenseRecordId", expenseRecordId);

      var lineProject = expenseRecordObj.getCurrentSublistValue({
        sublistId: "expense",
        fieldId: "customer",
      });
      var expenselineAmount = expenseRecordObj.getCurrentSublistValue({
        sublistId: "expense",
        fieldId: "amount",
      });
      log.debug("lineProject", lineProject);
      log.debug("expenselineAmount", expenselineAmount);

      if (_logValidation(expenseRecordId)) {
        if (_logValidation(lineProject)) {
          var getPurchaseExpenses = getPurchaseExpensesExpense(
            lineProject,
            "PurchOrd",
            "ExpRept",
            expenseRecordId
          );
          log.debug("Except Existing : getPurchaseExpenses & getExpense", getPurchaseExpenses);

          var getProjectCostBudget = getProjectBudget(lineProject, "COST");

          if (getPurchaseExpenses != 0 || getPurchaseExpenses == 0) {
            var currentSalesTotal =
              parseFloat(expenselineAmount) + parseFloat(getPurchaseExpenses);
            if (currentSalesTotal > parseFloat(getProjectCostBudget)) {
              alert(
                "This Employee Expense is exceeding the cost budget for the selected project."
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
          var getPurchaseExpenses = getPurchaseExpensesExpense(
            lineProject,
            "PurchOrd",
            "ExpRept",
            0
          );
          log.debug("getPurchaseExpenses", getPurchaseExpenses);

          var getProjectCostBudget = getProjectBudget(lineProject, "COST");

          if (getPurchaseExpenses != 0 || getPurchaseExpenses == 0) {
            var currentSalesTotal =
              parseFloat(expenselineAmount) + parseFloat(getPurchaseExpenses);
            if (currentSalesTotal > parseFloat(getProjectCostBudget)) {
              alert(
                "This Employee Expense is exceeding the cost budget for the selected project."
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


  const saveRecord = (scriptContext) => {
    try {
      var objRecord = scriptContext.currentRecord;
      var expenseRecordId = scriptContext.currentRecord.id;
      var i = 0;
      var j = 0;
      var lineProject = 0;
      var expenseLines = 0;
      var ExpenseAmount;
      var ExpenseAmount = objRecord.getValue({
        fieldId: "amount",
      });
      var ExpenseDate = objRecord.getValue({
        fieldId: "trandate",
      });
      var expenseLines = objRecord.getLineCount({
        sublistId: "expense",
      });
      log.debug("expenseRecordId", expenseRecordId);
      log.debug("expenseLines", expenseLines);
      if (expenseLines > 0) {
        while (i < expenseLines) {
          var sublistFieldValue = objRecord.getSublistValue({
            sublistId: "expense",
            fieldId: "customer",
            line: i,
          });
          console.log("item sublistFieldValue" + sublistFieldValue);
          if (sublistFieldValue != "") {
            // console.log("inside if");
            lineProject = sublistFieldValue;
            break;
          }
          i++;
        }
      }
      console.log("lineProject" + lineProject);
     
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
        var getPurchaseExpenses = getPurchaseExpensesExpense(
          lineProject,
          "PurchOrd",
          "ExpRept",
          0
        );
        console.log("getPurchaseExpenses");
        console.log(getPurchaseExpenses);
        var getProjectCostBudget = getProjectBudget(lineProject, "COST");
        var cloureDate = projectBudgetStatus.custentity_closure_date;
        var formattedExpenseDate = parseDate(ExpenseDate);
        var formattedcloureDate = parseDate(cloureDate);
        var isprojectclose = compareDates(
          formattedExpenseDate,
          formattedcloureDate
        );
        if (_logValidation(expenseRecordId)) {
          if (_logValidation(lineProject)) {
            var getPurchaseExpenses = getPurchaseExpensesExpense(
              lineProject,
              "PurchOrd",
              "ExpRept",
              expenseRecordId
            );
            log.debug("Except Existing : getPurchaseExpenses", getPurchaseExpenses);
            var getProjectCostBudget = getProjectBudget(lineProject, "COST");
          }
        } else {
          if (_logValidation(lineProject)) {
            var getPurchaseExpenses = getPurchaseExpensesExpense(
              lineProject,
              "PurchOrd",
              "ExpRept",
              0
            );
            log.debug("getPurchaseExpenses", getPurchaseExpenses);
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
          } else if (getPurchaseExpenses != 0 || getPurchaseExpenses == 0) {
            var currentPurchaseTotal =
              parseFloat(ExpenseAmount) + parseFloat(getPurchaseExpenses);
            log.debug("ExpenseAmount", ExpenseAmount);
            log.debug("getPurchaseExpenses", getPurchaseExpenses);
            if (currentPurchaseTotal > parseFloat(getProjectCostBudget)) {
              alert(
                "This Employee Expense is exceeding the cost budget for the selected project."
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
        return true;
      }
    } catch (error) {
      console.log("Error : ", error.toString());
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
  function getPurchaseExpensesExpense(
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

  const _logValidation = (val) =>
    val != null &&
    val != "" &&
    val != "null" &&
    val != undefined &&
    val != "undefined" &&
    val != "@NONE@" &&
    val != "NaN";

  return {
    fieldChanged: fieldChanged,
    lineInit: lineInit,
    validateLine: validateLine,
    saveRecord: saveRecord,
  };
});
