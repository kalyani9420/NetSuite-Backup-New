
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
                let selectedProjects = params.custpage_project;
                let selectedLocations = params.custpage_locations;
                let selectedDepartment = params.custpage_departments;
                let form = generateMGMReport(fromDate, uptoDate, selectedProjects, selectedLocations, selectedDepartment);
                scriptContext.response.writePage(form);
            }
        } catch (error) {
            log.debug("Error", error);
        }
    };

    let generateRequestForm = () => {
        let form = serverWidget.createForm({ title: "MGM Report" });
        form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE }).isMandatory = true;;
        form.addField({ id: "custpage_project", label: "Project", type: serverWidget.FieldType.MULTISELECT, source: "job" });
        form.addField({ id: "custpage_locations", label: "Location", type: serverWidget.FieldType.SELECT, source: "location" });
        form.addField({ id: "custpage_departments", label: "Department", type: serverWidget.FieldType.SELECT, source: "Department" });
        form.addSubmitButton({ label: "Generate Report" });
        return form;
    };

    let generateMGMReport = (fromDate, uptoDate, selectedProjects, selectedLocations, selectedDepartment) => {
        let form = serverWidget.createForm({ title: `MGM Report [ ${fromDate} to ${uptoDate} ]` });
        form.clientScriptModulePath =
            "SuiteScripts/CS_MGM_Report.js";
        form.addButton({ id: "Export Excel", label: "Export Report", functionName: "exportReport()" });
        let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });
        let selectedProjectsArray = selectedProjects ? selectedProjects.split("\u0005").filter(Boolean) : [];

        let projectIdObject = {};
        let projectObject = {};
        let transactionObject = {};
        let totalObject = { soValue: 0, sbValue: 0, jvSale: 0, cnValue: 0, netSale: 0, poValue: 0, pbValue: 0, expReport: 0, jvPurchase: 0, dnValue: 0, netExpense: 0, grossExpense: 0, plannedMargin: 0, actualMargin: 0 };

        let projectTransaction = getProjectTransactions(fromDate, uptoDate, selectedLocations, selectedDepartment);
        let delegatesSoSb = getDeligatesSoSb(fromDate, uptoDate, selectedLocations, selectedDepartment);

        projectTransaction.forEach(project => {
            let id = project.getValue({ name: "internalid", join: "job", summary: "GROUP", label: "Internal Id" });
            if ((!selectedProjectsArray.length || (selectedProjects.length && selectedProjectsArray.includes(id))) && _validation(id)) {
                project = JSON.parse(JSON.stringify(project));
                let code = (project.values["GROUP(formulatext)_3"]).toString().trim().replace(/\s+/g, ' ');
                let creationDate = project.values["GROUP(formuladate)"];
                let location = project.values["GROUP(formulatext)"];
                let department = project.values["GROUP(formulatext)_1"];
                let customer = project.values["GROUP(formulatext)_2"];
                let soValue = project.values["SUM(formulanumeric)"];
                let sbValue = project.values["SUM(formulanumeric)_1"];
                let jvSale = project.values["SUM(formulanumeric)_2"];
                let cnValue = project.values["SUM(formulanumeric)_3"];
                let netSale = project.values["SUM(formulanumeric)_4"];
                let poValue = project.values["SUM(formulanumeric)_5"];
                let pbValue = project.values["SUM(formulanumeric)_6"];
                let expReport = project.values["SUM(formulanumeric)_7"];
                let jvPurchase = project.values["SUM(formulanumeric)_8"];
                let dnValue = project.values["SUM(formulanumeric)_9"];
                let netExpense = project.values["SUM(formulanumeric)_10"];
                let grossExpense = project.values["SUM(formulanumeric)_11"];
                let plannedMargin = project.values["SUM(formulanumeric)_12"];
                projectIdObject[code] = id;
                projectObject[id] = { id: id, code: code, creationDate: creationDate, location: location, department: department, customer: customer };
                transactionObject[id] = { soValue: soValue, sbValue: sbValue, jvSale: jvSale, cnValue: cnValue, netSale: netSale, poValue: poValue, pbValue: pbValue, expReport: expReport, jvPurchase: jvPurchase, dnValue: dnValue, netExpense: netExpense, grossExpense: grossExpense, plannedMargin: plannedMargin, actualMargin: 0.0, actualMarginPercent: 0.0 };
            }
        });

        delegatesSoSb.forEach(project => {
            project = JSON.parse(JSON.stringify(project));
            let delgCode = project.values["GROUP(formulatext)"].toString().trim().replace(/\s+/g, ' ');
            let delgSo = project.values["SUM(formulanumeric)"];
            let delgSb = project.values["SUM(formulanumeric)_1"];
            if (_validation(delgCode)) {
                if (Object.keys(projectIdObject).includes(delgCode)) {
                    let id = projectIdObject[delgCode];
                    if ((!selectedProjectsArray.length || (selectedProjects.length && selectedProjectsArray.includes(id))) && (_validation(id) && Object.keys(transactionObject).includes(id) && Object.keys(projectObject).includes(id))) {
                        let soValueWithDelg = parseFloat(delgSo) + parseFloat(transactionObject[id].soValue)
                        let sbValueWithDelg = parseFloat(delgSb) + parseFloat(transactionObject[id].sbValue)
                        transactionObject[id].plannedMargin = parseFloat(delgSo) + parseFloat(transactionObject[id].plannedMargin)
                        transactionObject[id].soValue = soValueWithDelg
                        transactionObject[id].netSale = parseFloat(delgSb) + parseFloat(transactionObject[id].netSale)
                        transactionObject[id].sbValue = sbValueWithDelg
                    }
                }
                else {
                    log.debug('delgCode', delgCode)
                    let delgProject = getDeligatesProject(delgCode);
                    log.debug('delgProject', delgProject)
                    if (delgProject.length != 0) {
                        let id = delgProject[0].getValue({ name: "internalid", label: "Internal Id" });
                        if ((!selectedProjectsArray.length || (selectedProjects.length && selectedProjectsArray.includes(id))) && _validation(id)) {
                            delgProject = JSON.parse(JSON.stringify(delgProject[0]));
                            let creationDate = delgProject.values["formuladate"];
                            let location = delgProject.values["formulatext"];
                            let department = delgProject.values["formulatext_1"];
                            let customer = delgProject.values["formulatext_2"];
                            log.debug('', id + ' ' + creationDate + ' ' + location + ' ' + department + ' ' + customer)
                            projectObject[id] = { id: id, code: delgCode, creationDate: creationDate, location: location, department: department, customer: customer };
                            transactionObject[id] = { soValue: delgSo, sbValue: delgSb, jvSale: 0.0, cnValue: 0.0, netSale: delgSb, poValue: 0.0, pbValue: 0.0, expReport: 0.0, jvPurchase: 0.0, dnValue: 0.0, netExpense: 0.0, grossExpense: 0.0, plannedMargin: delgSo };
                        }
                    }
                }
            }
        });

        log.debug('totalObject', totalObject.soValue);

        Object.entries(transactionObject).forEach(([id, transactionDetails]) => {
            log.debug('project id', id);
            log.debug('transactionDetails', transactionDetails);
            let actualMargin = Math.abs(parseFloat(transactionDetails.netSale)) - Math.abs(parseFloat(transactionDetails.netExpense));
            transactionObject[id].actualMargin = actualMargin
            transactionObject[id].actualMarginPercent = (Math.abs(parseFloat(transactionDetails.netSale)) != 0.0) ? (Math.abs(parseFloat(actualMargin)) / Math.abs(parseFloat(transactionDetails.netSale))) : 0.0;
            // transactionObject[id].actualMarginPercent = Math.abs(parseFloat(actualMargin)) / Math.abs(parseFloat(transactionDetails.netSale));
            totalObject.soValue = parseFloat(totalObject.soValue) + parseFloat(transactionDetails.soValue);
            totalObject.sbValue = parseFloat(totalObject.sbValue) + parseFloat(transactionDetails.sbValue);
            totalObject.jvSale = parseFloat(totalObject.jvSale) + parseFloat(transactionDetails.jvSale);
            totalObject.cnValue = parseFloat(totalObject.cnValue) + parseFloat(transactionDetails.cnValue);
            totalObject.netSale = parseFloat(totalObject.netSale) + parseFloat(transactionDetails.netSale);
            totalObject.poValue = parseFloat(totalObject.poValue) + parseFloat(transactionDetails.poValue);
            totalObject.pbValue = parseFloat(totalObject.pbValue) + parseFloat(transactionDetails.pbValue);
            totalObject.expReport = parseFloat(totalObject.expReport) + parseFloat(transactionDetails.expReport);
            totalObject.jvPurchase = parseFloat(totalObject.jvPurchase) + parseFloat(transactionDetails.jvPurchase);
            totalObject.dnValue = parseFloat(totalObject.dnValue) + parseFloat(transactionDetails.dnValue);
            totalObject.netExpense = parseFloat(totalObject.netExpense) + parseFloat(transactionDetails.netExpense);
            totalObject.grossExpense = parseFloat(totalObject.grossExpense) + parseFloat(transactionDetails.grossExpense);
            totalObject.plannedMargin = parseFloat(totalObject.plannedMargin) + parseFloat(transactionDetails.plannedMargin);
            totalObject.actualMargin = parseFloat(totalObject.actualMargin) + parseFloat(transactionDetails.actualMargin);

        });

        log.debug('totalObject', totalObject);

        sublist.addField({ id: "custpage_creation_date", type: serverWidget.FieldType.TEXT, label: "Creation Date" });
        sublist.addField({ id: "custpage_location", type: serverWidget.FieldType.TEXT, label: "Location" });
        sublist.addField({ id: "custpage_department", type: serverWidget.FieldType.TEXT, label: "Department" });
        sublist.addField({ id: "custpage_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sublist.addField({ id: "custpage_code", type: serverWidget.FieldType.TEXT, label: "Code" });
        sublist.addField({ id: "custpage_so_value", type: serverWidget.FieldType.TEXT, label: "SO Value" });
        sublist.addField({ id: "custpage_sb_value", type: serverWidget.FieldType.TEXT, label: "SB Value" });
        sublist.addField({ id: "custpage_jv_sale", type: serverWidget.FieldType.TEXT, label: "JV (Sales)" });
        sublist.addField({ id: "custpage_cn_value", type: serverWidget.FieldType.TEXT, label: "Credit Note" });
        sublist.addField({ id: "custpage_net_sale", type: serverWidget.FieldType.TEXT, label: "Net Sales" });
        sublist.addField({ id: "custpage_po_value", type: serverWidget.FieldType.TEXT, label: "PO Value" });
        sublist.addField({ id: "custpage_pb_value", type: serverWidget.FieldType.TEXT, label: "PB Value" });
        sublist.addField({ id: "custpage_exp_report", type: serverWidget.FieldType.TEXT, label: "Expense Report" });
        sublist.addField({ id: "custpage_jv_purchase", type: serverWidget.FieldType.TEXT, label: "JV (Purchases)" });
        sublist.addField({ id: "custpage_dn_value", type: serverWidget.FieldType.TEXT, label: "Debit Note" });
        sublist.addField({ id: "custpage_net_expense", type: serverWidget.FieldType.TEXT, label: "Net Expense" });
        sublist.addField({ id: "custpage_gross_expense", type: serverWidget.FieldType.TEXT, label: "Gross Expense" });
        sublist.addField({ id: "custpage_planned_margin", type: serverWidget.FieldType.TEXT, label: "Planned Margin" });
        sublist.addField({ id: "custpage_actual_margin", type: serverWidget.FieldType.TEXT, label: "Actual Margin" });
        sublist.addField({ id: "custpage_actual_margin_percent", type: serverWidget.FieldType.TEXT, label: "Actual Margin %" });

        let projectLines = Object.entries(projectObject);

        let count = 0;
        for (; count < projectLines.length; count++) {
            let [projectId, projectDetails] = projectLines[count];
            sublist.setSublistValue({ id: "custpage_creation_date", line: count, value: (projectDetails.creationDate).toString() });
            sublist.setSublistValue({ id: "custpage_location", line: count, value: (projectDetails.location).toString() });
            sublist.setSublistValue({ id: "custpage_department", line: count, value: (projectDetails.department).toString() });
            sublist.setSublistValue({ id: "custpage_customer", line: count, value: (projectDetails.customer).toString() });
            sublist.setSublistValue({ id: "custpage_code", line: count, value: (projectDetails.code).toString() });
            sublist.setSublistValue({ id: "custpage_so_value", line: count, value: Math.abs(transactionObject[projectId].soValue).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_sb_value", line: count, value: Math.abs(transactionObject[projectId].sbValue).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_jv_sale", line: count, value: Math.abs(transactionObject[projectId].jvSale).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_cn_value", line: count, value: Math.abs(transactionObject[projectId].cnValue).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_net_sale", line: count, value: Math.abs(transactionObject[projectId].netSale).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_po_value", line: count, value: Math.abs(transactionObject[projectId].poValue).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_pb_value", line: count, value: Math.abs(transactionObject[projectId].pbValue).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_exp_report", line: count, value: Math.abs(transactionObject[projectId].expReport).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_jv_purchase", line: count, value: Math.abs(transactionObject[projectId].jvPurchase).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_dn_value", line: count, value: Math.abs(transactionObject[projectId].dnValue).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_net_expense", line: count, value: Math.abs(transactionObject[projectId].netExpense).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_gross_expense", line: count, value: Math.abs(transactionObject[projectId].grossExpense).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_planned_margin", line: count, value: Math.abs(transactionObject[projectId].plannedMargin).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_actual_margin", line: count, value: Math.abs(transactionObject[projectId].actualMargin).toFixed(2).toString() });
            sublist.setSublistValue({ id: "custpage_actual_margin_percent", line: count, value: Math.abs(transactionObject[projectId].actualMarginPercent).toFixed(2).toString() });
        }
        log.debug('count', count)

        sublist.setSublistValue({ id: "custpage_creation_date", line: count, value: '<b>Total</b>' });
        sublist.setSublistValue({ id: "custpage_so_value", line: count, value: '<b>' + Math.abs(totalObject.soValue).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_sb_value", line: count, value: '<b>' + Math.abs(totalObject.sbValue).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_jv_sale", line: count, value: '<b>' + Math.abs(totalObject.jvSale).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_cn_value", line: count, value: '<b>' + Math.abs(totalObject.cnValue).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_net_sale", line: count, value: '<b>' + Math.abs(totalObject.netSale).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_po_value", line: count, value: '<b>' + Math.abs(totalObject.poValue).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_pb_value", line: count, value: '<b>' + Math.abs(totalObject.pbValue).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_exp_report", line: count, value: '<b>' + Math.abs(totalObject.expReport).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_jv_purchase", line: count, value: '<b>' + Math.abs(totalObject.jvPurchase).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_dn_value", line: count, value: '<b>' + Math.abs(totalObject.dnValue).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_net_expense", line: count, value: '<b>' + Math.abs(totalObject.netExpense).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_gross_expense", line: count, value: '<b>' + Math.abs(totalObject.grossExpense).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_planned_margin", line: count, value: '<b>' + Math.abs(totalObject.plannedMargin).toFixed(2).toString() + '</b>' });
        sublist.setSublistValue({ id: "custpage_actual_margin", line: count, value: '<b>' + Math.abs(totalObject.actualMargin).toFixed(2).toString() + '</b>' });

        return form;
    }

    let getProjectTransactions = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {
        let filters = [
            ["type", "anyof", "SalesOrd", "VendCred", "CustInvc", "VendBill", "CustCred", "Journal", "PurchOrd", "ExpRept"],
            "AND",
            ["mainline", "any", ""],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["trandate", "within", fromDate, uptoDate],
        ]


        if (selectedLocations && selectedLocations !== "" && selectedLocations !== "\u0005") {
            let selectedLocationsArray = selectedLocations.split("\u0005").filter(Boolean);
            if (selectedLocationsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedLocationsArray]);
            }
        }

        if (selectedDepartment && selectedDepartment !== "" && selectedDepartment !== "\u0005") {
            let selectedDepartmentsArray = selectedDepartment.split("\u0005").filter(Boolean);
            if (selectedDepartmentsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedDepartmentsArray]);
            }
        }

        let transactionRelatedProjectObject = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: filters,
            columns:
                [
                    search.createColumn({ name: "internalid", join: "job", summary: "GROUP", label: "Internal Id" }),
                    search.createColumn({ name: "formuladate", summary: "GROUP", formula: "{job.custentity_project_code_date}", label: "Project Code Creation Date", sort: search.Sort.ASC }),
                    search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL({job.custentity_subsidiary_loaction},' ' )", label: "Location" }), 
                    search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL(REGEXP_SUBSTR({job.custentity_department}, '[^:]+$'),' ' )", label: "Department" }),
                    search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL({job.customer},' ' )", label: "Customer" }),
                    search.createColumn({ name: "formulatext", summary: "GROUP", formula: "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END", label: "Project Code" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Sales Order' AND ({custbody_approval_status} !='Rejected' ) THEN {amount} ELSE 0 END", label: "SO Value" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Invoice' AND( {approvalstatus} != 'Rejected')  THEN {amount} ELSE 0 END", label: "SB Value" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Journal' AND ({account.type} = 'Accounts Receivable' OR {account.type} = 'Income') AND ({approvalstatus}!='Rejected') THEN {amount} ELSE 0 END", label: "JVValue(S)" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Credit Memo'  THEN {amount} ELSE 0  END", label: "Credit Note" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Invoice' AND {posting} = 'T' THEN {amount}    WHEN {type} = 'Credit Memo' THEN {amount}    WHEN {type} = 'Journal' AND ({account.type} = 'Accounts Receivable' OR {account.type} = 'Income') AND {posting} = 'T' THEN {amount}  ELSE 0  END", label: "Net Sales" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Purchase Order' AND {approvalstatus} != 'Rejected' THEN {amount}    ELSE 0  END", label: "PO Value" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Vendor Invoice' AND {approvalstatus} != 'Rejected'  THEN {amount} ELSE 0 END", label: "PB Value" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Expense Report' AND {posting} = 'T' THEN {amount} ELSE 0 END", label: "Expense Report" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Journal' AND ({account.type} = 'Accounts Payable' OR {account.type} = 'Cost of Goods Sold')  AND ({approvalstatus}!='Rejected') THEN {amount} ELSE 0 END", label: "JVValue(P)" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Bill Credit'  THEN {amount} ELSE 0 END", label: "Debit Note" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN ({type} = 'Vendor Invoice' AND {approvalstatus} != 'Rejected') THEN {amount} WHEN ({type} = 'Expense Report' AND {posting} = 'T') THEN {amount} WHEN {type} = 'Bill Credit' THEN {amount} WHEN ({type} = 'Journal' AND ({account.type} = 'Accounts Payable' OR {account.type} = 'Cost of Goods Sold')  AND {approvalstatus}!='Rejected') THEN {amount} ELSE 0 END  ", label: "Net Expenses" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Purchase Order' AND {approvalstatus} != 'Rejected' THEN {amount}    WHEN {type} = 'Journal' AND ({account.type} = 'Accounts Payable' OR {account.type} = 'Cost of Goods Sold') AND {approvalstatus} != 'Rejected' THEN {amount}    WHEN {type} = 'Bill Credit' THEN {amount}    ELSE 0  END", label: "Gross Expenses" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Sales Order' AND ({custbody_approval_status} != 'Rejected' )THEN {amount}    WHEN {type} = 'Purchase Order' AND {approvalstatus} != 'Rejected' THEN -{amount}    ELSE 0  END", label: "Planned Margin" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "ABS(SUM(CASE  WHEN {type} = 'Invoice' AND {posting} = 'T' THEN {amount}  WHEN {type} = 'Credit Memo' THEN {amount} WHEN ({type} = 'Journal' AND ({account.type} = 'Accounts Receivable' OR {account.type} = 'Income') AND {posting} = 'T') THEN {amount}  ELSE 0  END))  - ABS(SUM(CASE  WHEN ({type} = 'Vendor Invoice' AND {approvalstatus} != 'Rejected') THEN {amount}  WHEN ({type} = 'Expense Report' AND {posting} = 'T') THEN {amount}  WHEN {type} = 'Bill Credit' THEN {amount}  WHEN ({type} = 'Journal' AND ({account.type} = 'Accounts Payable' OR {account.type} = 'Cost of Goods Sold')  AND {approvalstatus}!='Rejected') THEN {amount} ELSE 0 END))", label: "Actual Margin" })
                ]
        });
        return getAllResult(transactionRelatedProjectObject);
    };


    let getDeligatesSoSb = (fromDate, uptoDate, selectedLocations, selectedDepartment) => {

        let filters = [
            ["job.internalidnumber", "isempty", ""],
            "AND",
            ["type", "anyof", "SalesOrd", "CustInvc"],
            "AND",
            ["trandate", "within", fromDate, uptoDate],
            "AND",
            ["mainline", "is", "F"],
            "AND",
            ["taxline", "is", "F"]
        ]

        if (selectedLocations && selectedLocations !== "" && selectedLocations !== "\u0005") {
            let selectedLocationsArray = selectedLocations.split("\u0005").filter(Boolean);
            if (selectedLocationsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedLocationsArray]);
            }
        }

        if (selectedDepartment && selectedDepartment !== "" && selectedDepartment !== "\u0005") {
            let selectedDepartmentsArray = selectedDepartment.split("\u0005").filter(Boolean);
            if (selectedDepartmentsArray.length > 0) {
                filters.push("AND", ["location", "anyof", selectedDepartmentsArray]);
            }
        }

        var deligatesSoSbObject = search.create({
            type: "transaction",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: filters,
            columns:
                [
                    search.createColumn({ name: "formulatext", summary: "GROUP", formula: "CASE WHEN {job.entityid} IS NOT NULL THEN CASE WHEN INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END WHEN {cseg_ags_projectcod} IS NOT NULL THEN CASE WHEN INSTR({cseg_ags_projectcod}, ' ') > 0 THEN SUBSTR({cseg_ags_projectcod}, 1, INSTR({cseg_ags_projectcod}, ' ') - 1) ELSE {cseg_ags_projectcod} END ELSE NULL END", label: "Delegates Project Code" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Sales Order' AND ({custbody_approval_status} !='Rejected') THEN {amount} ELSE 0 END", label: "Delegates SO" }),
                    search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Invoice' AND( {approvalstatus} != 'Rejected')  THEN {amount} ELSE 0 END", label: "Delegates SB" })
                ]
        });
        return getAllResult(deligatesSoSbObject);
    };

    let getDeligatesProject = (projectCode) => {
        var deligatesProjectObject = search.create({
            type: "job",
            filters:
                [
                    ["entityid", "contains", projectCode]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "formuladate", formula: "{custentity_project_code_date}", label: "Project Code Creation Date" }),
                    search.createColumn({ name: "formulatext", formula: "NVL({custentity_subsidiary_loaction},' ' )", label: "Subsidiary Location" }),
                    search.createColumn({ name: "formulatext", formula: "NVL({custentity_department},' ' )", label: "Department " }),
                    search.createColumn({ name: "formulatext", formula: "NVL({customer},' ' )", label: "Customer" }),
                    search.createColumn({ name: "formulatext", formula: "CASE WHEN INSTR({entityid}, ' ') > 0 THEN SUBSTR({entityid}, 1, INSTR({entityid}, ' ') - 1) ELSE {entityid}  END", label: "Formula (Text)" }),

                ]
        });
        return getAllResult(deligatesProjectObject);
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

    let getAfterLastColon = input => {
        const match = input.match(/[^:]*$/);
        return match ? match[0].trim() : null;
    }

    let _validation = (value) => {
        if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "- None -" && value != "NaN" && value != 0) { return true }
        else { return false }
    }

    return { onRequest };
});