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
           var cost_projectBudget = parseInt(
             getProjectBudget(projectId, "COST")
           );
           var billing_projectBudget = parseInt(
             getProjectBudget(projectId, "BILLING")
           );
           var budgetStatus = search.lookupFields({
             type: search.Type.JOB,
             id: projectId,
             columns: ["custentity_project_approval_status"],
           });
           budgetStatus =
             budgetStatus.custentity_project_approval_status[0].value;
 
           log.debug("budgetStatus", budgetStatus);
 
           if (budgetStatus == "1") {
             // Pending Budget Approval
             var id = record.submitFields({
               type: record.Type.JOB,
               id: projectId,
               values: {
                 custentity_project_approval_status: 2, //Budget Approved
                 custentity_cost_budget_history: cost_projectBudget,
                 custentity_billing_budget_history: billing_projectBudget,
                 custentity_rejection_reason: ''
               },
             });
           }
           if (budgetStatus == "5") {
             // Pending Budget Approval
             var id = record.submitFields({
               type: record.Type.JOB,
               id: projectId,
               values: {
                 custentity_project_approval_status: 6, //Modified Budget Approved
                 custentity_rejection_reason: ''
               },
             });
           }
 
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
         var budgetStatus =
           budgetStatusLookup.custentity_project_approval_status[0].value;
 
         var cost_projectBudget = parseInt(getProjectBudget(projectId, "COST"));
         var billing_projectBudget = parseInt(
           getProjectBudget(projectId, "BILLING")
         );
 
         log.debug("budgetStatus", budgetStatus);
 
         if (budgetStatus == "1") {
           //Pending Budget Approval
           var id = record.submitFields({
             type: record.Type.JOB,
             id: projectId,
             values: {
               custentity_project_approval_status: 3, //Budget Rejected
               custentity_rejection_reason: rejectionReason.toString(),
               custentity_cost_budget_history: cost_projectBudget,
               custentity_billing_budget_history: billing_projectBudget,
             },
           });
         }
 
         if (budgetStatus == "5") {
           // Pending Budget Approval
           var id = record.submitFields({
             type: record.Type.JOB,
             id: projectId,
             values: {
               custentity_project_approval_status: 7, //Modified Budget Rejected
               custentity_rejection_reason: rejectionReason.toString()
             },
           });
         }
 
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
 
   function getProjectBudget(projectId, budgetType) {
     try {
       var jobSearchObj = search.create({
         type: "job",
         filters: [
           ["internalidnumber", "equalto", projectId],
           "AND",
           ["projectbudget.type", "anyof", budgetType],
           // "AND",
           // ["projectbudget.type", "anyof", "COST", "BILLING"],
         ],
         columns: [
           search.createColumn({
             name: "type",
             join: "projectBudget",
             summary: "GROUP",
             label: "Budget Type",
           }),
           search.createColumn({
             name: "amount",
             join: "projectBudget",
             summary: "SUM",
             label: "Amount",
             sort: search.Sort.ASC,
           }),
         ],
       });
       var searchResultCount = jobSearchObj.runPaged().count;
       log.debug("jobSearchObj result count", searchResultCount);
       var projectBudget = jobSearchObj.run().getRange(0, 100);
 
       if (searchResultCount > 0) {
         var budgetAmount = projectBudget[0].getValue({
           name: "amount",
           join: "projectBudget",
           summary: "SUM",
           label: "Amount",
           sort: search.Sort.ASC,
         });
         return budgetAmount;
       } else {
         return 0;
       }
     } catch (error) {
       log.debug("Error 2 : ", error.toString());
     }
   }
 
   return { onRequest };
 });
 