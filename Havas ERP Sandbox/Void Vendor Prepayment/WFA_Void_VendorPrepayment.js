/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/currentRecord', 'N/record', 'N/search'],
    /**
 * @param{currentRecord} currentRecord
 */
    (currentRecord, record, search) => {
        /**
         * Defines the WorkflowAction script trigger point.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
         * @param {string} scriptContext.type - Event type
         * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
         * @since 2016.1
         */
        const onAction = (scriptContext) => {
            try {
                let prepaymentObj = scriptContext.newRecord;
                let prepaymentId = scriptContext.newRecord.id;
                let prepaymentApp = getPrepaymentApplication(prepaymentId);
                log.debug('prepaymentApplication', prepaymentApp);
                log.debug('getSublists', prepaymentObj.getSublists());
                if (prepaymentApp != null) {
                    for (let index = 0; index < prepaymentApp.length; index++) {
                        let applicationType = prepaymentApp[index].getValue({ name: "type", join: "applyingTransaction", label: "Type" });
                        let applicationId = prepaymentApp[index].getValue({ name: "internalid", join: "applyingTransaction", label: "Internal ID" });
                        if (applicationType == 'VPrepApp' && _logValidation(applicationId)) record.delete({ type: record.Type.VENDOR_PREPAYMENT_APPLICATION, id: applicationId });
                    }
                }
                let paymentAmount = prepaymentObj.getValue({ fieldId: "payment" });
                let paymentLocation = prepaymentObj.getValue({ fieldId: "location" });
                let agTaxJE = prepaymentObj.getValue({ fieldId: 'custbody_agtax_journal_entry' });
                log.debug('paymentAmount', paymentAmount)
                log.debug('paymentLocation', paymentLocation)
                record.submitFields({
                    type: record.Type.VENDOR_PREPAYMENT,
                    id: prepaymentId,
                    values: {
                        memo: 'VOID', purchaseorder: '', payment: paymentAmount, location: paymentLocation, custbody_voided: true, custbody_agtax_gst_apply_tax: false, custbody_agtax_tds_type: '', custbody_agtax_tax_rate: 0,
                        custbody_agtax_gst_tds_account: '', custbody_agtax_tax_amount: 0, custbody_agtax_india_sub_tax: false, custbody_agtax_journal_entry: '', custbody_agtax_vendor_rel: ''
                    },
                });
                if (agTaxJE) record.delete({ type: 'customtransaction_agtax_tdstransaction', id: agTaxJE });

            } catch (error) {
                log.debug('Error in onAction', error);
            }

        }

        const getPrepaymentApplication = (prepaymentId) => {
            var vendorprepaymentSearchObj = search.create({
                type: "vendorprepayment",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters: [["type", "anyof", "VPrep"], "AND", ["internalidnumber", "equalto", prepaymentId], "AND", ["mainline", "is", "F"]],
                columns: [
                    search.createColumn({ name: "type", join: "applyingTransaction", label: "Type" }),
                    search.createColumn({ name: "internalid", join: "applyingTransaction", label: "Internal ID" }),
                ]
            });
            var searchResultCount = vendorprepaymentSearchObj.runPaged().count;
            return searchResultCount > 0 ? vendorprepaymentSearchObj.run().getRange(0, 100) : null;
        }

        function _logValidation(value) {
            if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "NaN") { return true; }
            else { return false }
        }
        return { onAction };
    });
