    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     */
    define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/error', 'N/runtime', 'N/redirect', 'N/email', 'N/url'],
        /**
     * @param{currentRecord} currentRecord
     */
        (record, search, serverWidget, error, runtime, redirect, email, url) => {
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
                    var curRec = scriptContext.newRecord;
                    var formObj = scriptContext.form;
                    // formObj.getField({id: 'custbody_created_by'}).updateDispalyType({displayType: serverWidget.FieldDisplayType.NORMAL});
                    var supervisorApproval = curRec.getValue({ fieldId: 'supervisorapproval' });
                    var accountingApproval = curRec.getValue({ fieldId: 'accountingapproval' });
                    var creator = curRec.getValue({ fieldId: 'custbody_created_by' });
                    var approver = curRec.getValue({ fieldId: 'custbody_approver' });
                    var curUser = runtime.getCurrentUser().id;
                    var curUserRole = runtime.getCurrentUser().role;

                    // Limited Admin ID SB - 1013

                    if (scriptContext.type == 'view') {
                        if (approver != curUser && (curUserRole != 3 || curUserRole != 1013)) {
                            if (creator != curUser) {
                                formObj.getButton({ id: 'edit' }).isHidden = true;
                            }
                            if (creator == curUser && (supervisorApproval == true && accountingApproval == true)) {
                                formObj.getButton({ id: 'edit' }).isHidden = true;
                            }
                            formObj.getButton({ id: 'approve' }).isHidden = true;
                            formObj.getButton({ id: 'reject' }).isHidden = true;
                        } else {
                            if (supervisorApproval == true && accountingApproval == true && (curUserRole != 3 || curUserRole != 1013)) {
                                formObj.getButton({ id: 'edit' }).isHidden = true;
                            }
                        }
                    }

                    if (scriptContext.type == 'edit' || scriptContext.type == 'xedit') {
                        if ((supervisorApproval == true && accountingApproval == true && (curUserRole != 3 || curUserRole != 1013)) || (approver != curUser && creator != curUser && (curUserRole != 3 || curUserRole != 1013))) {
                            redirect.toRecord({ type: curRec.type, id: curRec.id, isEditMode: false });
                        }

                        if(approver != curUser && (curUserRole != 3 || curUserRole != 1013)){
                            formObj.getButton({ id: 'void' }).isHidden = true;
                            formObj.getButton({ id: 'delete' }).isHidden = true;
                        }
                    }
                } catch (error) {
                    log.debug('Error from beforeLoad', error);
                }
            }

            /**
             * Defines the function definition that is executed before record is submitted.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {Record} scriptContext.oldRecord - Old record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @since 2015.2
             */
            const beforeSubmit = (scriptContext) => {
                try {
                    if (scriptContext.type == 'create') {
                        var curRec = scriptContext.newRecord;
                        var subsidiary = curRec.getValue({ fieldId: 'subsidiary' });
                        var transactionTypeId = curRec.getValue({ fieldId: 'ntype' });
                        curRec.setValue({ fieldId: 'custbody_created_by', value: runtime.getCurrentUser().id });
                        var approverDetailsArr = getApproverDetails(runtime.getCurrentUser().id, transactionTypeId, subsidiary);
                        if (_logValidation(approverDetailsArr)) {
                            var approver = approverDetailsArr[0].getValue({ name: "custentity_oof_alternate_approver", join: "CUSTRECORD_APPROVER" }) || approverDetailsArr[0].getValue({ name: "custrecord_approver" });
                            log.debug('approver', approver);
                            curRec.setValue({ fieldId: 'custbody_approver', value: approver });
                        } else {
                            throw error.create({ name: 'NOTREGISTERED_IN_APPROVAL_MATRIX_ERROR', message: 'You are not registered in the Approval Matrix. Please reach out to your Admin for assistance!' });
                        }
                    }
                } catch (error) {
                    log.debug('Error from beforeSubmit', error);
                    if (error.name == 'NOTREGISTERED_IN_APPROVAL_MATRIX_ERROR') {
                        log.debug('Inside custom error segment');
                        throw error.message;
                    }
                }
            }

            /**
             * Defines the function definition that is executed before record is submitted.
             * @param {Object} scriptContext
             * @param {Record} scriptContext.newRecord - New record
             * @param {Record} scriptContext.oldRecord - Old record
             * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
             * @since 2015.2
             */
            const afterSubmit = (scriptContext) => {
                try {
                    if (scriptContext.type == 'create') {
                        var expenseReportFieldLookup = search.lookupFields({ type: scriptContext.newRecord.type, id: scriptContext.newRecord.id, columns: ['tranid', 'custbody_approver', 'custbody_created_by'] });
                        var creator = expenseReportFieldLookup.custbody_created_by.length > 0 ? expenseReportFieldLookup.custbody_created_by[0].value : null;
                        var approver = expenseReportFieldLookup.custbody_approver.length > 0 ? expenseReportFieldLookup.custbody_approver[0].value : null;
                        var approverName = expenseReportFieldLookup.custbody_approver.length > 0 ? expenseReportFieldLookup.custbody_approver[0].text : null;
                        var tranId = expenseReportFieldLookup.tranid;

                        if (_logValidation(creator) && _logValidation(approver)) {
                            var firstName = approverName.split(' ')[0];
                            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                            var recordUrl = url.resolveRecord({ recordType: scriptContext.newRecord.type, recordId: scriptContext.newRecord.id, isEditMode: false });
                            var subject = `ExpenseReport ID: ${tranId} needs your approval`;
                            var finalURL = 'https://9370186-sb1.app.netsuite.com' + recordUrl;
                            var body = `<p>Hi ${firstName},</p><p>A new Expense Report has been created and is awaiting your approval. Please find the details below.</p><p>Thank you.</p><br><a href=${finalURL}>View Record</a>`
                            email.send({ author: Number(creator), recipients: Number(approver), subject: subject, body: body });
                            log.debug('Mail sent');
                        }


                    }
                } catch (error) {
                    log.debug('Error from afterSubmit', error);
                }
            };

            // Function to extract the Approver Details
            function getApproverDetails(requestor, transactionType, subsidiary) {
                try {
                    var approvalRoutingSearchRes = search.create({
                        type: "customrecord_approval_routing_matrix",
                        filters:
                            [
                                ["custrecord_requestor", "anyof", requestor],
                                "AND",
                                ["custrecord_transaction_type", "anyof", transactionType],
                                "AND",
                                ["custrecord_subsidiary", "anyof", subsidiary],
                                "AND",
                                ["isinactive", "is", "F"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_requestor", label: "Requestor" }),
                                search.createColumn({ name: "custrecord_approver", label: "Approver" }),
                                search.createColumn({ name: "custrecord_transaction_type", label: "Transaction Type" }),
                                search.createColumn({ name: "custrecord_subsidiary", label: "Subsidiary" }),
                                search.createColumn({ name: "custrecord_type_of_expense", label: "Type of Expense" }),
                                search.createColumn({ name: "custentity_oof_alternate_approver", join: "CUSTRECORD_APPROVER", label: "out of office alternate approver" })
                            ]
                    }).run().getRange(0, 1);

                    log.debug('SearchResult', approvalRoutingSearchRes[0]);
                    return approvalRoutingSearchRes.length > 0 ? approvalRoutingSearchRes : null;

                } catch (error) {
                    log.debug('Error from getApproverDetails', error);
                }
            }

            // Null validator function
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

            return { beforeLoad, beforeSubmit, afterSubmit }

        });
