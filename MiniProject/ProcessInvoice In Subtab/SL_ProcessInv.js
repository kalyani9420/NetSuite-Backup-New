/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
*/
define(['N/ui/serverWidget', 'N/search', 'N/record'],
    /**
    * @param{serverWidget} serverWidget
    */
    function (serverWidget, search, record) {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        function onRequest(scriptContext) {

            if (scriptContext.request.method === 'GET') {

                var o_form = serverWidget.createForm({
                    title: 'Process Invoices'
                });

                //Body Fields Starts-----------------------------------------------------------------------------
                var s_customer_field = o_form.addField({
                    id: 'custpage_customers',
                    type: serverWidget.FieldType.SELECT,
                    label: 'CUSTOMER',
                    source: 'customer'
                });

                var s_document_number_field = o_form.addField({
                    id: 'custpage_inv_num',
                    type: serverWidget.FieldType.SELECT,
                    label: 'DOCUMENT NUMBER'
                });

                s_document_number_field.addSelectOption({
                    value: 0,
                    text: ''
                })
                var resultSet_open_inv = searchOnOpenInvoice([]);

                for (var i = 0; i < resultSet_open_inv.length; i++) {
                    s_document_number_field.addSelectOption({
                        value: resultSet_open_inv[i].getValue({ name: 'tranid' }),
                        text: resultSet_open_inv[i].getValue({ name: 'tranid' })
                    })
                }

                var s_trandate_field = o_form.addField({
                    id: 'custpage_trandate',
                    type: serverWidget.FieldType.DATE,
                    label: 'TRANSACTION DATE'
                });

                
                //Body Fields Ends-----------------------------------------------------------------------------

                //Tabs section start---------------------------------------------------------------------------
                var open_tab = o_form.addTab({
                    id: 'custpage_open_tab',
                    label: 'OPEN INVOICES TAB'
                });

                var processing_tab = o_form.addTab({
                    id: 'custpage_processing_tab',
                    label: 'PROCESSING INVOICES TAB'
                });

                var closed_tab = o_form.addTab({
                    id: 'custpage_closed_tab',
                    label: 'CLOSED INVOICES TAB'
                });
                //Tabs section ends---------------------------------------------------------------------------


                //Open Invoice Sublist section Starts---------------------------------------------------------------------------
                var open_invoices = o_form.addSublist({
                    id: 'custpage_open_invoices',
                    type: serverWidget.SublistType.LIST,
                    label: 'OPEN INVOICES',
                    tab: 'custpage_open_tab'
                })

                open_invoices.addField({
                    id: 'custpage_open_cb',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'SELECT'
                });

                open_invoices.addField({
                    id: 'custpage_open_internal_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'INTERNAL ID'
                });

                open_invoices.addField({
                    id: 'custpage_open_document_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'DOCUMENT NUMBER'
                });

                open_invoices.addField({
                    id: 'custpage_open_customer',
                    type: serverWidget.FieldType.TEXT,
                    label: 'CUSTOMER'
                });

                open_invoices.addField({
                    id: 'custpage_open_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'AMOUNT'
                });

                open_invoices.addField({
                    id: 'custpage_open_trandate',
                    type: serverWidget.FieldType.DATE,
                    label: 'DATE'
                });
                //Open Invoice Sublist section closed---------------------------------------------------------------------------

                //Custom Process button
                open_invoices.addButton({
                    id: 'custpage_btn_open_inv',
                    label: 'Process',
                    functionName: 'processInvoice()'
                });

                //Processing Invoice Sublist section Starts---------------------------------------------------------------------------
                var processing_invoices = o_form.addSublist({
                    id: 'custpage_processing_invoices',
                    type: serverWidget.SublistType.LIST,
                    label: 'PROCESSED INVOICES',
                    tab: 'custpage_processing_tab'
                })

                processing_invoices.addField({
                    id: 'custpage_processing_cb',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'SELECT'
                });

                processing_invoices.addField({
                    id: 'custpage_processing_internal_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'INTERNAL ID'
                });

                processing_invoices.addField({
                    id: 'custpage_processing_document_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'DOCUMENT NUMBER'
                });

                processing_invoices.addField({
                    id: 'custpage_processing_customer',
                    type: serverWidget.FieldType.TEXT,
                    label: 'CUSTOMER'
                });

                processing_invoices.addField({
                    id: 'custpage_processing_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'AMOUNT'
                });
                //Processing Invoice Sublist section Ends---------------------------------------------------------------------------


                //Closed Invocie Sublist section Starts---------------------------------------------------------------------------
                var closed_invoices = o_form.addSublist({
                    id: 'custpage_closed_invoices',
                    type: serverWidget.SublistType.LIST,
                    label: 'CLOSED INVOICES',
                    tab: 'custpage_closed_tab'
                })

                closed_invoices.addField({
                    id: 'custpage_closed_document_number',
                    type: serverWidget.FieldType.TEXT,
                    label: 'DOCUMENT NUMBER'
                });

                closed_invoices.addField({
                    id: 'custpage_closed_customer',
                    type: serverWidget.FieldType.TEXT,
                    label: 'CUSTOMER'
                });

                closed_invoices.addField({
                    id: 'custpage_closed_transaction_date',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TRANSACTION DATE'
                });

                closed_invoices.addField({
                    id: 'custpage_closed_account',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ACCOUNT'
                });


                closed_invoices.addField({
                    id: 'custpage_closed_applied_amt',
                    type: serverWidget.FieldType.TEXT,
                    label: 'APPLIED AMOUNT'
                });
                //Closed Invoice Sublist section Ends---------------------------------------------------------------------------


                //This array stores the filter object of search.
                var o_filters = [];

                //Setting field's default value which is coming through URL.
                //1. Customer field value
                if (scriptContext.request.parameters.customer) {

                    s_customer_field.defaultValue = scriptContext.request.parameters.customer;
                    var customer_filter = search.createFilter({
                        name: 'name',
                        operator: search.Operator.ANYOF,
                        values: scriptContext.request.parameters.customer
                    });
                    o_filters.push(customer_filter);

                }

                //2. Transaction date.
                if (scriptContext.request.parameters.trandate) {

                    s_trandate_field.defaultValue = new Date(scriptContext.request.parameters.trandate);
                    var trandate_filter = search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.ON,
                        values: scriptContext.request.parameters.trandate
                    });
                    o_filters.push(trandate_filter);

                }

                //3. Invoice number field
                if (scriptContext.request.parameters.inv_num) {

                    s_document_number_field.defaultValue = scriptContext.request.parameters.inv_num;
                    log.debug("invoice num on suitlet", scriptContext.request.parameters.inv_num);
                    var inv_num_filter = search.createFilter({
                        name: 'numbertext',
                        operator: search.Operator.IS,
                        values: scriptContext.request.parameters.inv_num
                    });
                    o_filters.push(inv_num_filter);

                }

                //This will check for the array which consist of internal Id's of selected invoices and set the only selected invoices on sublist.
                if (scriptContext.request.parameters.inv_arr) {

                    var inv_selected_arr = JSON.parse(scriptContext.request.parameters.inv_arr);
                    if (inv_selected_arr.length != 0) {

                        var o_selected_inv_filters = [];
                        var inv_num_internal_id_filter = search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.ANYOF,
                            values: inv_selected_arr
                        });

                        o_selected_inv_filters.push(inv_num_internal_id_filter);
                        var resultset_for_processing_inv = searchOnOpenInvoice(o_selected_inv_filters);

                        for (var i = 0; i < resultset_for_processing_inv.length; i++) {

                            processing_invoices.setSublistValue({
                                id: 'custpage_processing_internal_id',
                                line: i,
                                value: resultset_for_processing_inv[i].getValue({ name: 'internalid' })
                            })
                            processing_invoices.setSublistValue({
                                id: 'custpage_processing_document_number',
                                line: i,
                                value: resultset_for_processing_inv[i].getValue({ name: 'tranid' })
                            })
                            processing_invoices.setSublistValue({
                                id: 'custpage_processing_customer',
                                line: i,
                                value: resultset_for_processing_inv[i].getValue({ name: 'entity' })
                            })

                            processing_invoices.setSublistValue({
                                id: 'custpage_processing_amount',
                                line: i,
                                value: resultset_for_processing_inv[i].getValue({ name: 'amount' })
                            })

                            processing_invoices.setSublistValue({
                                id: 'custpage_processing_trandate',
                                line: i,
                                value: resultset_for_processing_inv[i].getValue({ name: 'trandate' })
                            });
                        }

                        processing_invoices.addButton({
                            id: 'custpage_btn_for_processing_inv',
                            label: 'Receive Payment',
                            functionName: 'invoicePayment()'
                        })

                        var o_open_inv_after_first_btn_click = search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.NONEOF,
                            values: inv_selected_arr
                        })
                        o_filters.push(o_open_inv_after_first_btn_click);

                    }
                }

                //This logic takes the internal Id's of invoices from processing sublist and make payment of those and attach in closed sublist.
                if (scriptContext.request.parameters.inv_arr2) {

                    // var o_selected_closed_inv_filters = [];
                    var inv_selected_arr2 = JSON.parse(scriptContext.request.parameters.inv_arr2);

                    var arr_custumerPayments = [];
                    for (var k = 0; k < inv_selected_arr2.length; k++) {

                        log.debug("inv array index value", inv_selected_arr2[k])
                        var o_payment_record = record.transform({
                            fromType: record.Type.INVOICE,
                            fromId: inv_selected_arr2[k],
                            toType: record.Type.CUSTOMER_PAYMENT,
                            isDynamic: true,
                        });

                        o_payment_record.save()

                        arr_custumerPayments.push(o_payment_record);

                        var o_paymentRecord = record.load({
                            type: record.Type.CUSTOMER_PAYMENT,
                            id: o_payment_record.id,
                            isDynamic: true,
                        });

                        var s_payment_tranid = o_paymentRecord.getValue({
                            fieldId: 'tranid'
                        });

                        var s_payment_trandate = o_paymentRecord.getValue({
                            fieldId: 'trandate'
                        });

                        var s_payment_customer = o_paymentRecord.getText({
                            fieldId: 'customer'
                        });

                        var s_payment_applied_amt = o_paymentRecord.getValue({
                            fieldId: 'applied'
                        });

                        // var s_payment_applied_accnt = o_paymentRecord.getValue({
                        //     fieldId:'account'
                        // });

                        closed_invoices.setSublistValue({
                            id: 'custpage_closed_document_number',
                            line: k,
                            value: s_payment_tranid
                        })
                        closed_invoices.setSublistValue({
                            id: 'custpage_closed_transaction_date',
                            line: k,
                            value: JSON.stringify(new Date(s_payment_trandate))
                        })
                        closed_invoices.setSublistValue({
                            id: 'custpage_closed_customer',
                            line: k,
                            value: s_payment_customer
                        })

                        closed_invoices.setSublistValue({
                            id: 'custpage_closed_applied_amt',
                            line: k,
                            value: s_payment_applied_amt
                        })

                        // closed_invoices.setSublistValue({
                        //     id: 'custpage_closed_account',
                        //     line: k,
                        //     value: s_payment_applied_accnt
                        // })


                    }

                    var o_open_inv_after_second_btn_click = search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.NONEOF,
                        values: inv_selected_arr2
                    })
                    o_filters.push(o_open_inv_after_second_btn_click);

                }

                var openInvoiceResultSet = searchOnOpenInvoice(o_filters);

                //Set the invoices on Open invoice sublist.
                for (var i = 0; i < openInvoiceResultSet.length; i++) {

                    open_invoices.setSublistValue({
                        id: 'custpage_open_internal_id',
                        line: i,
                        value: openInvoiceResultSet[i].getValue({ name: 'internalid' })
                    })
                    open_invoices.setSublistValue({
                        id: 'custpage_open_document_number',
                        line: i,
                        value: openInvoiceResultSet[i].getValue({ name: 'tranid' })
                    })
                    open_invoices.setSublistValue({
                        id: 'custpage_open_customer',
                        line: i,
                        value: openInvoiceResultSet[i].getValue({ name: 'entity' })
                    })
                    open_invoices.setSublistValue({
                        id: 'custpage_open_amount',
                        line: i,
                        value: openInvoiceResultSet[i].getValue({ name: 'amount' })
                    })

                    open_invoices.setSublistValue({
                        id: 'custpage_open_trandate',
                        line: i,
                        value: openInvoiceResultSet[i].getValue({ name: 'trandate' })
                    })
                }

                o_form.clientScriptFileId = '8896';
                scriptContext.response.writePage(o_form);
            } else if (scriptContext.request.method === 'POST') {

            }
        }

        //This function return the resultSet of search also apply the filter which we passed in parameters.
        function searchOnOpenInvoice(invoiceFilters) {

            var invoiceSearchObj = search.create({
                type: "invoice",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["status", "anyof", "CustInvc:A"],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "trandate", label: "Date" }),
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "entity", label: "Name" }),
                        search.createColumn({ name: "amount", label: "Amount" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });

            var o_filters = invoiceSearchObj.filters;
            o_filters.push(...invoiceFilters);
            invoiceSearchObj.filters = o_filters;
            var openInvoiceResultSet = invoiceSearchObj.run().getRange({ start: 0, end: 1000 });

            return openInvoiceResultSet;
        }

        return {
            onRequest: onRequest
        }

    });

