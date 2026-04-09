/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/runtime', 'N/url', 'N/ui/message'],
    /**
     * @param{currentRecord} currentRecord
     */
    function (currentRecord, record, search, runtime, url, message) {
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
        */
        function pageInit(scriptContext) {

        }

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
            // if ((scriptContext.fieldId == 'custpage_vendor' && _logValidation(scriptContext.currentRecord.getValue({ fieldId: scriptContext.fieldId }))) || (scriptContext.fieldId == 'custpage_employee' && _logValidation(scriptContext.currentRecord.getValue({ fieldId: scriptContext.fieldId })))) {

            //     entityId = scriptContext.currentRecord.getValue({ fieldId: scriptContext.fieldId });
            //     console.log("Entity Id: ", entityId);
            //     let entityBankDetails = fetchEntityBankDetails(entityId, scriptContext.fieldId);
            //     // console.log("Bank Details Search", entityBankDetails.length)

            //     if (_logValidation(entityBankDetails)) {
            //         let beneficiaryName = scriptContext.fieldId == 'custpage_vendor' ? entityBankDetails[0].getText({ name: 'custrecord_2663_parent_vendor' }) : entityBankDetails[0].getText({ name: 'custrecord_2663_parent_employee' });
            //         console.log("beneficiaryName", beneficiaryName);
            //         let accNumber = entityBankDetails[0].getValue({ name: 'custrecord_2663_entity_acct_no' });
            //         console.log("accNumber", accNumber);
            //         let IFSCCode = entityBankDetails[0].getValue({ name: 'custrecord_2663_entity_bank_no' });
            //         console.log("IFSCCode", IFSCCode);
            //         let bankName = entityBankDetails[0].getValue({ name: 'custrecord_2663_entity_bank_name' });
            //         console.log("bankName", bankName);
            //         let bankType = entityBankDetails[0].getText({ name: 'custrecord_2663_entity_bank_type' });
            //         console.log("bankType", bankType);
            //         let bankDetailsObj = `<!DOCTYPE html>
            //             <html lang="en">
            //             <head>
            //             <meta charset="UTF-8">
            //             <title>Beneficiary Details</title>
            //             <style>

            //                 .card {
            //                 background-color: #ffffff;
            //                 padding: 20px 30px;
            //                 border-radius: 10px;
            //                 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            //                 width: 100%;
            //                 max-width: 400px;
            //                 }

            //                 .card p {
            //                 margin: 10px 0;
            //                 font-size: 16px;
            //                 color: #333;
            //                 }

            //             </style>
            //             </head>
            //             <body>

            //             <div class="card">
            //                 <p><b>Beneficiary Details: </b></p>
            //                 <p>Name: `+ beneficiaryName + `</p>
            //                 <p>Account Number: `+ accNumber + `</p>
            //                 <p>IFSC Code:  `+ IFSCCode + `</p>
            //                 <p>Bank Name: `+ bankName + `</p>
            //             </div>

            //             </body>
            //             </html>
            //             `
            //         scriptContext.currentRecord.setValue({ fieldId: 'custpage_bank_details', value: bankDetailsObj });
            //     }
            // } else {
            //     scriptContext.currentRecord.setValue({ fieldId: 'custpage_bank_details', value: '' });
            // }



            try {
                if (scriptContext.fieldId == 'custpage_vendor') {
                    let entityId = scriptContext.currentRecord.getValue({ fieldId: 'custpage_vendor' });
                    let alternateEntity = scriptContext.currentRecord.getField({ fieldId: 'custpage_employee' });
                    let entityAccountFieldObj = scriptContext.currentRecord.getField({ fieldId: 'custpage_entity_bank_account' });

                    if (_logValidation(entityId)) {
                        alternateEntity.isDisabled = true;
                        let entityAccounts = fetchEntityBankAccounts('vendor', entityId);
                        if (entityAccounts != null) {
                            for (let i = 0; i < entityAccounts.length; i++) {
                                let id = entityAccounts[i].getValue({ name: 'internalid' });
                                let name = entityAccounts[i].getValue({ name: 'custrecord_2663_entity_acct_no' });
                                entityAccountFieldObj.insertSelectOption({ value: id, text: `A/C No. ${name}` });
                            }
                        }
                    } else {
                        alternateEntity.isDisabled = false;
                        let selectOptionsArray = entityAccountFieldObj.getSelectOptions({ filter: 'A/C', operator: 'startswith' });
                        for (let i = 0; i < selectOptionsArray.length; i++) {
                            entityAccountFieldObj.removeSelectOption({ value: selectOptionsArray[i].value })
                        }
                    }
                }

            } catch (error) {
                console.log('Error in Vendor Bank Details', error)

            }


            try {
                if (scriptContext.fieldId == 'custpage_employee') {
                    let entityId = scriptContext.currentRecord.getValue({ fieldId: 'custpage_employee' });
                    let alternateEntity = scriptContext.currentRecord.getField({ fieldId: 'custpage_vendor' });
                    let entityAccountFieldObj = scriptContext.currentRecord.getField({ fieldId: 'custpage_entity_bank_account' });

                    if (_logValidation(entityId)) {
                        alternateEntity.isDisabled = true;
                        let entityAccounts = fetchEntityBankAccounts('employee', entityId);
                        if (entityAccounts != null) {
                            for (let i = 0; i < entityAccounts.length; i++) {
                                let id = entityAccounts[i].getValue({ name: 'internalid' });
                                let name = entityAccounts[i].getValue({ name: 'custrecord_2663_entity_acct_no' });
                                entityAccountFieldObj.insertSelectOption({ value: id, text: `A/C No. ${name}` });
                            }
                        }
                    } else {
                        alternateEntity.isDisabled = false;
                        let selectOptionsArray = entityAccountFieldObj.getSelectOptions({ filter: 'A/C', operator: 'startswith' });
                        for (let i = 0; i < selectOptionsArray.length; i++) {
                            entityAccountFieldObj.removeSelectOption({ value: selectOptionsArray[i].value })
                        }
                    }
                }

            } catch (error) {
                console.log('Error in Vendor Bank Details', error)

            }


            // try {
            //     if (scriptContext.fieldId == 'custpage_employee') {
            //         let entityAccounts;
            //         entityId = scriptContext.currentRecord.getValue({ fieldId: 'custpage_employee' });
            //         let alternateEntity = scriptContext.currentRecord.getField({ fieldId: 'custpage_vendor' });
            //         let entityAccountFieldObj = scriptContext.currentRecord.getField({ fieldId: 'custpage_entity_bank_account' });
            //         _logValidation(entityId) ? alternateEntity.isDisabled = true : alternateEntity.isDisabled = false;
            //         _logValidation(entityId) ? entityAccounts = fetchEntityBankAccounts('employee', entityId) : entityAccounts = null;
            //         if (entityAccounts != null) {
            //             if (_logValidation(entityId)) {
            //                 for (let i = 0; i < entityAccounts.length; i++) {
            //                     let id = entityAccounts[i].getValue({ name: 'internalid' });
            //                     let name = entityAccounts[i].getValue({ name: 'custrecord_2663_entity_acct_no' });
            //                     entityAccountFieldObj.insertSelectOption({ value: id, text: `A/C No. ${name}` });
            //                 }
            //             }
            //             else {
            //                 for (let i = 0; i < entityAccounts.length; i++) {
            //                     let id = entityAccounts[i].getValue({ name: 'internalid' });
            //                     entityAccountFieldObj.removeSelectOption({ value: id });
            //                 }
            //             }
            //         }

            //     }

            // } catch (error) {
            //     console.log('Error in Employee Bank Details', error)

            // }
        }


        //This function will return bank details against selected entity.
        function fetchEntityBankDetails(entityId, fieldId) {
            //Will identify the entity type and pass the correct filter in the search.
            entityType = {
                'custpage_vendor': 'custrecord_2663_parent_vendor',
                'custpage_employee': 'custrecord_2663_parent_employee'
            }

            var customrecord_2663_entity_bank_detailsSearchObj = search.create({
                type: "customrecord_2663_entity_bank_details",
                filters:
                    [
                        [entityType[fieldId], "anyof", entityId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "custrecord_2663_entity_bank_name", label: "Bank Name" }),
                        search.createColumn({ name: "custrecord_2663_entity_acct_no", label: "Bank Account Number" }),
                        search.createColumn({ name: "custrecord_2663_parent_vendor", label: "Parent Vendor" }),
                        search.createColumn({ name: "custrecord_2663_parent_customer", label: "Parent Customer" }),
                        search.createColumn({ name: "custrecord_2663_parent_employee", label: "Parent Employee" }),
                        search.createColumn({ name: "custrecord_2663_entity_bank_no", label: "Bank Number" }),
                        search.createColumn({ name: "custrecord_2663_entity_bank_type", label: "Type" }),
                        search.createColumn({ name: "custrecord_2663_acct_type", label: "Account Type" })
                    ]
            });
            var searchResultArray = customrecord_2663_entity_bank_detailsSearchObj.run().getRange(0, 999);
            console.log("Search Length", searchResultArray.length);
            return searchResultArray.length > 0 ? searchResultArray : null;
        }

        const fetchEntityBankAccounts = (entityType, entityId) => {
            let filter = [];
            entityType == 'vendor' ? filter.push(["custrecord_2663_parent_vendor", "anyof", entityId]) : filter.push(["custrecord_2663_parent_employee", "anyof", entityId])
            try {
                var entity_bank_SearchObj = search.create({
                    type: "customrecord_2663_entity_bank_details",
                    filters: filter,
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custrecord_2663_entity_acct_no", label: "Bank Account Number" })
                        ]
                });
                let searchResultArray = entity_bank_SearchObj.run().getRange({ start: 0, end: 999 });
                return searchResultArray.length > 0 ? searchResultArray : null;

            } catch (error) {
                log.debug("Error from fetchEntityBankAccounts Saved Search", error);

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
        return { fieldChanged };
    });
