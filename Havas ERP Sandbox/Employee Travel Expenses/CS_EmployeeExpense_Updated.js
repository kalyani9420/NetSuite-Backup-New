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
    // if (scriptContext.fieldId == "category") {
    //   var currentRecord = scriptContext.currentRecord;
    //   var travelCategory = currentRecord.getCurrentSublistValue({ sublistId: "expense", fieldId: "category" });
    //   if (!_logValidation(travelCategory)) return; // No Category Selected
    //   var expenseCategoryRecord = record.load({ type: record.Type.EXPENSE_CATEGORY, id: travelCategory });
    //   var accountNumber = Number(expenseCategoryRecord.getText({ fieldId: "expenseacct" }).split(" ")[0]);
    //   console.log("Selected Account Number : ", accountNumber);
    //   if (!_logValidation(accountNumber)) return; // Not a valid account number
    //   var sublistObject = currentRecord.getSublist({ sublistId: "expense" });
    //   var employeeColumn = sublistObject.getColumn({ fieldId: "custcol_employee_name" });
    //   var fromColumn = sublistObject.getColumn({ fieldId: "custcol_from_place" });
    //   var toColumn = sublistObject.getColumn({ fieldId: "custcol_to_place" });
    //   var dateColumn = sublistObject.getColumn({ fieldId: "custcol_travel_date" });
    //   if (TRAVEL_EXPENSE_ACCOUNTS.includes(accountNumber)) {
    //     employeeColumn.isDisabled = false;
    //     fromColumn.isDisabled = false;
    //     toColumn.isDisabled = false;
    //     dateColumn.isDisabled = false;
    //   } else {
    //     employeeColumn.isDisabled = true;
    //     fromColumn.isDisabled = true;
    //     toColumn.isDisabled = true;
    //     dateColumn.isDisabled = true;
    //   }
    // }

    if (scriptContext.fieldId == "category") {
      var currentRecord = scriptContext.currentRecord;
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
      var travelCategory = currentRecord.getCurrentSublistValue({
        sublistId: "expense",
        fieldId: "category",
      });
      if (travelCategory == 207) {
        employeeColumn.isDisabled = false;
        fromColumn.isDisabled = false;
        toColumn.isDisabled = false;
        dateColumn.isDisabled = false;
      }
    }
  };

  /**
   * Function to be executed after line is selected.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   *
   * @since 2015.2
   */
  const lineInit = (scriptContext) => {
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
        expenseCategoryRecord.getText({ fieldId: "expenseacct" }).split(" ")[0]
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
  };

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
  };
});
