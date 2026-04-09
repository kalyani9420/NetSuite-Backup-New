/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search", "N/format"], /**
  * @param{currentRecord} currentRecord
  */ function (currentRecord, search, format) {
   /**
    * Function to be executed after page is initialized.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
    *
    * @since 2015.2
    */
   function pageInit(scriptContext) {}
 
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
       if (scriptContext.fieldId == "entity") {
         // alert("customer");
         var soRecordObj = scriptContext.currentRecord;
         var soProject;
         var currentProject = soRecordObj.getValue({
           fieldId: "custpage_p2p_data",
         });
         var test = JSON.parse(currentProject);
         // alert(test.p2pJobId);
         soProject = test.p2pJobId;
         // var soRecordObj = scriptContext.currentRecord;
 
         // var soProject = soRecordObj.getValue({
         //   fieldId: "customer",
         // });
         // alert(soProject);
 
         if (_logValidation(soProject)) {
           var projectBudgetStatus = search.lookupFields({
             type: search.Type.JOB,
             id: soProject,
             columns: [
               "custentity_subsidiary_loaction",
               "custentity_line_of_business",
               "custentity_department",
               "projectedenddate",
             ],
           });
 
           // alert("test 2");
           // alert(projectBudgetStatus.custentity_subsidiary_loaction.length);
           // var temp = projectBudgetStatus.custentity_subsidiary_loaction[0].value
           // alert(temp);
 
           soRecordObj.setValue({
             fieldId: "custbody_project_reference",
             value: soProject,
           });
 
           if (projectBudgetStatus.projectedenddate.length == 10) {
             // alert("inside if");
             var projectDate = parseDate(projectBudgetStatus.projectedenddate);
             
             soRecordObj.setValue({
               fieldId: "custbody_project_end_date",
               value: projectDate,
             });
           } else {
             // alert("inside else");
             soRecordObj.setValue({
               fieldId: "custbody_project_end_date",
               value: null,
             });
           }
 
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
 
       if (scriptContext.fieldId == "customer") {
         // alert("customer");
         var soRecordObj = scriptContext.currentRecord;
         var soProject;
         // var currentProject = soRecordObj.getValue({
         //   fieldId: "custpage_p2p_data",
         // });
         // var test = JSON.parse(currentProject);
         // alert(test.p2pJobId);
         // soProject = test.p2pJobId;
         // var soRecordObj = scriptContext.currentRecord;
 
         // var soProject = soRecordObj.getValue({
         //   fieldId: "customer",
         // });
         // alert(soProject);
 
         if (scriptContext.sublistId == "item") {
           soProject = soRecordObj.getCurrentSublistValue({
             sublistId: "item",
             fieldId: "customer",
           });
         } else {
           soProject = soRecordObj.getCurrentSublistValue({
             sublistId: "expense",
             fieldId: "customer",
           });
         }
 
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
           // alert(getPreviousProject);
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
   // function validateLine(scriptContext) {
   //   try {
   //     if (
   //       scriptContext.sublistId == "expense" ||
   //       scriptContext.sublistId == "item"
   //     ) {
   //       // alert('job')
   //       var soRecordObj = scriptContext.currentRecord;
   //       // var soRecordObj = scriptContext.currentRecord;
 
   //       var soProject;
 
   //       if (scriptContext.sublistId == "item") {
   //         soProject = soRecordObj.getCurrentSublistValue({
   //           sublistId: "item",
   //           fieldId: "customer",
   //         });
   //       } else {
   //         soProject = soRecordObj.getCurrentSublistValue({
   //           sublistId: "expense",
   //           fieldId: "customer",
   //         });
   //       }
 
   //       if (_logValidation(soProject)) {
   //         var projectBudgetStatus = search.lookupFields({
   //           type: search.Type.JOB,
   //           id: soProject,
   //           columns: [
   //             "custentity_subsidiary_loaction",
   //             "custentity_line_of_business",
   //             "custentity_department",
   //           ],
   //         });
 
   //         // alert("test 2");
   //         // alert(projectBudgetStatus.custentity_subsidiary_loaction.length);
   //         // var temp = projectBudgetStatus.custentity_subsidiary_loaction[0].value
   //         // alert(temp);
 
   //         if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
   //           // alert("inside if");
   //           soRecordObj.setValue({
   //             fieldId: "location",
   //             value:
   //               projectBudgetStatus.custentity_subsidiary_loaction[0].value,
   //           });
   //           return true;
   //         } else {
   //           // alert("inside else");
   //           soRecordObj.setValue({
   //             fieldId: "location",
   //             value: "",
   //           });
   //           return true;
 
   //         }
   //         // alert("test 2");
   //         if (projectBudgetStatus.custentity_line_of_business.length === 1) {
   //           // alert("inside if");
   //           soRecordObj.setValue({
   //             fieldId: "class",
   //             value: projectBudgetStatus.custentity_line_of_business[0].value,
   //           });
   //           return true;
   //         } else {
   //           // alert("inside else");
   //           soRecordObj.setValue({
   //             fieldId: "class",
   //             value: "",
   //           });
   //           return true;
   //         }
   //         // alert("test 3");
   //         if (projectBudgetStatus.custentity_department.length === 1) {
   //           // alert("inside if");
   //           soRecordObj.setValue({
   //             fieldId: "department",
   //             value: projectBudgetStatus.custentity_department[0].value,
   //           });
   //           return true;
   //         } else {
   //           // alert("inside else");
   //           soRecordObj.setValue({
   //             fieldId: "department",
   //             value: "",
   //           });
 
   //         }
   //       }
   //       else{
   //         return true;
   //       }
   //     }
   //   } catch (error) {
   //     console.log("error : ", error);
   //   }
   //   return true;
   // }
 
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
       var objRecord = scriptContext.currentRecord;
       // alert(scriptContext.sublistId)
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
         fieldId: "total",
       });
       var purchaseDate = objRecord.getValue({
         fieldId: "trandate",
       });
       console.log("itemLines " + itemLines);
       console.log("expenseLines " + expenseLines);
 
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
         var getPurchase = getPurchaseSales(lineProject, "PurchOrd");
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
 
         console.log("test log........");
         // alert(projectBudgetStatus.custentity_project_approval_status);
         // alert(projectBudgetStatus.custentity_inital_approved);
         // alert(
         //   Object.keys(projectBudgetStatus.custentity_project_approval_status)
         //     .length
         // );
 
         if (
           Object.keys(projectBudgetStatus).length != 0 &&
           (Object.keys(projectBudgetStatus.custentity_project_approval_status)
             .length != 0 ||
             projectBudgetStatus.custentity_inital_approved == false)
         ) {
           // alert("inside loop");
           var isInitialApproved =
             projectBudgetStatus.custentity_inital_approved;
 
           if (
             Object.keys(projectBudgetStatus.custentity_project_approval_status)
               .length != 0
           ) {
             var projectBudgetStatus =
               projectBudgetStatus.custentity_project_approval_status[0].value;
           }
 
           // alert(isInitialApproved);
 
           if (projectBudgetStatus == 1) {
             alert(
               "The budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval."
             );
             return false;
           } else if (projectBudgetStatus == 3) {
             alert(
               "The project owner has rejected the budget for the selected project. Kindly obtain the necessary approval."
             );
             return false;
           } else if (projectBudgetStatus == 4) {
             alert(
               "The budget for the selected project has been revised but not submitted to the project owner for approval. Kindly obtain the necessary approval."
             );
             return false;
           } else if (projectBudgetStatus == 5) {
             alert(
               "The revised budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval."
             );
             return false;
           } else if (projectBudgetStatus == 7) {
             alert(
               "The revised budget for the selected project has been rejected by the project owner. Kindly obtain the necessary approval."
             );
             return false;
           } else if (isInitialApproved === false) {
             alert("The budget has not been generated for the selected project. Please create a project budget and obtain approval.");
             return false;
           } else if (isprojectclose === 1) {
             alert("The closure date for the selected project has already passed.");
             return false;
           } else if (getPurchase != 0 || getPurchase == 0) {
             var currentPurchaseTotal =
               parseFloat(purchaseAmount) + parseFloat(getPurchase);
             if (currentPurchaseTotal > parseFloat(getProjectCostBudget)) {
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
 
   //   function getPurchaseSales(projectId, transactionType) {
   //     try {
   //       var jobSearchObj = search.create({
   //         type: "job",
   //         filters: [
   //           ["internalidnumber", "equalto", projectId],
   //           "AND",
   //           ["transaction.type", "anyof", transactionType],
   //           // "AND",
   //           // ["transaction.type", "anyof", "PurchOrd", "SalesOrd"],
   //         ],
   //         columns: [
   //           search.createColumn({
   //             name: "type",
   //             join: "transaction",
   //             summary: "GROUP",
   //             label: "Type",
   //           }),
   //           search.createColumn({
   //             name: "amount",
   //             join: "transaction",
   //             summary: "SUM",
   //             label: "Amount",
   //             sort: search.Sort.ASC,
   //           }),
   //         ],
   //       });
   //       var searchResultCount = jobSearchObj.runPaged().count;
   //       log.debug("jobSearchObj result count", searchResultCount);
   //       var searchresult = jobSearchObj.run().getRange(0, 10);
   //       // alert(searchResultCount)
   //       // console.log(searchresult)
   //       if (searchResultCount > 0) {
   //         var transactionAmount = searchresult[0].getValue({
   //           name: "amount",
   //           join: "transaction",
   //           summary: "SUM",
   //           label: "Amount",
   //           sort: search.Sort.ASC,
   //         });
   //         // console.log(transactionAmount)
   //         return transactionAmount;
   //       } else {
   //         return 0;
   //       }
   //     } catch (error) {
   //       log.debug("error : ", error.toString());
   //     }
   //   }
   function getPurchaseSales(projectId, transactionType) {
     try {
       //   var jobSearchObj = search.create({
       //     type: "job",
       //     filters: [
       //       ["internalidnumber", "equalto", projectId],
       //       "AND",
       //       ["transaction.type", "anyof", transactionType],
       //       // "AND",
       //       // ["transaction.type", "anyof", "PurchOrd", "SalesOrd"],
       //     ],
       //     columns: [
       //       search.createColumn({
       //         name: "type",
       //         join: "transaction",
       //         summary: "GROUP",
       //         label: "Type",
       //       }),
       //       search.createColumn({
       //         name: "amount",
       //         join: "transaction",
       //         summary: "SUM",
       //         label: "Amount",
       //         sort: search.Sort.ASC,
       //       }),
       //     ],
       //   });
 
       var jobSearchObj = search.create({
         type: "job",
         filters: [
           ["internalidnumber", "equalto", projectId],
           "AND",
           ["transaction.type", "anyof", transactionType],
         ],
         columns: [
           search.createColumn({
             name: "internalid",
             join: "transaction",
             summary: "GROUP",
             label: "Internal ID",
             sort: search.Sort.ASC,
           }),
           search.createColumn({
             name: "total",
             join: "transaction",
             summary: "MAX",
             label: "Amount (Transaction Total)",
           }),
           search.createColumn({
             name: "type",
             join: "transaction",
             summary: "GROUP",
             label: "Type",
             sort: search.Sort.ASC,
           }),
         ],
       });
 
       var searchResultCount = jobSearchObj.runPaged().count;
       log.debug("jobSearchObj result count", searchResultCount);
       var searchresult = jobSearchObj.run().getRange(0, 10);
       // alert(searchResultCount)
       // console.log(searchresult)
       var i = 0;
       var totalsales = 0;
       if (searchResultCount > 0) {
         while (i < searchResultCount) {
           var transactionAmount = searchresult[i].getValue({
             name: "total",
             join: "transaction",
             summary: "MAX",
             label: "Amount (Transaction Total)",
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
 
   return {
     pageInit: pageInit,
     fieldChanged: fieldChanged,
     // postSourcing: postSourcing,
     // sublistChanged: sublistChanged,
     //  lineInit: lineInit,
     // validateField: validateField,
     // validateLine: validateLine,
     // validateInsert: validateInsert,
     // validateDelete: validateDelete,
     saveRecord: saveRecord,
   };
 });
 