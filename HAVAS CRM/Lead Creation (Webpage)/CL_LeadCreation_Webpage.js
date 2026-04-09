/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord"], /**
 * @param{currentRecord} currentRecord
 */
function (currentRecord) {
  function pageInit(scriptContext) {
    // alert("Client Script has been link");
  }

  function fieldChanged(scriptContext) {
    try {
      var objRecord = currentRecord.get();
      var selectOption = objRecord.getValue({
        fieldId: "custpage_lead_type",
      });
      var leadFirstName = objRecord.getField({
        fieldId: "custpage_lead_firstname",
      });
      var leadLastName = objRecord.getField({
        fieldId: "custpage_lead_lastname",
      });
      var leadCompanyName = objRecord.getField({
        fieldId: "custpage_lead_companyname",
      });

      if (selectOption === "Company") {
        leadFirstName.isDisabled = true;
        leadLastName.isDisabled = true;
        leadCompanyName.isDisabled = false;
        leadFirstName.isMandatory = false;
        leadLastName.isMandatory = false;
        leadCompanyName.isMandatory = true;
      }
       else if (selectOption === "Individual") {
        leadFirstName.isDisabled = false;
        leadLastName.isDisabled = false;
        leadCompanyName.isDisabled = true;
        leadFirstName.isMandatory = true;
        leadLastName.isMandatory = true;
        leadCompanyName.isMandatory = false;
      } else {
        log.debug("Invalid Type");
      }
    } catch (error) {
      log.debug("Error :", error);
    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
  };
});
