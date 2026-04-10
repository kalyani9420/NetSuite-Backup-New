/**
* @NApiVersion 2.1
* @NScriptType Suitelet
*/
define(['N/currentRecord', 'N/ui/serverWidget', 'N/url', 'N/https', 'N/task', 'N/search'],

    (currentRecord, serverWidget, url, http, task, search) => {
		
		
        function onRequest(scriptContext) {
            if (scriptContext.request.method === 'GET') {
                var customer_name;
                // const customerName = scriptContext.request.parameters.custpage_customer_name;
                const fromDate = scriptContext.request.parameters.custpage_from_date;
                const toDate = scriptContext.request.parameters.custpage_to_date;
                const SO_Array = scriptContext.request.parameters.custpage_arr;
                const First = scriptContext.request.parameters.first;
				
				log.debug('SO_Array ' , SO_Array)

                log.debug('first ', First)
				
				var index = First 
				if(!index){
					index = 0 
				}



                let form = serverWidget.createForm({
                    title: 'Sales Order'
                });
                form.clientScriptFileId = 8766;



                var primary = form.addFieldGroup({
                    id: 'primary',
                    label: 'Primary Information'
                });


            


                var fromField = form.addField({
                    id: 'custpage_from_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'From',
                    container: 'primary'


                });

                if (fromDate) {
                    fromField.defaultValue = fromDate
                }

                var toField = form.addField({
                    id: 'custpage_to_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'To',
                    container: 'primary'


                });

                if (toDate) {
                    toField.defaultValue = toDate
                }

                var disableField = form.addField({
                    id: 'custpage_disable_field',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'disable',
                    container: 'primary'
                }).defaultValue = First ? First : '0';
                // disableField.defaultValue = 0

                var sales_sublist = form.addSublist({
                    id: 'sales_order_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Sales Orders'
                })
                sales_sublist.addButton({
                    id: 'custpage_previous_button',
                    label: 'Previous',
                    functionName: 'previous'
                });

                sales_sublist.addButton({
                    id: 'custpage_next_button',
                    label: 'Next',
                    functionName: 'next'
                });
                sales_sublist.addField({ id: "custpage_checkbox", type: serverWidget.FieldType.CHECKBOX, label: "Select" });
                sales_sublist.addField({ id: "custpage_tranid", type: serverWidget.FieldType.TEXT, label: "Sales Order Number" });
                sales_sublist.addField({ id: "custpage_entity", type: serverWidget.FieldType.TEXT, label: "Customer Name" });
                sales_sublist.addField({ id: "custpage_trandate", type: serverWidget.FieldType.TEXT, label: "Date" }),
                sales_sublist.addField({ id: "custpage_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
                sales_sublist.addField({ id: "custpage_status", type: serverWidget.FieldType.TEXT, label: "Status" });


					
                if (fromDate && toDate && First) {
					
					log.debug('index' , index )


                    var salesorderSearchObj = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["mainline", "is", true],
                                "AND",
                                ["trandate", "within", fromDate, toDate],

                            ],

                        columns:
                            [
                                search.createColumn({
                                    name: "salesorder",
                                    sort: search.Sort.ASC,
                                    label: "Sales Order"
                                }),
                                search.createColumn({ name: "mainline", label: "*" }),
                                search.createColumn({ name: "internalid", label: "Internal Id" }),
                                search.createColumn({ name: "tranid", label: "Document Number" }),
                                search.createColumn({ name: "trandate", label: "Date" }),
                                search.createColumn({ name: "type", label: "Type" }),
                                search.createColumn({ name: "entity", label: "Name" }),
                                search.createColumn({ name: "account", label: "Account" }),
                                search.createColumn({ name: "amount", label: "Amount" }),
                                search.createColumn({ name: "status", label: "Status" }),
                                search.createColumn({ name: "currency", label: "Currency" }),

                            ]
                    });

                    // log.debug("salesorderSearchObj result count", searchResultCount);
					
                    var resultSearch = salesorderSearchObj.run().getRange({ start: index, end: 1000});
					
					// log.debug('resultSearch' , resultSearch)
					
					for (var i = 0; i < resultSearch.length; i++) {
                    sales_sublist.setSublistValue({
                            id: 'custpage_tranid',
                            line: i,
                            value: resultSearch[i].getValue('internalid') 
                        });               
 
                    sales_sublist.setSublistValue({
                        id: 'custpage_trandate',
                        line: i,
                        value: resultSearch[i].getValue('trandate') 
                    });
					
					sales_sublist.setSublistValue({
                            id: 'custpage_entity',
                            line: i,
                            value: resultSearch[i].getText({ name: 'entity' })
                        });

                        sales_sublist.setSublistValue({
                            id: 'custpage_status',
                            line: i,
                            value: resultSearch[i].getText({ name: 'status' })
                        });

                        sales_sublist.setSublistValue({
                            id: 'custpage_amount',
                            line: i,
                            value: resultSearch[i].getValue({ name: 'amount' })
                        });
					}
				
					
				
					



                    // resultSearch.forEach(function (result, i) {
                    // customer_name = result.getText({ name: 'entity' })
                    // sales_sublist.setSublistValue({
                    // id: 'custpage_tranid',
                    // line: i,
                    // value: result.getValue({ name: 'internalid' })
                    // });

                    // sales_sublist.setSublistValue({
                    // id: 'custpage_trandate',
                    // line: i,
                    // value: result.getValue({ name: 'trandate' })
                    // });

                    // sales_sublist.setSublistValue({
                    // id: 'custpage_entity',
                    // line: i,
                    // value: result.getText({ name: 'entity' })
                    // });

                    // sales_sublist.setSublistValue({
                    // id: 'custpage_status',
                    // line: i,
                    // value: result.getText({ name: 'status' })
                    // });

                    // sales_sublist.setSublistValue({
                    // id: 'custpage_amount',
                    // line: i,
                    // value: result.getValue({ name: 'amount' })
                    // });

                    // });

                }

                form.addButton({
                    id: 'custpage_set_memo_button',
                    label: 'Send',
                    functionName: 'setMemo'
                });



                if (SO_Array) {
                    log.debug('SO_Array', SO_Array)
                    var scheduledScript = task.create({
                        taskType: task.TaskType.MAP_REDUCE
                    });
                    scheduledScript.scriptId = 'customscript797';
                    scheduledScript.deploymentId = 'customdeploy1';
                    scheduledScript.params = {
                        'custscript1': SO_Array,
                    };
                    var scriptTaskId = scheduledScript.submit();
                    log.debug("id", scriptTaskId);
                }


                scriptContext.response.writePage(form);


            }
            else if (scriptContext.request.method === 'POST') {

                // const delimiter = /\u0001/;
                // const customerName = scriptContext.request.parameters.custpage_customer_name;
                const fromDate = scriptContext.request.parameters.custpage_from_date;
                const toDate = scriptContext.request.parameters.custpage_to_date;
                const so_array = scriptContext.request.parameters.custpage_arr;
                // const first_index = scriptContext.request.parameters.first;
				
				log.debug("fromDate: ", fromDate);
				log.debug("toDate: ", toDate);
				log.debug("Checking post SO array: ", so_array);
				
				log.debug("Checking post SO array: ", so_array);
				
                scriptContext.response.sendRedirect({
                type: 'SUITELET',
                identifier: 'customscript796',
                id: 'customdeploy1',
                parameters: {
                custpage_from_date: fromDate,
                custpage_to_date: toDate
                }
                });
                if (so_array) {
                    scriptContext.response.sendRedirect({
                        type: 'SUITELET',
                        identifier: 'customscript796',
                        id: 'customdeploy1',
                        parameters: {
                            custpage_arr: so_array

                        }
                    });
                }
             


            }
        }
        return {
            onRequest: onRequest,

        };
    });