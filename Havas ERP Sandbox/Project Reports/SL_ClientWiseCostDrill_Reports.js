/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search", "N/url"], (serverWidget, search, url) => {
    let onRequest = scriptContext => {
        try {
            if (scriptContext.request.method === "GET") {
                let params = scriptContext.request.parameters;
                let projectCode = params.projectCode;
                let fromDate = params.startDate;
                let uptoDate = params.endDate;
                let selectedLocation = params.location;
                let selectedDepartment = params.department;
                let form = generateDrillDown(projectCode, fromDate, uptoDate, selectedLocation, selectedDepartment);
                scriptContext.response.writePage(form);
            }
            else {
                let params = scriptContext.request.parameters || {};
                let drillFromDate = params.custpage_selected_fromdate;
                let drillToDate = params.custpage_selected_todate;
                let selectedVoucher = params.custpage_selectedvoucher_no;
                let selectedAccount = params.custpage_selectedaccount;
                let selectedType = params.custpage_selectedrecord_type;
                let selectedProject = params.custpage_project_code;
                let selectedFromDate = params.custpage_from_date;
                let selectedUptoDate = params.custpage_upto_date;
                let selectedLocation = params.custpage_location;
                let selectedDepartment = params.custpage_department;
                log.debug("Params", drillFromDate + ' ' + drillToDate); log.debug("Params", selectedVoucher); log.debug("Params", selectedAccount); log.debug("Params", selectedType); log.debug("Params", selectedProject); log.debug("Params", selectedFromDate); log.debug("Params", selectedUptoDate); log.debug("Params", selectedLocation); log.debug("Params", selectedDepartment);
                let form = generateDrillDown(selectedProject, selectedFromDate, selectedUptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType);
                scriptContext.response.writePage(form);
            }
        } catch (error) {
            log.debug("Error", error);
        }
    };

    let generateRequestForm = (projectCode, fromDate, uptoDate, selectedLocation, selectedDepartment, selectedFromDate, selectedToDate, selectedVoucher, selectedAccount, selectedType) => {
        let recordTypeObj = { 'Credit Memo': 'CustCred', 'TDS Transaction': 'Custom108', 'Vendor Invoice': 'VendBill', 'Vendor Prepayment': 'VPrep', 'Expense Report': 'ExpRept', 'Customer Deposite': 'CustDep', 'Customer Invoice': 'CustInvc', 'Bill Credit': 'VendCred', 'Journal': 'Journal' }
        let form = _logValidation(fromDate) && _logValidation(uptoDate) ? serverWidget.createForm({ title: `Clientwise Cost Report [ ${fromDate} to ${uptoDate} ]` }) : serverWidget.createForm({ title: "Clientwise Cost Report" });
        let recordType = form.addField({ id: "custpage_selectedrecord_type", label: "Voucher Type", type: serverWidget.FieldType.SELECT });
        recordType.addSelectOption({ value: '', text: '' });
        Object.entries(recordTypeObj).forEach(([recordkey, recordvalue]) => { recordType.addSelectOption({ value: recordvalue, text: recordkey }) });
        if (selectedType) recordType.defaultValue = selectedType || "";
        let drillFromDate = form.addField({ id: "custpage_selected_fromdate", label: "From Date", type: serverWidget.FieldType.DATE, }); if (selectedFromDate) drillFromDate.defaultValue = selectedFromDate || "";
        let drillToDate = form.addField({ id: "custpage_selected_todate", label: "To Date", type: serverWidget.FieldType.DATE, }); if (selectedToDate) drillToDate.defaultValue = selectedToDate || "";
        let voucherNo = form.addField({ id: "custpage_selectedvoucher_no", label: "Voucher No", type: serverWidget.FieldType.TEXT }); if (selectedVoucher) voucherNo.defaultValue = selectedVoucher || "";
        let account = form.addField({ id: "custpage_selectedaccount", label: "Expense GL", type: serverWidget.FieldType.SELECT, source: "account" }); if (selectedAccount) account.defaultValue = selectedAccount || "";
        let projectcode = form.addField({ id: "custpage_project_code", label: "Project Code", type: serverWidget.FieldType.TEXT }); if (projectCode) projectcode.defaultValue = projectCode || "";
        projectcode.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); if (projectCode) projectcode.defaultValue = projectCode || "";
        let startDate = form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE });
        startDate.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); if (fromDate) startDate.defaultValue = fromDate || "";
        let endDate = form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE });
        endDate.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); if (uptoDate) endDate.defaultValue = uptoDate || "";
        let location = form.addField({ id: "custpage_location", label: "Location", type: serverWidget.FieldType.TEXT });
        location.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); if (selectedLocation) location.defaultValue = selectedLocation || "";
        let department = form.addField({ id: "custpage_department", label: "End / Upto Date", type: serverWidget.FieldType.TEXT });
        department.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); if (selectedDepartment) department.defaultValue = selectedDepartment || "";
        form.addSubmitButton({ label: "Filter" });
        return form;
    };


    let generateDrillDown = (projectCode, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType) => {
        let form = generateRequestForm(projectCode, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType);
        form.clientScriptModulePath = "SuiteScripts/CS_ClientwiseCostDrilldownReport.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: `${projectCode}` });
        sublist.addField({ id: "custpage_record_type", type: serverWidget.FieldType.TEXT, label: "Voucher" });
        sublist.addField({ id: "custpage_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sublist.addField({ id: "custpage_voucher_number", type: serverWidget.FieldType.TEXT, label: "Voucher Number" });
        sublist.addField({ id: "custpage_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sublist.addField({ id: "custpage_debit", type: serverWidget.FieldType.TEXT, label: "Debit" });
        sublist.addField({ id: "custpage_credit", type: serverWidget.FieldType.TEXT, label: "Credit" });
        let projectId = getprojectId(projectCode);
        if (_logValidation(projectId)) {
            let lineNo = 0; let totalDebit = 0; let totalCredit = 0; let resultMap = []; let debitMap; let creditMap; let delgatesMap; let count = 0;
            let debitArray = getDebit(projectId, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType);
            if (debitArray != null) {
                debitMap = debitArray.map(transactionLine => ({
                    recordType: transactionLine.getValue({ name: "recordtype", label: "Record Type" }) || null,
                    recordId: transactionLine.getValue({ name: "internalid", label: "Internal ID" }) || null,
                    type: transactionLine.getText({ name: "type", label: "Type" }) || null,
                    date: transactionLine.getValue({ name: "trandate", label: "Date" }) || null,
                    voucherNo: transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" }) || null,
                    account: transactionLine.getText({ name: "account", label: "Account" }) || null,
                    creditAmount: transactionLine.getValue({ name: "creditamount", label: "Amount (Credit)" }) || 0,
                    debiAmount: transactionLine.getValue({ name: "debitamount", label: "Amount (Debit)" }) || 0,
                }));
                log.debug('resultMap 1 ', debitMap.length);
            }
            let creditArray = getCredit(projectId, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType);
            if (creditArray != null) {

                creditMap = creditArray.map(transactionLine => ({
                    recordType: transactionLine.getValue({ name: "recordtype", label: "Record Type" }) || null,
                    recordId: transactionLine.getValue({ name: "internalid", label: "Internal ID" }) || null,
                    type: transactionLine.getText({ name: "type", label: "Type" }) || null,
                    date: transactionLine.getValue({ name: "trandate", label: "Date" }) || null,
                    voucherNo: transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" }) || null,
                    account: transactionLine.getText({ name: "account", label: "Account" }) || null,
                    creditAmount: transactionLine.getValue({ name: "creditamount", label: "Amount (Credit)" }) || 0,
                    debiAmount: transactionLine.getValue({ name: "debitamount", label: "Amount (Debit)" }) || 0,
                }));
                log.debug('resultMap 2 ', creditMap.length);
            }

            let delegatesArray = getDelgatesSbCn(projectCode, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType);

            if (delegatesArray != null) {
                delgatesMap = delegatesArray.map(transactionLine => ({
                    recordType: transactionLine.getValue({ name: "recordtype", label: "Record Type" }) || null,
                    recordId: transactionLine.getValue({ name: "internalid", label: "Internal ID" }) || null,
                    type: transactionLine.getText({ name: "type", label: "Type" }) || null,
                    date: transactionLine.getValue({ name: "trandate", label: "Date" }) || null,
                    voucherNo: transactionLine.getValue({ name: "custbody_voucher_number", label: "Voucher Number" }) || null,
                    account: transactionLine.getText({ name: "account", label: "Account" }) || null,
                    creditAmount: transactionLine.getText({ name: "type", label: "Type" }) == 'Credit Memo' ? 0 : transactionLine.getValue({ name: "amount", label: "Amount" }),
                    debiAmount: transactionLine.getText({ name: "type", label: "Type" }) == 'Credit Memo' ? transactionLine.getValue({ name: "amount", label: "Amount" }) : 0,
                }));
                log.debug('resultMap 3 ', delgatesMap.length);
            }

            if (debitArray != null) resultMap.push(...debitMap);
            if (creditArray != null) resultMap.push(...creditMap);
            if (delegatesArray != null) resultMap.push(...delgatesMap);
            log.debug('resultMap 4', resultMap.length)

            let orderedCheckData = sortByTransactionDate(resultMap);
            log.debug('orderedCheckData', orderedCheckData)
            log.debug('orderedCheckData length', orderedCheckData.length)

            orderedCheckData.forEach(transactionLine => {
                let accountDomain = 'https://9370186.app.netsuite.com';
                let transactionUrl = url.resolveRecord({ recordType: transactionLine.recordType, recordId: transactionLine.recordId, isEditMode: false });
                sublist.setSublistValue({ id: "custpage_record_type", line: lineNo, value: _logValidation(transactionLine.type) ? '<a href =' + accountDomain + transactionUrl + ' target = "_blank" >' + transactionLine.type + '</a>' : null });
                sublist.setSublistValue({ id: "custpage_voucher_number", line: lineNo, value: _logValidation(transactionLine.voucherNo) ? transactionLine.voucherNo : null });
                sublist.setSublistValue({ id: "custpage_date", line: lineNo, value: _logValidation(transactionLine.date) ? transactionLine.date : null });
                sublist.setSublistValue({ id: "custpage_account", line: lineNo, value: _logValidation(transactionLine.account) ? transactionLine.account : null });
                sublist.setSublistValue({ id: "custpage_credit", line: lineNo, value: _logValidation(transactionLine.creditAmount) ? formatAmount(transactionLine.creditAmount) : 0 });
                sublist.setSublistValue({ id: "custpage_debit", line: lineNo, value: _logValidation(transactionLine.debiAmount) ? formatAmount(transactionLine.debiAmount) : 0 });
                lineNo += 1;
                totalCredit += Math.abs(parseFloat(transactionLine.creditAmount));
                totalDebit += Math.abs(parseFloat(transactionLine.debiAmount));
            })
            sublist.setSublistValue({ id: "custpage_record_type", line: lineNo, value: "<b>Total</b>" });
            sublist.setSublistValue({ id: "custpage_voucher_number", line: lineNo, value: null });
            sublist.setSublistValue({ id: "custpage_account", line: lineNo, value: null });
            sublist.setSublistValue({ id: "custpage_credit", line: lineNo, value: "<b>" + formatAmount(totalCredit) + "</b>" });
            sublist.setSublistValue({ id: "custpage_debit", line: lineNo, value: "<b>" + formatAmount(totalDebit) + "</b>" });
        }
        else {
            log.debug('Error :', 'Project Id not found')
        }
        return form;
    }

    let _logValidation = (value) => {
        return !(value == null || value === "" || value === "null" || value === undefined || value === "undefined" || value === "@NONE@" || value === "NaN");
    };

    let getprojectId = (projectCode) => {
        var jobSearchObj = search.create({
            type: "job",
            filters: [["entityid", "contains", projectCode]],
            columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
        });
        var searchResultCount = jobSearchObj.runPaged().count;
        if (searchResultCount > 0) {
            let searchResult = jobSearchObj.run().getRange(0, 1);
            return searchResult[0].getValue({ name: "internalid", label: "Internal ID" });
        } else {
            return null;
        }

    }
    let sortByTransactionDate = (data) => {
        return data.sort((a, b) => {
            const dateA = new Date(a.date.split("/").reverse().join("-"));
            const dateB = new Date(b.date.split("/").reverse().join("-"));
            return dateA - dateB; // ascending order
        });
    };

    let getDebit = (projectId, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType) => {

        let filter1 = [["type", "anyof", "CustCred", "VendPymt", "Custom108", "VendBill", "VPrep", "ExpRept"], "AND", ["mainline", "any", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"], "AND", ["voided", "is", "F"], "AND", ["job.internalidnumber", "equalto", projectId]];
        let filter2 = ["OR", ["type", "anyof", "Journal"], "AND", ["debitamount", "isnotempty", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"], "AND", ["voided", "is", "F"], "AND", ["account.type", "anyof", "AcctPay", "AcctRec", "Income", "COGS"], "AND", ["job.internalidnumber", "equalto", projectId]];
        if (_logValidation(selectedLocation)) { filter1.push("AND", ["location", "anyof", selectedLocation]); filter2.push("AND", ["location", "anyof", selectedLocation]); }
        if (_logValidation(selectedDepartment)) { filter1.push("AND", ["department", "anyof", selectedDepartment]); filter2.push("AND", ["department", "anyof", selectedDepartment]); }
        if (_logValidation(drillFromDate)) { filter1.push("AND", ["trandate", "onorafter", drillFromDate]); filter2.push("AND", ["trandate", "onorafter", drillFromDate]); }
        if (_logValidation(drillToDate)) { filter1.push("AND", ["trandate", "onorbefore", drillToDate]); filter2.push("AND", ["trandate", "onorbefore", drillToDate]); }
        if (_logValidation(selectedVoucher)) { filter1.push("AND", ["custbody_voucher_number", "is", selectedVoucher]); filter2.push("AND", ["custbody_voucher_number", "is", selectedVoucher]); }
        if (_logValidation(selectedAccount)) { filter1.push("AND", ["account", "anyof", selectedAccount]); filter2.push("AND", ["account", "anyof", selectedAccount]); }
        if (_logValidation(selectedType)) { filter1.push("AND", ["type", "anyof", selectedType]); filter2.push("AND", ["type", "anyof", selectedType]); }
        let filter = [];
        filter.push(...filter1, ...filter2, "AND", ["job.entityid", "isnotempty", ""], "AND", ["job.customer", "noneof", "@NONE@"]);
        let transactionSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filter,
            columns: [
                search.createColumn({ name: "type", label: "Type" }),
                search.createColumn({ name: "recordtype", label: "Record Type" }),
                search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                search.createColumn({ name: "account", label: "Account" }),
                search.createColumn({ name: "mainname", label: "Main Line Name" }),
                search.createColumn({ name: "internalid", label: "Internal ID" }),
                search.createColumn({ name: "trandate", label: "Date" }),
                search.createColumn({ name: "creditamount", label: "Amount (Credit)" }),
                search.createColumn({ name: "debitamount", label: "Amount (Debit)" })
            ],
        });
        var searchResultCount = transactionSearchObj.runPaged().count;
        log.debug('debit length', searchResultCount);
        return searchResultCount > 0 ? getAllResult(transactionSearchObj) : null;
    };

    let getCredit = (projectId, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType) => {

        let filter1 = [["type", "anyof", "CustDep", "CustInvc", "VendCred", "CustPymt"], "AND", ["mainline", "any", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"], "AND", ["voided", "is", "F"], "AND", ["job.internalidnumber", "equalto", projectId]];
        let filter2 = ["OR", ["type", "anyof", "Journal"], "AND", ["creditamount", "isnotempty", ""], "AND", ["trandate", "within", fromDate, uptoDate], "AND", ["posting", "is", "T"], "AND", ["voided", "is", "F"], "AND", ["account.type", "anyof", "AcctPay", "AcctRec", "Income", "COGS"], "AND", ["job.internalidnumber", "equalto", projectId]];
        if (_logValidation(selectedLocation)) { filter1.push("AND", ["location", "anyof", selectedLocation]); filter2.push("AND", ["location", "anyof", selectedLocation]); }
        if (_logValidation(selectedDepartment)) { filter1.push("AND", ["department", "anyof", selectedDepartment]); filter2.push("AND", ["department", "anyof", selectedDepartment]); }
        if (_logValidation(drillFromDate)) { filter1.push("AND", ["trandate", "onorafter", drillFromDate]); filter2.push("AND", ["trandate", "onorafter", drillFromDate]); }
        if (_logValidation(drillToDate)) { filter1.push("AND", ["trandate", "onorbefore", drillToDate]); filter2.push("AND", ["trandate", "onorbefore", drillToDate]); }
        if (_logValidation(selectedVoucher)) { filter1.push("AND", ["custbody_voucher_number", "is", selectedVoucher]); filter2.push("AND", ["custbody_voucher_number", "is", selectedVoucher]); }
        if (_logValidation(selectedAccount)) { filter1.push("AND", ["account", "anyof", selectedAccount]); filter2.push("AND", ["account", "anyof", selectedAccount]); }
        if (_logValidation(selectedType)) { filter1.push("AND", ["type", "anyof", selectedType]); filter2.push("AND", ["type", "anyof", selectedType]); }
        let filter = [];
        filter.push(...filter1, ...filter2, "AND", ["job.entityid", "isnotempty", ""], "AND", ["job.customer", "noneof", "@NONE@"]);

        let transactionSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filter,
            columns: [
                search.createColumn({ name: "type", label: "Type" }),
                search.createColumn({ name: "recordtype", label: "Record Type" }),
                search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                search.createColumn({ name: "account", label: "Account" }),
                search.createColumn({ name: "mainname", label: "Main Line Name" }),
                search.createColumn({ name: "internalid", label: "Internal ID" }),
                search.createColumn({ name: "trandate", label: "Date" }),
                search.createColumn({ name: "creditamount", label: "Amount (Credit)" }),
                search.createColumn({ name: "debitamount", label: "Amount (Debit)" })
            ],
        });
        var searchResultCount = transactionSearchObj.runPaged().count;
        log.debug('credit length', searchResultCount);
        return searchResultCount > 0 ? getAllResult(transactionSearchObj) : null;
    };

    let getDelgatesSbCn = (projectCode, fromDate, uptoDate, selectedLocation, selectedDepartment, drillFromDate, drillToDate, selectedVoucher, selectedAccount, selectedType) => {
        let filter = [["job.internalidnumber", "isempty", ""], "AND", ["type", "anyof", "CustInvc", "CustCred"], "AND", ["formulatext: {cseg_ags_project_co}", "contains", projectCode],
            "AND", ["mainline", "is", "F"], "AND", ["taxline", "is", "F"], "AND", ["voided", "is", "F"], "AND", ["trandate", "within", fromDate, uptoDate]];
        if (_logValidation(selectedLocation)) filter.push("AND", ["location", "anyof", selectedLocation]);
        if (_logValidation(selectedDepartment)) filter.push("AND", ["department", "anyof", selectedDepartment]);
        if (_logValidation(drillFromDate)) { filter.push("AND", ["trandate", "onorafter", drillFromDate]) }
        if (_logValidation(drillToDate)) { filter.push("AND", ["trandate", "onorbefore", drillToDate]) }
        if (_logValidation(selectedVoucher)) { filter.push("AND", ["custbody_voucher_number", "is", selectedVoucher]) }
        if (_logValidation(selectedAccount)) { filter.push("AND", ["account", "anyof", selectedAccount]) }
        if (_logValidation(selectedType)) { filter.push("AND", ["type", "anyof", selectedType]) }
        var delegatesSearchObj = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: filter,
            columns:
                [
                    search.createColumn({ name: "type", label: "Type" }),
                    search.createColumn({ name: "recordtype", label: "Record Type" }),
                    search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                    search.createColumn({ name: "mainname", label: "Main Line Name" }),
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "account", label: "Account" }),
                    search.createColumn({ name: "amount", label: "Amount" }),
                ]
        });
        var searchResultCount = delegatesSearchObj.runPaged().count;
        log.debug('delgates length', searchResultCount);
        return searchResultCount > 0 ? getAllResult(delegatesSearchObj) : null;
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
    let toNum = (n) => {
        const v = parseFloat(n);
        if (!isFinite(v)) return "0.00";
        return Math.abs(v).toFixed(2);
    }

    let formatAmount = (amount) => {
        const formatter = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return formatter.format(toNum(amount));
    };

    return { onRequest };
});
