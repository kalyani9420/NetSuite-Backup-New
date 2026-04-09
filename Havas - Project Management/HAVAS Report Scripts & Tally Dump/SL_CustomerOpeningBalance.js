/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search"], (serverWidget, search) => {
    let onRequest = scriptContext => {
        try {
            if (scriptContext.request.method === "GET") {
                let form = generateRequestForm();
                scriptContext.response.writePage(form);
            } else {
                let params = scriptContext.request.parameters;
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

    let generateRequestForm = () => {
        let form = serverWidget.createForm({ title: "Customer Balance Search" });
        form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE });
        form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE });
        form.addField({ id: "custpage_customers", label: "Customer", type: serverWidget.FieldType.MULTISELECT, source: "customer" });
        form.addField({ id: "custpage_locations", label: "Location", type: serverWidget.FieldType.MULTISELECT, source: "location" });
        form.addSubmitButton({ label: "Generate Balance's" });
        return form;
    };

    let generateOpeningBalances = (fromDate, uptoDate, selectedCustomers, selectedLocations) => {
        let form = serverWidget.createForm({ title: `Customer Opening Balance [ ${fromDate} to ${uptoDate} ]` });
        form.clientScriptModulePath =
            "SuiteScripts/CS_CustomerOpeningBalance.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });

        let customerMap = {};

        log.debug("Selected Customers", selectedCustomers);

        let selectedCustomersArray = selectedCustomers ? selectedCustomers.split("\u0005").filter(Boolean) : [];
        let selectedLocationsArray = selectedLocations ? selectedLocations.split("\u0005").filter(Boolean) : [];
        log.debug("Customers", selectedCustomersArray);
        log.debug("Locations", selectedLocationsArray);

        let allCustomers = getAllCustomers();
        allCustomers.forEach(customer => {
            let customerID = customer.id;
            log.debug('customerID' , customerID);
            if (!selectedCustomersArray.length || (selectedCustomers.length && selectedCustomersArray.includes(customerID))) {
                let customerInternalId = customer.getValue({ name: "internalid", label: "Internal ID" });
                let customerName = customer.getValue({ name: "entityid", label: "Name" });
                customerMap[customerInternalId] = { name: customerName, id: customerInternalId, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
            }
        });
        log.debug('customerMap[9374]' , customerMap[9374]);
        

        let allOpeningBalance = getAllCustomerOpeningBalance(getPreviousDate(fromDate), selectedLocations);
        allOpeningBalance.forEach(customerBalance => {
            let transactionCustomerId = customerBalance.getValue({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" });
            // let customerID = customerBalance.getText({ name: "entity", summary: "GROUP" });
            let openingBalance = customerBalance.getValue({ name: "amount", summary: "SUM" });
            if (transactionCustomerId == 9374) {
                log.debug('In Opening Balance', 'In Opening Balance');
                // log.debug('customerID', customerID);
                log.debug('openingBalance', openingBalance);
            }
            if (customerMap[transactionCustomerId]) customerMap[transactionCustomerId].openingBalance = openingBalance;
        });

        let allClosingBalance = getAllCustomerOpeningBalance(uptoDate, selectedLocations);
        allClosingBalance.forEach(customerBalance => {
            let transactionCustomerId = customerBalance.getValue({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" });
            // let customerID = customerBalance.getText({ name: "entity", summary: "GROUP" });
            let closingBalance = customerBalance.getValue({ name: "amount", summary: "SUM" });
            if (transactionCustomerId == 9374) {
                log.debug('In Closing Balance', 'In Closing Balance');
                // log.debug('customerID', customerID);
                log.debug('closingBalance', closingBalance);
            }

            if (customerMap[transactionCustomerId]) customerMap[transactionCustomerId].closingBalance = closingBalance;
        });

        let allBalances = getDebitCreditBalance(fromDate, uptoDate, selectedLocations);
        allBalances.forEach(customerBalance => {
            // let customerID = customerBalance.getText({ name: "entity", summary: "GROUP" });
            let transactionCustomerId = customerBalance.getValue({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" });
            customerBalance = JSON.parse(JSON.stringify(customerBalance));
            let totalCredit = customerBalance.values["SUM(formulanumeric)"];
            let totalDebit = customerBalance.values["SUM(formulanumeric)_1"];
            if (customerMap[transactionCustomerId]) [customerMap[transactionCustomerId].debit, customerMap[transactionCustomerId].credit] = [totalDebit, totalCredit];
            if (transactionCustomerId == 9374) {
                log.debug('In Debit/Credit', 'In Debit/Credit');
                log.debug('customerBalance', customerBalance);
                log.debug('totalCredit', totalCredit);
                log.debug('totalDebit', totalDebit);
                // log.debug('customerMap[customerID]', customerMap[customerID]);
                // log.debug('customerMap[customerID].debit' , customerMap[customerID].debit);
                // log.debug('customerMap[customerID].credit' , customerMap[customerID].credit);
            }
        });

        sublist.addField({ id: "custpage_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sublist.addField({ id: "custpage_opening_balance", type: serverWidget.FieldType.CURRENCY, label: "Opening Balance" });
        sublist.addField({ id: "custpage_total_debit", type: serverWidget.FieldType.CURRENCY, label: "Total Debit" });
        sublist.addField({ id: "custpage_total_credit", type: serverWidget.FieldType.CURRENCY, label: "Total Credit" });
        sublist.addField({ id: "custpage_closing_balance", type: serverWidget.FieldType.CURRENCY, label: "Closing Balance" });

        let customerLines = Object.entries(customerMap);

        for (let count = 0; count < customerLines.length; count++) {
            let [customerID, customerDetails] = customerLines[count];
            sublist.setSublistValue({ id: "custpage_customer", line: count, value: customerDetails.name });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: count, value: customerDetails.openingBalance.toString() });
            sublist.setSublistValue({ id: "custpage_total_debit", line: count, value: Math.abs(customerDetails.debit).toString() });
            sublist.setSublistValue({ id: "custpage_total_credit", line: count, value: Math.abs(customerDetails.credit).toString() });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: count, value: customerDetails.closingBalance.toString() });
        }

        return form;
    };

    let getAllCustomers = () => {
        let vendorSearchObj = search.create({
            type: "customer",
            filters: [],
            columns: [
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({ name: "entityid", label: "Name" })
            ],
        });
        return getAllResult(vendorSearchObj);
    };

    let getAllCustomerOpeningBalance = (date, selectedLocations) => {
        let filters = [
            [[
                ["type", "anyof", "CustCred", "CustPymt", "Journal", "Custom108"],
                "AND",
                ["accounttype", "anyof", "AcctRec"]
            ],
                "OR",
            [
                ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"]
            ],
                "OR",
            [
                ["type", "anyof", "CustDep"], "AND", ["account", "anyof", "2387"]
            ]],
            "AND",
            ["trandate", "onorbefore", date],
            "AND",
            ["posting", "is", "T"],
        ];

        // Add location filter if selectedLocations is not empty
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

                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "amount", summary: "SUM" }),
            ],
        });
        return getAllResult(openingBalanceSearch);
    };

    let getDebitCreditBalance = (fromDate, uptoDate, selectedLocations) => {
        let filters = [
            [[
                ["type", "anyof", "CustCred", "CustPymt", "Journal", "Custom108"], "AND", ["accounttype", "anyof", "AcctRec"]
            ],
                "OR",
            [
                ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"]
            ],
                "OR",
            [
                ["type", "anyof", "CustDep"], "AND", ["account", "anyof", "2387"]
            ]
            ],
            "AND",
            ["trandate", "within", fromDate, uptoDate],
            "AND",
            ["posting", "is", "T"],
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

                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "amount", summary: "SUM" }),
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

    return { onRequest };
});
