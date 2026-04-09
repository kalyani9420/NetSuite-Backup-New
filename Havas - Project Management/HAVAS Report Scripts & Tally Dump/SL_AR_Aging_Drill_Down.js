/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/url'], (record, search, serverWidget, url) => {
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
                let request = scriptContext.request;
                let vendorId = request.parameters.venId;
                let asOfDate = request.parameters.asofdate;
                let subsidiary = request.parameters.sub;
                let form = generateForm(vendorId, asOfDate, subsidiary)
                scriptContext.response.writePage(form);
            }
            catch (e) {
                log.debug('The error is', e)
            }
        }
    }

    function generateForm(vendorId, asOfDate, subsidiary) {
        var vendorName = search.lookupFields({ type: 'Customer', id: vendorId, columns: ['entityid'] }).entityid;
        let form = serverWidget.createForm({ title: `A/R Aging Report as of date ${asOfDate}` })
        form.clientScriptModulePath = "SuiteScripts/CS_Havas_ARAgingDrillDownExport.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReportDrillDown()" });
        let sublist = form.addSublist({ id: 'ar_aging_sublist', type: serverWidget.SublistType.LIST, label: `${vendorName}` });
        sublist.addField({ id: 'custpage_transaction_type', type: serverWidget.FieldType.TEXT, label: 'Transaction Type' });
        sublist.addField({ id: 'custpage_transaction_date', type: serverWidget.FieldType.DATE, label: 'Transaction Date' });
        sublist.addField({ id: 'custpage_voucher_number', type: serverWidget.FieldType.TEXT, label: 'Voucher Number' });
        sublist.addField({ id: 'custpage_location', type: serverWidget.FieldType.TEXT, label: 'Location' });
        sublist.addField({ id: 'custpage_age', type: serverWidget.FieldType.TEXT, label: 'Age' });
        sublist.addField({ id: 'custpge_amount', type: serverWidget.FieldType.CURRENCY, label: 'Remaining Amount' });
        let allTransactionData = getAllTransaction(vendorId, asOfDate, subsidiary)
        let getCustomerDepositeData = getAllCustomerDeposite(vendorId, asOfDate, subsidiary)
        log.debug('allTransactionData', allTransactionData)
        log.debug('getCustomerDepositeData', getCustomerDepositeData)
        let resultArray = []
        for (let i = 0; i < allTransactionData.length; i++) {
            let currentObj = JSON.parse(JSON.stringify(allTransactionData[i]))
            let amountRemain = currentObj.values.formulanumeric_1 || 0;
            if (amountRemain > 0) {
                let obj = {
                    internalId: currentObj.id || " ",
                    tranDate: currentObj.values.trandate || " ",
                    tranType: currentObj.values.type[0].text || " ",
                    voucherNumber: currentObj.values.custbody_voucher_number || " ",
                    location: currentObj.values.formulatext || " ",
                    age: currentObj.values.formulanumeric || 0,
                    amountRemaining: currentObj.values.formulanumeric_1 || 0,
                    recordType: currentObj.values.recordtype || " ",
                }
                resultArray.push(obj)
            }
        }

        for (let i = 0; i < getCustomerDepositeData.length; i++) {
            let currentObj = JSON.parse(JSON.stringify(getCustomerDepositeData[i]))
            let obj = {
                internalId: currentObj.id || " ",
                tranDate: currentObj.values.trandate || " ",
                tranType: currentObj.values.type[0].text || " ",
                voucherNumber: currentObj.values.custbody_voucher_number || " ",
                location: currentObj.values.formulatext || " ",
                age: currentObj.values.formulanumeric || 0,
                amountRemaining: currentObj.values.formulacurrency || 0,
                recordType: currentObj.values.recordtype || " ",
            }
            resultArray.push(obj)
        }

        let sortedArray = sortByDate(resultArray)
        log.debug('sortedArray', sortedArray)
        let count = 0
        let totalAmt = 0
        for (; count < sortedArray.length; count++) {
            let sortedObj = sortedArray[count]
            log.debug('sortedObj', sortedObj)
            let detailURL = url.resolveRecord({ recordType: `${sortedObj.recordType}`, recordId: sortedObj.internalId });
            let link = `<a href="${detailURL}" target="_blank">${sortedObj.tranType}</a>`
            sublist.setSublistValue({ id: "custpage_transaction_type", line: count, value: link });
            sublist.setSublistValue({ id: "custpage_transaction_date", line: count, value: sortedObj.tranDate });
            sublist.setSublistValue({ id: "custpage_voucher_number", line: count, value: sortedObj.voucherNumber });
            sublist.setSublistValue({ id: "custpage_location", line: count, value: sortedObj.location });
            sublist.setSublistValue({ id: "custpage_age", line: count, value: sortedObj.age });
            sublist.setSublistValue({ id: "custpge_amount", line: count, value: sortedObj.amountRemaining });
            totalAmt += Number(sortedObj.amountRemaining)
        }
        sublist.setSublistValue({ id: "custpage_transaction_type", line: count, value: `<b>Total</b>` });
        sublist.setSublistValue({ id: "custpge_amount", line: count, value: totalAmt });
        return form
    }

    function getAllTransaction(vendorId, asOfDate, subsidiary) {
        var transactionSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters:
                [
                    ["accounttype", "anyof", "AcctRec"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["trandate", "onorbefore", asOfDate],
                    "AND",
                    ["type", "anyof", "Custom108", "CustInvc", "CustCred", "CustRfnd", "Journal", "FxReval"],
                    "AND",
                    ["subsidiary", "anyof", subsidiary],
                    "AND",
                    ["name", "anyof", vendorId],
                ],
            columns:
                [
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "type", label: "Type" }),
                    search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                    search.createColumn({ name: "formulatext", formula: "NVL({location},{custbody_location})", label: "Location" }),
                    search.createColumn({ name: "formulanumeric", formula: `ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})`, label: "Age" }),
                    search.createColumn({ name: "formulanumeric", formula: `Case When {applyingtransaction.trandate} > TO_DATE('${asOfDate}','DD/MM/YYYY') then {amount} else {amountremaining} end`, label: "Amount" }),
                    search.createColumn({ name: "amount", label: "Amount" }),
                    search.createColumn({ name: "recordtype", label: "Record Type" }),

                ]
        });
        return getAllResult(transactionSearchObj)
    };

    function getAllCustomerDeposite(vendorId, asOfDate, subsidiary) {
        var transactionSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters:
                [
                    ["type", "anyof", "CustDep"],
                    "AND",
                    ["status", "anyof", "CustDep:B"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["trandate", "onorbefore", asOfDate],
                    "AND",
                    ["accounttype", "anyof", "OthCurrLiab"],
                    "AND",
                    ["subsidiary", "anyof", subsidiary],
                    "AND",
                    ["name", "anyof", vendorId]
                ],
            columns:
                [
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "type", label: "Type" }),
                    search.createColumn({ name: "recordtype", label: "Record Type" }),
                    search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                    search.createColumn({ name: "formulatext", formula: "NVL({location},{custbody_location})", label: "Location" }),
                    search.createColumn({ name: "formulanumeric", formula: `ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})`, label: "Age" }),
                    search.createColumn({ name: "formulacurrency", formula: "{amount}-ABS({applyingtransaction.amount})", label: "Formula (Currency)" }),
                ]
        });
        return getAllResult(transactionSearchObj)
    };

    function sortByDate(data) {
        return data.sort((a, b) => {
            const [dayA, monthA, yearA] = a.tranDate.split('/');
            const [dayB, monthB, yearB] = b.tranDate.split('/');
            const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
            const dateB = new Date(`${yearB}-${monthB}-${dayB}`);

            return dateA - dateB;
        });
    }

    function getAllResult(customSearch) {
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

    return { onRequest }

});
