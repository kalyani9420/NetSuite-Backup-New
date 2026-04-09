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
                let selectedDepartment = params.custpage_departments;
                let form = generateOpeningBalances(fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment);
                scriptContext.response.writePage(form);
            }
        } catch (error) {
            log.debug("Error", error);
        }
    };

    let generateRequestForm = () => {
        let form = serverWidget.createForm({ title: "Clientwise Cost Report" });
        form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE }).isMandatory = true;;
        form.addField({ id: "custpage_customers", label: "Customer", type: serverWidget.FieldType.MULTISELECT, source: "customer" });
        form.addField({ id: "custpage_locations", label: "Location", type: serverWidget.FieldType.SELECT, source: "location" });
        form.addField({ id: "custpage_departments", label: "Department", type: serverWidget.FieldType.SELECT, source: "Department" });
        form.addSubmitButton({ label: "Generate Balance's" });
        return form;
    };

    let generateOpeningBalances = (fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment) => {
        let form = serverWidget.createForm({ title: `Clientwise Cost Report [ ${fromDate} to ${uptoDate} ]` });
        form.clientScriptModulePath =
            "SuiteScripts/CS_ClientwiseCostSummaryReport.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });

        let selectedCustomersArray = selectedCustomers ? selectedCustomers.split("\u0005").filter(Boolean) : [];
        // let selectedLocationsArray = selectedLocations ? selectedLocations.split("\u0005").filter(Boolean) : [];

        let customerObject = {};
        let projectObject = {};
        let locationObject = {};

        if (_logValidation(selectedLocations)) {
            var fieldLookUp = search.lookupFields({
                type: search.Type.LOCATION,
                id: selectedLocations,
                columns: ['name']
            });
            let selectedLocationName = fieldLookUp.name;
            let locationOpeningBalance = 0;
            let locationOpeningBalanceSearch = getLocationOpeningBalance(getPreviousDate(fromDate), selectedLocations);
            if (locationOpeningBalanceSearch.length > 0) {
                locationOpeningBalance = locationOpeningBalanceSearch[0].getValue({
                    name: "amount", summary: "SUM", label: "Amount"
                })
            }
            locationObject[selectedLocations] = { name: selectedLocationName, id: selectedLocations, openingBalance: locationOpeningBalance, closingBalance: 0, debit: 0, credit: 0 };
        }


        let allProjectAssociatedCustomers = getProjectAssociatedCustomers(fromDate, uptoDate, selectedLocations, selectedDepartment);
        allProjectAssociatedCustomers.forEach(customer => {
            if (!selectedCustomersArray.length || (selectedCustomers.length && selectedCustomersArray.includes(customerID))) {
                let customerInternalID = customer.getValue({ name: "internalid", label: "Internal ID" });
                let customerIdText = customer.getValue({ name: "entityid", label: "ID" }) || "";
                let isPerson = customer.getValue({ name: "isperson" }) === "T";
                let firstName = isPerson ? (customer.getValue({ name: "firstname" }) || "") : "";
                let lastName = isPerson ? (customer.getValue({ name: "lastname" }) || "") : "";
                let company = isPerson ? "" : (customer.getValue({ name: "companyname" }) || "");
                let namePart = isPerson ? (firstName + " " + lastName).trim() : company;
                let hasNameInIdField = (customerIdText || '').indexOf(' ') >= 0;
                let displayName = hasNameInIdField ? customerIdText : [customerIdText, namePart].filter(Boolean).join(" ");
                customerObject[customerInternalID] = { name: displayName, id: customerInternalID, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
            }
        });
        //////log.debug('customerObject', customerObject)


        let allDebit = getDebit(fromDate, uptoDate, selectedLocations, selectedDepartment);
        //////log.debug('allDebit', allDebit)
        //log.debug('allDebit.length', allDebit.length)
        allDebit.forEach(projectBalance => {
            let customerID = projectBalance.getValue({ name: "customer", join: "job", summary: "GROUP", label: "Customer" });
            //////log.debug('customerID', customerID)
            if (_logValidation(customerID)) {
                let projectID = projectBalance.getValue({ name: "entityid", join: "job", summary: "GROUP", label: "Project" });
                //////log.debug('projectID', projectID)
                if (!selectedCustomersArray.length || (selectedCustomers.length && selectedCustomersArray.includes(customerID))) {
                    let totalDebit = _logValidation(projectBalance.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "ABS{debitamount}",
                        label: "Formula (Numeric)"
                    })) ? projectBalance.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "ABS{debitamount}",
                        label: "Formula (Numeric)"
                    }) : 0.00

                    customerObject[customerID].debit = Math.abs(parseFloat(customerObject[customerID].debit)) + Math.abs(parseFloat(totalDebit));
                    if (_logValidation(selectedLocations)) {
                        log.debug('Math.abs(parseFloat(totalDebit)', Math.abs(parseFloat(totalDebit)))
                        locationObject[selectedLocations].debit = Math.abs(parseFloat(locationObject[selectedLocations].debit)) + Math.abs(parseFloat(totalDebit));
                        log.debug('locationObject[selectedLocations].debit', locationObject[selectedLocations].debit)
                    }
                    if (projectObject[customerID]) {
                        let currentProjectBalance = projectObject[customerID];
                        currentProjectBalance[projectID] = { debit: totalDebit, credit: 0 }
                        projectObject[customerID] = currentProjectBalance;
                    }
                    else {
                        let currentProjectBalance = {};
                        currentProjectBalance[projectID] = { debit: totalDebit, credit: 0 }
                        projectObject[customerID] = currentProjectBalance;
                    }
                }
            }

        });

        //////log.debug('get Debit', projectObject)


        let allCredit = getCredit(fromDate, uptoDate, selectedLocations, selectedDepartment);
        //log.debug('allCredit.length', allCredit.length)
        allCredit.forEach(projectBalance => {
            let customerID = projectBalance.getValue({ name: "customer", join: "job", summary: "GROUP", label: "Customer" });
            if (_logValidation(customerID)) {
                let projectID = projectBalance.getValue({ name: "entityid", join: "job", summary: "GROUP", label: "Project" });
                if (!selectedCustomersArray.length || (selectedCustomers.length && selectedCustomersArray.includes(customerID))) {
                    let totalCredit = _logValidation(projectBalance.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "ABS{creditamount}",
                        label: "Formula (Numeric)"
                    })) ? projectBalance.getValue({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "ABS{creditamount}",
                        label: "Formula (Numeric)"
                    }) : 0.00
                    customerObject[customerID].credit = Math.abs(parseFloat(customerObject[customerID].credit)) + Math.abs(parseFloat(totalCredit));
                    if (_logValidation(selectedLocations)) {
                        locationObject[selectedLocations].credit = Math.abs(parseFloat(locationObject[selectedLocations].credit)) + Math.abs(parseFloat(totalCredit));
                    }
                    if (projectObject[customerID]) {
                        let currentProjectBalance = projectObject[customerID];
                        if (Object.keys(currentProjectBalance).some(key => key === projectID)) {
                            currentProjectBalance[projectID].credit = totalCredit;
                            projectObject[customerID] = currentProjectBalance;
                        }
                        else {
                            currentProjectBalance[projectID] = { debit: 0, credit: totalCredit }
                        }
                    }
                    else {
                        let currentProjectBalance = {};
                        currentProjectBalance[projectID] = { debit: 0, credit: totalCredit }
                        projectObject[customerID] = currentProjectBalance;
                    }
                }

            }
        });

        ////log.debug('get Credit', projectObject)


        Object.entries(projectObject).forEach(([customerId, projectDetails]) => {
            ////log.debug('customerId', customerId);
            Object.entries(projectDetails).forEach(([projectName, { debit, credit }]) => {
                ////log.debug('projectDetails[projectName]', projectDetails[projectName]);
                let currentClosingBalance = Math.abs(Math.abs(parseFloat(projectDetails[projectName].debit)).toFixed(2) - Math.abs(parseFloat(projectDetails[projectName].credit)).toFixed(2));
                projectDetails[projectName].closingBalance = currentClosingBalance;
                ////log.debug('projectDetails[projectName].openingBalance', currentClosingBalance);
                customerObject[customerId].closingBalance = Math.abs(parseFloat(customerObject[customerId].closingBalance)) + Math.abs(parseFloat(currentClosingBalance));
                if (_logValidation(selectedLocations)) {
                    locationObject[selectedLocations].closingBalance = parseFloat(locationObject[selectedLocations].closingBalance) + parseFloat(currentClosingBalance);
                }
            });

        });


        ////log.debug('get Opening Balance', projectObject)

        if (_logValidation(selectedLocations)) {
            sublist.addField({ id: "custpage_location", type: serverWidget.FieldType.TEXT, label: "Location" });
        }
        if (_logValidation(selectedDepartment)) {
            sublist.addField({ id: "custpage_department", type: serverWidget.FieldType.TEXT, label: "Department" });
        }

        sublist.addField({ id: "custpage_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sublist.addField({ id: "custpage_project", type: serverWidget.FieldType.TEXT, label: "Project" });
        sublist.addField({ id: "custpage_opening_balance", type: serverWidget.FieldType.TEXT, label: "Opening Balance" });
        sublist.addField({ id: "custpage_total_debit", type: serverWidget.FieldType.TEXT, label: "Total Debit" });
        sublist.addField({ id: "custpage_total_credit", type: serverWidget.FieldType.TEXT, label: "Total Credit" });
        sublist.addField({ id: "custpage_closing_balance", type: serverWidget.FieldType.TEXT, label: "Closing Balance" });

        let customerLines = Object.entries(customerObject);

        var temp = -1;
        if (_logValidation(selectedLocations)) {
            temp = temp + 1;
            sublist.setSublistValue({ id: "custpage_location", line: temp, value: '<b style="color: #ff6347">' + locationObject[selectedLocations].name + '</b>' });
            // sublist.setSublistValue({ id: "custpage_customer", line: temp, value: null });
            // sublist.setSublistValue({ id: "custpage_project", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: '<b style="color: #ff6347">' + Math.abs(locationObject[selectedLocations].openingBalance).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: '<b style="color: #ff6347">' + Math.abs(locationObject[selectedLocations].debit).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: '<b style="color: #ff6347">' + Math.abs(locationObject[selectedLocations].credit).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: '<b style="color: #ff6347">' + Math.abs(locationObject[selectedLocations].closingBalance).toFixed(2).toString() + '</b>' });
        }
        if (_logValidation(selectedDepartment)) {
            temp = temp + 1;
            var fieldLookUp = search.lookupFields({
                type: search.Type.DEPARTMENT,
                id: selectedDepartment,
                columns: ['name']
            });
            let selectedDepartmentName = fieldLookUp.name;
            sublist.setSublistValue({ id: "custpage_department", line: temp, value: '<b style="color: #ff6347">' + selectedDepartmentName + '</b>' });
        }

        for (let count = 0; count < customerLines.length; count++) {
            let [customerId, customerDetails] = customerLines[count];
            if (customerDetails.debit == 0 && customerDetails.credit == 0) continue;
            temp = temp + 1;
            sublist.setSublistValue({ id: "custpage_customer", line: temp, value: '<b>' + customerDetails.name + '</b>' });
            sublist.setSublistValue({ id: "custpage_project", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: '<b>' + Math.abs(customerDetails.debit).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: '<b>' + Math.abs(customerDetails.credit).toFixed(2).toString() + '</b>' });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: '<b>' + Math.abs(customerDetails.closingBalance).toFixed(2).toString() + '</b>' });
            let projectLines = projectObject[customerId];
            for (let projectName in projectLines) {
                temp = temp + 1;
                let projectDetails = projectLines[projectName];
                sublist.setSublistValue({ id: "custpage_customer", line: temp, value: null });
                sublist.setSublistValue({ id: "custpage_project", line: temp, value: getProjectCode(projectName) });
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
                search.createColumn({ name: "entityid", label: "ID" }),
                search.createColumn({ name: "isperson", label: "Is Individual" }),
                search.createColumn({ name: "firstname", label: "First Name" }),
                search.createColumn({ name: "lastname", label: "Last Name" }),
                search.createColumn({ name: "companyname", label: "Company Name" })
            ],
        });
        return getAllResult(customerSearchObj);
    };


    let getDebit = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {

        let filters = [[["type", "anyof", "CustCred", "VendPymt", "Custom108", "VendBill", "VPrep", "ExpRept", "Check"], "AND", ["mainline", "any", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"],],
            "OR", [["type", "anyof", "Journal"], "AND", ["debitamount", "isnotempty", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"],],
            "AND", ["job.entityid", "isnotempty", ""], "AND", ["job.customer", "noneof", "@NONE@"]]

        if (_logValidation(selectedLocations)) {
            filters.push("AND", ["location", "anyof", selectedLocations]);

        }
        if (_logValidation(selectedDepartment)) {
            filters.push("AND", ["department", "anyof", selectedDepartment]);
        }

        let customerSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filters,
            columns: [
                search.createColumn({ name: "customer", join: "job", summary: "GROUP", label: "Customer", sort: search.Sort.ASC }),
                search.createColumn({ name: "entityid", join: "job", summary: "GROUP", label: "Project" }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "ABS{debitamount}",
                    label: "Formula (Numeric)"
                })
            ],
        });
        return getAllResult(customerSearchObj);
    };

    let getCredit = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {

        let filters = [[["type", "anyof", "CustDep", "CustInvc", "VendCred", "CustPymt"], "AND", ["mainline", "any", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"]],
            "OR",
        [["type", "anyof", "Journal"], "AND", ["creditamount", "isnotempty", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"]],
            "AND",
        ["job.entityid", "isnotempty", ""]]

        if (_logValidation(selectedLocations)) {
            filters.push("AND", ["location", "anyof", selectedLocations]);

        }
        if (_logValidation(selectedDepartment)) {
            filters.push("AND", ["department", "anyof", selectedDepartment]);
        }
        let customerSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filters,
            columns: [
                search.createColumn({ name: "customer", join: "job", summary: "GROUP", label: "Customer", sort: search.Sort.ASC }),
                search.createColumn({ name: "entityid", join: "job", summary: "GROUP", label: "Project" }),
                search.createColumn({
                    name: "formulanumeric",
                    summary: "SUM",
                    formula: "ABS{creditamount}",
                    label: "Formula (Numeric)"
                })
            ],
        });
        return getAllResult(customerSearchObj);
    };

    let getLocationOpeningBalance = (fromDate, selectedLocations) => {

        let filters = [["type", "anyof", "CustDep", "VendCred", "VendPymt", "CustInvc", "VendBill", "CustCred", "VPrep", "ExpRept", "CustPymt", "Custom108", "Journal"], "AND", ["mainline", "any", ""], "AND", ["posting", "is", "T"], "AND", ["trandate", "onorbefore", fromDate], "AND", ["job.entityid", "isnotempty", ""]];

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
                search.createColumn({
                    name: "location",
                    summary: "GROUP",
                    label: "Location"
                }),
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

    let _logValidation = value => {
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

    function getProjectCode(projectName) {
        const firstSpaceIndex = projectName.indexOf(' ');
        if (firstSpaceIndex === -1) {
            return projectName; // No space found
        }
        return projectName.substring(0, firstSpaceIndex);
    }
    return { onRequest };
});
