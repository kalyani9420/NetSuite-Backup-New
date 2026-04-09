/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/log'],
    /**
     * @param{currentRecord} currentRecord
     */
    function (currentRecord, search, log) {



        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            try {

                log.debug('validateLine')

                const accountsToCheck = [
                    "1254", "1256", "1219", "1257", "1220", "1221", "1222", "1258", "1223",
                    "1217", "1226", "1227", "1224", "1225", "1228", "1229", "1230", "1231",
                    "1232", "1249", "1250", "1251", "1233", "1262", "1234", "1235", "1236",
                    "1218", "1237", "1238", "1239", "1240", "1241", "1242", "1243", "1244",
                    "1253", "1252", "1259", "1245", "1246", "1260", "1255", "1256", "1261",
                    "1247", "1248", "535", "1215", "1216", "1244", "720", "119", "874", "111",
                    "1040", "1454", "850", "853", "952"
                ];

  
                let sublistLineId = {
                    'journalentry': 'line',
                    'purchaseorder': 'item'
                }

                let sublistFieldId = {
                    'journalentry': 'account',
                    'purchaseorder': 'item'
                }

                let sublistProjectId = {
                    'journalentry': 'entity',
                    'purchaseorder': 'customer'
                }

                let currRec = scriptContext.currentRecord;
                if (currRec.type == "journalentry" || currRec.type == "purchaseorder") {
                    var lineId = currRec.getCurrentSublistValue({ sublistId: sublistLineId[currRec.type], fieldId: sublistFieldId[currRec.type] });
                    let accountId = "";
                }

                //This will check on the Check record to mandate employee field if a particular GL is selected.
                // if (currRec.type == "check") {
                //     let checkAccountId = currRec.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'account' });
                //     if (checkAccountId == "1347" && _logValidation(checkAccountId)) {
                //         var employeeName = currRec.getCurrentSublistValue({
                //             sublistId: 'expense',
                //             fieldId: 'custcol_employee'
                //         });
                //         if (!_logValidation(employeeName)) {
                //             alert("Please enter the employee for the selected GL");
                //         } else {
                //             return true;
                //         }
                //     }
                //     return;
                // }

                if (currRec.type == "journalentry") {
                    accountId = lineId;
                }

                if (currRec.type == "purchaseorder") {
                    var itemAccount = search.lookupFields({
                        type: search.Type.ITEM,
                        id: lineId,
                        columns: ['expenseaccount']
                    });

                    log.debug("itemAccount", itemAccount);
                    log.debug("itemAccount.expenseaccount[0].value", itemAccount.expenseaccount[0].value);

                    let accountSearch = getAccountType(itemAccount.expenseaccount[0].value);
                    if (_logValidation(accountSearch)) {
                        let accountType = accountSearch[0].getValue({ name: 'type' });
                        log.debug("accountType", accountType);

                        if (accountType == "COGS")
                            accountId = itemAccount.expenseaccount[0].value;
                        else accountId = ""
                    }
                }

                if ((_logValidation(accountId) && accountsToCheck.includes(accountId) && currRec.type == "journalentry") || (_logValidation(accountId) && currRec.type == "purchaseorder")) {
                    log.debug('Inside If')
                    var projectId = currRec.getCurrentSublistValue({
                        sublistId: sublistLineId[currRec.type],
                        fieldId: sublistProjectId[currRec.type]
                    });
                    if (!_logValidation(projectId)) {
                        alert("Please enter the project for the selected GL")
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            } catch (e) {
                log.debug(e)
            }
        }

        function getAccountType(accountId) {
            var accountSearchObj = search.create({
                type: "account",
                filters:
                    [
                        ["internalid", "anyof", accountId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "displayname", label: "Display Name" }),
                        search.createColumn({ name: "type", label: "Account Type" })
                    ]
            });
            var searchResultArray = accountSearchObj.run().getRange({ start: 0, end: 999 });
            return searchResultArray.length > 0 ? searchResultArray : null;
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

        return { validateLine };
    });
