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
       var formObj = scriptContext.form;
       if(scriptContext.type == 'view') {
           formObj.getField({id: 'duedate'}).updateDisplayType({displayType: 'normal'});
       } else {
           formObj.getField({id: 'duedate'}).updateDisplayType({displayType: 'hidden'});
       }
     } catch (error) {
       log.debug('Error from beforeLoad', error);
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
 
   const afterSubmit = (scriptContext) => {
     try {
       var purchaseOrderId = scriptContext.newRecord.id;
       if (_logValidation(purchaseOrderId)) {
         log.debug("Purchase Id : ", purchaseOrderId);
         isInterCompanyEvent(purchaseOrderId);
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
 
   function isInterCompanyEvent(purchaseId) {
     try {
       var purchaseProject = [];
       var holdTask = [];
       var purchaseResult = getPurchaseResult(purchaseId);
       log.debug("purchaseResult length ", purchaseResult.length);
 
       if (purchaseResult != 0) {
         // var purchaseLocation = purchaseResult[0].getValue({
         //   name: "location",
         //   label: "Location",
         // })
         //   ? purchaseResult[0].getValue({
         //       name: "location",
         //       label: "Location",
         //     })
         //   : 0;
         //   log.debug("purchaseLocation  ", purchaseLocation);
 
         for (var index = 0; index < purchaseResult.length; index++) {
           //intercompany
         //   if (purchaseLocation != 0) {
         //     var projectId = purchaseResult[index].getValue({
         //       name: "internalid",
         //       join: "customer",
         //       label: "Internal ID",
         //     })
         //       ? purchaseResult[index].getValue({
         //           name: "internalid",
         //           join: "customer",
         //           label: "Internal ID",
         //         })
         //       : 0;
         //     if (projectId != 0) {
         //       var locationLookUpOnProject = search.lookupFields({
         //         type: search.Type.JOB,
         //         id: projectId,
         //         columns: ["custentity_project_location"],
         //       });
 
         //       locationLookUpOnProject =
         //         locationLookUpOnProject.custentity_project_location[0].value;
         //       log.debug("locationLookUpOnProject", locationLookUpOnProject);
 
         //       if (locationLookUpOnProject != purchaseLocation) {
         //         purchaseProject.push(projectId);
         //       }
         //     }
         //   }
 
           //On hold
           var taskId = purchaseResult[index].getValue({
             name: "internalid",
             join: "projectTask",
             label: "Internal ID",
           })
             ? purchaseResult[index].getValue({
                 name: "internalid",
                 join: "projectTask",
                 label: "Internal ID",
               })
             : 0;
           if (taskId != 0) {
             var PayWhenPaidLookupOnTask = search.lookupFields({
               type: search.Type.PROJECT_TASK,
               id: taskId,
               columns: ["custevent_enable_pay_when_paid"],
             });
 
             PayWhenPaidLookupOnTask =
               PayWhenPaidLookupOnTask.custevent_enable_pay_when_paid;
             log.debug("PayWhenPaidLookupOnTask", PayWhenPaidLookupOnTask);
 
             if (PayWhenPaidLookupOnTask == true) {
               holdTask.push(taskId);
             }
           }
         }
 
         log.debug('purchaseProject' , purchaseProject)
         log.debug('holdTask' , holdTask)
 
 
         // if (purchaseProject.length > 0) {
         //     var id = record.submitFields({
         //       type: record.Type.VENDOR_BILL,
         //       id: purchaseId,
         //       values: {
         //         custbody_intercompany_event: true,
         //       },
         //     });
   
         //     log.debug("id", id);
         //   }
         //   else {
         //     var id = record.submitFields({
         //       type: record.Type.VENDOR_BILL,
         //       id: purchaseId,
         //       values: {
         //         custbody_intercompany_event: false,
         //       },
         //     });
         //     log.debug("Note : ", "No project found on purchase order");
         //   }
 
 
           if (holdTask.length > 0) {
             var id = record.submitFields({
               type: record.Type.VENDOR_BILL,
               id: purchaseId,
               values: {
                 paymenthold: true,
               },
             });
     
             log.debug("id", id);
           } else {
             var id = record.submitFields({
               type: record.Type.VENDOR_BILL,
               id: purchaseId,
               values: {
                 paymenthold: false,
               },
             });
             log.debug("Note : ", "Pay When paid has unapplied on bill task");
           }
 
 
       } else {
         log.debug("Note : ", "No project found on purchase order");
       }
     } catch (error) {
       log.debug("Error : ", error.toString());
     }
   }
 
   function getPurchaseResult(purchaseId) {
     try {
       var purchaseorderSearchObj = search.create({
         type: "vendorbill",
         settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
         filters: [
           ["type", "anyof", "VendBill"],
           "AND",
           ["mainline", "is", "F"],
           "AND",
           ["customer.entityid", "isnotempty", ""],
           "AND",
           ["internalidnumber", "equalto", purchaseId],
         ],
         columns: [
           search.createColumn({ name: "internalid", label: "Internal ID" }),
           search.createColumn({ name: "type", label: "Type" }),
           search.createColumn({ name: "entity", label: "Name" }),
           search.createColumn({ name: "memo", label: "Memo" }),
           search.createColumn({ name: "amount", label: "Amount" }),
           search.createColumn({ name: "location", label: "Location" }),
 
           search.createColumn({
             name: "itemid",
             join: "item",
             label: "Name",
           }),
           search.createColumn({
             name: "entityid",
             join: "customer",
             label: "Name",
           }),
           search.createColumn({
             name: "internalid",
             join: "customer",
             label: "Internal ID",
           }),
           search.createColumn({
             name: "internalid",
             join: "projectTask",
             label: "Internal ID",
           }),
         ],
       });
       var searchResultCount = purchaseorderSearchObj.runPaged().count;
       log.debug("purchaseorderSearchObj result count", searchResultCount);
       var purchaseResult = purchaseorderSearchObj.run().getRange(0, 100);
 
       if (searchResultCount > 0) {
         return purchaseResult;
       } else {
         return 0;
       }
     } catch (error) {
       log.debug("Error : ", error.toString());
     }
   }
 
   return { beforeLoad, beforeSubmit, afterSubmit };
 });
 