// This Script will provide a custom form to users where user can select different transaction and generate payment files.
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
*/
define(['N/record', 'N/search', 'N/ui/serverWidget'],
    /**
    * @param{serverWidget} serverWidget
    */
    function (record, search, serverWidget) {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        function onRequest(scriptContext) {
            try {
                if (scriptContext.request.method === 'GET') {
                    let form = getEFTForm();
                    scriptContext.response.writePage(form);
                } else if (scriptContext.request.method === 'POST') {
                    let params = scriptContext.request.parameters || {};
                    log.debug("Params", params);
                    let apAccount = params.custpage_ap_account;
                    let transactionType = params.custpage_transaction_type;
                    let vendor = params.custpage_vendor;
                    let employee = params.custpage_employee;
                    let companyBank = params.custpage_company_banks;
                    let entityBank = params.custpage_entity_bank_account;
                    let form = getTransaction(companyBank, apAccount, transactionType, vendor, employee, entityBank);
                    scriptContext.response.writePage(form);
                }

            } catch (error) {
                log.debug("Error From Get Request", error);
            }

        }

        function fetchApAccounts() {
            try {
                var accountSearchObj = search.create({
                    type: "account",
                    filters: [["type", "anyof", "AcctPay"]],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "type", label: "Account Type" }),
                            search.createColumn({ name: "displayname", label: "Display Name" })
                        ]
                });
                let searchResultArray = accountSearchObj.run().getRange({ start: 0, end: 999 });
                return searchResultArray.length > 0 ? searchResultArray : null;
            } catch (e) {
                log.debug("Error from fetchApAccount Saved Search", e);
            }
        }

        const getEFTForm = (companyBank, apAccount, transactionType, vendor, employee, entityBank) => {
            const formObj = serverWidget.createForm({ title: 'Payment Processing Page' });
            formObj.clientScriptFileId = '26001';

            let companyBankField = formObj.addField({ id: 'custpage_company_banks', type: serverWidget.FieldType.SELECT, label: 'Company Bank', source: 'customrecord_2663_bank_details' });
            companyBankField.isMandatory = true;
            if (companyBank) companyBankField.defaultValue = companyBank;


            let apAccountFieldObj = formObj.addField({ id: 'custpage_ap_account', type: serverWidget.FieldType.SELECT, label: 'A/P Account' });
            apAccountFieldObj.addSelectOption({ value: "", text: "" });
            let apAccounts = fetchApAccounts();
            if (apAccounts != null) {
                for (var i = 0; i < apAccounts.length; i++) {
                    var id = apAccounts[i].getValue({ name: 'internalid' });
                    var name = apAccounts[i].getValue({ name: 'displayname' });
                    apAccountFieldObj.addSelectOption({ value: id, text: name });
                }
            }
            apAccountFieldObj.isMandatory = true;
            if (apAccount) apAccountFieldObj.defaultValue = apAccount;

            apAccountFieldObj.defaultValue = 2452;
            let tranTypeFieldObj = formObj.addField({ id: 'custpage_transaction_type', type: serverWidget.FieldType.SELECT, label: 'Transaction Type' });
            tranTypeFieldObj.addSelectOption({ value: 'vendorbill', text: 'Vendor Bill' });
            tranTypeFieldObj.addSelectOption({ value: 'expensereport', text: 'Expense Report' });
            tranTypeFieldObj.addSelectOption({ value: 'vendorprepayment', text: 'Vendor Prepayment' });
            tranTypeFieldObj.addSelectOption({ value: 'check', text: 'Check' });
            tranTypeFieldObj.addSelectOption({ value: 'billcredit', text: 'Bill Credit' });
            tranTypeFieldObj.addSelectOption({ value: 'Journal', text: 'Journal' });
            tranTypeFieldObj.isMandatory = true;
            if (transactionType) tranTypeFieldObj.defaultValue = transactionType;

            let locationFieldObj = formObj.addField({ id: 'custpage_location', type: serverWidget.FieldType.SELECT, label: 'Location', source: 'location' });
            
            let vendorFieldObj = formObj.addField({ id: 'custpage_vendor', type: serverWidget.FieldType.SELECT, label: 'Vendor', source: 'vendor' });
            if (vendor) vendorFieldObj.defaultValue = vendor;

            let employeeFieldObj = formObj.addField({ id: 'custpage_employee', type: serverWidget.FieldType.SELECT, label: 'Employee', source: 'employee' });
            if (employee) employeeFieldObj.defaultValue = employee;

            let paymentModeFieldObj = formObj.addField({ id: 'custpage_payment_mode', type: serverWidget.FieldType.SELECT, label: 'Payment Mode' });
            paymentModeFieldObj.addSelectOption({ value: 'fundTransfer', text: 'Fund Transfer' });
            paymentModeFieldObj.addSelectOption({ value: 'DD', text: 'DD' });
            paymentModeFieldObj.addSelectOption({ value: 'CC', text: 'CC' });

            let entityBankAccountFieldObj = formObj.addField({ id: 'custpage_entity_bank_account', type: serverWidget.FieldType.SELECT, label: 'Entity Bank Account' });
            entityBankAccountFieldObj.isMandatory = true;
            if (entityBank) entityBankAccountFieldObj.defaultValue = entityBank;

            formObj.addSubmitButton({ label: "Submit" });
            return formObj;
        }


        const getTransaction = (companyBank, apAccount, transactionType, vendor, employee, entityBank) => {
            let formObj = getEFTForm(companyBank, apAccount, transactionType, vendor, employee, entityBank);
            var tranSublistObj = formObj.addSublist({ id: 'custpage_transaction_list', type: serverWidget.SublistType.LIST, label: 'Select Transactions' });
            let payFieldObj = tranSublistObj.addField({ id: 'custpage_apply', label: 'Pay', type: serverWidget.FieldType.CHECKBOX });
            let payeeFieldObj = tranSublistObj.addField({ id: 'custpage_payee', label: 'Payee', type: serverWidget.FieldType.TEXT });
            let tranNumberFieldObj = tranSublistObj.addField({ id: 'custpage_tran_number', label: 'Transaction Number', type: serverWidget.FieldType.TEXT });
            let tranDateFieldObj = tranSublistObj.addField({ id: 'custpage_tran_date', label: 'Date', type: serverWidget.FieldType.DATE });
            let currencyFieldObj = tranSublistObj.addField({ id: 'custpage_currency', label: 'Currency', type: serverWidget.FieldType.TEXT });
            let amountFieldObj = tranSublistObj.addField({ id: 'custpage_amount', label: 'Amount', type: serverWidget.FieldType.CURRENCY });


            let lineTransaction = getOpenTransactions(apAccount, transactionType, vendor, employee);
            if (lineTransaction != null) {
                for (let i = 0; i < lineTransaction.length; i++) {
                    log.debug('lineTransaction', lineTransaction[i].getValue({ name: "mainname", label: "Main Line Name" }))
                    tranSublistObj.setSublistValue({ id: "custpage_payee", line: i, value: _logValidation(lineTransaction[i].getText({ name: "mainname", label: "Main Line Name" })) ? lineTransaction[i].getText({ name: "mainname", label: "Main Line Name" }) : null });
                    tranSublistObj.setSublistValue({ id: "custpage_tran_number", line: i, value: _logValidation(lineTransaction[i].getValue({ name: "custbody_voucher_number", label: "Voucher Number" })) ? lineTransaction[i].getValue({ name: "custbody_voucher_number", label: "Voucher Number" }) : null });
                    tranSublistObj.setSublistValue({ id: "custpage_tran_date", line: i, value: _logValidation(lineTransaction[i].getValue({ name: "trandate", label: "Date" })) ? lineTransaction[i].getValue({ name: "trandate", label: "Date" }) : null });
                    tranSublistObj.setSublistValue({ id: "custpage_currency", line: i, value: _logValidation(lineTransaction[i].getText({ name: "currency", label: "Currency" })) ? lineTransaction[i].getText({ name: "currency", label: "Currency" }) : null });
                    tranSublistObj.setSublistValue({ id: "custpage_amount", line: i, value: _logValidation(lineTransaction[i].getValue({ name: "amount", label: "Amount" })) ? lineTransaction[i].getValue({ name: "amount", label: "Amount" }) : null });
                };
            }
            log.debug('Line Transaction', lineTransaction)
            return formObj;

        }


        const getOpenTransactions = (apAccount, transactionType, vendor, employee) => {

            try {
                let transactionTypeJson = { 'vendorbill': 'VendBill', 'expensereport': 'ExpRept' , 'check' : 'Check' , 'vendorprepayment' : 'VPrep' , 'Journal' : 'Journal' , 'billcredit' : 'VendCred' };
                let filter = [
                    ["type", "anyof", transactionTypeJson[transactionType]],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["accountmain", "anyof", apAccount]
                ];
                if (_logValidation(vendor)) { filter.push("AND", ["mainname", "anyof", vendor], "AND", ["status", "anyof", "VendBill:A"]) }
                else if (_logValidation(employee)) { filter.push("AND", ["mainname", "anyof", employee], "AND", ["status", "anyof", "ExpRept:G", "ExpRept:F"],) }
                else { log.debug('Error :', 'No Entity found'); return null }

                var transactionSearchObj = search.create({
                    type: transactionType,
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: filter,
                    columns:
                        [
                            search.createColumn({ name: "mainname", label: "Main Line Name" }),
                            search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "currency", label: "Currency" }),
                            search.createColumn({ name: "amount", label: "Amount" })
                        ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;
                log.debug("transactionSearchObj result count", searchResultCount);
                return searchResultCount > 0 ? getAllResult(transactionSearchObj) : null;

            } catch (error) {
                log.debug('Open Transaction Search Error', error)

            }

        }

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

        let getAllResult = customSearch => {
            let searchResultCount = customSearch.runPaged().count;
            let allResults = [];
            let [start, end, limit] = [0, 1000, searchResultCount];
            while (start < limit) {
                allResults.push(...customSearch.run().getRange(start, end));
                start += 1000;
                end += 1000;
            }
            return allResults;
        };

        return {
            onRequest: onRequest
        }

    });

