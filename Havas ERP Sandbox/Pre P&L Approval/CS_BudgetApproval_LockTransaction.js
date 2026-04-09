/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search" , "N/format"], /**
  * @param{currentRecord} currentRecord
  */ function (currentRecord, search , format) {
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
   function fieldChanged(scriptContext) {}
 
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
     try {
       var recordObj = scriptContext.currentRecord;
       // alert(scriptContext.sublistId)
       if (
         scriptContext.sublistId == "expense" ||
         scriptContext.sublistId == "item"
       ) {
         // alert("Validate Line");
         var currentLineProject;
 
         if (scriptContext.sublistId == "item") {
           currentLineProject = recordObj.getCurrentSublistValue({
             sublistId: "item",
             fieldId: "customer",
           });
         } else {
           currentLineProject = recordObj.getCurrentSublistValue({
             sublistId: "expense",
             fieldId: "customer",
           });
         }
 
         if (_logValidation(currentLineProject)) {
           var projectBudgetStatus = search.lookupFields({
             type: search.Type.JOB,
             id: currentLineProject,
             columns: [
               "custentity_project_approval_status",
               "custentity_inital_approved",
             ],
           });
 
           // alert(projectBudgetStatus);
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
               Object.keys(
                 projectBudgetStatus.custentity_project_approval_status
               ).length != 0
             ) {
               var projectBudgetStatus =
                 projectBudgetStatus.custentity_project_approval_status[0].value;
             }
 
             // alert(isInitialApproved);
 
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
             } else if (
               projectBudgetStatus == 4 ||
               projectBudgetStatus == 5 ||
               projectBudgetStatus == 6
             ) {
               alert(
                 "The Pre P&L for the selected project has exceed and awaiting approval from the project owner."
               );
               return false;
             } else if (
               projectBudgetStatus == 10 ||
               projectBudgetStatus == 11 ||
               projectBudgetStatus == 12
             ) {
               alert(
                 "The Pre P&L for the selected project has exceed and rejected by the project owner."
               );
               return false;
             } else if (isInitialApproved === false) {
               alert("The P&L has not generated for selected project.");
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
 
       var soProject = soRecordObj.getValue({
         fieldId: "job",
       });
       if (_logValidation(soProject)) {
         var projectBudgetStatus = search.lookupFields({
           type: search.Type.JOB,
           id: soProject,
           columns: [
             "custentity_project_approval_status",
             "custentity_inital_approved",
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
           } else if (
             projectBudgetStatus == 4 ||
             projectBudgetStatus == 5 ||
             projectBudgetStatus == 6
           ) {
             alert(
               "The Pre P&L for the selected project has exceed and awaiting approval from the project owner."
             );
             return false;
           } else if (
             projectBudgetStatus == 10 ||
             projectBudgetStatus == 11 ||
             projectBudgetStatus == 12
           ) {
             alert(
               "The Pre P&L for the selected project has exceed and rejected by the project owner."
             );
             return false;
           } else if (isInitialApproved === false) {
             alert("The P&L has not generated for selected project.");
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
 
   return {
     pageInit: pageInit,
     // fieldChanged: fieldChanged,
     // postSourcing: postSourcing,
     // sublistChanged: sublistChanged,
     // lineInit: lineInit,
     // validateField: validateField,
     validateLine: validateLine,
     // validateInsert: validateInsert,
     // validateDelete: validateDelete,
     saveRecord: saveRecord,
   };
 });
 