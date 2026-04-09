/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/ui/serverWidget"], /**
  * @param{record} record
  */ (record, search, serverWidget) => {
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
 
   //Payment Hold - Unshow Check Box
   const afterSubmit = (scriptContext) => {
     try {
       var RecordType = scriptContext.newRecord.type;
 
       var RecordId = scriptContext.newRecord.id;
 
       if (RecordType == "projecttask") {
         var ProjectTaskObj = scriptContext.newRecord;
 
         log.debug("ProjectTaskObj", ProjectTaskObj);
 
         //default checked
         var isPayWhenPaid = ProjectTaskObj.getValue({
           fieldId: "custevent_enable_pay_when_paid",
         });
         log.debug("isPayWhenPaid : ", isPayWhenPaid);
 
         var taskId = ProjectTaskObj.id;
         var billResult;
         var billId;
 
         if (isPayWhenPaid === true) {
           billResult = getVendorBills(taskId);
 
           if (billResult != 0) {
             log.debug("Vendor Bills to hold : ", billResult);
 
             for (var index = 0; index < billResult.length; index++) {
               billId = _logValidation(
                 billResult[index].getValue({
                   name: "internalid",
                   join: "transaction",
                   label: "Internal ID",
                 })
               )
                 ? billResult[index].getValue({
                     name: "internalid",
                     join: "transaction",
                     label: "Internal ID",
                   })
                 : -1;
               if (billId != -1) {
                 var id = record.submitFields({
                   type: record.Type.VENDOR_BILL,
                   id: billId,
                   values: {
                     paymenthold: true,
                   },
                 });
 
                 log.debug("id : ", id);
               }
             }
           } else {
             log.debug("Note : ", "No Vendor Bill found in current task");
           }
         } else if (isPayWhenPaid === false) {
           billResult = getVendorBills(taskId);
 
           if (billResult != 0) {
             log.debug("Vendor Bills to unhold : ", billResult);
 
             for (var index = 0; index < billResult.length; index++) {
               billId = _logValidation(
                 billResult[index].getValue({
                   name: "internalid",
                   join: "transaction",
                   label: "Internal ID",
                 })
               )
                 ? billResult[index].getValue({
                     name: "internalid",
                     join: "transaction",
                     label: "Internal ID",
                   })
                 : -1;
               if (billId != -1) {
                 var id = record.submitFields({
                   type: record.Type.VENDOR_BILL,
                   id: billId,
                   values: {
                     paymenthold: false,
                   },
                 });
 
                 log.debug("id : ", id);
               }
             }
           } else {
             log.debug("Note : ", "No Vendor Bill found in current task");
           }
         } else {
           log.debug("Note : ", "Current task is not pay when paid");
         }
       }
     } catch (error) {
       log.debug("Error : ", error.toString());
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
           name: "custevent_enable_pay_when_paid",
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
 
   function getProjectCogs(projectId) {
     var jobSearchObj = search.create({
       type: "job",
       filters: [
         ["internalidnumber", "equalto", projectId],
         "AND",
         ["transaction.type", "anyof", "PurchOrd", "ExpRept"],
       ],
       columns: [
         search.createColumn({
           name: "amount",
           join: "transaction",
           summary: "SUM",
           label: "Total Amount",
         }),
         search.createColumn({
           name: "type",
           join: "transaction",
           summary: "GROUP",
           label: "Transaction Type",
           sort: search.Sort.ASC,
         }),
       ],
     });
     var searchResultCount = jobSearchObj.runPaged().count;
     log.debug("jobSearchObj result count", searchResultCount);
     var searchResult = jobSearchObj.run().getRange(0, 100);
     log.debug("searchResult result count", searchResult);
 
     var totalExpense = searchResult[0].getValue({
       name: "amount",
       join: "transaction",
       summary: "SUM",
       label: "Total Amount",
     })
       ? searchResult[0].getValue({
           name: "amount",
           join: "transaction",
           summary: "SUM",
           label: "Total Amount",
         })
       : 0.0;
 
     var totalPO = searchResult[1].getValue({
       name: "amount",
       join: "transaction",
       summary: "SUM",
       label: "Total Amount",
     })
       ? searchResult[1].getValue({
           name: "amount",
           join: "transaction",
           summary: "SUM",
           label: "Total Amount",
         })
       : 0.0;
 
     log.debug("COGS : ", totalExpense + " " + totalPO);
 
     var htmlTable = "";
     htmlTable += "<html>";
     htmlTable += "<body>";
     htmlTable += '<table style="text-align: center; width:60%">';
     htmlTable +=
       '<tr style="border: 1px solid #ddd; text-align: left; background-color: #79a6d2";>';
     htmlTable +=
       '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%">Total Purchase</th>';
     htmlTable +=
       '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%">Total Expenses</th>';
 
     htmlTable += "</tr>";
     htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%">' +
       totalPO +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%">' +
       totalExpense +
       "</td>";
     htmlTable += "</tr>";
 
     htmlTable += "</table>";
     htmlTable += "</body>";
     htmlTable += "</html>";
 
     return htmlTable;
   }
 
   return { beforeLoad, beforeSubmit, afterSubmit };
 });
 
 // [
 //   {
 //     values: {
 //       "SUM(transaction.amount)": "1000.00",
 //       "GROUP(transaction.type)": [{ value: "ExpRept", text: "Expense Report" }],
 //     },
 //   },
 //   {
 //     values: {
 //       "SUM(transaction.amount)": "3000.00",
 //       "GROUP(transaction.type)": [
 //         { value: "PurchOrd", text: "Purchase Order" },
 //       ],
 //     },
 //   },
 // ];
 