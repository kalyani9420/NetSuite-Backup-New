/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/record", "N/format", "N/runtime", "N/search"], /**
 * @param{currentRecord} currentRecord
 */ function (currentRecord, record, format, runtime, search) {
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
      if (
        scriptContext.fieldId == "projectedenddate" ||
        scriptContext.fieldId == "startdate"
      ) {
        var projectObj = scriptContext.currentRecord;
        var projectStartDate = projectObj.getValue({
          fieldId: "startdate",
        });
        var projectEndDate = projectObj.getValue({
          fieldId: "projectedenddate",
        });
  
        var formattedStartDate = parseDate(projectStartDate);
        var formattedEndDate = parseDate(projectEndDate);
        var compareDates = compareDates(formattedEndDate, formattedStartDate);
  
        if (compareDates == 1) {
          alert("The end date cannot be earlier than the start date.");
          projectObj.setValue({
            fieldId: "projectedenddate",
            value: null,
            ignoreFieldChange: true,
            forceSyncSourcing: true,
          });
        }
      }
      
    } catch (error) {
      console.log(error)
      
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
  function validateField(scriptContext) {
  }

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
  function validateLine(scriptContext) {}

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
      var projectId = scriptContext.currentRecord.id;

      if (_nullValidation(projectId)) {
        var projectCreator = runtime.getCurrentUser();
        objRecord.setValue({
          fieldId: "custentity_project_creator",
          value: projectCreator.id,
        });
      }

      var totalBill = objRecord.getSublistValue({
        sublistId: "bbudget",
        fieldId: "totalamount",
        line: 8,
      });

      var totalCost = objRecord.getSublistValue({
        sublistId: "cbudget",
        fieldId: "totalamount",
        line: 9,
      });

      if (_logValidation(totalBill) && _logValidation(totalCost)) {
        if (parseFloat(totalCost) > parseFloat(totalBill)) {
          alert("The costing budget must not exceed the billing budget.");
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    } catch (error) {
      console.log("Error : ", error.toString());
    }
    return true;
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
  function _nullValidation(val) {
    if (
      val == null ||
      val == undefined ||
      val == "" ||
      val.toString() == "undefined" ||
      val.toString() == "NaN" ||
      val.toString() == "null"
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

    if (typeof dateString !== "string") {
      console.log("Invalid dateString:", dateString);
      throw new Error(
        "Invalid date format. Expected a string in 'DD/MM/YYYY' format."
      );
    }

    var dateParts = dateString.split("/");
    if (dateParts.length !== 3) {
      throw new Error("Invalid date format. Expected 'DD/MM/YYYY'.");
    }

    var day = parseInt(dateParts[0], 10);
    var month = parseInt(dateParts[1], 10) - 1;
    var year = parseInt(dateParts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error("Invalid date parts in 'DD/MM/YYYY' format.");
    }

    return new Date(year, month, day);
  }

  function compareDates(date1, date2) {
    var parsedDate1 = parseDate(date1);
    var parsedDate2 = parseDate(date2);

    if (parsedDate1 < parsedDate2) {
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
