/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search", "N/query"], (serverWidget, search, query) => {
    let onRequest = scriptContext => {
        try {
            if (scriptContext.request.method === "GET") {
                let form = generateRequestForm();
                scriptContext.response.writePage(form);
            } else {
                let params = scriptContext.request.parameters || {};
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

    let generateRequestForm = (fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment) => {
        let form = _logValidation(fromDate) && _logValidation(uptoDate) ? serverWidget.createForm({ title: `Clientwise Cost Report [ ${fromDate} to ${uptoDate} ]` }) : serverWidget.createForm({ title: "Clientwise Cost Report" });
        let startDate = form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE })
        startDate.isMandatory = true;
        if (fromDate) startDate.defaultValue = fromDate || "";
        let endDate = form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE });
        endDate.isMandatory = true;
        if (uptoDate) endDate.defaultValue = uptoDate || "";
        let customer = form.addField({ id: "custpage_customers", label: "Customer", type: serverWidget.FieldType.MULTISELECT, source: "customer" });
        if (selectedCustomers) customer.defaultValue = selectedCustomers || "";
        let location = form.addField({ id: "custpage_locations", label: "Location", type: serverWidget.FieldType.SELECT, source: "location" });
        if (selectedLocations) location.defaultValue = selectedLocations || "";
        let department = form.addField({ id: "custpage_departments", label: "Department", type: serverWidget.FieldType.SELECT, source: "Department" });
        if (selectedDepartment) department.defaultValue = selectedDepartment || "";
        form.addSubmitButton({ label: "Generate Balance's" });
        return form;
    };

    let generateOpeningBalances = (fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment) => {
        let form = generateRequestForm(fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment);
        form.clientScriptModulePath =
            "SuiteScripts/CS_ClientwiseCostSummaryReport.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });

        let selectedCustomersArray = selectedCustomers ? selectedCustomers.split("\u0005").filter(Boolean) : [];

        let customerObject = {};
        let projectObject = {};
        let locationObject = {};

        if (_logValidation(selectedLocations)) {
            var fieldLookUp = search.lookupFields({ type: search.Type.LOCATION, id: selectedLocations, columns: ['name'] });
            let selectedLocationName = fieldLookUp.name;
            let locationOpeningBalance = 0;
            let locationOpeningBalanceSearch = getLocationOpeningBalance(getPreviousDate(fromDate), selectedLocations);
            if (locationOpeningBalanceSearch.length > 0) {
                locationOpeningBalance = parseFloat(locationOpeningBalanceSearch[0].getValue({ name: "amount", summary: "SUM", label: "Amount" })) || 0;
            }
            locationObject[selectedLocations] = { name: selectedLocationName, id: selectedLocations, openingBalance: locationOpeningBalance, closingBalance: 0, debit: 0, credit: 0 };
        }


        let allProjectAssociatedCustomers = getProjectAssociatedCustomers(fromDate, uptoDate, selectedLocations, selectedDepartment);
        allProjectAssociatedCustomers.forEach(customer => {
            let customerInternalID = customer.getValue({ name: "internalid", label: "Internal ID" });
            if (!selectedCustomersArray.length || (selectedCustomers && selectedCustomersArray.includes(customerInternalID))) {
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

        let allDebit = getDebit(fromDate, uptoDate, selectedLocations, selectedDepartment);
        allDebit.forEach(projectBalance => {
            let customerID = projectBalance.getValue({ name: "customer", join: "job", summary: "GROUP" });
            if (_logValidation(customerID)) {
                let projectInternalID = getProjectCode(projectBalance.getValue({ name: "internalid", join: "job", summary: "GROUP" }));
                log.debug('projectInternalID', projectInternalID)
                let projectID = _logValidation(getJobId(projectInternalID)) ? getProjectCode(getJobId(projectInternalID)) : null;
                if (!selectedCustomersArray.length || (selectedCustomers && selectedCustomersArray.includes(customerID))) {
                    let totalDebit = parseFloat(projectBalance.getValue({ name: "debitamount", summary: "SUM" })) || 0;
                    customerObject[customerID] = customerObject[customerID] || { name: customerID, id: customerID, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
                    customerObject[customerID].debit += totalDebit;
                    if (_logValidation(selectedLocations)) { locationObject[selectedLocations].debit += totalDebit; }
                    if (!projectObject[customerID]) projectObject[customerID] = {};
                    projectObject[customerID][projectID] = projectObject[customerID][projectID] || { debit: 0, credit: 0 };
                    projectObject[customerID][projectID].debit += totalDebit;
                }
            }
        });


        let allCredit = getCredit(fromDate, uptoDate, selectedLocations, selectedDepartment);
        allCredit.forEach(projectBalance => {
            let customerID = projectBalance.getValue({ name: "customer", join: "job", summary: "GROUP" });
            if (_logValidation(customerID)) {
                let projectInternalID = getProjectCode(projectBalance.getValue({ name: "internalid", join: "job", summary: "GROUP" }));
                log.debug('projectInternalID', projectInternalID)
                let projectID = _logValidation(getJobId(projectInternalID)) ? getProjectCode(getJobId(projectInternalID)) : null;
                if (!selectedCustomersArray.length || (selectedCustomers && selectedCustomersArray.includes(customerID))) {
                    let totalCredit = parseFloat(projectBalance.getValue({ name: "creditamount", summary: "SUM" })) || 0;
                    customerObject[customerID] = customerObject[customerID] || { name: customerID, id: customerID, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
                    customerObject[customerID].credit += totalCredit;
                    if (_logValidation(selectedLocations)) {
                        locationObject[selectedLocations].credit += totalCredit;
                    }
                    if (!projectObject[customerID]) projectObject[customerID] = {};
                    projectObject[customerID][projectID] = projectObject[customerID][projectID] || { debit: 0, credit: 0 };
                    projectObject[customerID][projectID].credit += totalCredit;
                }
            }
        });

        let delegatesSbCn = getDelgatesSoCn(fromDate, uptoDate, selectedLocations, selectedDepartment);
        log.debug('delegatesSbCn', delegatesSbCn);
        if (delegatesSbCn != null) {
            delegatesSbCn.forEach(project => {
                project = JSON.parse(JSON.stringify(project));
                let delgCode = getProjectCode(project.values["GROUP(formulatext)"]);
                let delgCustomerObj = getDeligatesProject(delgCode);
                let delgCustomer = delgCustomerObj[0].getValue({ name: "internalid", join: "customer", label: "Internal ID" })
                let delgCustomerName = delgCustomerObj[0].getValue({ name: "entityid", join: "customer", label: "ID" })
                let delgSb = project.values["SUM(formulanumeric)"];
                let delgCn = project.values["SUM(formulanumeric)_1"];
                if (_logValidation(selectedLocations)) {
                    locationObject[selectedLocations].debit += Math.abs(parseFloat(delgCn));
                    locationObject[selectedLocations].credit += Math.abs(parseFloat(delgSb));
                }
                if (_logValidation(delgCustomer) && _logValidation(projectObject[delgCustomer])) {
                    if (_logValidation(delgCode) && Object.keys(projectObject[delgCustomer]).includes(delgCode)) {
                        let projectDebit = parseFloat(projectObject[delgCustomer][delgCode].debit) + Math.abs(parseFloat(delgCn))
                        let projectCredit = parseFloat(projectObject[delgCustomer][delgCode].credit) + Math.abs(parseFloat(delgSb))
                        projectObject[delgCustomer][delgCode] = { debit: parseFloat(projectDebit), credit: parseFloat(projectCredit) };
                        customerObject[delgCustomer].debit += Math.abs(parseFloat(delgCn));
                        customerObject[delgCustomer].credit += Math.abs(parseFloat(delgSb));
                    } else {
                        projectObject[delgCustomer][delgCode] = { debit: parseFloat(delgCn), credit: parseFloat(delgSb) };
                        customerObject[delgCustomer].debit += Math.abs(parseFloat(delgCn));
                        customerObject[delgCustomer].credit += Math.abs(parseFloat(delgSb));
                    }
                } else {
                    if (!selectedCustomersArray.length || (selectedCustomers && selectedCustomersArray.includes(delgCustomer))) {
                        projectObject[delgCustomer] = {};
                        projectObject[delgCustomer][delgCode] = { debit: parseFloat(delgCn), credit: parseFloat(delgSb) };
                        customerObject[delgCustomer] = { name: delgCustomerName, id: delgCustomer, openingBalance: 0, closingBalance: 0, debit: parseFloat(delgCn), credit: parseFloat(delgSb) };
                    }
                }
            });
        }


        Object.entries(projectObject).forEach(([customerId, projectDetails]) => {
            Object.entries(projectDetails).forEach(([projectName, dc]) => {
                const d = parseFloat(dc.debit) || 0;
                const c = parseFloat(dc.credit) || 0;
                const currentClosingBalance = c - d; // <-- SIGNED
                projectDetails[projectName].closingBalance = currentClosingBalance;
                customerObject[customerId].closingBalance += currentClosingBalance;
                if (_logValidation(selectedLocations)) {
                    locationObject[selectedLocations].closingBalance += currentClosingBalance;
                }
            });
        });

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
        let temp = -1;

        if (_logValidation(selectedLocations)) {
            temp++;
            sublist.setSublistValue({ id: "custpage_location", line: temp, value: '<b style="color: #ff6347">' + locationObject[selectedLocations].name + '</b>' });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: `<b style="color: #ff6347">${formatAmount(toNum(locationObject[selectedLocations].openingBalance))}</b>` });
            sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: `<b style="color: #ff6347">${formatAmount(toNum(locationObject[selectedLocations].debit))}</b>` });
            sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: `<b style="color: #ff6347">${formatAmount(toNum(locationObject[selectedLocations].credit))}</b>` });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: `<b style="color: #ff6347">${formatAmount(toNum(locationObject[selectedLocations].closingBalance))}</b>` });
        }
        if (_logValidation(selectedDepartment)) {
            temp++;
            var fieldLookUp = search.lookupFields({ type: search.Type.DEPARTMENT, id: selectedDepartment, columns: ['name'] });
            let selectedDepartmentName = fieldLookUp.name;
            sublist.setSublistValue({ id: "custpage_department", line: temp, value: '<b style="color: #ff6347">' + selectedDepartmentName + '</b>' });
        }

        for (let count = 0; count < customerLines.length; count++) {
            let [customerId, customerDetails] = customerLines[count];
            if ((customerDetails.debit || 0) === 0 && (customerDetails.credit || 0) === 0) continue;

            temp++;
            sublist.setSublistValue({ id: "custpage_customer", line: temp, value: '<b>' + (customerDetails.name || '') + '</b>' });
            sublist.setSublistValue({ id: "custpage_project", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: null });
            sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: '<b>' + formatAmount(toNum(customerDetails.debit)) + '</b>' });
            sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: '<b>' + formatAmount(toNum(customerDetails.credit)) + '</b>' });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: '<b>' + formatAmount(toNum(customerDetails.closingBalance)) + '</b>' });

            let projectLines = projectObject[customerId] || {};
            for (let projectName in projectLines) {
                temp++;
                let projectDetails = projectLines[projectName];
                let drillURL = 'https://9370186-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2444&deploy=1&projectCode=' + getProjectCode(projectName) + '&startDate=' + fromDate + '&endDate=' + uptoDate;
                if (_logValidation(selectedLocations)) drillURL += "&location=" + selectedLocations;
                if (_logValidation(selectedDepartment)) drillURL += "&department=" + selectedDepartment;
                sublist.setSublistValue({ id: "custpage_customer", line: temp, value: null });
                sublist.setSublistValue({ id: "custpage_project", line: temp, value: '<a href =' + drillURL + ' target = "_blank" >' + getProjectCode(projectName) + '</a>' });
                sublist.setSublistValue({ id: "custpage_opening_balance", line: temp, value: null });
                sublist.setSublistValue({ id: "custpage_total_debit", line: temp, value: formatAmount(toNum(projectDetails.debit)) });
                sublist.setSublistValue({ id: "custpage_total_credit", line: temp, value: formatAmount(toNum(projectDetails.credit)) });
                sublist.setSublistValue({ id: "custpage_closing_balance", line: temp, value: formatAmount(toNum(projectDetails.closingBalance)) });
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

    let getDeligatesProject = (projectCode) => {
        var deligatesProjectObject = search.create({
            type: "job",
            filters: [["entityid", "contains", projectCode]],
            columns: [search.createColumn({ name: "internalid", join: "customer", label: "Internal ID" }),
            search.createColumn({ name: "entityid", join: "customer", label: "ID" })]
        });
        return deligatesProjectObject.runPaged().count > 0 ? getAllResult(deligatesProjectObject) : null;
    };


    let getDebit = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {

        let filter1 = [["type", "anyof", "CustCred", "VendPymt", "Custom108", "VendBill", "VPrep", "ExpRept"], "AND", ["mainline", "any", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"]];
        let filter2 = ["OR", ["type", "anyof", "Journal"], "AND", ["debitamount", "isnotempty", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"], "AND", ["account.type", "anyof", "AcctPay", "AcctRec", "Income", "COGS"]];
        if (_logValidation(selectedLocations)) {
            filter1.push("AND", ["location", "anyof", selectedLocations]);
            filter2.push("AND", ["location", "anyof", selectedLocations]);
        }
        if (_logValidation(selectedDepartment)) {
            filter1.push("AND", ["department", "anyof", selectedDepartment]);
            filter2.push("AND", ["department", "anyof", selectedDepartment]);
        }
        let filter = [];
        filter.push(...filter1, ...filter2, "AND", ["job.entityid", "isnotempty", ""], "AND", ["job.customer", "noneof", "@NONE@"]);
        let customerSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filter,
            columns: [
                search.createColumn({ name: "customer", join: "job", summary: "GROUP", sort: search.Sort.ASC }),
                search.createColumn({ name: "internalid", join: "job", summary: "GROUP" }),
                search.createColumn({ name: "debitamount", summary: "SUM" })
            ],
        });
        return getAllResult(customerSearchObj);
    };

    let getCredit = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {

        let filter1 = [["type", "anyof", "CustDep", "CustInvc", "VendCred", "CustPymt"], "AND", ["mainline", "any", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"]];
        let filter2 = ["OR", ["type", "anyof", "Journal"], "AND", ["creditamount", "isnotempty", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"], "AND", ["account.type", "anyof", "AcctPay", "AcctRec", "Income", "COGS"]];
        if (_logValidation(selectedLocations)) {
            filter1.push("AND", ["location", "anyof", selectedLocations]);
            filter2.push("AND", ["location", "anyof", selectedLocations]);
        }
        if (_logValidation(selectedDepartment)) {
            filter1.push("AND", ["department", "anyof", selectedDepartment]);
            filter2.push("AND", ["department", "anyof", selectedDepartment]);
        }
        let filter = [];
        filter.push(...filter1, ...filter2, "AND", ["job.entityid", "isnotempty", ""], "AND", ["job.customer", "noneof", "@NONE@"]);

        let customerSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filter,
            columns: [
                search.createColumn({ name: "customer", join: "job", summary: "GROUP", sort: search.Sort.ASC }),
                search.createColumn({ name: "internalid", join: "job", summary: "GROUP" }),
                search.createColumn({ name: "creditamount", summary: "SUM" })
            ],
        });
        return getAllResult(customerSearchObj);
    };

    let getLocationOpeningBalance = (fromDate, selectedLocations) => {
        let filters = [
            ["type", "anyof", "CustDep", "VendCred", "VendPymt", "CustInvc", "VendBill", "CustCred", "VPrep", "ExpRept", "CustPymt", "Custom108", "Journal"],
            "AND", ["mainline", "any", ""],
            "AND", ["posting", "is", "T"],
            "AND", ["trandate", "onorbefore", fromDate],
            "AND", ["job.entityid", "isnotempty", ""]
        ];
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
                search.createColumn({ name: "location", summary: "GROUP" }),
                search.createColumn({ name: "amount", summary: "SUM" }) // signed amount
            ],
        });
        return getAllResult(customerSearchObj);
    };

    const getPreviousDate = (dateStr) => {
        const [day, month, year] = dateStr.split("/").map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() - 1);
        const prevDay = String(date.getDate()).padStart(2, "0");
        const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
        const prevYear = date.getFullYear();
        return `${prevDay}/${prevMonth}/${prevYear}`;
    };

    const getJobId = (jobId) => {
        try {
            const sql = `SELECT entityid FROM job WHERE id = ? `;
            const result = query.runSuiteQL({
                query: sql,
                params: [jobId],
            }).asMappedResults();

            if (result.length > 0) {
                log.debug("Job EntityID", result);
                log.debug("Job EntityID", result[0].entityid);
                return result[0].entityid;
            }
            return null;

        } catch (error) {
            log.debug('Error', error);

        }
    }

    let getAllResult = (customSearch) => {
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

    let _logValidation = (value) => {
        return !(
            value == null ||
            value === "" ||
            value === "null" ||
            value === undefined ||
            value === "undefined" ||
            value === "@NONE@" ||
            value === "NaN"
        );
    };

    let getProjectCode = (projectName) => {
        const firstSpaceIndex = projectName.indexOf(' ');
        if (firstSpaceIndex === -1) return projectName;
        return projectName.substring(0, firstSpaceIndex);
    }

    let toNum = (n) => {
        const v = parseFloat(n);
        if (!isFinite(v)) return "0.00";
        return v.toFixed(2);
    }

    let formatAmount = (amount) => {
        const formatter = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return formatter.format(toNum(amount));
    };

    let getDelgatesSoCn = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {
        let filter = [["job.internalidnumber", "isempty", ""], "AND", ["type", "anyof", "SalesOrd", "CustInvc", "CustCred"], "AND", ["cseg_ags_project_co", "noneof", "@NONE@"], "AND", ["mainline", "is", "F"], "AND", ["taxline", "is", "F"], "AND", ["trandate", "within", fromDate, uptoDate]];
        if (_logValidation(selectedLocations)) filter.push("AND", ["location", "anyof", selectedLocations]);
        if (_logValidation(selectedDepartment)) filter.push("AND", ["department", "anyof", selectedDepartment]);
        var delegatesSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: filter,
            columns:
                [
                    search.createColumn({ name: "formulatext", summary: "GROUP", formula: "CASE      WHEN {cseg_ags_project_co} IS NOT NULL THEN          CASE              WHEN INSTR({cseg_ags_project_co}, ' ') > 0 THEN SUBSTR({cseg_ags_project_co}, 1, INSTR({cseg_ags_project_co}, ' ') - 1)              ELSE {cseg_ags_project_co}          END      ELSE NULL  END", label: "Project Code" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Invoice' AND( {approvalstatus} != 'Rejected')  THEN {amount} ELSE 0 END", label: "Formula (Numeric)" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: " CASE  WHEN {type} = 'Credit Memo'  THEN {amount} ELSE 0  END", label: "Formula (Numeric)" })
                ]
        });
        var searchResultCount = delegatesSearchObj.runPaged().count;
        return searchResultCount > 0 ? getAllResult(delegatesSearchObj) : null;
    }

    return { onRequest };
});
