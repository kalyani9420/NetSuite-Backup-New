/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/currentRecord", "N/record"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (scriptContext) => {
    if (scriptContext.request.method === "GET") {
      try {
        var form = serverWidget.createForm({
            title: 'Rejection Reason'
        });

        form.addField({
            id: 'custpage_rejection_reason',
            type: serverWidget.FieldType.TEXT,
            label: 'Enter Rejection Reason',

        });

        
        form.addSubmitButton({
            label: 'Submit',
        });
        


      } catch (error) {
        log.debug("Error : ", error.toString());
      }
      
    
    }
  };

  return { onRequest };
});
