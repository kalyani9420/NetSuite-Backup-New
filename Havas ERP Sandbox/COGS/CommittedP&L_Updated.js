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
     try {
       var recordId = scriptContext.newRecord.id;
       var recordType = scriptContext.newRecord.type;
       var recordObj = scriptContext.newRecord;
 
       var recordForm = scriptContext.form;
 
       if (recordType == "job") {
         var cogsTable = getProjectCogs(recordId);
         var committedPlTable = getCommittedPL(recordId);
 
         // var cogsFieldGroup = recordForm.addFieldGroup({
         //   id: "cogsfieldgroupid",
         //   label: "COGS",
         // });
 
         // var cogsField = recordForm.addField({
         //   id: "custpage_cogs_table",
         //   type: serverWidget.FieldType.INLINEHTML,
         //   label: "COGS Table",
         //   container: "cogsfieldgroupid",
         // });
         // cogsField.defaultValue = cogsTable;
 
         var cogsTable = recordObj.setValue({
           fieldId: "custentity_cogs_calculation",
           value: cogsTable,
         });
         log.debug("cogsTable : ", cogsTable);
 
         var committedPl = recordObj.setValue({
           fieldId: "custentity_commiteed_pl",
           value: committedPlTable,
         });
         log.debug("committedPl : ", committedPl);
       }
     } catch (error) {
       log.debug("Error : ", error);
     }
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
 
   const afterSubmit = (scriptContext) => {};
 
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
 
   function formatIndianNumber(num) {
     return num.toLocaleString("en-IN");
   }
 
   function getCommittedPL(projectId) {
     // var jobSearchObj = search.create({
     //   type: "job",
     //   filters: [
     //     ["internalidnumber", "equalto", projectId],
     //     "AND",
     //     ["transaction.type", "anyof", "PurchOrd", "ExpRept", "SalesOrd"],
     //   ],
     //   columns: [
     //     search.createColumn({
     //       name: "amount",
     //       join: "transaction",
     //       summary: "SUM",
     //       label: "Total Amount",
     //     }),
     //     search.createColumn({
     //       name: "type",
     //       join: "transaction",
     //       summary: "GROUP",
     //       label: "Transaction Type",
     //       sort: search.Sort.ASC,
     //     }),
     //   ],
     // });
 
     var jobSearchObj = search.create({
       type: "job",
       filters: [
         //  ["internalidnumber", "equalto", projectId],
         //  "AND",
         //  ["transaction.type", "anyof", "ExpRept", "PurchOrd", "SalesOrd"],
 
         [
           ["internalidnumber", "equalto", projectId],
           "AND",
           ["transaction.type", "anyof", "PurchOrd"],
           "AND",
           ["transaction.approvalstatus", "anyof", "2"],
         ],
         "OR",
         [
           ["transaction.type", "anyof", "SalesOrd"],
           "AND",
           ["transaction.custbody_approval_status", "anyof", "2"],
           "AND",
           ["internalidnumber", "equalto", projectId],
         ],
         "OR",
         [
           ["transaction.type", "anyof", "ExpRept"],
           "AND",
           ["internalidnumber", "equalto", projectId],
           "AND",
           [
             "transaction.status",
             "anyof",
             "ExpRept:G",
             "ExpRept:F",
             "ExpRept:I",
             "ExpRept:J",
           ],
         ],
       ],
       columns: [
         search.createColumn({
           name: "internalid",
           join: "transaction",
           summary: "GROUP",
           label: "Internal ID",
           sort: search.Sort.ASC,
         }),
         search.createColumn({
           name: "total",
           join: "transaction",
           summary: "MAX",
           label: "Amount (Transaction Total)",
         }),
         search.createColumn({
           name: "type",
           join: "transaction",
           summary: "GROUP",
           label: "Type",
           sort: search.Sort.ASC,
         }),
       ],
     });
     var searchResultCount = jobSearchObj.runPaged().count;
     log.debug("jobSearchObj result count", searchResultCount);
     var searchResult = jobSearchObj.run().getRange(0, 100);
     log.debug("searchResult result count", searchResult);
 
     var cogsJSON = {
       "Purchase Order": "0.0",
       "Expense Report": "0.0",
       "Sales Order": "0.0",
     };
 
     if (searchResultCount > 0) {
       for (var index = 0; index < searchResultCount; index++) {
         var cogsAmount = searchResult[index].getValue({
           name: "total",
           join: "transaction",
           summary: "MAX",
           label: "Amount (Transaction Total)",
         });
 
         var cogsType = searchResult[index].getText({
           name: "type",
           join: "transaction",
           summary: "GROUP",
           label: "Type",
           sort: search.Sort.ASC,
         });
 
         log.debug(index, cogsType + " " + cogsAmount);
         cogsJSON[cogsType] =
           parseFloat(cogsJSON[cogsType]) + parseFloat(cogsAmount);
       }
     }
 
     log.debug("cogsJSON", cogsJSON);
 
     var profitCalculation =
       parseFloat(cogsJSON["Sales Order"]) -
       (parseFloat(cogsJSON["Purchase Order"]) +
         parseFloat(cogsJSON["Expense Report"]));
     log.debug("profitCalculation", profitCalculation);
 
     var htmlTable = "";
     htmlTable += "<html>";
     htmlTable += "<body>";
     htmlTable +=
       '<table style="text-align: center; width:60% ; padding-top: 10px; font-size: 13px;">';
     // htmlTable +=
     //   '<tr style="border: 1px solid #ddd; text-align: left; background-color: #607799";>';
     // htmlTable +=
     //   '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Total Purchase</th>';
     // htmlTable +=
     //   '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Total Expenses</th>';
 
     // htmlTable += "</tr>";
     htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       "Sales Order" +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width: 50%; background-color: #dfe4eb">' +
       formatIndianNumber(parseFloat(cogsJSON["Sales Order"])) +
       ".00";
     ("</td>");
     htmlTable += "</tr>";
     htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       "Purchase Order" +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       formatIndianNumber(parseFloat(cogsJSON["Purchase Order"])) +
       ".00";
     ("</td>");
     htmlTable += "</tr>";
 
     htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       "Expense Report" +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       formatIndianNumber(parseFloat(cogsJSON["Expense Report"])) +
       ".00";
     ("</td>");
     htmlTable += "</tr>";
 
     htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       "Profit" +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
       formatIndianNumber(profitCalculation) +
       ".00";
     ("</td>");
     htmlTable += "</tr>";
 
     htmlTable += "</table>";
     htmlTable += "</body>";
     htmlTable += "</html>";
 
     return htmlTable;
   }
 
   function getProjectCogs(projectId) {
     // var jobSearchObj = search.create({
     //   type: "job",
     //   filters: [
     //     ["internalidnumber", "equalto", projectId],
     //     "AND",
     //     ["transaction.type", "anyof", "PurchOrd", "ExpRept"],
     //   ],
     //   columns: [
     //     search.createColumn({
     //       name: "amount",
     //       join: "transaction",
     //       summary: "SUM",
     //       label: "Total Amount",
     //     }),
     //     search.createColumn({
     //       name: "type",
     //       join: "transaction",
     //       summary: "GROUP",
     //       label: "Transaction Type",
     //       sort: search.Sort.ASC,
     //     }),
     //   ],
     // });
     var jobSearchObj = search.create({
       type: "job",
       filters: [
         // ["internalidnumber", "equalto", projectId],
         // "AND",
         // ["transaction.type", "anyof", "ExpRept", "PurchOrd"],
 
         [
           ["internalidnumber", "equalto", projectId],
           "AND",
           ["transaction.type", "anyof", "PurchOrd"],
           "AND",
           ["transaction.approvalstatus", "anyof", "2"],
         ],
         "OR",
         [
           ["transaction.type", "anyof", "ExpRept"],
           "AND",
           ["internalidnumber", "equalto", projectId],
           "AND",
           [
             "transaction.status",
             "anyof",
             "ExpRept:G",
             "ExpRept:F",
             "ExpRept:I",
             "ExpRept:J",
           ],
         ],
       ],
       columns: [
         search.createColumn({
           name: "internalid",
           join: "transaction",
           summary: "GROUP",
           label: "Internal ID",
           sort: search.Sort.ASC,
         }),
         search.createColumn({
           name: "total",
           join: "transaction",
           summary: "MAX",
           label: "Amount (Transaction Total)",
         }),
         search.createColumn({
           name: "type",
           join: "transaction",
           summary: "GROUP",
           label: "Type",
           sort: search.Sort.ASC,
         }),
       ],
     });
     var searchResultCount = jobSearchObj.runPaged().count;
     log.debug("jobSearchObj result count", searchResultCount);
     var searchResult = jobSearchObj.run().getRange(0, 100);
     log.debug("searchResult result count", searchResult);
 
     // var cogsJSON = {
     //   "Purchase Order": "0.0",
     //   "Expense Report": "0.0",
     // };
 
     // if (searchResultCount > 0) {
     //   for (var index = 0; index < searchResultCount; index++) {
     //     var cogsAmount = searchResult[index].getValue({
     //       name: "total",
     //       join: "transaction",
     //       summary: "MAX",
     //       label: "Amount (Transaction Total)",
     //     });
 
     //     var cogsType = searchResult[index].getText({
     //       name: "type",
     //       join: "transaction",
     //       summary: "GROUP",
     //       label: "Type",
     //       sort: search.Sort.ASC,
     //     });
 
     //     log.debug(index, cogsType + " " + cogsAmount);
     //     cogsJSON[cogsType] = cogsAmount;
     //   }
     // }
 
 
 
     var cogsJSON = {
       "Purchase Order": "0.0",
       "Expense Report": "0.0",
     };
 
     if (searchResultCount > 0) {
       for (var index = 0; index < searchResultCount; index++) {
         var cogsAmount = searchResult[index].getValue({
           name: "total",
           join: "transaction",
           summary: "MAX",
           label: "Amount (Transaction Total)",
         });
 
         var cogsType = searchResult[index].getText({
           name: "type",
           join: "transaction",
           summary: "GROUP",
           label: "Type",
           sort: search.Sort.ASC,
         });
 
         log.debug(index, cogsType + " " + cogsAmount);
         cogsJSON[cogsType] =
           parseFloat(cogsJSON[cogsType]) + parseFloat(cogsAmount);
       }
     }
 
     log.debug("cogsJSON", cogsJSON);
 
     log.debug("cogsJSON", cogsJSON);
     var totalAmount =
       parseFloat(cogsJSON["Purchase Order"]) +
       parseFloat(cogsJSON["Expense Report"]);
     var htmlTable = "";
     htmlTable += "<html>";
     htmlTable += "<body>";
     htmlTable +=
       '<table style="text-align: center; width:60% ; padding-top: 10px; font-size: 13px;">';
     htmlTable +=
       '<tr style="border: 1px solid #ddd; text-align: left; background-color: #607799";>';
     htmlTable +=
       '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Purchase</th>';
     htmlTable +=
       '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Expenses</th>';
 
     htmlTable +=
       '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Total </th>';
 
     htmlTable += "</tr>";
     htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%;">' +
       formatIndianNumber(parseFloat(cogsJSON["Purchase Order"])) +
       ".00" +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%;">' +
       formatIndianNumber(parseFloat(cogsJSON["Expense Report"])) +
       ".00" +
       "</td>";
     htmlTable +=
       '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%;">' +
       formatIndianNumber(parseFloat(totalAmount)) +
       ".00" +
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
 