/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search"], /**
 * @param{currentRecord} currentRecord
 */ function (currentRecord, search) {
  /**
   * Function to be executed after page is initialized.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
   *
   * @since 2015.2
   */
  function pageInit(scriptContext) {
    // alert("pageInit");
  }

  /**
   * Function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} ~ - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number~. Will be undefined if not a matrix field
   *
   * @since 2015.2
   */
  function fieldChanged(scriptContext) {
    try {
      if (scriptContext.fieldId == "job") {
        // alert('job')
        var soRecordObj = scriptContext.currentRecord;
        // var soRecordObj = scriptContext.currentRecord;

        var soProject = soRecordObj.getValue({
          fieldId: "job",
        });

        if (_logValidation(soProject)) {
          var projectBudgetStatus = search.lookupFields({
            type: search.Type.JOB,
            id: soProject,
            columns: [
              "custentity_subsidiary_loaction",
              "custentity_line_of_business",
              "custentity_department",
            ],
          });

          // alert("test 2");
          // alert(projectBudgetStatus.custentity_subsidiary_loaction.length);
          // var temp = projectBudgetStatus.custentity_subsidiary_loaction[0].value
          // alert(temp);

          if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
            // alert("inside if");
            soRecordObj.setValue({
              fieldId: "location",
              value:
                projectBudgetStatus.custentity_subsidiary_loaction[0].value,
            });
          } else {
            // alert("inside else");
            soRecordObj.setValue({
              fieldId: "location",
              value: "",
            });
          }
          // alert("test 2");
          if (projectBudgetStatus.custentity_line_of_business.length === 1) {
            // alert("inside if");
            soRecordObj.setValue({
              fieldId: "class",
              value: projectBudgetStatus.custentity_line_of_business[0].value,
            });
          } else {
            // alert("inside else");
            soRecordObj.setValue({
              fieldId: "class",
              value: "",
            });
          }
          // alert("test 3");
          if (projectBudgetStatus.custentity_department.length === 1) {
            // alert("inside if");
            soRecordObj.setValue({
              fieldId: "department",
              value: projectBudgetStatus.custentity_department[0].value,
            });
          } else {
            // alert("inside else");
            soRecordObj.setValue({
              fieldId: "department",
              value: "",
            });
          }
        }
      }
    } catch (error) {
      console.log("error : ", error);
    }
  }

  /**
   * Function to be executed when field is slaved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   *
   * @since 2015.2
   */
  function postSourcing(scriptContext) {}

  /**
   * Function to be executed after sublist is inserted, removed, or edited.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function sublistChanged(scriptContext) {}

  /**
   * Function to be executed after line is selected.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  function lineInit(scriptContext) {}

  /**
   * Validation function to be executed when field is changed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   *
   * @returns {boolean} Return true if field is valid
   *
   * @since 2015.2
   */
  function validateField(scriptContext) {}

  /**
   * Validation function to be executed when sublist line is committed.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateLine(scriptContext) {
    // try {
    //   var recordObj = scriptContext.currentRecord;
    //   // alert(scriptContext.sublistId)
    //   if (
    //     scriptContext.sublistId == "expense" ||
    //     scriptContext.sublistId == "item"
    //   ) {
    //     // alert("Validate Line");
    //     var currentLineProject;
    //     var currentLineAmount;
    //     if (scriptContext.sublistId == "item") {
    //       currentLineProject = recordObj.getCurrentSublistValue({
    //         sublistId: "item",
    //         fieldId: "customer",
    //       });
    //       currentLineAmount = recordObj.getCurrentSublistValue({
    //         sublistId: "item",
    //         fieldId: "amount",
    //       });
    //     } else {
    //       currentLineProject = recordObj.getCurrentSublistValue({
    //         sublistId: "expense",
    //         fieldId: "customer",
    //       });
    //       currentLineAmount = recordObj.getCurrentSublistValue({
    //         sublistId: "expense",
    //         fieldId: "amount",
    //       });
    //     }
    //     if (_logValidation(currentLineProject)) {
    //       var projectBudgetStatus = search.lookupFields({
    //         type: search.Type.JOB,
    //         id: currentLineProject,
    //         columns: [
    //           "custentity_project_approval_status",
    //           "custentity_inital_approved",
    //         ],
    //       });
    //       var getPurchase = getPurchaseSales(currentLineProject, "PurchOrd");
    //       var getProjectCostBudget = getProjectBudget(
    //         currentLineProject,
    //         "COST"
    //       );
    //       // alert(projectBudgetStatus);
    //       // alert(projectBudgetStatus.custentity_project_approval_status);
    //       // alert(projectBudgetStatus.custentity_inital_approved);
    //       // alert(
    //       //   Object.keys(projectBudgetStatus.custentity_project_approval_status)
    //       //     .length
    //       // );
    //       if (
    //         Object.keys(projectBudgetStatus).length != 0 &&
    //         (Object.keys(projectBudgetStatus.custentity_project_approval_status)
    //           .length != 0 ||
    //           projectBudgetStatus.custentity_inital_approved == false)
    //       ) {
    //         // alert("inside loop");
    //         var isInitialApproved =
    //           projectBudgetStatus.custentity_inital_approved;
    //         if (
    //           Object.keys(
    //             projectBudgetStatus.custentity_project_approval_status
    //           ).length != 0
    //         ) {
    //           var projectBudgetStatus =
    //             projectBudgetStatus.custentity_project_approval_status[0].value;
    //         }
    //         // alert(isInitialApproved);
    //         if (projectBudgetStatus == 1) {
    //           alert(
    //             "The Pre P&L for the selected project is awaiting approval from the project owner."
    //           );
    //           return false;
    //         } else if (projectBudgetStatus == 3) {
    //           alert(
    //             "The Pre P&L for the selected project has been rejected by the project owner."
    //           );
    //           return false;
    //         } else if (projectBudgetStatus == 4) {
    //           alert(
    //             "The Pre P&L for the selected project has been modified and not sent to the project owner for approval."
    //           );
    //           return false;
    //         } else if (projectBudgetStatus == 5) {
    //           alert(
    //             "The Modified Pre P&L for the selected project is awaiting approval from the project owner."
    //           );
    //           return false;
    //         } else if (projectBudgetStatus == 7) {
    //           alert(
    //             "The Modified Pre P&L for the selected project has been rejected by the project owner."
    //           );
    //           return false;
    //         } else if (isInitialApproved === false) {
    //           alert("The P&L has not generated for selected project.");
    //           return false;
    //         } else if (getPurchase != 0 || getPurchase == 0) {
    //           var currentPurchaseTotal =
    //             parseFloat(currentLineAmount) + parseFloat(getPurchase);
    //           if (currentPurchaseTotal > parseFloat(getProjectCostBudget)) {
    //             alert(
    //               "Costing budget of selected project is getting exceed by this purchase"
    //             );
    //             return false;
    //           } else {
    //             return true;
    //           }
    //         } else {
    //           return true;
    //         }
    //       } else {
    //         return true;
    //       }
    //     } else {
    //       return true;
    //     }
    //   }
    // } catch (error) {
    //   console.log("Error : ", error.toString());
    // }
  }

  /**
   * Validation function to be executed when sublist line is inserted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateInsert(scriptContext) {}

  /**
   * Validation function to be executed when record is deleted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @returns {boolean} Return true if sublist line is valid
   *
   * @since 2015.2
   */
  function validateDelete(scriptContext) {}

  /**
   * Validation function to be executed when record is saved.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @returns {boolean} Return true if record is valid
   *
   * @since 2015.2
   */
  function saveRecord(scriptContext) {
    try {
      var soRecordObj = scriptContext.currentRecord;
      // var soRecordObj = scriptContext.currentRecord;

      var soProject = soRecordObj.getValue({
        fieldId: "job",
      });
      var soTotal = soRecordObj.getValue({
        fieldId: "total",
      });
      var salesDate = soRecordObj.getValue({
        fieldId: "trandate",
      });
      if (_logValidation(soProject)) {
        var projectBudgetStatus = search.lookupFields({
          type: search.Type.JOB,
          id: soProject,
          columns: [
            "custentity_project_approval_status",
            "custentity_inital_approved",
            "custentity_closure_date",
          ],
        });

        // console.log(projectBudgetStatus);
        var temp = projectBudgetStatus.custentity_project_approval_status;

        // console.log(projectBudgetStatus);
        // console.log(Object.keys(projectBudgetStatus).length);
        // console.log(
        //   Object.keys(projectBudgetStatus.custentity_project_approval_status)
        //     .length
        // );
        // console.log(
        //   Object.keys(projectBudgetStatus.custentity_inital_approved).length
        // );

        var cloureDate = projectBudgetStatus.custentity_closure_date;

        var formattedpurchaseDate = parseDate(salesDate);
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
          }
          // console.log(isInitialApproved);
          // console.log(projectBudgetStatus);

          var getSales = getPurchaseSales(soProject, "SalesOrd");
          var getProjectBillingBudget = getProjectBudget(soProject, "BILLING");
          // alert(getSales);
          // alert(getProjectBillingBudget);

          if (projectBudgetStatus == 1) {
            alert(
              "The Pre P&L for the selected project is awaiting approval from the project owner."
            );
            return false;
          } else if (projectBudgetStatus == 3) {
            alert(
              "The Pre P&L for the selected project has been rejected by the project owner."
            );
            return false;
          } else if (projectBudgetStatus == 4) {
            alert(
              "The Pre P&L for the selected project has been modified and not sent to the project owner for approval."
            );
            return false;
          } else if (projectBudgetStatus == 5) {
            alert(
              "The Modified Pre P&L for the selected project is awaiting approval from the project owner."
            );
            return false;
          } else if (projectBudgetStatus == 7) {
            alert(
              "The Modified Pre P&L for the selected project has been rejected by the project owner."
            );
            return false;
          } else if (isInitialApproved === false) {
            alert("The P&L has not generated for selected project.");
            return false;
          } else if (isprojectclose === 1) {
            alert("Closer Date of selected project has been passed.");
            return false;
          } else if (getSales != 0 || getSales == 0) {
            var currentSalesTotal = parseFloat(soTotal) + parseFloat(getSales);
            if (currentSalesTotal > parseFloat(getProjectBillingBudget)) {
              alert(
                "Billing budget of selected project is getting exceed by this sale"
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

  function getPurchaseSales(projectId, transactionType) {
    try {
      var jobSearchObj = search.create({
        type: "job",
        filters: [
          ["internalidnumber", "equalto", projectId],
          "AND",
          ["transaction.type", "anyof", transactionType],
          // "AND",
          // ["transaction.type", "anyof", "PurchOrd", "SalesOrd"],
        ],
        columns: [
          search.createColumn({
            name: "type",
            join: "transaction",
            summary: "GROUP",
            label: "Type",
          }),
          search.createColumn({
            name: "amount",
            join: "transaction",
            summary: "SUM",
            label: "Amount",
            sort: search.Sort.ASC,
          }),
        ],
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var searchresult = jobSearchObj.run().getRange(0, 10);
      // alert(searchResultCount)
      // console.log(searchresult)
      if (searchResultCount > 0) {
        var transactionAmount = searchresult[0].getValue({
          name: "amount",
          join: "transaction",
          summary: "SUM",
          label: "Amount",
          sort: search.Sort.ASC,
        });
        // console.log(transactionAmount)
        return transactionAmount;
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
        // console.log(transactionAmount)
        return budgetAmount;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error 2 : ", error.toString());
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

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    // postSourcing: postSourcing,
    // sublistChanged: sublistChanged,
    // lineInit: lineInit,
    // validateField: validateField,
    // validateLine: validateLine,
    // validateInsert: validateInsert,
    // validateDelete: validateDelete,
    saveRecord: saveRecord,
  };
});
