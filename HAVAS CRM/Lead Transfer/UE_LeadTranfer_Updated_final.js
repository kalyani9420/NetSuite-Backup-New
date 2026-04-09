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
    //   var leadSubsidiary = recordObj.getValue({
    //     fieldId: "subsidiary",
    //   });
    var leadSubsidiary = getCurrentPrimarySubsidiary(recordId);
    log.debug('leadSubsidiary' , leadSubsidiary)
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
            custentity_from_subsidary: fromSubsidiary,
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

  function getCurrentPrimarySubsidiary(leadId) {
    var leadSearchObj = search.create({
      type: "lead",
      filters: [
        ["stage", "anyof", "LEAD"],
        "AND",
        ["internalidnumber", "equalto", leadId],
        "AND",
        ["msesubsidiary.primary", "is", "T"],
      ],
      columns: [
        search.createColumn({
          name: "name",
          join: "mseSubsidiary",
          label: "Name",
        }),
        search.createColumn({
          name: "internalid",
          join: "mseSubsidiary",
          label: "Internal ID",
        }),

        search.createColumn({
          name: "primary",
          join: "mseSubsidiary",
          label: "Primary (Y/N)",
        }),
      ],
    });
    var searchResultCount = leadSearchObj.runPaged().count;
    log.debug("leadSearchObj result count", searchResultCount);

    if (searchResultCount > 0) {
      var leadResult = leadSearchObj.run().getRange(0, 10);
      var primarySubsidiary = leadResult[0].getValue({
        name: "internalid",
        join: "mseSubsidiary",
        label: "Internal ID",
      });
      return primarySubsidiary;
    }
    log.debug("primarySubsidiary", primarySubsidiary);
  }

  return { afterSubmit };
});
