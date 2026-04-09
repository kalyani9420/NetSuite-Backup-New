/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search"], (ui, search) => {
    function onRequest(context) {

        const request = context.request;
        const response = context.response;

        const form = ui.createForm({
            title: "PO vs PB and Expense Report",
        });

        form.clientScriptFileId = 10762;

        form.addSubmitButton({
            label: "Generate Report",
        });

        const projectFilter = form.addField({
            id: "custpage_project_filter",
            type: ui.FieldType.SELECT,
            label: "Select Project",
            source: "job",
        });
        projectFilter.isMandatory = true;

        // PO vs PB sublist
        const sublist = form.addSublist({
            id: "custpage_report_sublist",
            type: ui.SublistType.LIST,
            label: "PO vs PB Report Data",
        });

        // Add from date field
        const fromDateField = form.addField({
            id: "custpage_from_date",
            type: ui.FieldType.DATE,
            label: "From Date",
        });

        // Add to date field
        const toDateField = form.addField({
            id: "custpage_to_date",
            type: ui.FieldType.DATE,
            label: "To Date",
        });


        // Columns for PO vs PB
        sublist.addField({ id: "profit_center", label: "Profit Center", type: ui.FieldType.TEXT });
        sublist.addField({ id: "budgeted_amount", label: "Budgeted Amount", type: ui.FieldType.CURRENCY });

        sublist.addField({ id: "po_number", label: "PO Number", type: ui.FieldType.TEXT });
        sublist.addField({ id: "vendor", label: "Vendor", type: ui.FieldType.TEXT });
        sublist.addField({ id: "po_amount", label: "PO Amount", type: ui.FieldType.CURRENCY });
        sublist.addField({ id: "po_to_be_booked", label: "PO to be Booked", type: ui.FieldType.CURRENCY });
        sublist.addField({ id: "purchase_bill_no", label: "Purchase Bill No.", type: ui.FieldType.TEXT });
        sublist.addField({ id: "location", label: "Period", type: ui.FieldType.TEXT });
        sublist.addField({ id: "year", label: "Year", type: ui.FieldType.TEXT });
        sublist.addField({ id: "pb_amount", label: "PB Amount", type: ui.FieldType.CURRENCY });
        sublist.addField({ id: "tds_amount", label: "TDS Amount", type: ui.FieldType.CURRENCY });
        sublist.addField({ id: "dn_voucher_no", label: "DN Voucher No.", type: ui.FieldType.TEXT });
        sublist.addField({ id: "dn_amount", label: "DN Amount", type: ui.FieldType.CURRENCY });
        sublist.addField({ id: "pb_dn", label: "PB - DN", type: ui.FieldType.CURRENCY });
        sublist.addField({ id: "bill_to_be_booked", label: "Bill to be Booked", type: ui.FieldType.CURRENCY });

        // Expense Sublist
        const expenseSublist = form.addSublist({
            id: 'custpage_expense_sublist',
            type: ui.SublistType.LIST,
            label: 'Expense Report Data'
        });

        // Columns for Employee Expense
        expenseSublist.addField({ id: 'project_name', label: 'Project Name', type: ui.FieldType.TEXT });
        expenseSublist.addField({ id: 'project_budget_amount', label: 'Project Budget Amount', type: ui.FieldType.CURRENCY });
        expenseSublist.addField({ id: 'expense_voucher_no', label: 'Expense Voucher No', type: ui.FieldType.TEXT });
        expenseSublist.addField({ id: 'employee_name', label: 'Employee Name', type: ui.FieldType.TEXT });
        expenseSublist.addField({ id: 'expense_amount', label: 'Expense Amount', type: ui.FieldType.CURRENCY });


        // POST block for adding search results
        if (context.request.method === "POST") {
            const selectedProjectId = context.request.parameters.custpage_project_filter;
            const fromDate = context.request.parameters.custpage_from_date;
            const toDate = context.request.parameters.custpage_to_date;

            //log.debug("Selected Project", selectedProjectId);
            projectFilter.defaultValue = selectedProjectId;

            fromDateField.defaultValue = fromDate || "";
            toDateField.defaultValue = toDate || "";

            form.addButton({
                id: 'custpage_export_excel',
                label: 'Export Excel',
                functionName: 'exportToExcel'
            });

            // This is PO search
            var purchaseorderSearchObj = search.create({
                type: "purchaseorder",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters:
                    [
                        ["job.internalidnumber", "equalto", selectedProjectId],
                        "AND",
                        ["type", "anyof", "PurchOrd"],
                        "AND",
                        ["approvalstatus", "noneof", "3"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "entity", label: "Name" }),
                        search.createColumn({
                            name: "entityid",
                            join: "job",
                            label: "ID"
                        }),
                        search.createColumn({ name: "custbody_voucher_number", label: "Voucher Number" }),
                        search.createColumn({ name: "amount", label: "Amount" }),
                        search.createColumn({
                            name: "custentity_cost_budget_history",
                            join: "job",
                            label: "Cost Budget History"
                        })
                    ]
            });
            var resultcount = purchaseorderSearchObj.runPaged().count;

            if (resultcount === 0) {
                const noResultsForm = ui.createForm({
                    title: "No Results Found",
                });

                noResultsForm.addField({
                    id: 'no_results',
                    label: 'No Results Found',
                    type: ui.FieldType.INLINEHTML
                }).updateLayoutType({
                    layoutType: ui.FieldLayoutType.OUTSIDEABOVE
                }).defaultValue = '<div style="color: red; font-size: 18px; font-weight: bold;">⚠ No matching purchase orders found against the selected project.</div>';

                response.writePage(noResultsForm);
                return;
            }

            // Merging Expense with PO vs PB
            if (selectedProjectId || (fromDate && toDate)) {
                let expenseLineNum = 0;
                const expenseResults = processExpenseReport(selectedProjectId, fromDate, toDate);
                if (expenseResults) {
                    expenseResults.forEach(result => {
                        expenseSublist.setSublistValue({
                            id: 'project_name',
                            line: expenseLineNum,
                            value: result.projectName
                        });
                        expenseSublist.setSublistValue({
                            id: 'project_budget_amount',
                            line: expenseLineNum,
                            value: result.projectBudgetAmount
                        });
                        expenseSublist.setSublistValue({
                            id: 'expense_voucher_no',
                            line: expenseLineNum,
                            value: result.expenseVoucherNo
                        });
                        expenseSublist.setSublistValue({
                            id: 'employee_name',
                            line: expenseLineNum,
                            value: result.employeeName
                        });
                        expenseSublist.setSublistValue({
                            id: 'expense_amount',
                            line: expenseLineNum,
                            value: result.expenseAmount
                        });

                        expenseLineNum++;
                    });
                }

            }

            let resultsByProject = {};
            let projectCostBudgetMap = {};
            let projectPoAmountMap = {};
            let poAmountObj = {};

            let results = purchaseorderSearchObj.run().getRange({ start: 0, end: 1000 });
            log.debug("PO Search Results", results);

            results.forEach((result, index) => {
                const projectName = result.getText({ name: "entity" }) || "UNKNOWN";
                const poVoucher = result.getValue({ name: "custbody_voucher_number" }) || "";
                const poAmount = parseFloat(result.getValue({ name: "amount" }) || "0");
                const accountName = result.getText({ name: "expenseaccount", join: "item" });
                // const vendor = result.getText({ name: "entity" }) || '';
                const poId = result.id;
                const vendor = getVendorNameFromPurchaseOrder(poId);
                const billId = result.getValue({ name: "internalid", join: "applyingTransaction" });
                const costBudget = parseFloat(result.getValue({ name: "custentity_cost_budget_history", join: "job" }) || "0");
                //const BillAmountpo = parseFloat(result.getValue({ name: "amount", join: "applyingTransaction" }) || '');

                if (!projectCostBudgetMap[projectName]) {
                    projectCostBudgetMap[projectName] = costBudget;
                }
                // accumulate PO amounts
                if (!projectPoAmountMap[projectName]) {
                    projectPoAmountMap[projectName] = 0;
                    //log.debug(`Initializing PO Amount for ${projectName}`, projectPoAmountMap[projectName]);
                }
                projectPoAmountMap[projectName] += poAmount;
                //log.debug(`Accumulated PO Amount for ${projectName}`, projectPoAmountMap[projectName]);

                if (!resultsByProject[projectName]) {
                    resultsByProject[projectName] = [];
                }

                let existingPO = resultsByProject[projectName].find(po => po.poId === poId);
                //log.debug("Existing PO for Project", existingPO);

                if (!existingPO) {
                    existingPO = {
                        poId: poId,
                        poVoucher: poVoucher,
                        poAmount: 0,
                        accountName: accountName,
                        vendor: vendor,
                        billIds: []
                    };
                    resultsByProject[projectName].push(existingPO);
                    //log.debug(`New PO added for ${projectName}`, existingPO);
                }

                if (poAmountObj[poId]) {
                    poAmountObj[poId] = parseFloat(poAmountObj[poId]) + parseFloat(poAmount);
                }
                else {
                    poAmountObj[poId] = parseFloat(poAmount);
                }

                existingPO.poAmount += poAmount;
                log.debug(`PO Amount for ${poVoucher} under ${projectName}`, existingPO.poAmount);


                if (billId && !existingPO.billIds.includes(billId)) {
                    existingPO.billIds.push(billId);
                }
            });

            log.debug("Grouped Project → POs → Bills:", JSON.stringify(resultsByProject, null, 2));
            for (let projectName in resultsByProject) {
                let totalPO = projectPoAmountMap[projectName] || 0;
                let costBudget = projectCostBudgetMap[projectName] || 0;
                var poToBeBooked = costBudget > totalPO ? costBudget - totalPO : null;

                // you can store poToBeBooked with the first PO under that project, or just attach to project header object
                resultsByProject[projectName].forEach((po, index) => {
                    if (index === 0) {
                        po.poToBeBooked = poToBeBooked;
                    } else {
                        po.poToBeBooked = null;
                    }
                });
            }

            // Unique PO internal IDs for the next search
            let allPoIds = [];

            for (let project in resultsByProject) {
                resultsByProject[project].forEach(po => {
                    if (po.poId) {
                        allPoIds.push(po.poId);
                    }
                });
            }

            allPoIds = [...new Set(allPoIds)]; // Remove duplicates
            log.debug("All Unique PO Internal IDs for Bill Search", allPoIds);
            //log.debug("Count of all unique PO IDs", allPoIds.length);

            const billFilter = [["type", "anyof", "VendBill"],
                "AND",
            ["mainline", "is", "F"],
                "AND",
            ["posting", "is", "T"],
                "AND",
            ["taxline", "is", "F"],
                // "AND",
                // ["applyingtransaction.type", "noneof", "Custom108", "VPrepApp", "VendAuth", "Journal"],
                "AND",
            ["job.internalidnumber", "equalto", selectedProjectId],
                //     "AND",
                // ["appliedtotransaction.internalid", "anyof", allPoIds]
            ];

            if (fromDate && toDate) {
                billFilter.push(
                    "AND",
                    ["trandate", "within", fromDate, toDate]
                );
            }

            //This is bill search and other related transactions
            var vendorbillSearchObj = search.create({
                type: "vendorbill",
                settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
                filters: billFilter,
                columns: [
                    search.createColumn({ name: "internalid", label: "Bill Internal ID" }),
                    search.createColumn({ name: "custbody_voucher_number", label: "Bill Voucher Number" }),
                    search.createColumn({ name: "entity", label: "Vendor" }),
                    search.createColumn({ name: "location", label: "Billing Location" }),
                    search.createColumn({
                        name: "entityid",
                        join: "job",
                        label: "Project Id",
                    }),
                    search.createColumn({ name: "amount", label: "Bill Amount" }),
                    search.createColumn({ name: "applyingtransaction", label: "Applying transaction" }),
                    search.createColumn({
                        name: "internalid",
                        join: "applyingTransaction",
                        label: "Applying transaction Internal ID",
                    }),
                    search.createColumn({
                        name: "custbody_voucher_number",
                        join: "applyingTransaction",
                        label: "Applying trnsaction Voucher Number",
                    }),
                    search.createColumn({
                        name: "amount",
                        join: "applyingTransaction",
                        label: "DN Amount",
                    }),
                    search.createColumn({
                        name: "internalid",
                        join: "appliedtotransaction",
                        label: "PO ",
                    }),
                    search.createColumn({
                        name: "amount",
                        join: "appliedtotransaction",
                        label: "PO Amount",
                    }),
                    search.createColumn({ name: "postingperiod", label: "Year" }),
                ],
            });

            var groupedResults = {};
            var billresultcount = vendorbillSearchObj.runPaged().count;
            log.debug("Bill search count is:", billresultcount);

            var tdsAmount = 0; // Initialize TDS Amount
            var billToBeBooked = {}

            vendorbillSearchObj.run().each(function (result) {
                var billInternalId = result.getValue({ name: "internalid" });

                var billVoucherNumber = result.getValue({ name: "custbody_voucher_number" });
                var vendorname = result.getText({ name: "entity" });
                var period = result.getText({ name: "location" });
                var billAmount = result.getValue({ name: "amount" });
                // var tdsAmount = result.getValue({ name: "formulanumeric" });
                var applyingTransactionName = result.getText({ name: "applyingtransaction" });
                var applyingTransactionId = result.getValue({ name: "internalid", join: "applyingTransaction" });
                var debitnoteAmount = result.getValue({ name: "amount", join: "applyingTransaction" }) || "";
                var POreference = result.getValue({ name: "internalid", join: "appliedtotransaction" });
                var poReferenceAmount = result.getValue({ name: "amount", join: "appliedtotransaction" });
                var applyingVoucherNumber = result.getValue({ name: "custbody_voucher_number", join: "applyingTransaction" });
                var year = result.getText({ name: "postingperiod" });

                // If this Bill ID hasn't been seen before, create its group
                if (!groupedResults[billInternalId]) {
                    groupedResults[billInternalId] = {
                        billInternalId: billInternalId,
                        billVoucherNumber: billVoucherNumber,
                        vendorname: vendorname,
                        period: period,
                        year: year,
                        billAmount: 0,
                        tdsAmount: 0,
                        POreference: POreference,
                        applyingTransactions: [],
                    };
                }
                // groupedResults[billInternalId].tdsAmount += parseFloat(tdsAmount || 0);
                groupedResults[billInternalId].billAmount += parseFloat(billAmount || 0);
                log.debug("Bill Amount for Bill ID " + billInternalId, groupedResults[billInternalId].billAmount);

                // Add this applying transaction to the bill's group
                groupedResults[billInternalId].applyingTransactions.push({
                    applyingTransactionName: applyingTransactionName,
                    applyingTransactionId: applyingTransactionId,
                    applyingVoucherNumber: applyingVoucherNumber,
                    debitnoteAmount: debitnoteAmount,
                    //actualAppliedAmount: actualAppliedAmount
                });

                return true;
            });

            // After bill search is processed
            for (const billInternalId in groupedResults) {
                const bill = groupedResults[billInternalId];
                const poRef = bill.POreference;

                for (const project in resultsByProject) {
                    var po = resultsByProject[project].find(po => po.poId === poRef);
                    if (po && !po.billIds.includes(billInternalId)) {
                        po.billIds.push(billInternalId);
                    }
                }
                log.debug("Grouped Result for Bill ID inside  " + billInternalId, JSON.stringify(groupedResults[billInternalId]));
            }

            //TDS search
            if (billresultcount > 0) {
                var vendorbillSearchObj = search.create({
                    type: "vendorbill",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "VendBill"],
                            "AND",
                            ["job.internalidnumber", "equalto", selectedProjectId],
                            "AND",
                            ["internalid", "anyof", Object.keys(groupedResults)],
                            "AND",
                            ["taxline", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "formulanumeric",
                                summary: "SUM",
                                formula: "CASE WHEN {taxdetail.taxtype}='Tax Deduction at Source' THEN ABS({taxdetail.taxamount}) ELSE 0 END  ",
                                label: "Formula (Numeric)"
                            })
                        ]
                });
                var searchResultCount = vendorbillSearchObj.runPaged().count;
                //log.debug("vendorbillSearchObj result count", searchResultCount);
                vendorbillSearchObj.run().each(function (result) {
                    var billInternalId = result.getValue({ name: "internalid", summary: "GROUP" });
                    tdsAmount = parseFloat(result.getValue({ name: "formulanumeric", summary: "SUM" }) || 0);
                    //log.debug("TDS Amount for Bill ID " + billInternalId, tdsAmount);
                    groupedResults[billInternalId].tdsAmount = groupedResults[billInternalId].tdsAmount + tdsAmount;

                    return true;
                });
                log.debug("To date", toDate);
                var billtobookFilter = [[
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["job.internalidnumber", "equalto", selectedProjectId],
                    "AND",
                    ["internalid", "anyof", Object.keys(groupedResults)],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["taxline", "is", "F"],
                    // "AND",
                    // ["applyingtransaction.trandate", "onorbefore", toDate],
                ]];

                if (toDate) {
                    billtobookFilter.push(
                        "AND",
                        ["trandate", "onorbefore", toDate]
                    );
                }

                var billtobookSearch = search.create({
                    type: "vendorbill",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: billtobookFilter,
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "amount",
                                label: " Bill Amount"
                            })

                        ]
                });
                var billtobookResultCount = billtobookSearch.runPaged().count;
                log.debug("billtobookSearch result count", billtobookResultCount);
                billtobookSearch.run().each(function (result) {
                    var billInternalId = result.getValue({ name: "internalid" });
                    var billtobookAmount = parseFloat(result.getValue({ name: "amount" }));

                    var poInternalId = groupedResults[billInternalId].POreference;

                    log.debug("PO Internal ID for Bill ID inside bill to book " + billInternalId, poInternalId);

                    var billtobookPoAmount = parseFloat(poAmountObj[poInternalId]);
                    if (poInternalId == 6313) {
                        log.debug("6313 billtobookAmount", billtobookAmount);
                    }

                    if (billToBeBooked[poInternalId]) {
                        billToBeBooked[poInternalId] = parseFloat(billToBeBooked[poInternalId]) - parseFloat(billtobookAmount);

                    } else {
                        billToBeBooked[poInternalId] = parseFloat(billtobookPoAmount) - parseFloat(billtobookAmount);

                    }
                    return true;
                });

            }

            var lineNum = 0;

            // === UPDATED: Render ALL POs including those with no bills ===
            for (let projectName in resultsByProject) {
                resultsByProject[projectName].forEach(po => {
                    if (po.billIds.length === 0 && !_logValidation(fromDate) && !_logValidation(toDate)) {
                        // No bills for this PO
                        sublist.setSublistValue({
                            id: "profit_center",
                            line: lineNum,
                            value: projectName,
                        });
                        sublist.setSublistValue({
                            id: "budgeted_amount",
                            line: lineNum,
                            value: projectCostBudgetMap[projectName] || 0,
                        });
                        sublist.setSublistValue({
                            id: "po_number",
                            line: lineNum,
                            value: po.poVoucher,
                        });
                        sublist.setSublistValue({
                            id: "po_amount",
                            line: lineNum,
                            value: po.poAmount,
                        });
                        sublist.setSublistValue({
                            id: "vendor",
                            line: lineNum,
                            value: po.vendor,
                        });

                        sublist.setSublistValue({
                            id: "account",
                            line: lineNum,
                            value: po.accountName,
                        });

                        sublist.setSublistValue({
                            id: "po_to_be_booked",
                            line: lineNum,
                            value: poToBeBooked,
                        });

                        sublist.setSublistValue({
                            id: "bill_to_be_booked",
                            line: lineNum,
                            value: po.poAmount,
                        });

                        lineNum++;
                    } else {
                        // POs with bills — same as before
                        po.billIds.forEach(billId => {
                            const billData = groupedResults[billId];
                            if (billData) {
                                sublist.setSublistValue({
                                    id: "profit_center",
                                    line: lineNum,
                                    value: projectName,
                                });
                                sublist.setSublistValue({
                                    id: "budgeted_amount",
                                    line: lineNum,
                                    value: projectCostBudgetMap[projectName] || 0,
                                });
                                sublist.setSublistValue({
                                    id: "po_number",
                                    line: lineNum,
                                    value: po.poVoucher,
                                });
                                sublist.setSublistValue({
                                    id: "po_amount",
                                    line: lineNum,
                                    value: po.poAmount,
                                });
                                sublist.setSublistValue({
                                    id: "vendor",
                                    line: lineNum,
                                    value: po.vendor,
                                });
                                sublist.setSublistValue({
                                    id: "account",
                                    line: lineNum,
                                    value: po.accountName,
                                });
                                sublist.setSublistValue({
                                    id: "purchase_bill_no",
                                    line: lineNum,
                                    value: billData.billVoucherNumber,
                                });
                                sublist.setSublistValue({
                                    id: "location",
                                    line: lineNum,
                                    value: billData.period,
                                });
                                sublist.setSublistValue({
                                    id: "year",
                                    line: lineNum,
                                    value: billData.year,
                                });

                                sublist.setSublistValue({
                                    id: "po_to_be_booked",
                                    line: lineNum,
                                    value: poToBeBooked,
                                });

                                sublist.setSublistValue({
                                    id: "pb_amount",
                                    line: lineNum,
                                    value: parseFloat(billData.billAmount) || 0,
                                });
                                sublist.setSublistValue({
                                    id: "tds_amount",
                                    line: lineNum,
                                    value: parseFloat(billData.tdsAmount) || 0,
                                });

                                let dnAmount = 0;
                                let dnVoucher = "";

                                billData.applyingTransactions.forEach(txn => {
                                    if (txn.applyingTransactionName?.startsWith("Bill Credit")) {
                                        dnAmount += parseFloat(txn.debitnoteAmount || "0");
                                        dnVoucher = txn.applyingVoucherNumber || "";
                                    }
                                });

                                var absoluteDNAmount = Math.abs(parseFloat(dnAmount));
                                //log.debug("Debit Note Amount for Bill ID " + billId, absoluteDNAmount);
                                var absolutePBAmount = Math.abs(parseFloat(billData.billAmount));
                                //log.debug("PB Amount for Bill ID " + billId, absolutePBAmount);
                                if (_logValidation(absolutePBAmount) && _logValidation(absoluteDNAmount)) {
                                    var pbMinusDN = absolutePBAmount - absoluteDNAmount;
                                }

                                // if (_logValidation(absolutePBAmount)) {
                                //     var billToBeBooked = parseFloat(po.poAmount) - absolutePBAmount;
                                // }

                                if (_logValidation(absoluteDNAmount)) {
                                    sublist.setSublistValue({
                                        id: "dn_amount",
                                        line: lineNum,
                                        value: absoluteDNAmount,
                                    });
                                }

                                if (_logValidation(dnVoucher)) {
                                    sublist.setSublistValue({
                                        id: "dn_voucher_no",
                                        line: lineNum,
                                        value: dnVoucher,
                                    });
                                }

                                if (_logValidation(absoluteDNAmount)) {
                                    sublist.setSublistValue({
                                        id: "pb_dn",
                                        line: lineNum,
                                        value: pbMinusDN || 0,
                                    });
                                }

                                if (_logValidation(billToBeBooked)) {
                                    sublist.setSublistValue({
                                        id: "bill_to_be_booked",
                                        line: lineNum,
                                        value: billToBeBooked[po.poId],
                                    });
                                }

                                lineNum++;
                            }
                        });
                    }
                });
            }
        }
        response.writePage(form);
    }

    function processExpenseReport(selectedProjectId, fromDate, toDate) {
        try {
            let results = [];

            const expenseSearch = search.create({
                type: 'expensereport',
                settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
                filters: [
                    ['type', 'anyof', 'ExpRept'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['approvalstatus', 'noneof', '3'],
                    'AND',
                    ['customer.entityid', 'isnotempty', ''],
                    'AND',
                    ['name', 'anyof', selectedProjectId],
                    "AND",
                    ["trandate", "within", fromDate, toDate]
                ],
                columns: [
                    search.createColumn({ name: 'entity', summary: 'GROUP', label: 'Project Name' }),
                    search.createColumn({ name: 'custentity_cost_budget_history', join: 'job', summary: 'GROUP', label: 'Project Budget Amount' }),
                    search.createColumn({ name: 'custbody_voucher_number', summary: 'GROUP', label: 'Expense Voucher No' }),
                    search.createColumn({ name: 'mainname', summary: 'GROUP', label: 'Employee Name' }),
                    search.createColumn({ name: 'amount', summary: 'SUM', label: 'Expense Amount' })
                ]
            });

            const pagedResults = expenseSearch.runPaged({ pageSize: 1000 });

            pagedResults.pageRanges.forEach(pageRange => {
                const page = pagedResults.fetch({ index: pageRange.index });
                page.data.forEach(result => {
                    const budget = result.getValue({ name: 'custentity_cost_budget_history', join: 'job', summary: 'GROUP' });
                    const expenseAmount = result.getValue({ name: 'amount', summary: 'SUM' });

                    results.push({
                        projectName: result.getText({ name: 'entity', summary: 'GROUP' }) || 'N/A',
                        projectBudgetAmount: budget ? parseFloat(budget).toFixed(2) : '0.00',
                        expenseVoucherNo: result.getValue({ name: 'custbody_voucher_number', summary: 'GROUP' }) || 'N/A',
                        employeeName: result.getText({ name: 'mainname', summary: 'GROUP' }) || 'N/A',
                        expenseAmount: expenseAmount ? parseFloat(expenseAmount).toFixed(2) : '0.00'
                    });
                });
            });

            return results;
        } catch (e) {
            log.error("Error in processExpenseReport", e);
            return null;
        }
    }

    function _logValidation(value) {
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

    const getVendorNameFromPurchaseOrder = poId => {
        try {
            const poLookup = search.lookupFields({
                type: search.Type.PURCHASE_ORDER,
                id: poId,
                columns: ["entity"],
            });

            const vendorEntity = poLookup.entity;
            if (!vendorEntity || !vendorEntity.length) {
                log.error("No Vendor", `Vendor not found on Purchase Order ID ${poId}`);
                return null;
            }

            return vendorEntity[0].text || "";
        } catch (error) {
            log.error("Error in getVendorNameFromPurchaseOrder", error);
            return null;
        }
    };

    return { onRequest };
});