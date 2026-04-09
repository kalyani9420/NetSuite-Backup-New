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
                let selectedVendors = params.custpage_vendors;
                let selectedLocations = params.custpage_locations;
                let form = generateOpeningBalances(fromDate, uptoDate, selectedVendors, selectedLocations);
                scriptContext.response.writePage(form);
            }
        } catch (error) {
            log.debug("Error", error);
        }
    };

    let generateRequestForm = (fromDate, uptoDate, selectedVendors, selectedLocations) => {
        let form = serverWidget.createForm({ title: "Vendor Balance Search" });

        let fromFld = form.addField({
            id: "custpage_from_date",
            label: "Start / From Date",
            type: serverWidget.FieldType.DATE
        });
        fromFld.isMandatory = true;
        if (fromDate) fromFld.defaultValue = fromDate;

        let uptoFld = form.addField({
            id: "custpage_upto_date",
            label: "End / Upto Date",
            type: serverWidget.FieldType.DATE
        });
        uptoFld.isMandatory = true;
        if (uptoDate) uptoFld.defaultValue = uptoDate;

        let vendorFld = form.addField({
            id: "custpage_vendors",
            label: "Vendor",
            type: serverWidget.FieldType.MULTISELECT,
            source: "vendor"
        });
        if (selectedVendors) vendorFld.defaultValues = selectedVendors.split(",");

        let locFld = form.addField({
            id: "custpage_locations",
            label: "Location",
            type: serverWidget.FieldType.MULTISELECT,
            source: "location"
        });
        if (selectedLocations) locFld.defaultValues = selectedLocations.split(",");

        form.addSubmitButton({ label: "Generate Balance's" });

        return form;
    };

    let generateOpeningBalances = (fromDate, uptoDate, selectedVendors, selectedLocations) => {
        //let form = serverWidget.createForm({ title: `Vendor Opening Balance [ ${fromDate} to ${uptoDate} ]` });

        let form = generateRequestForm(fromDate, uptoDate, selectedVendors, selectedLocations);
        form.title = `Vendor Opening Balance [ ${fromDate} to ${uptoDate} ]`;


        form.clientScriptFileId = 9597;
        form.addButton({ id: "custbody_export_excel", label: "Export Excel", functionName: "exportToExcel()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });

        let vendorMap = {};

        let selectedVendorsArray = selectedVendors ? selectedVendors.split("\u0005").filter(Boolean) : [];
        let selectedLocationsArray = selectedLocations ? selectedLocations.split("\u0005").filter(Boolean) : [];

        let allVendors = getAllVendors();
        allVendors.forEach(vendor => {
            let vendorID = vendor.id;
            if (!selectedVendorsArray.length || (selectedVendors.length && selectedVendorsArray.includes(vendorID))) {
                let vendorName = vendor.getValue({ name: "altname", label: "Name" });
                let vendorID = vendor.getValue({ name: "entityid", label: "ID" });
                let companyName = vendor.getValue({ name: "companyname", label: "Company Name" });
                let computedID = "";
                if (vendorID && !vendorName) computedID = vendorID;
                if (!vendorID && vendorName) computedID = vendorName;
                if (vendorID && vendorName) computedID = vendorID + " " + vendorName;
                let displayName = /[a-zA-Z]/.test(vendorID) ? vendorID : vendorID + " " + vendorName;
                displayName = /[a-zA-Z]/.test(displayName) ? displayName : displayName + " " + companyName;
                vendorMap[computedID] = { name: displayName, id: vendorID, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
            }
        });

        let allOpeningBalance = getAllVendorOpeningBalance(getPreviousDate(fromDate), selectedLocations);
        allOpeningBalance.forEach(vendorBalance => {
            let vendorID = vendorBalance.getText({ name: "entity", summary: "GROUP" });
            let openingBalance = vendorBalance.getValue({ name: "amount", summary: "SUM" });
            if (vendorMap[vendorID]) vendorMap[vendorID].openingBalance = -1 * openingBalance;
        });

        let allClosingBalance = getAllVendorOpeningBalance(uptoDate, selectedLocations);
        allClosingBalance.forEach(vendorBalance => {
            let vendorID = vendorBalance.getText({ name: "entity", summary: "GROUP" });
            let closingBalance = vendorBalance.getValue({ name: "amount", summary: "SUM" });

            if (vendorMap[vendorID]) vendorMap[vendorID].closingBalance = -1 * closingBalance;
        });

        let allBalances = getDebitCreditBalance(fromDate, uptoDate, selectedLocations);
        allBalances.forEach(vendorBalance => {
            let vendorID = vendorBalance.getText({ name: "entity", summary: "GROUP" });
            vendorBalance = JSON.parse(JSON.stringify(vendorBalance));
            let totalDebit = vendorBalance.values["SUM(formulanumeric)"];
            let totalCredit = vendorBalance.values["SUM(formulanumeric)_1"];
            if (vendorID.includes("Creedit Experrtis") || vendorID.includes("Amazon Seller")) log.debug(vendorID, totalDebit + " : " + totalCredit);
            if (vendorMap[vendorID]) [vendorMap[vendorID].debit, vendorMap[vendorID].credit] = [totalDebit, totalCredit];
        });

        sublist.addField({ id: "custpage_vendor", type: serverWidget.FieldType.TEXT, label: "Vendor" });
        sublist.addField({ id: "custpage_opening_balance", type: serverWidget.FieldType.CURRENCY, label: "Opening Balance" });
        sublist.addField({ id: "custpage_total_debit", type: serverWidget.FieldType.CURRENCY, label: "Total Debit" });
        sublist.addField({ id: "custpage_total_credit", type: serverWidget.FieldType.CURRENCY, label: "Total Credit" });
        sublist.addField({ id: "custpage_closing_balance", type: serverWidget.FieldType.CURRENCY, label: "Closing Balance" });

        let vendorLines = Object.entries(vendorMap);

        let totalOpening = 0, totalDebit = 0, totalCredit = 0, totalClosing = 0;

        for (let count = 0; count < vendorLines.length; count++) {
            let [vendorID, vendorDetails] = vendorLines[count];
            if (vendorID.includes("Creedit Experrtis") || vendorID.includes("Amazon Seller")) log.debug(vendorID, vendorDetails);
            sublist.setSublistValue({ id: "custpage_vendor", line: count, value: vendorDetails.name.toString() });
            sublist.setSublistValue({ id: "custpage_opening_balance", line: count, value: vendorDetails.openingBalance.toString() });
            sublist.setSublistValue({ id: "custpage_total_debit", line: count, value: Math.abs(vendorDetails.debit).toString() });
            sublist.setSublistValue({ id: "custpage_total_credit", line: count, value: Math.abs(vendorDetails.credit).toString() });
            sublist.setSublistValue({ id: "custpage_closing_balance", line: count, value: vendorDetails.closingBalance.toString() });

            totalOpening += parseFloat(vendorDetails.openingBalance) || 0;
            totalDebit += Math.abs(parseFloat(vendorDetails.debit) || 0);
            totalCredit += Math.abs(parseFloat(vendorDetails.credit) || 0);
            totalClosing += parseFloat(vendorDetails.closingBalance) || 0;
        }

        let totalLineNum = vendorLines.length;
        log.debug('total opening : ' + totalOpening + ' total debit : ' + totalDebit + ' total credit : ' + totalCredit + ' total closing : ' + totalClosing);
        sublist.setSublistValue({ id: "custpage_vendor", line: totalLineNum, value: "TOTAL" });
        sublist.setSublistValue({ id: "custpage_opening_balance", line: totalLineNum, value: totalOpening.toString() });
        sublist.setSublistValue({ id: "custpage_total_debit", line: totalLineNum, value: totalDebit.toString() });
        sublist.setSublistValue({ id: "custpage_total_credit", line: totalLineNum, value: totalCredit.toString() });
        sublist.setSublistValue({ id: "custpage_closing_balance", line: totalLineNum, value: totalClosing.toString() });

        return form;
    };

    let getAllVendors = () => {
        let vendorSearchObj = search.create({
            type: "vendor",
            filters: [["entityid", "doesnotcontain", "Tax Agency"]],
            columns: [
                search.createColumn({ name: "internalid", label: "Internal ID" }),
                search.createColumn({ name: "altname", label: "Name" }),
                search.createColumn({ name: "entityid", label: "ID" }),
                search.createColumn({ name: "companyname", label: "Company Name" }),
            ],
        });
        return getAllResult(vendorSearchObj);
    };

    let getAllVendorOpeningBalance = (date, selectedLocations) => {
        let filters = [
            [
                [["type", "anyof", "ExpRept", "VendCred", "VendPymt", "Custom108", "Journal", "Deposit"], "AND", [["accounttype", "anyof", "AcctPay"], "OR", ["account", "anyof", "2356"]]],
                "OR",
                [["type", "anyof", "VendBill", "VPrep"], "AND", ["mainline", "is", "T"]],
            ],
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
                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END" }),
                search.createColumn({ name: "amount", summary: "SUM" }),
            ],
        });
        return getAllResult(openingBalanceSearch);
    };

    let getDebitCreditBalance = (fromDate, uptoDate, selectedLocations) => {
        let filters = [
            [
                [["type", "anyof", "ExpRept", "VendCred", "VendPymt", "Custom108", "Journal", "Deposit"], "AND", [["accounttype", "anyof", "AcctPay"], "OR", ["account", "anyof", "2356"]]],
                "OR",
                [["type", "anyof", "VendBill", "VPrep"], "AND", ["mainline", "is", "T"]],
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

