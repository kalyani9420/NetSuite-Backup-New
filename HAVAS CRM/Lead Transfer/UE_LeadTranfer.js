/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record"], /**
 * @param{record} record
 */
(record) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {
    log.debug("beforeLoad", "beforeLoad");
  };

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {
    
  };

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {
    try {
        
        var recordObj = scriptContext.newRecord;
        var recordId = scriptContext.newRecord.id;
        var fromSubsidary = recordObj.getValue({
          fieldId: "custentity_from_subsidary",
        });
        var toSubsidary = recordObj.getValue({
          fieldId: "custentity_to_subsidary",
        });

        if (_logValidation(fromSubsidary) && _logValidation(toSubsidary)) {
          var id = record.submitFields({
            type: record.Type.LEAD,
            id: recordId,
            values: {
                subsidiary: toSubsidary,
            },
          });
          log.debug("id" , id);
        } else {
          log.debug("Lead is not referal lead");
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

  return { beforeLoad, beforeSubmit, afterSubmit };
});
