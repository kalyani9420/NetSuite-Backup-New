/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 */ (record, search) => {
  const afterSubmit = (scriptContext) => {
    try {
      var recordObj = scriptContext.newRecord;
      var recordId = scriptContext.newRecord.id;
      var leadSubsidiary = recordObj.getValue({
        fieldId: "subsidiary",
      });
      var leadObjRecord = record.load({
        type: record.Type.LEAD,
        id: recordId,
        isDynamic: true,
      });
      var leadSalesRep = leadObjRecord.getValue({
        fieldId: "salesrep",
      });
      if (_logValidation(leadSalesRep)) {
        var employeeFieldLookUp = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: leadSalesRep,
          columns: ["subsidiary"],
        });

        fromSubsidiary = leadSubsidiary;
        toSubsidiary = employeeFieldLookUp.subsidiary[0].value;

        var id = record.submitFields({
          type: record.Type.LEAD,
          id: recordId,
          values: {
            subsidiary: toSubsidiary,
            custentity_from_subsidary: 1,
            custentity_to_subsidary: toSubsidiary,
            custentity_referred_lead: true,
          },
        });
        log.debug("id", id);
      } else {
        log.debug("Sales Rep has not assigned yet");
      }
    } catch (error) {
      log.debug("Error :", error);
    }
  };

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

  return { afterSubmit };
});
