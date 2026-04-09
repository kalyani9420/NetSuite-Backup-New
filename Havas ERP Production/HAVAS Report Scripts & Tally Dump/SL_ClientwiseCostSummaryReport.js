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
        form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE }).isMandatory = true;;
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

        let customerObject = {};
        let projectObject = {};

        let selectedCustomersArray = selectedCustomers ? selectedCustomers.split("\u0005").filter(Boolean) : [];
        let selectedLocationsArray = selectedLocations ? selectedLocations.split("\u0005").filter(Boolean) : [];

        let allProjectAssociatedCustomers = getProjectAssociatedCustomers();
        log.debug('allProjectAssociatedCustomers' , allProjectAssociatedCustomers)
        log.debug('allProjectAssociatedCustomers' , allProjectAssociatedCustomers.length)
        allProjectAssociatedCustomers.forEach(customer => {
            let customerID = customer.getValue({ name: "internalid", label: "Internal ID" });
            if (!selectedCustomersArray.length || (selectedCustomers.length && selectedCustomersArray.includes(customerID))) {
                let customerName = customer.getValue({ name: "entityid", label: "Name" });
                customerObject[customerID] = { name: customerName, id: customerID, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
            }
        });
        log.debug('customerObject' , customerObject)

        let allDebitCreditClosingBalance = getDebitCreditClosingBalance(fromDate, uptoDate, selectedLocations);
        allDebitCreditClosingBalance.forEach(projectBalance => {
            let customerID = projectBalance.getValue({ name: "customer", join: "job", summary: "GROUP", label: "Customer" });
            let customerName = projectBalance.getText({ name: "customer", join: "job", summary: "GROUP", label: "Customer" });
            let projectID = projectBalance.getValue({ name: "entityid", join: "job", summary: "GROUP", label: "Project" });
            let projectName = projectBalance.getText({ name: "entityid", join: "job", summary: "GROUP", label: "Project" });
            if (!selectedCustomersArray.length || (selectedCustomers.length && selectedCustomersArray.includes(customerID))) {
                let closingBalance = projectBalance.getValue({ name: "amount", summary: "SUM", label: "Amount" });
                projectBalance = JSON.parse(JSON.stringify(projectBalance));
                let totalDebit = projectBalance.values["SUM(formulanumeric)"];
                let totalCredit = projectBalance.values["SUM(formulanumeric)_1"];
                customerObject[customerID].debit = parseFloat(customerObject[customerID].debit) + parseFloat(totalDebit);
                customerObject[customerID].credit = parseFloat(customerObject[customerID].credit) + parseFloat(totalCredit);
                customerObject[customerID].closingBalance = parseFloat(customerObject[customerID].closingBalance) + parseFloat(closingBalance);
                log.debug('customerObject[customerID].debit', customerObject[customerID].debit)
                log.debug('customerObject[customerID].credit', customerObject[customerID].credit)
                if (projectObject[customerID]) {
                    let currentProjectBalance = projectObject[customerID];
                    currentProjectBalance[projectID] = { debit: totalDebit, credit: totalCredit, closingBalance: closingBalance }
                    projectObject[customerID] = currentProjectBalance;
                }
                else {
                    let currentProjectBalance = {};
                    currentProjectBalance[projectID] = { debit: totalDebit, credit: totalCredit, closingBalance: closingBalance }
                    projectObject[customerID] = currentProjectBalance;
                }
            }
        });

        sublist.addField({ id: "custpage_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sublist.addField({ id: "custpage_project", type: serverWidget.FieldType.TEXT, label: "Project" });
        sublist.addField({ id: "custpage_opening_balance", type: serverWidget.FieldType.TEXT, label: "Opening Balance" });
        sublist.addField({ id: "custpage_total_debit", type: serverWidget.FieldType.TEXT, label: "Total Debit" });
        sublist.addField({ id: "custpage_total_credit", type: serverWidget.FieldType.TEXT, label: "Total Credit" });
        sublist.addField({ id: "custpage_closing_balance", type: serverWidget.FieldType.TEXT, label: "Closing Balance" });

        let customerLines = Object.entries(customerObject);

        var temp = -1;

        for (let count = 0; count < customerLines.length; count++) {
            temp = temp + 1;
            let [customerId, customerDetails] = customerLines[count];
            sublist.setSublistValue({ id: "custpage_customer", line: temp, value: '<b>' + customerDetails.name + '</b>' });
            sublist.setSublistValue({ id: "custpage_project", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: '<b>' + Math.abs(customerDetails.debit).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: '<b>' + Math.abs(customerDetails.credit).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: '<b>' + Math.abs(customerDetails.closingBalance).toFixed(2).toString() + '</b>' });
            let projectLines = projectObject[customerId];
            // log.debug('projectLines', projectLines)
            for (let projectName in projectLines) {
                temp = temp + 1;
                let projectDetails = projectLines[projectName];
                sublist.setSublistValue({ id: "custpage_customer", line: temp, value: null });
                sublist.setSublistValue({ id: "custpage_project", line: temp, value: projectName });
                sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: null });
                sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: Math.abs(projectDetails.debit).toFixed(2).toString() });
                sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: Math.abs(projectDetails.credit).toFixed(2).toString() });
                sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: Math.abs(projectDetails.closingBalance).toFixed(2).toString() });

            }

        }

        return form;
    };

    let getProjectAssociatedCustomers = () => {

        let customerSearchObj = search.create({
            type: "customer",
            filters: [],
            columns: [
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({ name: "entityid", label: "Name" })
            ],
        });
        return getAllResult(customerSearchObj);
    };


    let getDebitCreditClosingBalance = (fromDate, uptoDate, selectedLocations) => {

        let filters = [["type", "anyof", "CustDep", "VendCred", "VendPymt", "CustInvc", "VendBill", "CustCred", "VPrep", "ExpRept", "CustPymt", "Custom108", "Journal"], "AND", ["mainline", "any", ""], "AND", ["posting", "is", "T"], "AND", ["trandate", "within", fromDate, uptoDate]];

        if (selectedLocations && selectedLocations !== "" && selectedLocations !== "\u0005") {
            let selectedLocationsArray = selectedLocations.split("\u0005").filter(Boolean);
            if (selectedLocationsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedLocationsArray]);
            }
        }
        let customerSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filters,
            columns: [
                search.createColumn({ name: "customer", join: "job", summary: "GROUP", label: "Customer", sort: search.Sort.ASC }),
                search.createColumn({ name: "entityid", join: "job", summary: "GROUP", label: "Project" }),
                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "ABS(SUM(CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END))", label: "Formula (Numeric)" }),
                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "ABS(SUM(CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END))", label: "Formula (Numeric)" }),
                search.createColumn({
                    name: "amount",
                    summary: "SUM",
                    label: "Amount"
                })
            ],
        });
        return getAllResult(customerSearchObj);
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
