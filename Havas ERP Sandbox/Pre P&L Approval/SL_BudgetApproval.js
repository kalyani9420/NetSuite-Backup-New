/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/currentRecord", "N/record", "N/ui/serverWidget", "N/search"], /**
  * @param{currentRecord} currentRecord
  */ (currentRecord, record, serverWidget, search) => {
   /**
    * Defines the Suitelet script trigger point.
    * @param {Object} scriptContext
    * @param {ServerRequest} scriptContext.request - Incoming request
    * @param {ServerResponse} scriptContext.response - Suitelet response
    * @since 2015.2
    */
   const onRequest = (scriptContext) => {
     try {
       if (scriptContext.request.method === "GET") {
         var projectId = scriptContext.request.parameters.projectId;
         var response = scriptContext.request.parameters.response;
 
         log.debug("Get Trigger", projectId + " " + response);
 
         if (response == "approve" || response == "approveexceedbudget") {
 
           var budgetStatus = search.lookupFields({
             type: search.Type.JOB,
             id: projectId,
             columns: ["custentity_project_approval_status"],
           });
           budgetStatus =
             budgetStatus.custentity_project_approval_status[0].value;
 
           log.debug("budgetStatus", budgetStatus);
 
 
           if (budgetStatus == "1") { // Pending Budget Approval	 
             var id = record.submitFields({
               type: record.Type.JOB,
               id: projectId,
               values: {
                 custentity_project_approval_status: 2, //Budget Approved	
               },
             });
           }
 
           if (budgetStatus == "4") { // Pending Cost Budget Exceed Approval	 
             var id = record.submitFields({
               type: record.Type.JOB,
               id: projectId,
               values: {
                 custentity_project_approval_status: 7, //Cost Budget Exceed Approved	
               },
             });
           }
           if (budgetStatus == "5") { //Pending Billing Budget Exceed Approval	
             var id = record.submitFields({
               type: record.Type.JOB,
               id: projectId,
               values: {
                 custentity_project_approval_status: 8, //Billing Budget Exceed Approved
               },
             });
           }
           if (budgetStatus == "6") { //Pending Cost & Billing Budget Exceed Approval
             var id = record.submitFields({
               type: record.Type.JOB,
               id: projectId,
               values: {
                 custentity_project_approval_status: 9, //Cost & Billing Budget Exceed Approved
               },
             });
           }


           // rejected exceed budget

          //  if (budgetStatus == "10") {
          //   var id = record.submitFields({
          //     type: record.Type.JOB,
          //     id: projectId,
          //     values: {
          //       custentity_project_approval_status: 7,
          //     },
          //   });
          // }
          // if (budgetStatus == "11") {
          //   var id = record.submitFields({
          //     type: record.Type.JOB,
          //     id: projectId,
          //     values: {
          //       custentity_project_approval_status: 8,
          //     },
          //   });
          // }
          // if (budgetStatus == "12") {
          //   var id = record.submitFields({
          //     type: record.Type.JOB,
          //     id: projectId,
          //     values: {
          //       custentity_project_approval_status: 9,
          //     },
          //   });
          // }

          ////////////////////////////////////////////////////////////


 
           log.debug("Get id", id);
 
           log.debug("Get Trigger", projectId + " " + response);
 
           scriptContext.response.write(
             `<html><head><script>window.close()</script></head></html>`
           );
         } else if (response == "reject" || response == "rejectexceedbudget") {
           var form = serverWidget.createForm({
             title: "Rejection Reason",
           });
 
           form.addField({
             id: "custpage_rejection_reason",
             type: serverWidget.FieldType.TEXT,
             label: "Enter Rejection Reason",
           });
 
           var field = form.addField({
             id: "custpage_projectid",
             type: serverWidget.FieldType.TEXT,
             label: "Project Id",
           });
           field.updateDisplayType({
             displayType: serverWidget.FieldDisplayType.HIDDEN,
           });
           if (projectId) {
             field.defaultValue = projectId;
           }
 
           form.addSubmitButton({
             label: "Submit",
           });
 
           scriptContext.response.writePage(form);
         }
       } else if (scriptContext.request.method === "POST") {
         log.debug("Inside POST: ", "Inside POST: ");
 
         var rejectionReason =
           scriptContext.request.parameters.custpage_rejection_reason;
         var projectId = scriptContext.request.parameters.custpage_projectid;
         log.debug("rejectionReason: ", rejectionReason + " " + projectId);
 
         var budgetStatusLookup = search.lookupFields({
           type: search.Type.JOB,
           id: projectId,
           columns: ["custentity_project_approval_status"],
         });
         log.debug("budgetStatusLookup", budgetStatusLookup);
         var budgetStatus = budgetStatusLookup.custentity_project_approval_status[0].value;
 
         log.debug("budgetStatus", budgetStatus);
 
         if (budgetStatus == "1") { //Pending Budget Approval	 
           var id = record.submitFields({
             type: record.Type.JOB,
             id: projectId,
             values: {
               custentity_project_approval_status: 3, //Budget Rejected	  
               custentity_rejection_reason: rejectionReason.toString(),
             },
           });
         }
         if (budgetStatus == "4") { //Pending Cost Budget Exceed Approval	
           var id = record.submitFields({
             type: record.Type.JOB,
             id: projectId,
             values: {
               custentity_project_approval_status: 10, //Cost Budget Exceed Rejected
               custentity_rejection_reason: rejectionReason.toString(),
             },
           });
         }
         if (budgetStatus == "5") { //Pending Billing Budget Exceed Approval	 
           var id = record.submitFields({
             type: record.Type.JOB,
             id: projectId,
             values: {
               custentity_project_approval_status: 11, //Billing Budget Exceed Rejected	 
               custentity_rejection_reason: rejectionReason.toString(),
             },
           });
         }
         if (budgetStatus == "6") { //Pending Cost & Billing Budget Exceed Approval	 
           var id = record.submitFields({
             type: record.Type.JOB,
             id: projectId,
             values: {
               custentity_project_approval_status: 12, //Cost & Billing Budget Exceed Rejected
               custentity_rejection_reason: rejectionReason.toString(),
             },
           });
         }



         // // rejected exceed budget
        //  if (budgetStatus == "10") {
        //   var id = record.submitFields({
        //     type: record.Type.JOB,
        //     id: projectId,
        //     values: {
        //       custentity_project_approval_status: 10,
        //       custentity_rejection_reason: rejectionReason.toString(),
        //     },
        //   });
        // }
        // if (budgetStatus == "11") {
        //   var id = record.submitFields({
        //     type: record.Type.JOB,
        //     id: projectId,
        //     values: {
        //       custentity_project_approval_status: 11,
        //       custentity_rejection_reason: rejectionReason.toString(),
        //     },
        //   });
        // }
        // if (budgetStatus == "12") {
        //   var id = record.submitFields({
        //     type: record.Type.JOB,
        //     id: projectId,
        //     values: {
        //       custentity_project_approval_status: 12,
        //       custentity_rejection_reason: rejectionReason.toString(),
        //     },
        //   });
        // }

        ////////////////////////////


 
         log.debug("Get id", id);
         scriptContext.response.write(
           `<html><head><script>window.close()</script></head></html>`
         );
       } else {
         log.debug("Invalid Response", "Invalid response");
       }
 
       log.debug("id: ", id);
     } catch (error) {
       log.debug("Error : ", error.toString());
     }
   };
 
   return { onRequest };
 });
 