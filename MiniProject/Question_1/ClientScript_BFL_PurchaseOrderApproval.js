/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
  "N/currentRecord",
  "N/runtime",
  "N/email",
  "N/record",
  "N/url",
], function (currentRecord, runtime, email, record, url) {
  var objRecord = currentRecord.get();
  var idRecord = objRecord.id;
  var userObj = runtime.getCurrentUser();

  function pageInit(scriptContext) {}

  function setStatus() {
    objRecord.setValue({
      fieldId: "custbody2",
      value: 1,
    //   ignoreFieldChange: true,
    //   forceSyncSourcing: true,
    });
    var recId = objRecord.save();
    log.debug('record id ' , recId)
  }

  function emailOfPOAprrovalRequest() {
    log.debug("email send", "email send");

    var scheme = "https://";
    var host = url.resolveDomain({
      hostType: url.HostType.APPLICATION,
    });

    var relativePath = url.resolveRecord({
      recordType: record.Type.PURCHASE_ORDER,
      recordId: idRecord,
      isEditMode: false,
    });

    var myURL = scheme + host + relativePath;

    log.debug("path", myURL);
    log.debug("path", typeof myURL);

    var msg = "Pending Purchase Order: ";
    msg += "<a href= " + myURL + ">" + idRecord + "</a>";

    location.reload();
    alert("Approval request has been send to Purchasing Manager");

    email.send({
      author: userObj.id,
      recipients: -5,
      subject: "#PO is pending for Approval",
      body: msg,
    });
  }
  function approvePO() {
    // var approveValue = objRecord.getValue({
    // fieldId: 'approvalstatus'
    // });
    // alert(approveValue)
    // alert(idRecord)

    var otherId = record.submitFields({
      type: record.Type.PURCHASE_ORDER,
      id: idRecord,
      values: {
        approvalstatus: 2,
      },
    });
    location.reload();
  }
  function rejectPO() {
    // var approveValue = objRecord.getValue({
    // fieldId: 'approvalstatus'
    // });
    // alert(approveValue)
    // alert(idRecord)

    var reason = prompt("Enter The Reason For PO Rejection");
    var otherId = record.submitFields({
      type: record.Type.PURCHASE_ORDER,
      id: idRecord,
      values: {
        approvalstatus: 3,
        custbody_po_rejection_reason: reason,
      },
    });

    location.reload();

    email.send({
      author: -5,
      recipients: userObj.id,
      subject: "#PO has been Reject",
      body: "#PO is has been reject by purchasing manager",
    });
  }

  return {
    pageInit: pageInit,
    emailOfPOAprrovalRequest: emailOfPOAprrovalRequest,
    approvePO: approvePO,
    rejectPO: rejectPO,
    setStatus: setStatus,
  };
});
