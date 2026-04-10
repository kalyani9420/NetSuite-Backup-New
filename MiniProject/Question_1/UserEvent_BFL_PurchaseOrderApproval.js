/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/runtime"], (record, runtime) => {
  var purchaseObject;

  const beforeLoad = (scriptContext) => {
    purchaseObject = scriptContext.newRecord;

    var o_form = scriptContext.form;

    o_form.clientScriptFileId =  8898;

    var userRole = runtime.getCurrentUser().role;
    log.debug("role", runtime.getCurrentUser());
    log.debug("id", purchaseObject.id);

    o_form.addButton({
      id: "custpage_setStatus",
      label: "Set Status",
      functionName: "setStatus",
    });

    if (userRole == 1128) {
      o_form.addButton({
        id: "custpage_approved_po_button",
        label: "Approve",
        functionName: "approvePO",
      });
      o_form.addButton({
        id: "custpage_rejected_po_button",
        label: "Reject",
        functionName: "rejectPO",
      });
    }
  };

  const beforeSubmit = (scriptContext) => {};

  const afterSubmit = (scriptContext) => {
    purchaseObject = scriptContext.newRecord;
  };

  return { beforeLoad, beforeSubmit, afterSubmit };
});
