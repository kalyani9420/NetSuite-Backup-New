/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/url', 'N/runtime'],
    /**
 * @param{currentRecord} currentRecord
 */
    (record, serverWidget, search, url, runtime) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === "GET") {
                    var form = createRequestForm()
                    scriptContext.response.writePage(form)
                }
                else {
                    let request = scriptContext.request.parameters
                    let toDate = request.custpage_as_of_date
                    let subsidiary = request.custpage_subsidiary
                    let selectedCustomers = request.custpage_customer
                    let form = generateResponseForm(toDate, subsidiary, selectedCustomers)
                    scriptContext.response.writePage(form)
                }
            }
            catch (e) {
                log.debug('The error is', e)
            }

        }

        function createRequestForm(asOfDate, subsidiary, selectedCustomers) {
            let form = serverWidget.createForm({ title: 'A/R Aging Report' });
            let requestAsOfDate = form.addField({ id: 'custpage_as_of_date', type: serverWidget.FieldType.DATE, label: 'As Of Date' })
            requestAsOfDate.isMandatory = true;
            if (asOfDate) requestAsOfDate.defaultValue = asOfDate;
            let subsidiaryField = form.addField({ id: 'custpage_subsidiary', type: serverWidget.FieldType.SELECT, label: 'Subsidiary', source: "subsidiary" })
            subsidiaryField.isMandatory = true;
            if (subsidiary) subsidiaryField.defaultValue = subsidiary;
            var userObj = runtime.getCurrentUser()
            if (userObj.role != 3) {
                subsidiaryField.defaultValue = userObj.subsidiary
                let subsidiary_Field = form.getField({ id: 'custpage_subsidiary' })
                subsidiary_Field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            }
            let customerField = form.addField({ id: 'custpage_customer', type: serverWidget.FieldType.MULTISELECT, label: 'Customer', source: "customer" })
            if (selectedCustomers) customerField.defaultValue = selectedCustomers;
            form.addSubmitButton({ label: 'Generate Report' });
            return form;
        };

        function generateResponseForm(asOfDate, subsidiary, selectedCustomers) {
            let form = createRequestForm(asOfDate, subsidiary, selectedCustomers);
            form.title = `A/R Aging Report as of Date ${asOfDate}`
            form.clientScriptModulePath = "SuiteScripts/CS_Havas_ARAgingExport.js";
            form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
            let sublist = form.addSublist({ id: "ar_aging_sublist", type: serverWidget.SublistType.LIST, label: "Aging Report" });
            sublist.addField({ id: 'custpage_customer_name', type: serverWidget.FieldType.TEXT, label: 'Customer Name' });
            sublist.addField({ id: 'custpage_first', type: serverWidget.FieldType.CURRENCY, label: '1-30 Days' });
            sublist.addField({ id: 'custpage_second', type: serverWidget.FieldType.CURRENCY, label: '31-60 Days' });
            sublist.addField({ id: 'custpage_third', type: serverWidget.FieldType.CURRENCY, label: '61-90 Days' });
            sublist.addField({ id: 'custpage_forth', type: serverWidget.FieldType.CURRENCY, label: '>90 Days' });

            let allTransactionData = getAllTransaction(asOfDate, subsidiary)
            let customerDepositTrans = getCustomerDeposite(asOfDate, subsidiary)
            let allCustomerSearch = getAllCustomers()
            let selectedCustomersArray = selectedCustomers ? selectedCustomers.split("\u0005").filter(Boolean) : [];
            log.debug('selectedCustomersArray', selectedCustomersArray)
            let customerArray = allCustomerSearch.reduce((accumalator, customer) => {
                let id = customer.getValue({ name: "internalid" });
                let name = customer.getValue({ name: "entityid" });
                if (!selectedCustomersArray.length || (selectedCustomers && selectedCustomersArray.includes(id))) {
                    accumalator[id] = { customerName: name, first: 0, second: 0, third: 0, fourth: 0 };
                }
                return accumalator;

            }, {});
            log.debug('customerArray', customerArray)

            allTransactionData.forEach(transaction => {
                let currentTransaction = JSON.parse(JSON.stringify(transaction))
                let id = currentTransaction.values["GROUP(entity)"][0].value
                if (customerArray[id]) {
                    customerArray[id].first = parseFloat(currentTransaction.values["SUM(formulacurrency)"]) || 0;
                    customerArray[id].second = parseFloat(currentTransaction.values["SUM(formulacurrency)_1"]) || 0;
                    customerArray[id].third = parseFloat(currentTransaction.values["SUM(formulacurrency)_2"]) || 0;
                    customerArray[id].fourth = parseFloat(currentTransaction.values["SUM(formulacurrency)_3"]) || 0;
                }
            })

            customerDepositTrans.forEach(transaction => {
                let currentTransaction = JSON.parse(JSON.stringify(transaction))
                let id = currentTransaction.values["GROUP(entity)"][0].value
                if (customerArray[id]) {
                    customerArray[id].first += parseFloat(currentTransaction.values["SUM(formulacurrency)"]) || 0;
                    customerArray[id].second += parseFloat(currentTransaction.values["SUM(formulacurrency)_1"]) || 0;
                    customerArray[id].third += parseFloat(currentTransaction.values["SUM(formulacurrency)_2"]) || 0;
                    customerArray[id].fourth += parseFloat(currentTransaction.values["SUM(formulacurrency)_3"]) || 0;
                }
            })
            let sublistLine = 0
            let sum1 = 0, sum2 = 0, sum3 = 0, sum4 = 0;
            Object.keys(customerArray).forEach(key => {
                let vendorTransaction = JSON.parse(JSON.stringify(customerArray[key]))
                if (vendorTransaction.first !== 0 || vendorTransaction.second !== 0 || vendorTransaction.third !== 0 || vendorTransaction.fourth !== 0) {
                    sum1 += vendorTransaction.first; sum2 += vendorTransaction.second; sum3 += vendorTransaction.third; sum4 += vendorTransaction.fourth
                    let detailURL = url.resolveScript({ scriptId: 'customscript_ar_aging_drill_down', deploymentId: 'customdeploy_ar_aging_drill_down', params: { venId: key, asofdate: asOfDate, sub: subsidiary } });
                    let link = `<b><a href="${detailURL}" target="_blank">${vendorTransaction.customerName}</a></b>`
                    sublist.setSublistValue({ id: "custpage_customer_name", line: sublistLine, value: link });
                    sublist.setSublistValue({ id: "custpage_first", line: sublistLine, value: vendorTransaction.first });
                    sublist.setSublistValue({ id: "custpage_second", line: sublistLine, value: vendorTransaction.second });
                    sublist.setSublistValue({ id: "custpage_third", line: sublistLine, value: vendorTransaction.third });
                    sublist.setSublistValue({ id: "custpage_forth", line: sublistLine, value: vendorTransaction.fourth });
                    sublistLine++
                }
            })
            sublist.setSublistValue({ id: "custpage_customer_name", line: sublistLine, value: `<b>Total</b>` });
            sublist.setSublistValue({ id: "custpage_first", line: sublistLine, value: sum1 });
            sublist.setSublistValue({ id: "custpage_second", line: sublistLine, value: sum2 });
            sublist.setSublistValue({ id: "custpage_third", line: sublistLine, value: sum3 });
            sublist.setSublistValue({ id: "custpage_forth", line: sublistLine, value: sum4 });

            return form
        }

        function getCustomerDeposite(asOfDate, subsidiary) {
            var customerDepositeSearch = search.create({
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
                        ["subsidiary", "anyof", subsidiary]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entity", summary: "GROUP", label: "Name" }),
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 1 and 30 then ({amount}-{applyingtransaction.amount}) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 1 and 30 then ({amount}-{applyingtransaction.amount}) else 0 end`, label: "30 Days" }),
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 31 and 60 then ({amount}-ABS({applyingtransaction.amount})) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 31 and 60 then ({amount}-ABS({applyingtransaction.amount})) else 0 end`, label: "60 Days" }),
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 61 and 90 then ({amount}-ABS({applyingtransaction.amount})) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 61 and 90 then ({amount}-ABS({applyingtransaction.amount})) else 0 end`, label: "90 Days" }),
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) > 90 then ({amount}-ABS({applyingtransaction.amount})) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) > 90 then ({amount}-ABS({applyingtransaction.amount})) else 0 end`, label: ">90 Days" })
                    ]
            });
            return getAllResult(customerDepositeSearch)
        }

        function getAllTransaction(asOfDate, subsidiary) {
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

                    ],
                columns:
                    [
                        search.createColumn({ name: "entity", summary: "GROUP", label: "Name" }),
                        // search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 1 and 30 then ({amount}*-1) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 1 and 30 then {amount} else 0 end`, label: "30 Days " }),
                        // search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 31 and 60 then ({amount}*-1) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 31 and 60 then {amount} else 0 end`, label: "60 Days" }),
                        // search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 61 and 90 then ({amount}*-1) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) between 61 and 90 then {amount} else 0 end`, label: "90 Days" }),
                        // search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `Case When substr({amount},1,1) = '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) > 90 then ({amount}*-1) When substr({amount},1,1) <> '-' and (Round(TO_DATE('${asOfDate}','DD/MM/YYYY')-{trandate})) > 90 then {amount} else 0 end`, label: ">90 Days" })

                        // search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `CASE WHEN {applyingtransaction.trandate} > TO_DATE('${asOfDate}','DD/MM/YYYY') THEN CASE WHEN SUBSTR({amount},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 1 AND 30 THEN ({amount} * -1) WHEN SUBSTR({amount},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 1 AND 30 THEN {amount} ELSE 0 END 
                        // ELSE CASE WHEN SUBSTR({amountremaining},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 1 AND 30 THEN ({amountremaining} * -1) WHEN SUBSTR({amountremaining},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 1 AND 30 THEN {amountremaining} ELSE 0 END END`, label: "30 Days " }),
                        
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `CASE   WHEN ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate}) BETWEEN 1 AND 30 THEN CASE  WHEN {applyingtransaction.internalid} IS NOT NULL AND {applyingtransaction.trandate} > TO_DATE('${asOfDate}','DD/MM/YYYY')  THEN {amount}   ELSE {amountremaining}  END  ELSE 0 END`, label: "30 Days" }),

                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `CASE WHEN {applyingtransaction.trandate} > TO_DATE('${asOfDate}','DD/MM/YYYY') THEN CASE WHEN SUBSTR({amount},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 31 and 60 THEN ({amount} * -1) WHEN SUBSTR({amount},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 31 and 60 THEN {amount} ELSE 0 END 
                        ELSE CASE WHEN SUBSTR({amountremaining},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 31 and 60 THEN ({amountremaining} * -1) WHEN SUBSTR({amountremaining},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 31 and 60 THEN {amountremaining} ELSE 0 END END`, label: "60 Days " }),
                        
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `CASE WHEN {applyingtransaction.trandate} > TO_DATE('${asOfDate}','DD/MM/YYYY') THEN CASE WHEN SUBSTR({amount},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 61 and 90 THEN ({amount} * -1) WHEN SUBSTR({amount},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 61 and 90 THEN {amount} ELSE 0 END 
                        ELSE CASE WHEN SUBSTR({amountremaining},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 61 and 90 THEN ({amountremaining} * -1) WHEN SUBSTR({amountremaining},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) BETWEEN 61 and 90 THEN {amountremaining} ELSE 0 END END`, label: "90 Days " }),
                        
                        search.createColumn({ name: "formulacurrency", summary: "SUM", formula: `CASE WHEN {applyingtransaction.trandate} > TO_DATE('${asOfDate}','DD/MM/YYYY') THEN CASE WHEN SUBSTR({amount},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) > 90 THEN ({amount} * -1) WHEN SUBSTR({amount},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) > 90 THEN {amount} ELSE 0 END 
                        ELSE CASE WHEN SUBSTR({amountremaining},1,1) = '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) > 90 THEN ({amountremaining} * -1) WHEN SUBSTR({amountremaining},1,1) <> '-' AND (ROUND(TO_DATE('${asOfDate}','DD/MM/YYYY') - {trandate})) > 90 THEN {amountremaining} ELSE 0 END END`, label: ">90 Days " }),
                        
    
                    ]
            });
            return getAllResult(transactionSearchObj)
        };

        function getAllCustomers() {
            var vendorSearchObj = search.create({
                type: "customer",
                filters: [["isinactive", "is", "F"]],
                columns: [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "entityid", label: "ID" })
                ]
            });
            return getAllResult(vendorSearchObj)
        };

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

        function _logValidation(value) {
            if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "NaN" && value != "-None-")
                return true;
            return false;

        };

        return { onRequest }

    });
