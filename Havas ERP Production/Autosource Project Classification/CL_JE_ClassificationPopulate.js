/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/record" , "N/search"], /**
 * @param{currentRecord} currentRecord
 * @param{record} record
 */ function (currentRecord, record , search) {
  /**
   * Function to be executed when field is changed.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.currentRecord - Current form record
   * @param {string} scriptContext.sublistId - Sublist name
   * @param {string} scriptContext.fieldId - Field name
   * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
   * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
   * @since 2015.2
   */

  // Account number associated with account
  // Account Name : Account Number
  const ACCOUNT_MAPPING = {
    // TDS Journal Accounts
    "Tds Receivable": 10391,

    // Employee Account
    "Employee Account": 101,

    // Employee loan accounts
    "Loans To Employees": 10340,

    // Reversal provision accounts
    "Provision For Expenses (Event)": 1120,
    "Provision For Expenses (Event) Mis": 1121,
    "Provision For Event Expenses Mis Jv": 1122,
    "Provision For Expenses - General Mis": 1123,
    "Advance Received From Debtors": 10539,
    "Advances To Suppliers": 10363,
    "Executive Advance for Expenses Payable (MIS)": 1119,
    "Executive Advance for Expenses Receivable (MIS)": 1089,
    "Credit Card Dues (MIS)": 1251,
  };

  // Accounts Number Configuration

  // Employee loan accounts
  const EMPLOYEE_LOAN_ACCOUNTS = [10340, 101];

  // Reversal provision accounts
  const REVERSAL_PROVISION_ACCOUNTS = [
    1120, 1121, 1122, 1123, 10539, 10363, 1119, 1089, 1251,
  ];

  // TDS Journal Accounts
  const TDS_ACCOUNTS = [10391];
  function pageInit(scriptContext) {
  }

  const fieldChanged = (scriptContext) => {
   
    // Changing Form Type
    if (scriptContext.fieldId == "custbody_form_type") {
      var currentRecord = scriptContext.currentRecord;
      var formType = currentRecord.getValue({ fieldId: "custbody_form_type" });
      var currentUrl = window.location.href;
      var objectCurrentURL = new URL(currentUrl);
      objectCurrentURL.searchParams.set("formtype", formType);
      window.open(objectCurrentURL, "_self");
    }

    // Changing Account On Lines
    if (scriptContext.fieldId == "account") {
      var currRec = scriptContext.currentRecord;

      // Account Name
      var accountId = currRec.getCurrentSublistText({
        sublistId: "line",
        fieldId: "account",
      });

      if (!_logValidation(accountId)) return; // No Account Selected

      // Account Number With String Manipulation
      var accountNumber =
        accountId.split(" ")[0] == "EMP"
          ? "EMP"
          : Number(accountId.split(" ")[0]);

      // Account is of employee loan
      var employeeField = currRec.getCurrentSublistField({
        fieldId: "custcol_employee",
        sublistId: "line",
      });
      if (
        EMPLOYEE_LOAN_ACCOUNTS.includes(accountNumber) ||
        accountNumber == "EMP"
      ) {
        currRec.setCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_employee",
          value: "",
        });
        employeeField.isDisabled = false;
      } else employeeField.isDisabled = true;

      // Account is of reversal provision
      var purchaseOrderField = currRec.getCurrentSublistField({
        fieldId: "custcol_purchase_order",
        sublistId: "line",
      });
      if (REVERSAL_PROVISION_ACCOUNTS.includes(accountNumber)) {
        currRec.setCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_purchase_order",
          value: "",
        });
        purchaseOrderField.isDisabled = false;
      } else purchaseOrderField.isDisabled = true;

      // Account is of TDS journal
      var assessmentYearField = currRec.getCurrentSublistField({
        fieldId: "custcol_assessment_year",
        sublistId: "line",
      });
      if (TDS_ACCOUNTS.includes(accountNumber)) {
        currRec.setCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_assessment_year",
          value: "",
        });
        assessmentYearField.isDisabled = false;
      } else assessmentYearField.isDisabled = true;
    }

    try {
      if (scriptContext.fieldId == "entity") {
        var currentRecord = scriptContext.currentRecord;
        var currentProject = currentRecord.getCurrentSublistValue({
          sublistId: "line",
          fieldId: "entity",
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
              sublistId: "line",
              fieldId: "location",
              value:
                projectClassificationLookup.custentity_subsidiary_loaction[0]
                  .value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "line",
              fieldId: "location",
              value: "",
            });
          }
          if (
            projectClassificationLookup.custentity_line_of_business.length === 1
          ) {
            currentRecord.setCurrentSublistValue({
              sublistId: "line",
              fieldId: "class",
              value:
                projectClassificationLookup.custentity_line_of_business[0]
                  .value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "line",
              fieldId: "class",
              value: "",
            });
          }
          if (projectClassificationLookup.custentity_department.length === 1) {
            currentRecord.setCurrentSublistValue({
              sublistId: "line",
              fieldId: "department",
              value: projectClassificationLookup.custentity_department[0].value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "line",
              fieldId: "department",
              value: "",
            });
          }
        } else {
          currentRecord.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "location",
            value: "",
          });
          currentRecord.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "class",
            value: "",
          });
          currentRecord.setCurrentSublistValue({
            sublistId: "line",
            fieldId: "department",
            value: "",
          });
        }
      }
    } catch (error) {
      console.log("Error", error);
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
    // Line is selected
    if (scriptContext.sublistId == "line") {
      var currRec = scriptContext.currentRecord;

      // Account Name
      var accountId = currRec.getCurrentSublistText({
        sublistId: "line",
        fieldId: "account",
      });

      if (!_logValidation(accountId)) return; // No Account Selected

      // Account Number With String Manipulation
      var accountNumber =
        accountId.split(" ")[0] == "EMP"
          ? "EMP"
          : Number(accountId.split(" ")[0]);

      // Account is of employee loan
      var employeeField = currRec.getCurrentSublistField({
        fieldId: "custcol_employee",
        sublistId: "line",
      });
      if (
        EMPLOYEE_LOAN_ACCOUNTS.includes(accountNumber) ||
        accountNumber == "EMP"
      ) {
        currRec.setCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_employee",
          value: "",
        });
        employeeField.isDisabled = false;
      } else employeeField.isDisabled = true;

      // Account is of reversal provision
      var purchaseOrderField = currRec.getCurrentSublistField({
        fieldId: "custcol_purchase_order",
        sublistId: "line",
      });
      if (REVERSAL_PROVISION_ACCOUNTS.includes(accountNumber)) {
        currRec.setCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_purchase_order",
          value: "",
        });
        purchaseOrderField.isDisabled = false;
      } else purchaseOrderField.isDisabled = true;

      // Account is of TDS journal
      var assessmentYearField = currRec.getCurrentSublistField({
        fieldId: "custcol_assessment_year",
        sublistId: "line",
      });
      if (TDS_ACCOUNTS.includes(accountNumber)) {
        currRec.setCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_assessment_year",
          value: "",
        });
        assessmentYearField.isDisabled = false;
      } else assessmentYearField.isDisabled = true;
    }
  };

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
    if (scriptContext.sublistId == "line") {
      var currRec = scriptContext.currentRecord;
      var customForm = currRec.getValue({ fieldId: "customform" });
      if (customForm == 226) {
        var accountId = currRec.getCurrentSublistText({
          sublistId: "line",
          fieldId: "account",
        });
        // if(!_logValidation(accountId)) return false;
        var accountNumber = accountId.split(" ")[0];
        var employeeFieldValue = currRec.getCurrentSublistValue({
          sublistId: "line",
          fieldId: "custcol_employee",
        });
        if (accountNumber == "EMP" && !_logValidation(employeeFieldValue)) {
          alert("Please enter the employee value for the selected account.");
          return false;
        } else {
          return true;
        }
      }
    }
    return true;
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
    pageInit: pageInit,
    fieldChanged: fieldChanged,
    lineInit: lineInit,
    validateLine: validateLine,
  };
});
