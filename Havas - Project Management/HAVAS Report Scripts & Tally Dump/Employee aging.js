/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/format', 'N/log'],
    (ui, search, format, log) => {

        const onRequest = (scriptContext) => {

            const fmt = (v) => {
                if (v === null || v === undefined) return '';
                if (typeof v === 'number') return v.toFixed(2);
                if (v === '') return '';
                if (!isNaN(v)) return Number(v).toFixed(2);
                return String(v);
            };

            //---GET---
            if (scriptContext.request.method === 'GET') {
                try {
                    const form = ui.createForm({ title: 'Employee Aging Report' });
                    var employeeFilter = form.addField({ id: 'custpage_employee', type: ui.FieldType.SELECT, label: 'Employee', source: 'employee' });
                    employeeFilter.isMandatory = true;
                    // form.addField({ id: 'custpage_fromdate', type: ui.FieldType.DATE, label: 'From Date' });
                    form.addField({ id: 'custpage_todate', type: ui.FieldType.DATE, label: 'As Of Date' });
                    form.addSubmitButton({ label: 'Generate Report' }); scriptContext.response.writePage(form);
                    return;

                } catch (error) {
                    log.debug('Error in Get form', error)

                }
            }

            //---Post---
            else {
                try {
                    const req = scriptContext.request.parameters;
                    const employeeId = req.custpage_employee;
                    log.debug('Selected Employee ID:', employeeId);
                    // const fromDate = req.custpage_fromdate;
                    // log.debug('From Date:', fromDate);
                    const toDate = req.custpage_todate;
                    log.debug('To Date:', toDate);

                    const form = ui.createForm({ title: 'Employee Aging Report' });
                    form.clientScriptModulePath = "SuiteScripts/CS_EmployeeAgingReport.js";
                    form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
                    const empField = form.addField({ id: 'custpage_employee', type: ui.FieldType.SELECT, label: 'Employee', source: 'employee' }); 
                    empField.isMandatory = true;
                    empField.defaultValue = employeeId || '';
                    // const fromField = form.addField({ id: 'custpage_fromdate', type: ui.FieldType.DATE, label: 'From Date' }); fromField.defaultValue = fromDate || '';
                    const toField = form.addField({ id: 'custpage_todate', type: ui.FieldType.DATE, label: 'To Date' }); toField.defaultValue = toDate || '';
                    form.addSubmitButton({ label: 'Generate Report' });

                    // --- Sublist ---
                    const sublist = form.addSublist({ id: 'custpage_sublist', type: ui.SublistType.LIST, label: 'Outstanding Transactions' });
                    sublist.addField({ id: 'tranid', type: ui.FieldType.TEXT, label: 'Voucher Number' });
                    sublist.addField({ id: 'trandate', type: ui.FieldType.DATE, label: 'Date' });
                    sublist.addField({ id: 'trantype', type: ui.FieldType.TEXT, label: 'Type' });
                    sublist.addField({ id: 'employee', type: ui.FieldType.TEXT, label: 'Employee' });
                    sublist.addField({ id: 'debit', type: ui.FieldType.CURRENCY, label: 'Debit' });
                    sublist.addField({ id: 'credit', type: ui.FieldType.CURRENCY, label: 'Credit' });
                    sublist.addField({ id: 'duedate', type: ui.FieldType.DATE, label: 'Due On' });
                    sublist.addField({ id: 'overdue', type: ui.FieldType.INTEGER, label: 'Overdue By Days' });
                    const results = [];
                    var totalDebit = 0;
                    var totalCredit = 0;

                    // ---Expense Report Search ----
                    var expFilters = [['mainline', 'is', 'T'], "AND", ['reimbursableamount', 'greaterthan', 0],];
                    if (employeeId) {
                        expFilters.push("AND", ["entity", "anyof", employeeId],);
                    }
                    // if (fromDate) {
                    //     expFilters.push("AND", ["trandate", "onorafter", fromDate],);
                    // }
                    if (toDate) {
                        expFilters.push("AND", ["trandate", "onorbefore", toDate]);
                        expFilters.push("AND", [[["status", "noneof", "ExpRept:I"], "OR", [["status", "anyof", "ExpRept:I"], "AND", ["applyingtransaction.trandate", "after", toDate]]]]);
                    }

                    const expSearch = search.create({
                        type: 'expensereport',
                        filters: expFilters,
                        columns: ['tranid', 'trandate', 'entity', 'amount', 'memo', 'reimbursableamount', 'statusref']
                    });

                    expSearch.run().each(result => {
                        const reimbursable = parseFloat(result.getValue('reimbursableamount')) || 0;
                        totalCredit += reimbursable;

                        //Overdue calculation
                        let dueDateStr = result.getValue('trandate');
                        let overdueDays = '';

                        if (dueDateStr) {
                            const dueDate = format.parse({ value: dueDateStr, type: format.Type.DATE });
                            log.debug('Expense Report Due Date:', dueDate);
                            if (toDate) {
                                const toDateObj = format.parse({ value: toDate, type: format.Type.DATE });
                                const diffMs = toDateObj.getTime() - dueDate.getTime();
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                overdueDays = diffDays > 0 ? diffDays : 0;
                            } else {
                                overdueDays = '';
                            }

                            log.debug('Expense Report Overdue Days:', overdueDays);
                        }

                        results.push({
                            tranid: result.getValue('tranid'),
                            trandate: result.getValue('trandate'),
                            trantype: 'Expense Report',
                            employee: result.getText('entity'),
                            debit: '',
                            credit: reimbursable, // Expense report considered credit
                            memo: result.getValue('memo') || '',
                            status: result.getText('statusref') || '',
                            amount: result.getValue('amount'),
                            outstanding: result.getValue('reimbursableamount'),
                            duedate: dueDateStr,
                            overdue: overdueDays,
                        });
                        return true;
                    });
                    log.debug('Expense Report Results Count:', results.length);
                    log.debug('Expense Report Search Results:', results);


                    // ------Journal Entry Search------------
                    const jeFilters = [
                        ["type", "anyof", "Journal"],
                    ];

                    if (employeeId) {
                        jeFilters.push("AND", ["name", "anyof", employeeId],);
                    }
                    // if (fromDate) {
                    //     jeFilters.push("AND", ["trandate", "onorafter", fromDate],);
                    // }
                    if (toDate) {
                        jeFilters.push("AND", ["trandate", "onorbefore", toDate]);
                        jeFilters.push("AND", [["reversalnumber", "isempty", ""], "OR", ["reversaldate", "after", toDate]]);
                    }

                    const jeSearch = search.create({
                        type: 'journalentry',
                        filters: jeFilters,
                        columns: ["type", "tranid", "custbody_voucher_number", "trandate", "entity", "memo", "amount", "debitamount", "creditamount", "statusref"]
                    });
                    var searchResultCount = jeSearch.runPaged().count;
                    log.debug("result count", searchResultCount);

                    const jeResults = [];

                    jeSearch.run().each(result => {
                        const debit = parseFloat(result.getValue('debitamount')) || 0;
                        const credit = parseFloat(result.getValue('creditamount')) || 0;
                        const totalamount = parseFloat(result.getValue('amount')) || 0;
                        const amount = debit > 0 ? debit : credit;
                        totalDebit += debit;
                        totalCredit += credit;

                        //Overdue calculation
                        let dueDateStr = result.getValue('trandate');
                        let overdueDays = '';

                        if (dueDateStr) {
                            const dueDate = format.parse({ value: dueDateStr, type: format.Type.DATE });
                            log.debug('Journal Entry Due Date:', dueDate);

                            if (toDate) {
                                const toDateObj = format.parse({ value: toDate, type: format.Type.DATE });
                                const diffMs = toDateObj.getTime() - dueDate.getTime();
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                overdueDays = diffDays > 0 ? diffDays : 0;
                            } else {
                                overdueDays = '';
                            }

                            log.debug('Journal Entry Overdue Days:', overdueDays);
                        }


                        const obj = {
                            tranid: result.getValue('custbody_voucher_number'),
                            trandate: result.getValue('trandate'),
                            trantype: 'Journal Entry',
                            employee: result.getText('entity'),
                            debit: debit,
                            credit: credit,
                            duedate: dueDateStr || '',
                            overdue: overdueDays,
                            amount: totalamount,
                            outstanding: amount,
                            memo: result.getValue('memo') || '',
                            status: result.getText('statusref') || ''
                        };
                        results.push(obj);
                        jeResults.push(obj);

                        return true;
                    });
                    log.debug('Journal Entry Results Count:', jeResults.length);
                    log.debug('Journal Entry Results:', jeResults);

                    // --------Check search--------
                    var checkfilter = [];
                    var filter1 = [["type", "anyof", "Check"], "AND", ["mainline", "is", "T"], "AND", ["posting", "is", "T"]];
                    var filter2 = ["OR", ["type", "anyof", "ExpRept"], "AND", ["advance", "greaterthan", "0"], "AND", ["advanceaccount", "anyof", "1454"], "AND", ["mainline", "is", "T"], "AND", ["posting", "is", "T"]];
                    if (employeeId) {
                        filter1.push('AND', ['mainname', 'anyof', employeeId],);
                        filter2.push('AND', ['mainname', 'anyof', employeeId],);
                    }
                    if (toDate) {
                        filter1.push('AND', ['trandate', 'onorbefore', toDate]);
                        filter2.push('AND', ['trandate', 'onorbefore', toDate]);
                    }
                    checkfilter.push(...filter1, ...filter2)

                    const searchObj = search.create({
                        type: 'transaction',
                        filters: checkfilter,
                        columns: [
                            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE  WHEN {type} = 'Check' THEN NVL(ABS({amount}), 0) ELSE 0 END", label: "Total Check" }),
                            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Expense Report' THEN NVL(ABS({advance}), 0)   ELSE 0 END", label: "Total Expense" })
                        ]
                    });

                    const result = searchObj.run().getRange({ start: 0, end: 1 });
                    log.debug('Check/Expense Report Search Result:', result);
                    searchResullt = JSON.parse(JSON.stringify(result[0]));
                    var check = searchResullt.values["SUM(formulanumeric)"];
                    var expenseReport = searchResullt.values["SUM(formulanumeric)_1"];
                    log.debug(' check  , expense report ', check + ' , ' + expenseReport)
                    var outstandingCheckTotal = 0;
                    check > expenseReport ? outstandingCheckTotal = check - expenseReport : null;
                    log.debug('Outstanding Check Amount (Checks - Advances)', outstandingCheckTotal);

                    const outstandingCheckTotalNum = parseFloat(outstandingCheckTotal) || 0;
                    if (outstandingCheckTotal > 0) {
                        results.push({
                            tranid: '',
                            trandate: '',
                            trantype: 'Check',
                            employee: '',
                            debit: outstandingCheckTotalNum,
                            credit: '',
                            memo: 'Outstanding check balance',
                            duedate: '',
                            overdue: '',

                        });
                        totalDebit += outstandingCheckTotalNum;
                        log.debug('Total Debit after adding outstanding checks:', totalDebit);
                    }

                    for (let i = 0; i < results.length; i++) {
                        const line = results[i];
                        try {
                            const v_debit = fmt(line.debit !== undefined && line.debit !== '' ? Number(line.debit) : '');
                            const v_credit = fmt(line.credit !== undefined && line.credit !== '' ? Number(line.credit) : '');
                            if (line.tranid) sublist.setSublistValue({ id: 'tranid', line: i, value: String(line.tranid) });
                            if (line.trandate) sublist.setSublistValue({ id: 'trandate', line: i, value: line.trandate });
                            sublist.setSublistValue({ id: 'trantype', line: i, value: line.trantype || '' });
                            if (line.employee) sublist.setSublistValue({ id: 'employee', line: i, value: line.employee });
                            if (v_debit !== '') sublist.setSublistValue({ id: 'debit', line: i, value: v_debit });
                            if (v_credit !== '') sublist.setSublistValue({ id: 'credit', line: i, value: v_credit });
                            if (line.duedate) sublist.setSublistValue({ id: 'duedate', line: i, value: line.duedate });
                            if (line.overdue !== '') sublist.setSublistValue({ id: 'overdue', line: i, value: String(line.overdue) });
                        } catch (e) {
                            log.error('Error setting sublist line', { lineIndex: i, error: e, lineData: line });
                        }
                    }

                    // Total lines show
                    try {
                        var totalLine = results.length;
                        sublist.setSublistValue({ id: 'tranid', line: totalLine, value: '<b>Total</b>' });
                        sublist.setSublistValue({ id: 'debit', line: totalLine, value: fmt(totalDebit) });
                        sublist.setSublistValue({ id: 'credit', line: totalLine, value: fmt(totalCredit) });
                        // Total outstanding
                        var overallOutstanding = totalDebit - totalCredit;
                        sublist.setSublistValue({ id: 'tranid', line: totalLine + 1, value: '<b>Total Outstanding</b>' });
                        if (overallOutstanding >= 0) {
                            sublist.setSublistValue({ id: 'debit', line: totalLine + 1, value: fmt(overallOutstanding) });
                        } else {
                            sublist.setSublistValue({ id: 'credit', line: totalLine + 1, value: fmt(-overallOutstanding) });
                        }
                    } catch (e) {
                        log.error('Error adding total lines', e);
                    }


                    scriptContext.response.writePage(form);

                } catch (error) {
                    log.debug('Error in Post form', error)

                }

            }
        };

        return { onRequest };
    });
