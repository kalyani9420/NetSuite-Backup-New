/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/record"], /**
  * @param{record} record
  */ function (record) {
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
     // return true;
   }
 
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
   function lineInit(scriptContext) {
     try {
       var recordObj = scriptContext.currentRecord;
       var flag = [];
       if (scriptContext.sublistId === "expense") {
         var sublistObj = recordObj.getSublist({
           sublistId: "expense",
         });
 
         var employeeColumn = sublistObj.getColumn({
           fieldId: "custcol_employee_name",
         });
         var fromColumn = sublistObj.getColumn({
           fieldId: "custcol_from_place",
         });
         var toColumn = sublistObj.getColumn({
           fieldId: "custcol_to_place",
         });
         var dateColumn = sublistObj.getColumn({
           fieldId: "custcol_travel_date",
         });
 
         var ExpenseCategory = recordObj.getCurrentSublistValue({
           sublistId: "expense",
           fieldId: "category_display",
         });
         log.debug("accountF", ExpenseCategory);
 
         if (ExpenseCategory == "Travel") {
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
       log.debug("Error :", error);
       console.log("Error : " + error);
     }
   }
 
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
       var flag = [];
       if (scriptContext.sublistId === "expense") {
         var sublistObj = recordObj.getSublist({
           sublistId: "expense",
         });
 
         var employeeColumn = sublistObj.getColumn({
           fieldId: "custcol_employee_name",
         });
         var fromColumn = sublistObj.getColumn({
           fieldId: "custcol_from_place",
         });
         var toColumn = sublistObj.getColumn({
           fieldId: "custcol_to_place",
         });
         var dateColumn = sublistObj.getColumn({
           fieldId: "custcol_travel_date",
         });
 
         employeeColumn.isDisabled = true;
 
         fromColumn.isDisabled = true;
 
         toColumn.isDisabled = true;
 
         dateColumn.isDisabled = true;
 
         var ExpenseCategory = recordObj.getCurrentSublistValue({
           sublistId: "expense",
           fieldId: "category_display",
         });
         log.debug("accountF", ExpenseCategory);
 
         if (ExpenseCategory == "Travel") {
           employeeColumn.isDisabled = false;
 
           fromColumn.isDisabled = false;
 
           toColumn.isDisabled = false;
 
           dateColumn.isDisabled = false;
 
           var employeeName = recordObj.getCurrentSublistValue({
             sublistId: "expense",
             fieldId: "custcol_employee_name",
           })
             ? recordObj.getCurrentSublistValue({
                 sublistId: "expense",
                 fieldId: "custcol_employee_name",
               })
             : flag.push("Employee Name");
 
           var fromName = recordObj.getCurrentSublistValue({
             sublistId: "expense",
             fieldId: "custcol_from_place",
           })
             ? recordObj.getCurrentSublistValue({
                 sublistId: "expense",
                 fieldId: "custcol_from_place",
               })
             : flag.push("From Name");
 
           var toName = recordObj.getCurrentSublistValue({
             sublistId: "expense",
             fieldId: "custcol_to_place",
           })
             ? recordObj.getCurrentSublistValue({
                 sublistId: "expense",
                 fieldId: "custcol_to_place",
               })
             : flag.push("To Name");
 
           var travelDate = recordObj.getCurrentSublistValue({
             sublistId: "expense",
             fieldId: "custcol_travel_date",
           })
             ? recordObj.getCurrentSublistValue({
                 sublistId: "expense",
                 fieldId: "custcol_travel_date",
               })
             : flag.push("Travel Date");
 
           log.debug(
             "employeeName",
             employeeName + fromName + toName + travelDate
           );
           log.debug("Flag", flag);
 
           if (flag.length > 0) {
             alert("Enter Value of : " + flag.toString());
 
             return false;
           } else {
             return true;
           }
         }
         return true;
       } else {
         return true;
       }
     } catch (error) {
       log.debug("Error :", error);
       console.log("Error : " + error);
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
   function validateInsert(scriptContext) {
     //return true;
   }
 
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
   function validateDelete(scriptContext) {
     //return true;
   }
 
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
     //return true;
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
     //fieldChanged: fieldChanged,
     // postSourcing: postSourcing,
     // sublistChanged: sublistChanged,
     lineInit: lineInit,
     //validateField: validateField,
     validateLine: validateLine,
     // validateInsert: validateInsert,
     // validateDelete: validateDelete,
     //saveRecord: saveRecord
   };
 });
 