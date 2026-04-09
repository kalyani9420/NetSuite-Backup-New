/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search", "N/url"], (serverWidget, search, url) => {


    let onRequest = scriptContext => {
        try {
            if (scriptContext.request.method === "GET") {
                let form = generateRequestForm();
                scriptContext.response.writePage(form);
            } else {
                let params = scriptContext.request.parameters || {};
                log.debug("Params", params);
                let fromDate = params.custpage_from_date;
                let uptoDate = params.custpage_upto_date;
                let selectedCustomers = params.custpage_customers;
                let selectedLocations = params.custpage_locations;
                let form = generateOpeningBalances(fromDate, uptoDate, selectedCustomers, selectedLocations);
                scriptContext.response.writePage(form);
            }
        } catch (error) {
            log.debug("Error", error);
        }
    };

    let generateRequestForm = (fromDate, uptoDate, selectedCustomers, selectedLocations) => {
        let form = serverWidget.createForm({ title: "Customer Balance Search" });
        let startField = form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE })
        startField.isMandatory = true;
        if (fromDate) startField.defaultValue = fromDate;

        let endField = form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE })
        endField.isMandatory = true;
        if (uptoDate) endField.defaultValue = uptoDate;

        let customerField = form.addField({ id: "custpage_customers", label: "Customer", type: serverWidget.FieldType.MULTISELECT, source: "customer" });
        customerField.isMandatory = false;
        log.debug('default customer', selectedCustomers)
        if (selectedCustomers) customerField.defaultValues = selectedCustomers || "";
        log.debug('default customer', selectedCustomers)

        let locationField = form.addField({ id: "custpage_locations", label: "Location", type: serverWidget.FieldType.MULTISELECT, source: "location" });
        if (selectedLocations) locationField.defaultValue = selectedLocations || "";
        form.addSubmitButton({ label: "Generate Balance's" });
        return form;
    };

    let generateOpeningBalances = (fromDate, uptoDate, selectedCustomers, selectedLocations) => {
        let form = generateRequestForm(fromDate, uptoDate, selectedCustomers, selectedLocations);
        form.title = `Customer Opening Balance [ ${fromDate} to ${uptoDate} ]`;
        form.clientScriptModulePath = "SuiteScripts/CS_CustomerOpeningBalance.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });

        let customerMap = {};
        let totalMap = { opening: 0.0, debit: 0.0, credit: 0.0, closing: 0.0 };
        let selectedCustomersArray = selectedCustomers ? selectedCustomers.split("\u0005").filter(Boolean) : [];
        let selectedLocationsArray = selectedLocations ? selectedLocations.split("\u0005").filter(Boolean) : [];

        let allCustomers = getAllCustomers();
        allCustomers.forEach(customer => {
            let customerInternalId = customer.getValue({ name: "internalid", label: "Internal ID" });
            if (!selectedCustomersArray.length || (selectedCustomers && selectedCustomersArray.includes(customerInternalId))) {
                let customerIdText = customer.getValue({ name: "entityid", label: "ID" }) || "";
                let isPerson = customer.getValue({ name: "isperson" }) === "T";
                let firstName = isPerson ? (customer.getValue({ name: "firstname" }) || "") : "";
                let lastName = isPerson ? (customer.getValue({ name: "lastname" }) || "") : "";
                let company = isPerson ? "" : (customer.getValue({ name: "companyname" }) || "");
                let namePart = isPerson ? (firstName + " " + lastName).trim() : company;
                let hasNameInIdField = (customerIdText || '').indexOf(' ') >= 0;
                let displayName = hasNameInIdField ? customerIdText : [customerIdText, namePart].filter(Boolean).join(" ");
                customerMap[customerInternalId] = { name: displayName, id: customerInternalId, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
            }
        });



        let allOpeningBalance = getAllCustomerOpeningBalance(getPreviousDate(fromDate), selectedLocations);
        allOpeningBalance.forEach(customerBalance => {
            let transactionCustomerId = customerBalance.getValue({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" });
            customerBalance = JSON.parse(JSON.stringify(customerBalance));
            let openingBalance = customerBalance.values["SUM(formulanumeric)_2"];
            if (customerMap[transactionCustomerId]) customerMap[transactionCustomerId].openingBalance = -1 * openingBalance;
        });


        let allClosingBalance = getAllCustomerOpeningBalance(uptoDate, selectedLocations);
        allClosingBalance.forEach(customerBalance => {
            let transactionCustomerId = customerBalance.getValue({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" });
            customerBalance = JSON.parse(JSON.stringify(customerBalance));
            let closingBalance = customerBalance.values["SUM(formulanumeric)_3"];
            if (customerMap[transactionCustomerId]) customerMap[transactionCustomerId].closingBalance = -1 * closingBalance;
        });

        let allBalances = getDebitCreditBalance(fromDate, uptoDate, selectedLocations);
        allBalances.forEach(customerBalance => {
            let transactionCustomerId = customerBalance.getValue({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" });
            customerBalance = JSON.parse(JSON.stringify(customerBalance));
            let totalCredit = customerBalance.values["SUM(formulanumeric)"];
            let totalDebit = customerBalance.values["SUM(formulanumeric)_1"];
            if (customerMap[transactionCustomerId]) [customerMap[transactionCustomerId].debit, customerMap[transactionCustomerId].credit] = [totalDebit, totalCredit];
        });

        sublist.addField({ id: "custpage_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sublist.addField({ id: "custpage_opening_balance", type: serverWidget.FieldType.CURRENCY, label: "Opening Balance" });
        sublist.addField({ id: "custpage_total_debit", type: serverWidget.FieldType.CURRENCY, label: "Total Debit" });
        sublist.addField({ id: "custpage_total_credit", type: serverWidget.FieldType.CURRENCY, label: "Total Credit" });
        sublist.addField({ id: "custpage_closing_balance", type: serverWidget.FieldType.CURRENCY, label: "Closing Balance" });

        // log.debug('total', totalMap['opening'] + ' ' + totalMap['credit'] + ' ' + totalMap['debit'] + ' ' + totalMap['closing'])

        let customerLines = Object.entries(customerMap);
        var sublistLine = 0;

        for (count = 0 ; count < customerLines.length; count++) {
            let [customerID, customerDetails] = customerLines[count];
            if (customerDetails.openingBalance !== 0 || customerDetails.debit !== 0 || customerDetails.credit !== 0 || customerDetails.closingBalance !== 0) {
                let detailURL = url.resolveScript({
                    scriptId: 'customscript_customer_balance_drill_down',
                    deploymentId: 'customdeploy_customer_balance_drill_down',
                    params: {
                        customerId: customerDetails.id,
                        fromDate: fromDate,
                        uptoDate: uptoDate,
                        location: selectedLocations
                    }
                });
                let link = `<a href="${detailURL}" target="_blank">${customerDetails.name}</a>`
                sublist.setSublistValue({ id: "custpage_customer", line: sublistLine, value: link });
                sublist.setSublistValue({ id: "custpage_opening_balance", line: sublistLine, value: customerDetails.openingBalance });
                sublist.setSublistValue({ id: "custpage_total_debit", line: sublistLine, value: toNumParse(customerDetails.debit).toString() });
                sublist.setSublistValue({ id: "custpage_total_credit", line: sublistLine, value: toNumParse(customerDetails.credit).toString() });
                sublist.setSublistValue({ id: "custpage_closing_balance", line: sublistLine, value: customerDetails.closingBalance });
                totalMap['opening'] = toNum(totalMap['opening']) + toNum(customerDetails.openingBalance);
                totalMap['closing'] = toNum(totalMap['closing']) + toNum(customerDetails.closingBalance);
                totalMap['credit'] = toNum(totalMap['credit']) + toNum(customerDetails.credit);
                totalMap['debit'] = toNum(totalMap['debit']) + toNum(customerDetails.debit);
                sublistLine++
            }
        }
        log.debug('sublistLine', sublistLine);
        sublist.setSublistValue({ id: "custpage_customer", line: sublistLine, value: `<b>Total</b>` });
        sublist.setSublistValue({ id: "custpage_opening_balance", line: sublistLine, value: Math.abs(totalMap.opening).toFixed(2).toString() });
        sublist.setSublistValue({ id: "custpage_total_debit", line: sublistLine, value: Math.abs(totalMap.debit).toFixed(2).toString() });
        sublist.setSublistValue({ id: "custpage_total_credit", line: sublistLine, value: Math.abs(totalMap.credit).toFixed(2).toString() });
        sublist.setSublistValue({ id: "custpage_closing_balance", line: sublistLine, value: Math.abs(totalMap.closing).toFixed(2).toString() });

        return form;
    };

    let getAllCustomers = () => {
        let vendorSearchObj = search.create({
            type: "customer",
            filters: [],
            columns: [
                search.createColumn({ name: "internalid", label: "Internal ID" }),
                search.createColumn({ name: "entityid", label: "ID" }),
                search.createColumn({ name: "isperson", label: "Is Individual" }),
                search.createColumn({ name: "firstname", label: "First Name" }),
                search.createColumn({ name: "lastname", label: "Last Name" }),
                search.createColumn({ name: "companyname", label: "Company Name" })
            ],
        });
        return getAllResult(vendorSearchObj);
    };

    let getAllCustomerOpeningBalance = (date, selectedLocations) => {
        let filters = [
            [[
                ["type", "anyof", "CustCred", "Journal", "Custom108", "FxReval"],
                "AND",
                ["accounttype", "anyof", "AcctRec"],
                "AND",
                ["voided", "is", "F"]
            ],
                "OR",
            [
                ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"]
            ],
                "OR",
            [
                ["type", "anyof", "CustRfnd"], "AND", ["mainline", "is", "T"]
            ],
                "OR",
            [
                ["type", "anyof", "CustDep"], "AND", ["account", "anyof", "2387"]
            ],
                "OR",
            [
                ["type", "anyof", "CustPymt"], "AND", ["accounttype", "anyof", "AcctRec"], "AND", ["voided", "is", "F"]
            ]
            ],
            "AND",
            ["trandate", "onorbefore", date],
            "AND",
            ["posting", "is", "T"],
            "AND",
            ["voided", "is", "F"]
        ];

        if (selectedLocations && selectedLocations !== "" && selectedLocations !== "\u0005") {
            let selectedLocationsArray = selectedLocations.split("\u0005").filter(Boolean);
            if (selectedLocationsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedLocationsArray]);
            }
        }

        let openingBalanceSearch = search.create({
            type: "transaction",
            settings: [{ name: "consolidationtype", value: "NONE" }],
            filters: filters,
            columns: [
                search.createColumn({ name: "entity", summary: "GROUP" }),
                search.createColumn({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" }),

                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE  WHEN {type}='Credit Memo'  OR ( {type}='Journal' AND {amount}<0) OR ( {type}='Currency Revaluation' AND {amount}<0) THEN ABS({amount})  WHEN {type} = 'Receipt' THEN ABS({amount}) WHEN {type} = 'Advance from Debtors'     THEN ABS({amount}) WHEN {type} = 'TDS Transaction'  THEN ABS({amount}) ELSE 0   END",
                    label: "Credit"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE   WHEN {type} = 'Invoice'     OR ({type} = 'Journal' AND {amount} > 0) OR ({type} = 'Currency Revaluation' AND {amount} > 0)    THEN ABS({amount}) WHEN {type} = 'Customer Refund' THEN ABS({amount})       ELSE 0 END",
                    label: "Debit"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE WHEN {type} = 'Credit Memo'  OR ( {type}='Journal' AND {amount}<0) OR ( {type}='Currency Revaluation' AND {amount}<0) THEN ABS({amount}) WHEN {type} = 'Receipt' THEN ABS({amount})WHEN {type} = 'Advance from Debtors'     THEN ABS({amount})WHEN {type} = 'Invoice'   OR ({type} = 'Journal' AND {amount} > 0) OR ( {type}='Currency Revaluation' AND {amount}>0) THEN -ABS({amount})WHEN {type} = 'TDS Transaction' THEN ABS({amount})WHEN {type} = 'Customer Refund' THEN -ABS({amount}) ELSE 0 END",
                    label: "Opening Balance"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE WHEN {type} = 'Credit Memo'  OR ( {type}='Journal' AND {amount}<0) OR ( {type}='Currency Revaluation' AND {amount}<0) THEN ABS({amount}) WHEN {type} = 'Receipt' THEN ABS({amount})  WHEN {type} = 'Advance from Debtors'   THEN ABS({amount})WHEN {type} = 'Invoice'   OR ({type} = 'Journal' AND {amount} > 0) OR ( {type}='Currency Revaluation' AND {amount}>0) THEN -ABS({amount})WHEN {type} = 'TDS Transaction' THEN ABS({amount})WHEN {type} = 'Customer Refund' THEN -ABS({amount}) ELSE 0 END",
                    label: "Closing Balance"
                })
            ],
        });
        return getAllResult(openingBalanceSearch);
    };

    let getDebitCreditBalance = (fromDate, uptoDate, selectedLocations) => {
        let filters = [
            [[
                ["type", "anyof", "CustCred", "Journal", "Custom108", "FxReval"],
                "AND",
                ["accounttype", "anyof", "AcctRec"],
                "AND",
                ["voided", "is", "F"]
            ],
                "OR",
            [
                ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"]
            ],
                "OR",
            [
                ["type", "anyof", "CustRfnd"], "AND", ["mainline", "is", "T"]
            ],
                "OR",
            [
                ["type", "anyof", "CustDep"], "AND", ["account", "anyof", "2387"]
            ],
                "OR",
            [
                ["type", "anyof", "CustPymt"], "AND", ["accounttype", "anyof", "AcctRec"], "AND", ["voided", "is", "F"]
            ]
            ],
            "AND",
            ["trandate", "within", fromDate, uptoDate],
            "AND",
            ["posting", "is", "T"],
            "AND",
            ["voided", "is", "F"]
        ];

        // Add location filter if selectedLocations is not empty
        if (selectedLocations && selectedLocations !== "" && selectedLocations !== "\u0005") {
            let selectedLocationsArray = selectedLocations.split("\u0005").filter(Boolean);
            if (selectedLocationsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedLocationsArray]);
            }
        }

        let balanceSearch = search.create({
            type: "transaction",
            settings: [{ name: "consolidationtype", value: "NONE" }],
            filters: filters,
            columns: [
                search.createColumn({ name: "entity", summary: "GROUP" }),
                search.createColumn({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE  WHEN {type}='Credit Memo'  OR ( {type}='Journal' AND {amount}<0) OR ( {type}='Currency Revaluation' AND {amount}<0) THEN ABS({amount})  WHEN {type} = 'Receipt' THEN ABS({amount}) WHEN {type} = 'Advance from Debtors'     THEN ABS({amount}) WHEN {type} = 'TDS Transaction'  THEN ABS({amount}) ELSE 0   END",
                    label: "Credit"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE   WHEN {type} = 'Invoice'     OR ({type} = 'Journal' AND {amount} > 0) OR ({type} = 'Currency Revaluation' AND {amount} > 0)    THEN ABS({amount}) WHEN {type} = 'Customer Refund' THEN ABS({amount})       ELSE 0 END",
                    label: "Debit"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE WHEN {type} = 'Credit Memo'  OR ( {type}='Journal' AND {amount}<0) OR ( {type}='Currency Revaluation' AND {amount}<0) THEN ABS({amount}) WHEN {type} = 'Receipt' THEN ABS({amount})WHEN {type} = 'Advance from Debtors'     THEN ABS({amount})WHEN {type} = 'Invoice'   OR ({type} = 'Journal' AND {amount} > 0) OR ( {type}='Currency Revaluation' AND {amount}>0) THEN -ABS({amount})WHEN {type} = 'TDS Transaction' THEN ABS({amount})WHEN {type} = 'Customer Refund' THEN -ABS({amount}) ELSE 0 END",
                    label: "Opening Balance"
                }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "CASE WHEN {type} = 'Credit Memo'  OR ( {type}='Journal' AND {amount}<0) OR ( {type}='Currency Revaluation' AND {amount}<0) THEN ABS({amount}) WHEN {type} = 'Receipt' THEN ABS({amount})  WHEN {type} = 'Advance from Debtors'     THEN ABS({amount})WHEN {type} = 'Invoice'   OR ({type} = 'Journal' AND {amount} > 0) OR ( {type}='Currency Revaluation' AND {amount}>0) THEN -ABS({amount})WHEN {type} = 'TDS Transaction' THEN ABS({amount})WHEN {type} = 'Customer Refund' THEN -ABS({amount}) ELSE 0 END",
                    label: "Closing Balance"
                })
            ],
        });

        return getAllResult(balanceSearch);
    };

    const getPreviousDate = dateStr => {
        const [day, month, year] = dateStr.split("/").map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() - 1);
        const prevDay = String(date.getDate()).padStart(2, "0");
        const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
        const prevYear = date.getFullYear();
        return `${prevDay}/${prevMonth}/${prevYear}`;
    };

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

    function toNumParse(n) {
        const v = parseFloat(n);
        if (!isFinite(v))
            return 0.00;
        return v.toFixed(2);
    }

    const toNum = v => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
    }

    return { onRequest };
});