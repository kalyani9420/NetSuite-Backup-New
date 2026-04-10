/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/log', 'N/currentRecord'],
    /**
     * @param{https} https
     */
    function (url, log, currentRecord) {

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {

            if (scriptContext.fieldId == 'custpage_customers' || scriptContext.fieldId == 'custpage_trandate' || scriptContext.fieldId == 'custpage_inv_num') {
                var paramsObj = {};
                var o_currRecord = scriptContext.currentRecord;

                var s_customer = o_currRecord.getValue({ fieldId: 'custpage_customers' });
                var s_trandate = o_currRecord.getText({ fieldId: 'custpage_trandate' });
                var s_inv_num = o_currRecord.getText({ fieldId: 'custpage_inv_num' });
                


                if (s_customer) {
                    paramsObj.customer = s_customer
                }

                if (s_trandate) {
                    paramsObj.trandate = s_trandate
                }

                if (s_inv_num) {
                    paramsObj.inv_num = s_inv_num
                }

                var url_suitelet = url.resolveScript({
                    scriptId: 'customscript_internaltask_processso_demo',
                    deploymentId: 'customdeploy_internaltask_processso_demo',
                    params: paramsObj
                })

                window.onbeforeunload = false;
                window.open(url_suitelet, '_self')
            }
        }

        function processInvoice() {

            var o_currRec = currentRecord.get();
            var i_open_inv_count = o_currRec.getLineCount({
                sublistId: 'custpage_open_invoices',
            })

            var arr_selected_open_inv = [];
            for (var i = 0; i < i_open_inv_count; i++) {
                var b_isChecked = o_currRec.getSublistValue({
                    sublistId: 'custpage_open_invoices',
                    fieldId: 'custpage_open_cb',
                    line: i,
                })

                if (b_isChecked) {
                    var i_open_internalId = o_currRec.getSublistValue({
                        sublistId: 'custpage_open_invoices',
                        fieldId: 'custpage_open_internal_id',
                        line: i,
                    })
                    arr_selected_open_inv.push(i_open_internalId);
                }

            }

            var paramsObj = {};

            var s_customer = o_currRec.getValue({ fieldId: 'custpage_customers' });
            var s_trandate = o_currRec.getText({ fieldId: 'custpage_trandate' });
            var s_inv_num = o_currRec.getText({ fieldId: 'custpage_inv_num' });
           
            if (s_customer) {
                paramsObj.customer = s_customer
            }

 
            if (s_trandate) {
                paramsObj.trandate = s_trandate
            }


            if (s_inv_num) {
                paramsObj.inv_num = s_inv_num
            }

            if (arr_selected_open_inv) {
                paramsObj.inv_arr = JSON.stringify(arr_selected_open_inv)
            }

            var url_suitelet = url.resolveScript({
                scriptId: 'customscript_internaltask_processso_demo',
                deploymentId: 'customdeploy_internaltask_processso_demo',
                params: paramsObj
            })

            window.onbeforeunload = false;
            window.open(url_suitelet, '_self')
            
        }

        function invoicePayment(){
            var o_currRec = currentRecord.get();
            var i_processing_inv_count = o_currRec.getLineCount({
                sublistId: 'custpage_processing_invoices',
            })

            var arr_selected_processing_inv = [];
            for (var i = 0; i < i_processing_inv_count; i++) {
                var b_isChecked = o_currRec.getSublistValue({
                    sublistId: 'custpage_processing_invoices',
                    fieldId: 'custpage_processing_cb',
                    line: i,
                })

                if (b_isChecked) {
                    var i_open_internalId = o_currRec.getSublistValue({
                        sublistId: 'custpage_processing_invoices',
                        fieldId: 'custpage_processing_internal_id',
                        line: i,
                    })
                    arr_selected_processing_inv.push(i_open_internalId);
                }

            }

            var paramsObj2 = {};

            var s_customer = o_currRec.getValue({ fieldId: 'custpage_customers' });
            var s_trandate = o_currRec.getText({ fieldId: 'custpage_trandate' });
            var s_inv_num = o_currRec.getText({ fieldId: 'custpage_inv_num' });

            if (s_customer) {
                paramsObj2.customer = s_customer
            }
 
            if (s_trandate) {
                paramsObj2.trandate = s_trandate
            }

            if (s_inv_num) {
                paramsObj2.inv_num = s_inv_num
            }

            if (arr_selected_processing_inv) {
                paramsObj2.inv_arr2 = JSON.stringify(arr_selected_processing_inv)
            }

            var url_suitelet = url.resolveScript({
                scriptId: 'customscript_internaltask_processso_demo',
                deploymentId: 'customdeploy_internaltask_processso_demo',
                params: paramsObj2
            })

            window.onbeforeunload = false;
            window.open(url_suitelet, '_self')
        }

        return {
            processInvoice: processInvoice,
            fieldChanged: fieldChanged,
            invoicePayment: invoicePayment
        };
    });
