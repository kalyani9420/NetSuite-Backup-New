/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search"], /**
    * @param{record} record
    */ (record, search) => {
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
       // log.debug("beforeLoad", "beforeLoad");
     };
   
     /**
      * Defines the function definition that is executed before record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const beforeSubmit = (scriptContext) => {};
   
     /**
      * Defines the function definition that is executed after record is submitted.
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
      * @since 2015.2
      */
     const afterSubmit = (scriptContext) => {
    //    try {
    //      var ProjectTaskObj = scriptContext.newRecord;
    //      log.debug("ProjectTaskObj", ProjectTaskObj);
   
    //      var isPayWhenPaid = ProjectTaskObj.getValue({
    //        fieldId: "custevent_pay_when_paid",
    //      });
    //      log.debug("isPayWhenPaid", isPayWhenPaid);
   
    //      var taskId = ProjectTaskObj.id;
    //      var billResult;
    //      var billId;
   
    //      if (isPayWhenPaid === true) {
    //        billResult = getVendorBills(taskId);
   
    //        if (billResult != 0) {
    //          log.debug("Vendor Bills to hold : ", billResult);
   
    //          for (var index = 0; index < billResult.length; index++) {
    //            billId = _logValidation(
    //              billResult[index].getValue({
    //                name: "internalid",
    //                join: "transaction",
    //                label: "Internal ID",
    //              })
    //            )
    //              ? billResult[index].getValue({
    //                  name: "internalid",
    //                  join: "transaction",
    //                  label: "Internal ID",
    //                })
    //              : -1;
    //            if (billId != -1) {
    //              var id = record.submitFields({
    //                type: record.Type.VENDOR_BILL,
    //                id: billId,
    //                values: {
    //                  custbody11: true,
    //                },
    //              });
   
    //              log.debug("id : ", id);
    //            }
    //          }
    //        } else {
    //          log.debug("Note : ", "No Vendor Bill found in current task");
    //        }
    //      } else if (isPayWhenPaid === false) {
    //        billResult = getVendorBills(taskId);
   
    //        if (billResult != 0) {
    //          log.debug("Vendor Bills to unhold : ", billResult);
   
    //          for (var index = 0; index < billResult.length; index++) {
    //            billId = _logValidation(
    //              billResult[index].getValue({
    //                name: "internalid",
    //                join: "transaction",
    //                label: "Internal ID",
    //              })
    //            )
    //              ? billResult[index].getValue({
    //                  name: "internalid",
    //                  join: "transaction",
    //                  label: "Internal ID",
    //                })
    //              : -1;
    //            if (billId != -1) {
                 var id = record.submitFields({
                   type: record.Type.VENDOR_BILL,
                   id: 22372,
                   values: {
                    paymenthold: true,
                   },
                 });
   
                 log.debug("id : ", id);
    //            }
    //          }
    //        } else {
    //          log.debug("Note : ", "No Vendor Bill found in current task");
    //        }
    //      } else {
    //        log.debug("Note : ", "Current task is not pay when paid");
    //      }
    //    } catch (error) {
    //      log.debug("Error : ", error.toString());
    //    }
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
   
     function getVendorBills(taskId) {
       var projecttaskSearchObj = search.create({
         type: "projecttask",
         filters: [
           ["transaction.type", "anyof", "VendBill"],
           "AND",
           ["internalidnumber", "equalto", taskId],
         ],
         columns: [
           search.createColumn({
             name: "custevent_pay_when_paid",
             label: "Pay When Paid",
           }),
           search.createColumn({
             name: "internalid",
             join: "transaction",
             label: "Internal ID",
           }),
           search.createColumn({
             name: "type",
             join: "transaction",
             label: "Type",
           }),
         ],
       });
       var searchResultCount = projecttaskSearchObj.runPaged().count;
       log.debug("projecttaskSearchObj result count", searchResultCount);
       var searchResult = projecttaskSearchObj.run().getRange(0, 100);
   
       if (searchResultCount > 0) {
         return searchResult;
       } else {
         return 0;
       }
     }
   
     return { beforeLoad, beforeSubmit, afterSubmit };
   });
   