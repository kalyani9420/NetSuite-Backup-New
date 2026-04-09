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
            let recObj = scriptContext.currentRecord;
            if (scriptContext.fieldId == 'custbody_auto_knock_off' && recObj.getValue({ fieldId: 'custbody_auto_knock_off' })) {
                recObj.getField({ fieldId: 'custbody_parent_voucher_number' }).isMandatory = true;
            }
        }

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
                const accountsToCheck = [
                    "2091", "2670", "2074", "2672", "2074", "2038", "2045", "2635", "2673", "2077",
                    "2077", "2024", "2636", "2089", "2026", "2025", "2637", "2027", "2638", "2055",
                    "2076", "2674", "2097", "2639", "2100", "2054", "2682", "2049", "2633", "2642",
                    "2643", "2640", "2641", "2644", "2645", "2646", "2647", "2648", "2190", "2144",
                    "2075", "2095", "2665", "2666", "2667", "2073", "2649", "2678", "2028", "2650",
                    "2684", "2044", "2680", "2681", "2651", "2093", "2046", "2685", "2080", "2094",
                    "2041", "2079", "2652", "2634", "2653", "2654", "2063", "2065", "2655", "2195",
                    "2656", "2099", "2657", "2085", "2686", "2030", "2031", "2023", "2036", "2037",
                    "2658", "2087", "2659", "2056", "2660", "2088", "2014", "2015", "2669", "2668",
                    "2675", "2679", "2661", "2016", "2078", "2662", "2676", "2061", "2671", "2672",
                    "2096", "2082", "2677", "2081", "2117", "2072", "2663", "2664", "2083", "2042",
                    "2287", "2452", "2936", "2631", "2056", "2660", "2632", "1949"
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
                if (currRec.type == "check") {
                    let checkAccountId = currRec.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'account' });
                    if (checkAccountId == "2763" && _logValidation(checkAccountId)) {
                        var employeeName = currRec.getCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_employee'
                        });
                        if (!_logValidation(employeeName)) {
                            alert("Please enter the employee for the selected GL");
                        } else {
                            return true;
                        }
                    }
                    return;
                }

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
                    if(_logValidation(accountSearch)){
                        let accountType = accountSearch[0].getValue({name: 'type'});
                        log.debug("accountType", accountType);

                        if(accountType == "COGS")
                            accountId = itemAccount.expenseaccount[0].value;
                        else accountId = ""
                    }
                }

                if ((_logValidation(accountId) && accountsToCheck.includes(accountId) && currRec.type == "journalentry") || (_logValidation(accountId) &&  currRec.type == "purchaseorder")) {
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

        function saveRecord(scriptContext) {
            let recObj = scriptContext.currentRecord;
            if (recObj.getValue({ fieldId: 'custbody_auto_knock_off' })) {
                if (!recObj.getValue({ fieldId: 'custbody_parent_voucher_number' })) {
                    alert('Parent Voucher Number is required when Auto Knock Off is checked.');
                    return false;
                }
            }

            return true;
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

        return { fieldChanged, validateLine, saveRecord };
    });
