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
                let selectedAccounts = params.custpage_account;
                let form = generateReports(fromDate, uptoDate, selectedAccounts);
                scriptContext.response.writePage(form);
            }
        } catch (error) {
            log.debug("Error", error);
        }
    };

    let generateRequestForm = () => {
        let form = serverWidget.createForm({ title: "COGS GL Head Report" });
        form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_account", label: "Select GL", type: serverWidget.FieldType.SELECT, source: "account" }).isMandatory = true;
        form.addSubmitButton({ label: "Generate Report" });
        return form;
    };

    let generateReports = (fromDate, uptoDate, selectedAccounts) => {
        let form = serverWidget.createForm({ title: `COGS GL Head Report [ ${fromDate} to ${uptoDate} ]` });
        let sublist = form.addSublist({ id: "transaction_sublist", type: serverWidget.SublistType.LIST, label: "Report" });
        let accountArray = [];
        let transactionMap = {};

        let vendorInvoice = getVendorInvoice(fromDate, uptoDate, selectedAccounts);
        log.debug('vendorInvoice', vendorInvoice.length)
        if (vendorInvoice.length > 0) {
            vendorInvoice.forEach(transactionLine => {
                let transactionType = _validation(transactionLine.getText({ name: "type", label: "Type" })) ? transactionLine.getText({ name: "type", label: "Type" }) : 'NONE';
                let transactionDate = _validation(transactionLine.getValue({ name: "trandate", label: "Date" })) ? transactionLine.getValue({ name: "trandate", label: "Date" }) : 'NONE';
                let voucherNumber = _validation(transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" })) ? transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" }) : 'NONE';
                let vendorName = _validation(transactionLine.getText({ name: "mainname", label: "Vendor/Customer" })) ? transactionLine.getText({ name: "mainname", label: "Vendor/Customer" }) : 'NONE';
                let accountName = _validation(transactionLine.getText({ name: "account", label: "Account" })) ? transactionLine.getText({ name: "account", label: "Account" }) : 'NONE';
                let transactionAmount = _validation(transactionLine.getValue({ name: "amount", label: "Amount" })) ? transactionLine.getValue({ name: "amount", label: "Amount" }) : 'NONE';
                let projectCode = _validation(JSON.parse(JSON.stringify(transactionLine)).values["formulatext"]) ? JSON.parse(JSON.stringify(transactionLine)).values["formulatext"] : 'NONE';
                transactionMap[voucherNumber] = { type: transactionType, date: transactionDate, vendor: vendorName, account: accountName, amount: transactionAmount, project: projectCode };
                log.debug('transactionMap', transactionMap)
            });
        }

        let expenseReport = getExpenseReport(fromDate, uptoDate, selectedAccounts);
        log.debug('expenseReport', expenseReport.length)
        if (expenseReport.length > 0) {
            expenseReport.forEach(transactionLine => {
                let transactionType = _validation(transactionLine.getText({ name: "type", label: "Type" })) ? transactionLine.getText({ name: "type", label: "Type" }) : 'NONE';
                let transactionDate = _validation(transactionLine.getValue({ name: "trandate", label: "Date" })) ? transactionLine.getValue({ name: "trandate", label: "Date" }) : 'NONE';
                let voucherNumber = _validation(transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" })) ? transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" }) : 'NONE';
                let vendorName = _validation(transactionLine.getText({ name: "mainname", label: "Vendor/Customer" })) ? transactionLine.getText({ name: "mainname", label: "Vendor/Customer" }) : 'NONE';
                let accountName = _validation(transactionLine.getText({ name: "account", label: "Account" })) ? transactionLine.getText({ name: "account", label: "Account" }) : 'NONE';
                let transactionAmount = _validation(transactionLine.getValue({ name: "amount", label: "Amount" })) ? transactionLine.getValue({ name: "amount", label: "Amount" }) : 'NONE';
                let projectCode = _validation(JSON.parse(JSON.stringify(transactionLine)).values["formulatext"]) ? JSON.parse(JSON.stringify(transactionLine)).values["formulatext"] : 'NONE';
                transactionMap[voucherNumber] = { type: transactionType, date: transactionDate, vendor: vendorName, account: accountName, amount: transactionAmount, project: projectCode };
                log.debug('transactionMap', transactionMap)
            });
        }


        sublist.addField({ id: "custpage_type", type: serverWidget.FieldType.TEXT, label: "Type" });
        sublist.addField({ id: "custpage_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sublist.addField({ id: "custpage_voucher_number", type: serverWidget.FieldType.TEXT, label: "Voucher Number" });
        sublist.addField({ id: "custpage_project_code", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sublist.addField({ id: "custpage_entity", type: serverWidget.FieldType.TEXT, label: "Vendor / Employee" });
        sublist.addField({ id: "custpage_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sublist.addField({ id: "custpage_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });

        let transactionLines = Object.entries(transactionMap);

        if (transactionLines.length > 0) {
            for (let count = 0; count < transactionLines.length; count++) {
                let [voucherNumber, transactionDetails] = transactionLines[count];
                sublist.setSublistValue({ id: "custpage_type", line: count, value: transactionDetails.type.toString() });
                sublist.setSublistValue({ id: "custpage_date", line: count, value: transactionDetails.date });
                sublist.setSublistValue({ id: "custpage_voucher_number", line: count, value: voucherNumber });
                sublist.setSublistValue({ id: "custpage_project_code", line: count, value: transactionDetails.project.toString() });
                sublist.setSublistValue({ id: "custpage_entity", line: count, value: transactionDetails.vendor.toString() });
                sublist.setSublistValue({ id: "custpage_account", line: count, value: transactionDetails.account.toString() });
                sublist.setSublistValue({ id: "custpage_amount", line: count, value: parseFloat(transactionDetails.amount).toFixed(2).toString() });

            }
        }

        return form;
    };

    let getVendorInvoice = (fromDate, uptoDate, selectedAccounts) => {

        let filters = [["taxline", "is", "F"], "AND", ["customgl", "is", "F"], "AND", ["mainline", "is", "F"], "AND", ["type", "anyof", "VendBill"], "AND", ["trandate", "within", fromDate, uptoDate]];
        if (selectedAccounts && selectedAccounts !== "" && selectedAccounts !== "\u0005") {
            let selectedAccountsArray = selectedAccounts.split("\u0005").filter(Boolean);
            if (selectedAccountsArray.length > 0) {
                filters.push("AND", [["account.parent", "anyof", selectedAccountsArray], "OR", ["account", "anyof", selectedAccountsArray]]);
            }
        }
        let vendorbillSearchObj = search.create({
            type: "vendorbill",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: filters,
            columns:
                [
                    search.createColumn({ name: "type", label: "Type" }),
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                    search.createColumn({ name: "mainname", label: "Vendor/Customer" }),
                    search.createColumn({ name: "account", label: "Account" }),
                    search.createColumn({ name: "amount", label: "Amount" }),
                    search.createColumn({ name: "formulatext", formula: "CASE    WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1)  ELSE {job.entityid} END", label: "Project Code" }),

                ]
        });
        return getAllResult(vendorbillSearchObj);
    };

    let getExpenseReport = (fromDate, uptoDate, selectedAccounts) => {

        let filters = [["taxline", "is", "F"], "AND", ["customgl", "is", "F"], "AND", ["mainline", "is", "F"], "AND", ["type", "anyof", "ExpRept"], "AND", ["trandate", "within", fromDate, uptoDate]];
        if (selectedAccounts && selectedAccounts !== "" && selectedAccounts !== "\u0005") {
            let selectedAccountsArray = selectedAccounts.split("\u0005").filter(Boolean);
            if (selectedAccountsArray.length > 0) {
                filters.push("AND", [["account.parent", "anyof", selectedAccountsArray], "OR", ["account", "anyof", selectedAccountsArray]]);
            }
        }
        let expensereportSearchObj = search.create({
            type: "expensereport",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: filters,
            columns:
                [
                    search.createColumn({ name: "type", label: "Type" }),
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                    search.createColumn({ name: "mainname", label: "Vendor/Customer" }),
                    search.createColumn({ name: "account", label: "Account" }),
                    search.createColumn({ name: "amount", label: "Amount" }),
                    search.createColumn({ name: "formulatext", formula: "CASE    WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1)  ELSE {job.entityid} END", label: "Project Code" }),

                ]
        });
        return getAllResult(expensereportSearchObj);
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

    let _validation = (value) => {
        if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "- None -" && value != "NaN") { return true }
        else { return false }
    }

    return { onRequest };
});
