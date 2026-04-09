    /**
     * @NApiVersion 2.1
     * @NScriptType Suitelet
     */
    define(["N/ui/serverWidget", "N/search", "N/url"], (serverWidget, search, url) => {


    const THIS_SUITELET_INTERNAL = {
        scriptId: "customscript1342",
        deploymentId: "customdeploy1"
    };

    function uniqueWordsInSequence(input) {
        const words = input.split(' ');
        const seen = new Set();
        const result = [];

        for (const word of words) {
        if (!seen.has(word)) {
            seen.add(word);
            result.push(word);
        }
        }

        return result.join(' ');
    }

    const SEP = "\u0005";
    const parseMulti = v => (v && v !== SEP) ? v.split(SEP).filter(Boolean) : [];
    const toNum = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
    const toStr = (v, fb = "-") => (v === null || v === undefined || v === "" ? fb : String(v));
    const isValid = v => v != null && v !== "" && v !== "null" && v !== "undefined" && v !== "@NONE@" && v !== "- None -" && v !== "NaN" && v !== 0;

    const getAllResult = (customSearch) => {
        const out = [];
        const paged = customSearch.runPaged({ pageSize: 1000 });
        paged.pageRanges.forEach(r => out.push(...paged.fetch({ index: r.index }).data));
        return out;
    };

    const cleanDisplayName = (s, keepId = false) => {
        if (!s) return "-";
        s = String(s).trim().replace(/\s+/g, " ");

        
        let id = null, name = s;
        const m = /^(\d+)\s+(.*)$/.exec(s);
        if (m) { id = m[1]; name = m[2]; }

        
        const parts = name.split(/\s*:\s*/);
        if (parts.length === 2 && parts[0] && parts[1] &&
        parts[0].toLowerCase() === parts[1].toLowerCase()) {
        name = parts[0];
        } else {
        const words = name.split(" ");
        if (words.length % 2 === 0) {
            const mid = words.length / 2;
            const left = words.slice(0, mid).join(" ");
            const right = words.slice(mid).join(" ");
            if (left && right && left.toLowerCase() === right.toLowerCase()) {
            name = left;
            }
        }
        }

        return (keepId && id) ? `${id} ${name}` : name;
    };


    const resolveInternalSuitelet = (params) => url.resolveScript({
        scriptId: THIS_SUITELET_INTERNAL.scriptId,
        deploymentId: THIS_SUITELET_INTERNAL.deploymentId,
        params,
        returnExternalUrl: false
    });

    const resolveRecordInternal = (recordType, recordId) => {
        try {
        return url.resolveRecord({
            recordType,
            recordId,
            isEditMode: false,
            returnExternalUrl: false
        }) || "";
        } catch (e) {
        log.debug("resolveRecord error", `${recordType} ${recordId}: ${e}`);
        return "";
        }
    };


    const TXN_TYPE_TO_SCRIPTID = {
        "Sales Order": "salesorder",
        "Invoice": "invoice",
        "Credit Memo": "creditmemo",
        "Purchase Order": "purchaseorder",
        "Vendor Invoice": "vendorbill",
        "Expense Report": "expensereport",
        "Bill Credit": "vendorcredit",
        "Journal": "journalentry"
    };


    const onRequest = (ctx) => {
        try {
        const req = ctx.request;
        const p = req.parameters || {};

        const action = (p.sl_action || p.action || "").toLowerCase();
        const jobId = (p.sl_jobid || p.jobid || "");
        const code = (p.sl_code || p.code || "");
        const from = (p.sl_from || p.from || "");
        const to = (p.sl_to || p.to || "");

        //Sales Order pages
        if (action === "so_list" && code) {
            const form = renderSalesOrdersForProjectCode({ projectCode: code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }
        if (action === "so" && jobId) {
            const form = renderSalesOrdersForProject({ jobId, code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }


        if (action === "jv_sales" && jobId) {
            const form = renderJvSalesByJob({ jobId, projectCode: code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }
        if (action === "jv_purchases" && jobId) {
            const form = renderJvPurchByJob({ jobId, projectCode: code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }


        //   if (action === "sb_list" && jobId) { 
        //     const form = renderTxnLinesByJob({
        //       jobId, projectCode: code, fromDate: from, uptoDate: to,
        //       nsTypes: ["CustInvc"],
        //       pageLabel: "Invoices (SB)"
        //     });
        //     ctx.response.writePage(form); return;
        //   }
        //   if (action === "cn_list" && jobId) { 
        //     const form = renderTxnLinesByJob({
        //       jobId, projectCode: code, fromDate: from, uptoDate: to,
        //       nsTypes: ["CustCred"],
        //       pageLabel: "Credit Notes (CN)"
        //     });
        //     ctx.response.writePage(form); return;
        //   }
        if (action === "sb_list" && jobId) {
            const form = renderTxnLinesByCodePlusJob({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["CustInvc"],
            pageLabel: "Invoices (SB) — incl. Delegates"
            });
            ctx.response.writePage(form); return;
        }

        if (action === "cn_list" && jobId) {
            const form = renderTxnLinesByCodePlusJob({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["CustCred"],
            pageLabel: "Credit Notes (CN) — incl. Delegates"
            });
            ctx.response.writePage(form); return;
        }
        if (action === "po_list" && jobId) {
            const form = renderTxnLinesByJob({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["PurchOrd"],
            pageLabel: "Purchase Orders (PO)"
            });
            ctx.response.writePage(form); return;
        }
        if (action === "pb_list" && jobId) {
            const form = renderTxnLinesByJob({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["VendBill"],
            pageLabel: "Vendor Bills (PB)"
            });
            ctx.response.writePage(form); return;
        }
        if (action === "er_list" && jobId) {
            const form = renderTxnLinesByJob({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["ExpRept"],
            pageLabel: "Expense Reports (ER)"
            });
            ctx.response.writePage(form); return;
        }
        if (action === "dn_list" && jobId) {
            const form = renderTxnLinesByJob({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["VendCred"],
            pageLabel: "Debit Notes (DN)"
            });
            ctx.response.writePage(form); return;
        }


        if (action === "net_sales" && jobId) {
            const form = renderNetSalesByJob({ jobId, projectCode: code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }
        if (action === "net_expense" && jobId) {
            const form = renderNetExpenseByJob({ jobId, projectCode: code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }
        if (action === "gross_expense" && jobId) {
            const form = renderGrossExpenseByJob({ jobId, projectCode: code, fromDate: from, uptoDate: to });
            ctx.response.writePage(form); return;
        }
        if (action === "totpo_list" && jobId) {
            const form = renderTxnLinesByCodePlusJobtotalpopb({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["PurchOrd", "ExpRept"],
            pageLabel: "Total PO (PO + ER) "
            });
            ctx.response.writePage(form); return;
        }
        
        if (action === "totpb_list" && jobId) {
            const form = renderTxnLinesByCodePlusJobtotalpopb({
            jobId, projectCode: code, fromDate: from, uptoDate: to,
            nsTypes: ["VendBill", "ExpRept"],
            pageLabel: "Total PB (PB + ER)"
            });
            ctx.response.writePage(form); return;
        }
        

        if (req.method === "GET") {
            ctx.response.writePage(generateRequestForm()); return;
        }


        const fromDate = p.custpage_from_date;
        const uptoDate = p.custpage_upto_date;
        const selectedCustomers = p.custpage_customer;
        const selectedProjects = p.custpage_project;
        const selectedLocations = p.custpage_locations;
        const selectedDepartment = p.custpage_departments;

        const form = generateMGMReport(fromDate, uptoDate, selectedCustomers, selectedProjects, selectedLocations, selectedDepartment);
        ctx.response.writePage(form);
        } catch (e) {
        log.error("Suitelet Error", e);
        try { ctx.response.write("<div style='padding:16px;font:14px Arial;'>An error occurred rendering the page. Please try again or check logs.</div>"); } catch (_) { }
        }
    };


    const generateRequestForm = () => {
        const form = serverWidget.createForm({ title: "MGM Report" });
        form.addSubmitButton({ label: "Generate Report" });
        form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE }).isMandatory = true;
        form.addField({ id: "custpage_customer", label: "Customer", type: serverWidget.FieldType.MULTISELECT, source: "customer" });
        form.addField({ id: "custpage_project", label: "Project", type: serverWidget.FieldType.MULTISELECT, source: "job" });
        form.addField({ id: "custpage_locations", label: "Location", type: serverWidget.FieldType.SELECT, source: "location" });
        form.addField({ id: "custpage_departments", label: "Department", type: serverWidget.FieldType.SELECT, source: "department" });
        return form;
    };


    const generateMGMReport = (fromDate, uptoDate, selectedCustomers, selectedProjects, selectedLocations, selectedDepartment) => {
        const form = serverWidget.createForm({ title: `MGM Report [ ${toStr(fromDate)} to ${toStr(uptoDate)} ]` });
        form.clientScriptModulePath = "SuiteScripts/CS_MGM_Report.js";
        form.addButton({ id: "custpage_export_excel", label: "Export Report", functionName: "exportReport()" });

        const sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });
        const selectedProjectsArray = parseMulti(selectedProjects);

        const projectIdObject = {};
        const projectObject = {};
        const transactionObject = {};
        const totalObject = { soValue: 0, sbValue: 0, jvSale: 0, cnValue: 0, netSale: 0, poValue: 0, pbValue: 0, expReport: 0, jvPurchase: 0, dnValue: 0, netExpense: 0, grossExpense: 0, plannedMargin: 0, actualMargin: 0, billingBudget: 0, costBudget: 0, totalPO: 0, totalPB: 0 };

        const projectTransaction = getProjectTransactions(fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment);
        projectTransaction.forEach(project => {
        const id = project.getValue({ name: "internalid", join: "job", summary: "GROUP" });
        if ((!selectedProjectsArray.length || selectedProjectsArray.includes(String(id))) && isValid(id)) {
            project = JSON.parse(JSON.stringify(project));
            const code = toStr(project.values["GROUP(formulatext)_3"], "").trim().replace(/\s+/g, ' ');
            const billingBudget = toStr(project.values["GROUP(formulatext)_4"], "");
            const costBudget = toStr(project.values["GROUP(formulatext)_5"], "");
            const creationDate = project.values["GROUP(formuladate)"];
            const location = project.values["GROUP(formulatext)"];
            const department = project.values["GROUP(formulatext)_1"];
            const customer = project.values["GROUP(formulatext)_2"];
            const soValue = project.values["SUM(formulanumeric)"]; //
            const sbValue = project.values["SUM(formulanumeric)_1"]; //
            const jvSale = project.values["SUM(formulanumeric)_2"]; //
            const cnValue = project.values["SUM(formulanumeric)_3"]; //
            const netSale = project.values["SUM(formulanumeric)_4"]; 
            const poValue = project.values["SUM(formulanumeric)_5"]; //
            const pbValue = project.values["SUM(formulanumeric)_6"]; //
            const expReport = project.values["SUM(formulanumeric)_7"];//
            const jvPurchase = project.values["SUM(formulanumeric)_8"]; //
            const dnValue = project.values["SUM(formulanumeric)_9"]; //
            const netExpense = project.values["SUM(formulanumeric)_10"];
            const grossExpense = project.values["SUM(formulanumeric)_11"];
            const plannedMargin = project.values["SUM(formulanumeric)_12"];
            const totalPO = project.values["SUM(formulanumeric)_14"];
            const totalPB = project.values["SUM(formulanumeric)_15"];

            if(soValue == 0 && sbValue == 0 && jvSale == 0 && cnValue == 0 && poValue == 0 && pbValue == 0 && expReport == 0 && jvPurchase == 0 && dnValue == 0) {
                
            } 

            else{
            projectIdObject[code] = String(id);
            projectObject[id] = { id, code, creationDate, location, department, customer: cleanDisplayName(customer, true), billingBudget, costBudget };
            transactionObject[id] = { soValue, sbValue, jvSale, cnValue, netSale, poValue, pbValue, expReport, totalPO ,totalPB, jvPurchase, dnValue, netExpense, grossExpense, plannedMargin, actualMargin: 0.0, actualMarginPercent: 0.0 };
        }
        }
        });

        //Delgates Mapping in MGM
        const delegatesSoSbCn = getDeligateSoSbCn(fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment);
        delegatesSoSbCn.forEach(project => {
        project = JSON.parse(JSON.stringify(project));
        const delgCode = toStr(project.values["GROUP(formulatext)"], "").trim().replace(/\s+/g, ' ');
        const delgSo = project.values["SUM(formulanumeric)"];
        const delgSb = project.values["SUM(formulanumeric)_1"];
        const delgCn = project.values["SUM(formulanumeric)_2"];

        if (!isValid(delgCode)) return;

        if (Object.prototype.hasOwnProperty.call(projectIdObject, delgCode)) {
            const id = projectIdObject[delgCode];
            if ((!selectedProjectsArray.length || selectedProjectsArray.includes(String(id))) && isValid(id) && transactionObject[id] && projectObject[id]) {
            transactionObject[id].soValue = toNum(delgSo) + toNum(transactionObject[id].soValue);
            transactionObject[id].sbValue = toNum(delgSb) + toNum(transactionObject[id].sbValue);
            transactionObject[id].cnValue = toNum(delgCn) + toNum(transactionObject[id].cnValue);
            transactionObject[id].plannedMargin = toNum(delgSo) + toNum(transactionObject[id].plannedMargin);
            transactionObject[id].netSale = toNum(delgSb) + toNum(delgCn) + toNum(transactionObject[id].netSale);
            }
        } else {
            log.debug('in else delgCode', delgCode)
            const delgProject = getDeligatesProject(delgCode);
            log.debug('in else delgProject', delgProject)
            if (delgProject.length) {
            const id = delgProject[0].getValue({ name: "internalid" });
            if ((!selectedProjectsArray.length || selectedProjectsArray.includes(String(id))) && isValid(id)) {
                const p = JSON.parse(JSON.stringify(delgProject[0]));
                // log.debug('', id + ' ' + creationDate + ' ' + location + ' ' + department + ' ' + customer)
                projectObject[id] = { id, code: delgCode, creationDate: p.values["formuladate"], location: p.values["formulatext"], department: p.values["formulatext_1"], customer: cleanDisplayName(p.values["formulatext_2"], true) };
                transactionObject[id] = { soValue: delgSo, sbValue: delgSb, jvSale: 0.0, cnValue: delgCn, netSale: toNum(delgSb) + toNum(delgCn), poValue: 0.0, pbValue: 0.0, expReport: 0.0, totalPO: 0.0 , totalPB: 0.0, jvPurchase: 0.0, dnValue: 0.0, netExpense: 0.0, grossExpense: 0.0, plannedMargin: delgSo, actualMargin: 0.0, actualMarginPercent: 0.0 };
                log.debug('in else projectObject[id]', projectObject[id])
                log.debug('in else transactionObject[id]', transactionObject[id])
            }
            }
        }
        });


        //Calculation of Actual Margin , Actual Margin %,Total 
        Object.entries(transactionObject).forEach(([id, t]) => {
        const actualMargin = toNum(t.netSale) - toNum(t.netExpense);
        t.actualMargin = actualMargin;
        t.actualMarginPercent = (toNum(t.netSale) !== 0) ? (actualMargin / Math.abs(toNum(t.netSale))) : 0.0;

        totalObject.soValue += toNum(t.soValue);
        totalObject.sbValue += toNum(t.sbValue);
        totalObject.jvSale += toNum(t.jvSale);
        totalObject.cnValue += toNum(t.cnValue);
        totalObject.netSale += toNum(t.netSale);
        totalObject.poValue += toNum(t.poValue);
        totalObject.pbValue += toNum(t.pbValue);
        totalObject.expReport += toNum(t.expReport);
        totalObject.jvPurchase += toNum(t.jvPurchase);
        totalObject.dnValue += toNum(t.dnValue);
        totalObject.netExpense += toNum(t.netExpense);
        totalObject.grossExpense += toNum(t.grossExpense);
        totalObject.plannedMargin += toNum(t.plannedMargin);
        totalObject.actualMargin += toNum(t.actualMargin);
        const p = projectObject[id] || {};
        totalObject.billingBudget += toNum(p.billingBudget);
        totalObject.costBudget += toNum(p.costBudget);
        totalObject.totalPO      += toNum(t.totalPO);
        totalObject.totalPB      += toNum(t.totalPB);
        });


        sublist.addField({ id: "custpage_creation_date", type: serverWidget.FieldType.TEXT, label: "Creation Date" });
        sublist.addField({ id: "custpage_location", type: serverWidget.FieldType.TEXT, label: "Location" });
        sublist.addField({ id: "custpage_department", type: serverWidget.FieldType.TEXT, label: "Department" });
        sublist.addField({ id: "custpage_customer", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sublist.addField({ id: "custpage_code", type: serverWidget.FieldType.TEXT, label: "Code" });
        sublist.addField({ id: "custpage_billing_budget", type: serverWidget.FieldType.TEXT, label: "Billing Budget" });
        sublist.addField({ id: "custpage_so_value", type: serverWidget.FieldType.TEXT, label: "SO Value" });
        sublist.addField({ id: "custpage_sb_value", type: serverWidget.FieldType.TEXT, label: "SB Value" });
        sublist.addField({ id: "custpage_jv_sale", type: serverWidget.FieldType.TEXT, label: "JV (Sales)" });
        sublist.addField({ id: "custpage_cn_value", type: serverWidget.FieldType.TEXT, label: "Credit Note" });
        sublist.addField({ id: "custpage_net_sale", type: serverWidget.FieldType.TEXT, label: "Net Sales" });
        sublist.addField({ id: "custpage_cost_budget_history", type: serverWidget.FieldType.TEXT, label: "Cost Budget" });
        sublist.addField({ id: "custpage_po_value", type: serverWidget.FieldType.TEXT, label: "PO Value" });
        sublist.addField({ id: "custpage_pb_value", type: serverWidget.FieldType.TEXT, label: "PB Value" });
        sublist.addField({ id: "custpage_exp_report", type: serverWidget.FieldType.TEXT, label: "Expense Report" });
        sublist.addField({ id: "custpage_total_po", type: serverWidget.FieldType.TEXT, label: "Total PO" });
        sublist.addField({ id: "custpage_total_pb", type: serverWidget.FieldType.TEXT, label: "Total PB" });
        sublist.addField({ id: "custpage_jv_purchase", type: serverWidget.FieldType.TEXT, label: "JV (Purchases)" });
        sublist.addField({ id: "custpage_dn_value", type: serverWidget.FieldType.TEXT, label: "Debit Note" });
        sublist.addField({ id: "custpage_net_expense", type: serverWidget.FieldType.TEXT, label: "Net Expense" });
        sublist.addField({ id: "custpage_gross_expense", type: serverWidget.FieldType.TEXT, label: "Gross Expense" });
        sublist.addField({ id: "custpage_planned_margin", type: serverWidget.FieldType.TEXT, label: "Planned Margin" });
        sublist.addField({ id: "custpage_actual_margin", type: serverWidget.FieldType.TEXT, label: "Actual Margin" });
        sublist.addField({ id: "custpage_actual_margin_percent", type: serverWidget.FieldType.TEXT, label: "Actual Margin %" });


        //     const mkLink = (val, act, projectId, codeText, opts = {}) => {
        //         const signed = !!opts.signed;              
        //         const nRaw   = toNum(val);
        //         const n      = signed ? nRaw : Math.abs(nRaw);
        //         if (n === 0) return n.toFixed(2);

        //   const href = resolveInternalSuitelet({
        //     sl_action: act,
        //     sl_jobid:  projectId,
        //     sl_code:   codeText,
        //     sl_from:   toStr(fromDate, ""),
        //     sl_to:     toStr(uptoDate, "")
        //   });
        //   return `<a href="${href}" target="_blank">${n.toFixed(2)}</a>`;
        //     };

        const mkLinkAbs = (val, act, projectId, codeText) => {
        const n = Math.abs(toNum(val));
        if (n === 0) return "0.00";
        return `<a href="${resolveInternalSuitelet({
            sl_action: act, sl_jobid: projectId, sl_code: codeText,
            sl_from: toStr(fromDate, ""), sl_to: toStr(uptoDate, "")
        })}" target="_blank">${formatAmount(n)}</a>`;
        };

        const mkLinkSigned = (val, act, projectId, codeText) => {
        const n = toNum(val);
        if (n === 0) return "0.00";
        return `<a href="${resolveInternalSuitelet({
            sl_action: act, sl_jobid: projectId, sl_code: codeText,
            sl_from: toStr(fromDate, ""), sl_to: toStr(uptoDate, "")
        })}" target="_blank">${formatAmount(n)}</a>`;
        };


        const projectLines = Object.entries(projectObject).sort((a, b) => {
        const aT = Date.parse(toStr(a[1].creationDate, "")) || -Infinity;
        const bT = Date.parse(toStr(b[1].creationDate, "")) || -Infinity;
        return aT - bT;
        });

        let count = 0;
        for (; count < projectLines.length; count++) {
        const [projectId, p] = projectLines[count];
        const t = transactionObject[projectId];

        const jobUrl = resolveRecordInternal("job", projectId);
        const codeText = toStr(p.code);
        const codeCell = jobUrl ? `<a href="${jobUrl}" target="_blank">${codeText}</a>` : codeText;

        const soAmount = Math.abs(toNum(t.soValue));
        let soCell = formatAmount(soAmount);
        if (soAmount > 0) {
            const detailUrl = resolveInternalSuitelet({
            sl_action: "so_list",
            sl_code: codeText,
            sl_from: toStr(fromDate, ""),
            sl_to: toStr(uptoDate, "")
            });
            soCell = `<a href="${detailUrl}" target="_blank">${formatAmount(soAmount)}</a>`;
        }

        const jvSalesCell = mkLinkSigned(t.jvSale, "jv_sales", projectId, codeText);
        const jvPurchCell = mkLinkSigned(t.jvPurchase, "jv_purchases", projectId, codeText);

        sublist.setSublistValue({ id: "custpage_creation_date", line: count, value: toStr(p.creationDate) });
        sublist.setSublistValue({ id: "custpage_location", line: count, value: toStr(p.location) });
        sublist.setSublistValue({ id: "custpage_department", line: count, value: toStr(p.department) });
        //   sublist.setSublistValue({ id: "custpage_customer",      line: count, value: toStr(p.customer) });
        sublist.setSublistValue({ id: "custpage_customer", line: count, value: cleanDisplayName(toStr(p.customer), true) });
        sublist.setSublistValue({ id: "custpage_code", line: count, value: codeCell });
        sublist.setSublistValue({ id: "custpage_billing_budget", line: count, value: toStr(formatAmount(p.billingBudget)) });
        sublist.setSublistValue({ id: "custpage_so_value", line: count, value: soCell });
        sublist.setSublistValue({ id: "custpage_sb_value", line: count, value: mkLinkSigned(t.sbValue, "sb_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_jv_sale", line: count, value: jvSalesCell });
        sublist.setSublistValue({ id: "custpage_cn_value", line: count, value: mkLinkSigned(t.cnValue, "cn_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_net_sale", line: count, value: mkLinkSigned(t.netSale, "net_sales", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_cost_budget_history", line: count, value: toStr(formatAmount(p.costBudget)) });
        sublist.setSublistValue({ id: "custpage_po_value", line: count, value: mkLinkSigned(t.poValue, "po_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_pb_value", line: count, value: mkLinkSigned(t.pbValue, "pb_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_exp_report", line: count, value: mkLinkSigned(t.expReport, "er_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_total_po", line: count, value: mkLinkSigned(t.totalPO, "totpo_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_total_pb", line: count, value: mkLinkSigned(t.totalPB, "totpb_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_jv_purchase", line: count, value: jvPurchCell });
        sublist.setSublistValue({ id: "custpage_dn_value", line: count, value: mkLinkSigned(t.dnValue, "dn_list", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_net_expense", line: count, value: mkLinkSigned(t.netExpense, "net_expense", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_gross_expense", line: count, value: mkLinkSigned(t.grossExpense, "gross_expense", projectId, codeText) });
        sublist.setSublistValue({ id: "custpage_planned_margin", line: count, value: ((toNum(t.plannedMargin)).toFixed(2)) });
        sublist.setSublistValue({ id: "custpage_actual_margin", line: count, value: ((toNum(t.actualMargin)).toFixed(2)) });
        sublist.setSublistValue({ id: "custpage_actual_margin_percent", line: count, value: (toNum(t.actualMarginPercent)).toFixed(2) });
        }
        log.debug('count', count)


        sublist.setSublistValue({ id: "custpage_creation_date", line: count, value: "<b>Total</b>" });
        sublist.setSublistValue({ id: "custpage_so_value", line: count, value: "<b>" + formatAmount(totalObject.soValue) + "</b>" });
        sublist.setSublistValue({ id: "custpage_sb_value", line: count, value: "<b>" + formatAmount(totalObject.sbValue) + "</b>" });
        sublist.setSublistValue({ id: "custpage_jv_sale", line: count, value: "<b>" + formatAmount(totalObject.jvSale) + "</b>" });
        sublist.setSublistValue({ id: "custpage_cn_value", line: count, value: "<b>" + formatAmount(totalObject.cnValue) + "</b>" });
        sublist.setSublistValue({ id: "custpage_net_sale", line: count, value: "<b>" + formatAmount(toNum(totalObject.netSale)) + "</b>" });
        sublist.setSublistValue({ id: "custpage_po_value", line: count, value: "<b>" + formatAmount(totalObject.poValue) + "</b>" });
        sublist.setSublistValue({ id: "custpage_pb_value", line: count, value: "<b>" + formatAmount(totalObject.pbValue) + "</b>" });
        sublist.setSublistValue({ id: "custpage_exp_report", line: count, value: "<b>" + formatAmount(totalObject.expReport) + "</b>" });
        sublist.setSublistValue({ id: "custpage_total_po",  line: count, value: "<b>" + formatAmount(totalObject.totalPO) + "</b>" });
        sublist.setSublistValue({ id: "custpage_total_pb",  line: count, value: "<b>" + formatAmount(totalObject.totalPB) + "</b>" });
        sublist.setSublistValue({ id: "custpage_jv_purchase", line: count, value: "<b>" + formatAmount(totalObject.jvPurchase) + "</b>" });
        sublist.setSublistValue({ id: "custpage_dn_value", line: count, value: "<b>" + formatAmount(totalObject.dnValue) + "</b>" });
        sublist.setSublistValue({ id: "custpage_net_expense", line: count, value: "<b>" + formatAmount(toNum(totalObject.netExpense)) + "</b>" });
        sublist.setSublistValue({ id: "custpage_gross_expense", line: count, value: "<b>" + formatAmount(toNum(totalObject.grossExpense)) + "</b>" });
        sublist.setSublistValue({ id: "custpage_planned_margin", line: count, value: "<b>" + formatAmount(totalObject.plannedMargin) + "</b>" });
        sublist.setSublistValue({ id: "custpage_actual_margin", line: count, value: "<b>" + formatAmount(totalObject.actualMargin) + "</b>" });
        sublist.setSublistValue({ id: "custpage_billing_budget", line: count, value: "<b>" + formatAmount(totalObject.billingBudget) + "</b>" });
        sublist.setSublistValue({ id: "custpage_cost_budget_history", line: count, value: "<b>" + formatAmount(totalObject.costBudget) + "</b>" });

        return form;
    };


    const renderSalesOrdersForProjectCode = ({ projectCode, fromDate, uptoDate }) => {
        const title = `Sales Orders for Project Code ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_so_list", type: serverWidget.SublistType.LIST, label: "Sales Orders (including Delegates)" });
        sl.addField({ id: "col_voucher", type: serverWidget.FieldType.TEXT, label: "Voucher #" });
        sl.addField({ id: "col_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sl.addField({ id: "col_entity", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sl.addField({ id: "col_projcode", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sl.addField({ id: "col_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sl.addField({ id: "col_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
        sl.addField({ id: "col_createdby", type: serverWidget.FieldType.TEXT, label: "Created By" });


        const regResults = searchSalesOrdersByProjectCode(projectCode, fromDate, uptoDate);

        const delResults = searchDelegatedSOsByProjectCode(projectCode, fromDate, uptoDate);


        const results = regResults.concat(delResults).sort((a, b) => {
        const da = Date.parse(toStr(a.getValue({ name: "trandate" }), "")) || 0;
        const db = Date.parse(toStr(b.getValue({ name: "trandate" }), "")) || 0;
        if (da !== db) return da - db;
        const ta = toStr(a.getValue({ name: "tranid" }), "");
        const tb = toStr(b.getValue({ name: "tranid" }), "");
        return ta.localeCompare(tb);
        });

        if (!results.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No Sales Orders found (including delegates) for this project code and date range.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        results.forEach(r => {
        const soId = r.getValue({ name: 'internalid' });
        const tranid = r.getValue({ name: 'tranid' }) || '';
        const voucher = toStr(r.getValue({ name: 'custbody_voucher_number' })) || tranid;
        const soHref = resolveRecordInternal("salesorder", soId);
        const vouLink = soHref ? `<a href="${soHref}" target="_blank">${voucher}</a>` : voucher;
        // const amount = toNum(r.getValue({ name: 'amount' }));
        //     const entityRaw   = toStr(r.getText({ name: 'mainname' })) || 'None';
        // const entityClean = entityRaw.indexOf(' : ') >= 0 ? entityRaw.split(' : ')[0] : entityRaw;
       const rawAmt = toNum(r.getValue({ name: 'amount' }));   
       const amountText = formatAmount(Math.abs(rawAmt));    
       const entityRaw = toStr(r.getText({ name: 'mainname' })) || 'None';
       const entityClean = cleanDisplayName(entityRaw, true);
       total += Math.abs(rawAmt);

        sl.setSublistValue({ id: "col_voucher", line: i, value: vouLink });
        sl.setSublistValue({ id: "col_date", line: i, value: toStr(r.getValue({ name: 'trandate' })) });
        sl.setSublistValue({ id: "col_entity", line: i, value: entityClean });
        sl.setSublistValue({ id: "col_projcode", line: i, value: toStr(r.getValue({ name: 'formulatext' })) });
        sl.setSublistValue({ id: "col_account", line: i, value: toStr(r.getText({ name: 'account' })) });
        sl.setSublistValue({ id: "col_amount", line: i, value: amountText });
        sl.setSublistValue({ id: "col_createdby", line: i, value: cleanDisplayName(toStr(r.getText({ name: 'createdby' })), true) });
        i++;
        });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };

    const renderSalesOrdersForProject = ({ jobId, code, fromDate, uptoDate }) => {
        const title = `Sales Orders for Project ${toStr(code)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Internal ID#: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_so_list", type: serverWidget.SublistType.LIST, label: "Sales Orders" });
        sl.addField({ id: "col_voucher", type: serverWidget.FieldType.TEXT, label: "Voucher #" });
        sl.addField({ id: "col_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sl.addField({ id: "col_entity", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sl.addField({ id: "col_projcode", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sl.addField({ id: "col_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sl.addField({ id: "col_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
        sl.addField({ id: "col_createdby", type: serverWidget.FieldType.TEXT, label: "Created By" });

        const results = searchSalesOrdersByProject_Exact(jobId, fromDate, uptoDate);
        if (!results.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No Sales Orders found for this project and date range.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        results.forEach(r => {
        const soId = r.getValue({ name: 'internalid' });
        const tranid = r.getValue({ name: 'tranid' }) || '';
        const voucher = toStr(r.getValue({ name: 'custbody_voucher_number' })) || tranid;
        const soHref = resolveRecordInternal("salesorder", soId);
        const voucherLink = soHref ? `<a href="${soHref}" target="_blank">${voucher}</a>` : voucher;

        const amount = Math.abs(toNum(r.getValue({ name: 'amount' })));
        total += amount;

        sl.setSublistValue({ id: "col_voucher", line: i, value: voucherLink });
        sl.setSublistValue({ id: "col_date", line: i, value: toStr(r.getValue({ name: 'trandate' })) });
        sl.setSublistValue({ id: "col_entity", line: i, value: toStr(r.getText({ name: 'entity' })) });
        sl.setSublistValue({ id: "col_projcode", line: i, value: toStr(r.getValue({ name: 'formulatext' })) });
        sl.setSublistValue({ id: "col_account", line: i, value: toStr(r.getText({ name: 'account' })) });
        sl.setSublistValue({ id: "col_amount", line: i, value: toStr(formatAmount(amount)) });
        sl.setSublistValue({ id: "col_createdby", line: i, value: cleanDisplayName(toStr(r.getText({ name: 'createdby' })), true) });
        i++;
        });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };


    const renderTxnLinesByCodePlusJob = ({ jobId, projectCode, fromDate, uptoDate, nsTypes, pageLabel }) => {
        const title = `${toStr(pageLabel)} for Project Code ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_txn_list", type: serverWidget.SublistType.LIST, label: toStr(pageLabel) });
        addCommonDetailColumns(sl);


        const regular = jobId ? searchTxnByJob(jobId, fromDate, uptoDate, nsTypes) : [];

        const delegates = searchDelegatedTxnsByProjectCode(projectCode, fromDate, uptoDate, nsTypes);


        const combined = regular.concat(delegates).sort(sortByDateThenType);
        const seen = new Set();
        const rows = [];
        for (const r of combined) {
        const key = `${r.getValue({ name: 'internalid' })}-${r.getValue({ name: 'lineuniquekey' }) || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(r);
        }

        if (!rows.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = `<div style='padding:10px;color:#555;'>No ${toStr(pageLabel)} found for this project code and date range.</div>`;
        return form;
        }

        let i = 0, total = 0.0;
        rows.forEach(r => { total += pushTxnRow(sl, i++, r, /*isJournal*/ false, /*keepSign*/ false); });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };

        const renderTxnLinesByCodePlusJobtotalpopb = ({ jobId, projectCode, fromDate, uptoDate, nsTypes, pageLabel }) => {
        const title = `${toStr(pageLabel)} for Project Code ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_txn_list", type: serverWidget.SublistType.LIST, label: toStr(pageLabel) });
        addCommonDetailColumns(sl);


        const regular = jobId ? searchTxnByJobtotalpopb(jobId, fromDate, uptoDate, nsTypes) : [];

        if (!regular.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = `<div style='padding:10px;color:#555;'>No ${toStr(pageLabel)} found for this project code and date range.</div>`;
        return form;
        }

        let i = 0, total = 0.0;
        regular.forEach(r => { total += pushTxnRow(sl, i++, r, /*isJournal*/ false, /*keepSign*/ false); });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };
    

    const renderJvSalesByJob = ({ jobId, projectCode, fromDate, uptoDate }) => {
        const title = `Journals (Sales) for Project Code ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_jv_s_list", type: serverWidget.SublistType.LIST, label: "Journals (Sales)" });
        sl.addField({ id: "col_voucher", type: serverWidget.FieldType.TEXT, label: "Voucher #" });
        sl.addField({ id: "col_type", type: serverWidget.FieldType.TEXT, label: "Type" });
        sl.addField({ id: "col_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sl.addField({ id: "col_entity", type: serverWidget.FieldType.TEXT, label: "Customer" });
        sl.addField({ id: "col_projcode", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sl.addField({ id: "col_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sl.addField({ id: "col_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
        sl.addField({ id: "col_createdby", type: serverWidget.FieldType.TEXT, label: "Created By" });

        const results = searchJvSalesByJob(jobId, fromDate, uptoDate);
        if (!results.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No JV (Sales) found for this project code and date range.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        results.forEach(r => {
        const id = r.getValue({ name: "internalid" });
        const tran = r.getValue({ name: "tranid" }) || "";
        const voucher = toStr(r.getValue({ name: "custbody_voucher_number" })) || tran;
        const href = resolveRecordInternal("journalentry", id);
        const link = href ? `<a href="${href}" target="_blank">${voucher}</a>` : voucher;
        const amt = Math.abs(toNum(r.getValue({ name: "amount" })));
        total += amt;

        sl.setSublistValue({ id: "col_voucher", line: i, value: link });
        sl.setSublistValue({ id: "col_type", line: i, value: toStr(r.getText({ name: "type" })) || "Journal" });
        sl.setSublistValue({ id: "col_date", line: i, value: toStr(r.getValue({ name: "trandate" })) });
        //   sl.setSublistValue({ id:"col_entity",    line:i, value: toStr(r.getText({ name:"mainname" })) });
        sl.setSublistValue({ id: "col_entity", line: i, value: cleanDisplayName(toStr(r.getText({ name: "mainname" }))) });
        sl.setSublistValue({ id: "col_projcode", line: i, value: toStr(r.getValue({ name: "formulatext" })) });
        sl.setSublistValue({ id: "col_account", line: i, value: toStr(r.getText({ name: "account" })) });
        sl.setSublistValue({ id: "col_amount", line: i, value: toStr(formatAmount(amt)) });
        //   sl.setSublistValue({ id:"col_createdby", line:i, value: toStr(r.getText({ name:"createdby" })) });
        sl.setSublistValue({ id: "col_createdby", line: i, value: cleanDisplayName(toStr(r.getText({ name: "createdby" })), true) });
        i++;
        });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };

    const renderJvPurchByJob = ({ jobId, projectCode, fromDate, uptoDate }) => {
        const title = `Journals (Purchases) for Project Code ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_jv_p_list", type: serverWidget.SublistType.LIST, label: "Journals (Purchases)" });
        sl.addField({ id: "col_voucher", type: serverWidget.FieldType.TEXT, label: "Voucher #" });
        sl.addField({ id: "col_type", type: serverWidget.FieldType.TEXT, label: "Type" });
        sl.addField({ id: "col_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sl.addField({ id: "col_entity", type: serverWidget.FieldType.TEXT, label: "Vendor" });
        sl.addField({ id: "col_projcode", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sl.addField({ id: "col_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sl.addField({ id: "col_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
        sl.addField({ id: "col_createdby", type: serverWidget.FieldType.TEXT, label: "Created By" });

        const results = searchJvPurchByJob(jobId, fromDate, uptoDate);
        if (!results.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No JV (Purchases) found for this project code and date range.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        results.forEach(r => {
        const id = r.getValue({ name: "internalid" });
        const tran = r.getValue({ name: "tranid" }) || "";
        const voucher = toStr(r.getValue({ name: "custbody_voucher_number" })) || tran;
        const href = resolveRecordInternal("journalentry", id);
        const link = href ? `<a href="${href}" target="_blank">${voucher}</a>` : voucher;
        const amt = Math.abs(toNum(r.getValue({ name: "amount" })));
        total += amt;

        sl.setSublistValue({ id: "col_voucher", line: i, value: link });
        sl.setSublistValue({ id: "col_type", line: i, value: toStr(r.getText({ name: "type" })) || "Journal" });
        sl.setSublistValue({ id: "col_date", line: i, value: toStr(r.getValue({ name: "trandate" })) });
        sl.setSublistValue({ id: "col_entity", line: i, value: toStr(r.getText({ name: "mainname" })) });
        sl.setSublistValue({ id: "col_projcode", line: i, value: toStr(r.getValue({ name: "formulatext" })) });
        sl.setSublistValue({ id: "col_account", line: i, value: toStr(r.getText({ name: "account" })) });
        sl.setSublistValue({ id: "col_amount", line: i, value: toStr(formatAmount(amt)) });
        //   sl.setSublistValue({ id:"col_createdby", line:i, value: toStr(r.getText({ name:"createdby" })) });
        sl.setSublistValue({ id: "col_createdby", line: i, value: cleanDisplayName(toStr(r.getText({ name: "createdby" })), true) });
        i++;
        });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };


    const renderTxnLinesByJob = ({ jobId, projectCode, fromDate, uptoDate, nsTypes, pageLabel }) => {
        const title = `${toStr(pageLabel)} for Project Code ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });

        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_txn_list", type: serverWidget.SublistType.LIST, label: toStr(pageLabel) });
        sl.addField({ id: "col_voucher", type: serverWidget.FieldType.TEXT, label: "Voucher #" });
        sl.addField({ id: "col_type", type: serverWidget.FieldType.TEXT, label: "Type" });
        sl.addField({ id: "col_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sl.addField({ id: "col_entity", type: serverWidget.FieldType.TEXT, label: "Vendor" });
        sl.addField({ id: "col_projcode", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sl.addField({ id: "col_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sl.addField({ id: "col_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
        sl.addField({ id: "col_createdby", type: serverWidget.FieldType.TEXT, label: "Created By" });

        const results = searchTxnByJob(jobId, fromDate, uptoDate, nsTypes);
        if (!results.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = `<div style='padding:10px;color:#555;'>No ${toStr(pageLabel)} found for this project and date range.</div>`;
        return form;
        }

        let i = 0, total = 0.0;
        results.forEach(r => {
        const id = r.getValue({ name: "internalid" });
        const tran = r.getValue({ name: "tranid" }) || "";
        const voucher = toStr(r.getValue({ name: "custbody_voucher_number" })) || tran;
        const typeText = toStr(r.getText({ name: "type" }));
        const recType = TXN_TYPE_TO_SCRIPTID[typeText] || "transaction";
        const href = resolveRecordInternal(recType, id);
        const voucherLink = href ? `<a href="${href}" target="_blank">${voucher}</a>` : voucher;
        const amt = Math.abs(toNum(r.getValue({ name: "amount" })));
        total += amt;

        sl.setSublistValue({ id: "col_voucher", line: i, value: voucherLink });
        sl.setSublistValue({ id: "col_type", line: i, value: typeText });
        sl.setSublistValue({ id: "col_date", line: i, value: toStr(r.getValue({ name: "trandate" })) });
        sl.setSublistValue({ id: "col_entity", line: i, value: toStr(r.getText({ name: "mainname" })) || toStr(r.getText({ name: "entity" })) });
        sl.setSublistValue({ id: "col_projcode", line: i, value: toStr(r.getValue({ name: "formulatext" })) });
        sl.setSublistValue({ id: "col_account", line: i, value: toStr(r.getText({ name: "account" })) });
        sl.setSublistValue({ id: "col_amount", line: i, value: toStr(formatAmount(amt)) });
        sl.setSublistValue({ id: "col_createdby", line: i, value: cleanDisplayName(toStr(r.getText({ name: "createdby" })), true) });
        i++;
        });

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };


    const addCommonDetailColumns = (sl) => {
        sl.addField({ id: "col_voucher", type: serverWidget.FieldType.TEXT, label: "Voucher #" });
        sl.addField({ id: "col_type", type: serverWidget.FieldType.TEXT, label: "Type" });
        sl.addField({ id: "col_date", type: serverWidget.FieldType.TEXT, label: "Date" });
        sl.addField({ id: "col_entity", type: serverWidget.FieldType.TEXT, label: "Customer/Vendor" });
        sl.addField({ id: "col_projcode", type: serverWidget.FieldType.TEXT, label: "Project Code" });
        sl.addField({ id: "col_account", type: serverWidget.FieldType.TEXT, label: "Account" });
        sl.addField({ id: "col_amount", type: serverWidget.FieldType.TEXT, label: "Amount" });
        sl.addField({ id: "col_createdby", type: serverWidget.FieldType.TEXT, label: "Created By" });
    };

    const pushTxnRow = (sl, lineIdx, rec, isJournal, keepSign = false) => {
        const id = rec.getValue({ name: "internalid" });
        const tranid = rec.getValue({ name: "tranid" }) || "";
        const voucher = toStr(rec.getValue({ name: "custbody_voucher_number" })) || tranid;
        const typeText = toStr(rec.getText({ name: "type" })) || (isJournal ? "Journal" : "");
        const recType = isJournal ? "journalentry" : (TXN_TYPE_TO_SCRIPTID[typeText] || "transaction");
        const href = resolveRecordInternal(recType, id);
        const voucherLink = href ? `<a href="${href}" target="_blank">${voucher}</a>` : voucher;
        const rawAmt = toNum(rec.getValue({ name: "amount" }));
        const amt = keepSign ? rawAmt : Math.abs(rawAmt);
        const entityTxt = cleanDisplayName(toStr(rec.getText({ name: isJournal ? "entity" : "mainname" })) || toStr(rec.getText({ name: "entity" })), true);
        const projCode = toStr(rec.getValue({ name: "formulatext" }));
        const account = toStr(rec.getText({ name: "account" }));
        const trandate = toStr(rec.getValue({ name: "trandate" }));
        const createdBy = cleanDisplayName(toStr(rec.getText({ name: "createdby" })), true);

        sl.setSublistValue({ id: "col_voucher", line: lineIdx, value: voucherLink });
        sl.setSublistValue({ id: "col_type", line: lineIdx, value: typeText });
        sl.setSublistValue({ id: "col_date", line: lineIdx, value: trandate });
        sl.setSublistValue({ id: "col_entity", line: lineIdx, value: entityTxt });
        sl.setSublistValue({ id: "col_projcode", line: lineIdx, value: projCode });
        sl.setSublistValue({ id: "col_account", line: lineIdx, value: account });
        sl.setSublistValue({ id: "col_amount", line: lineIdx, value: toStr(formatAmount(amt)) });
        sl.setSublistValue({ id: "col_createdby", line: lineIdx, value: createdBy });
        return amt;
    };

    const sortByDateThenType = (a, b) => {
        const ad = Date.parse(toStr(a.getValue({ name: "trandate" }), "")) || 0;
        const bd = Date.parse(toStr(b.getValue({ name: "trandate" }), "")) || 0;
        if (ad !== bd) return ad - bd;
        const at = toStr(a.getText({ name: "type" }), "");
        const bt = toStr(b.getText({ name: "type" }), "");
        return at.localeCompare(bt);
    };

    // Net Sales = Invoice + JV (S) + CN
    //   const renderNetSalesByJob = ({ jobId, projectCode, fromDate, uptoDate }) => {
    //     const title = `Net Sales ${toStr(projectCode)} [ ${toStr(fromDate,"-")} to ${toStr(uptoDate,"-")} ]`;
    //     const form  = serverWidget.createForm({ title });
    //     form.addField({ id:"custpage_info", type: serverWidget.FieldType.INLINEHTML, label:" " })
    //       .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

    //     const sl = form.addSublist({ id:"custpage_net_sales", type: serverWidget.SublistType.LIST, label:"Net Sales Components" });
    //     addCommonDetailColumns(sl);

    //     const invAndCn = searchTxnByJob(jobId, fromDate, uptoDate, ["CustInvc", "CustCred"]);
    //     const jvSales  = searchJvSalesByJob(jobId, fromDate, uptoDate);

    //     const rowsTxn = invAndCn.slice().sort(sortByDateThenType);
    //     const rowsJv  = jvSales.slice().sort(sortByDateThenType);

    //     if (!rowsTxn.length && !rowsJv.length) {
    //       form.addField({ id:"custpage_msg", type: serverWidget.FieldType.INLINEHTML, label:" " })
    //         .defaultValue = "<div style='padding:10px;color:#555;'>No Net Sales components in this period.</div>";
    //       return form;
    //     }

    //     let i = 0, total = 0.0;
    //     rowsTxn.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ false, true));
    //     rowsJv.forEach(r  => total += pushTxnRow(sl, i++, r, /*isJournal*/ true, true));

    //     sl.setSublistValue({ id:"col_voucher", line:i, value:"<b>Total</b>" });
    //     sl.setSublistValue({ id:"col_amount",  line:i, value:"<b>"+ total.toFixed(2) +"</b>" });
    //     return form;
    //   };
    const renderNetSalesByJob = ({ jobId, projectCode, fromDate, uptoDate }) => {
        const title = `Net Sales ${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });
        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_net_sales", type: serverWidget.SublistType.LIST, label: "Net Sales Components (incl. Delegates for SB/CN)" });
        addCommonDetailColumns(sl);


        const regInvCn = searchTxnByJob(jobId, fromDate, uptoDate, ["CustInvc", "CustCred"]);
        const delInvCn = searchDelegatedTxnsByProjectCode(projectCode, fromDate, uptoDate, ["CustInvc", "CustCred"]);

        const invCnCombined = regInvCn.concat(delInvCn).sort(sortByDateThenType);
        const seen = new Set();
        const rowsInvCn = [];
        for (const r of invCnCombined) {
        const key = `${r.getValue({ name: 'internalid' })}-${r.getValue({ name: 'lineuniquekey' }) || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rowsInvCn.push(r);
        }


        const rowsJv = searchJvSalesByJob(jobId, fromDate, uptoDate).slice().sort(sortByDateThenType);

        if (!rowsInvCn.length && !rowsJv.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No Net Sales components in this period.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        rowsInvCn.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ false, /*keepSign*/ true));
        rowsJv.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ true,  /*keepSign*/ true));

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };

    // Net Expense = Bill + Expense Report + JV (P) + DN
    const renderNetExpenseByJob = ({ jobId, projectCode, fromDate, uptoDate }) => {
        const title = `${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });
        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_net_exp", type: serverWidget.SublistType.LIST, label: "Net Expense Components" });
        addCommonDetailColumns(sl);

        const billsAndErDn = searchTxnByJob(jobId, fromDate, uptoDate, ["VendBill", "ExpRept", "VendCred"]); // PB + ER + DN
        const jvPurch = searchJvPurchByJob(jobId, fromDate, uptoDate);

        const rowsTxn = billsAndErDn.slice().sort(sortByDateThenType);
        const rowsJv = jvPurch.slice().sort(sortByDateThenType);

        if (!rowsTxn.length && !rowsJv.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No Net Expense components in this period.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        rowsTxn.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ false, true));
        rowsJv.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ true, true));

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };


    const renderGrossExpenseByJob = ({ jobId, projectCode, fromDate, uptoDate }) => {
        const title = `${toStr(projectCode)} [ ${toStr(fromDate, "-")} to ${toStr(uptoDate, "-")} ]`;
        const form = serverWidget.createForm({ title });
        form.addField({ id: "custpage_info", type: serverWidget.FieldType.INLINEHTML, label: " " })
        .defaultValue = `<div style="padding:6px 0;">Project Code: <b>${toStr(projectCode)}</b> &nbsp; Job ID: <b>${toStr(jobId)}</b></div>`;

        const sl = form.addSublist({ id: "custpage_gross_exp", type: serverWidget.SublistType.LIST, label: "Gross Expense Components" });
        addCommonDetailColumns(sl);

        const poAndDn = searchTxnByJob(jobId, fromDate, uptoDate, ["PurchOrd", "VendCred"]);
        const jvPurch = searchJvPurchByJob(jobId, fromDate, uptoDate);

        const rowsTxn = poAndDn.slice().sort(sortByDateThenType);
        const rowsJv = jvPurch.slice().sort(sortByDateThenType);

        if (!rowsTxn.length && !rowsJv.length) {
        form.addField({ id: "custpage_msg", type: serverWidget.FieldType.INLINEHTML, label: " " })
            .defaultValue = "<div style='padding:10px;color:#555;'>No Gross Expense components in this period.</div>";
        return form;
        }

        let i = 0, total = 0.0;
        rowsTxn.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ false, true));
        rowsJv.forEach(r => total += pushTxnRow(sl, i++, r, /*isJournal*/ true, true));

        sl.setSublistValue({ id: "col_voucher", line: i, value: "<b>Total</b>" });
        sl.setSublistValue({ id: "col_amount", line: i, value: "<b>" + toStr(formatAmount(total)) + "</b>" });
        return form;
    };

    const searchDelegatedSOsByProjectCode = (projectCode, fromDate, uptoDate) => {

        const segTrimExpr =
        "CASE " +
        "WHEN {cseg_ags_projectcod} IS NOT NULL THEN " +
        "  (CASE WHEN INSTR({cseg_ags_projectcod}, ' ') > 0 " +
        "        THEN SUBSTR({cseg_ags_projectcod}, 1, INSTR({cseg_ags_projectcod}, ' ') - 1) " +
        "        ELSE {cseg_ags_projectcod} END) " +
        "ELSE NULL END";
        log.debug('code', segTrimExpr);

        const filters = [
        ["taxline", "is", "F"], "AND",
        ["customgl", "is", "F"], "AND",
        ["mainline", "is", "F"], "AND",
        ["job.internalidnumber", "isempty", ""], "AND",
        ["type", "anyof", "SalesOrd"], "AND",
        ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
        ["formulatext: " + segTrimExpr, "is", toStr(projectCode, "")], "AND",
        ["voided", "is", "F"]
        ];

        const cols = [
        search.createColumn({ name: "tranid" }),
        search.createColumn({ name: "internalid" }),
        search.createColumn({ name: "trandate" }),
        search.createColumn({ name: "entity" }),
        search.createColumn({ name: "mainname" }),
        search.createColumn({ name: "custbody_voucher_number" }),
        search.createColumn({ name: "formulatext", formula: segTrimExpr }),
        search.createColumn({ name: "account" }),
        search.createColumn({ name: "amount" }),
        search.createColumn({ name: "createdby" })
        ];

        const s = search.create({
        type: "salesorder",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters,
        columns: cols
        });

        return getAllResult(s);
    };

    const searchSalesOrdersByProject_Exact = (jobId, fromDate, uptoDate) => {
        const filters = [
        ["taxline", "is", "F"], "AND",
        ["customgl", "is", "F"], "AND",
        ["mainline", "is", "F"], "AND",
        ["job.internalidnumber", "isnotempty", ""], "AND",
        ["type", "anyof", "SalesOrd"], "AND",
        ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
        ["job.internalidnumber", "equalto", toStr(jobId, "")], "AND",
        ["voided", "is", "F"]
        ];

        const cols = [
        search.createColumn({ name: "tranid" }),
        search.createColumn({ name: "internalid" }),
        search.createColumn({ name: "trandate" }),
        search.createColumn({ name: "entity" }),
        search.createColumn({ name: "custbody_voucher_number" }),
        search.createColumn({
            name: "formulatext",
            formula: "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END"
        }),
        search.createColumn({ name: "account" }),
        search.createColumn({ name: "amount" }),
        search.createColumn({ name: "createdby" })
        ];

        const s = search.create({
        type: "salesorder",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters,
        columns: cols
        });

        return getAllResult(s);
    };


    const searchSalesOrdersByProjectCode = (projectCode, fromDate, uptoDate) => {
        // const codeExpr =
        //   "CASE WHEN {job.entityid} IS NOT NULL THEN " +
        //   "CASE WHEN INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END " +
        //   "WHEN {cseg_ags_projectcod} IS NOT NULL THEN " +
        //   "CASE WHEN INSTR({cseg_ags_projectcod}, ' ') > 0 THEN SUBSTR({cseg_ags_projectcod}, 1, INSTR({cseg_ags_projectcod}, ' ') - 1) ELSE {cseg_ags_projectcod} END " +
        //   "ELSE NULL END";

        const jobCodeExpr =
        "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 " +
        "THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) " +
        "ELSE {job.entityid} END";

        const filters = [
        ["taxline", "is", "F"], "AND",
        ["customgl", "is", "F"], "AND",
        ["mainline", "is", "F"], "AND",
        ["job.internalidnumber", "isnotempty", ""], "AND",
        ["type", "anyof", "SalesOrd"], "AND",
        ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
        ["formulatext: " + jobCodeExpr, "is", toStr(projectCode, "")], "AND",
        ["voided", "is", "F"]
        ];

        const cols = [
        search.createColumn({ name: "tranid" }),
        search.createColumn({ name: "internalid" }),
        search.createColumn({ name: "trandate" }),
        search.createColumn({ name: "mainname" }),
        search.createColumn({ name: "custbody_voucher_number" }),
        search.createColumn({ name: "formulatext", formula: jobCodeExpr }),
        search.createColumn({ name: "account" }),
        search.createColumn({ name: "amount" }),
        search.createColumn({ name: "createdby" })
        ];

        const s = search.create({
        type: "salesorder",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters,
        columns: cols
        });

        return getAllResult(s);
    };

    const searchDelegatedTxnsByProjectCode = (projectCode, fromDate, uptoDate, nsTypes) => {
        const segTrimExpr =
        "CASE " +
        "WHEN {cseg_ags_projectcod} IS NOT NULL THEN " +
        "  (CASE WHEN INSTR({cseg_ags_projectcod}, ' ') > 0 " +
        "        THEN SUBSTR({cseg_ags_projectcod}, 1, INSTR({cseg_ags_projectcod}, ' ') - 1) " +
        "        ELSE {cseg_ags_projectcod} END) " +
        "ELSE NULL END";

        const s = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters: [
            ["taxline", "is", "F"], "AND",
            ["customgl", "is", "F"], "AND",
            ["mainline", "is", "F"], "AND",
            ["job.internalidnumber", "isempty", ""], "AND",
            ["type", "anyof"].concat(nsTypes), "AND",
            ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
            ["formulatext: " + segTrimExpr, "is", toStr(projectCode, "")], "AND",
            ["voided", "is", "F"]
        ],
        columns: [
            search.createColumn({ name: "tranid" }),
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "lineuniquekey" }),
            search.createColumn({ name: "type" }),
            search.createColumn({ name: "trandate" }),
            search.createColumn({ name: "custbody_voucher_number" }),
            search.createColumn({ name: "mainname" }),
            search.createColumn({ name: "account" }),
            search.createColumn({ name: "amount" }),
            search.createColumn({ name: "createdby" }),
            search.createColumn({ name: "formulatext", formula: segTrimExpr })
        ]
        });
        return getAllResult(s);
    };
    const searchJvSalesByJob = (jobId, fromDate, uptoDate) => {
        const codeExpr = "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END";

        const s = search.create({
        type: "journalentry",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters: [
            ["type", "anyof", "Journal"], "AND",
            ["job.internalidnumber", "isnotempty", ""], "AND",
            ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
            ["job.internalidnumber", "equalto", toStr(jobId, "")], "AND",
            ["accounttype", "anyof", "Income", "AcctRec"], "AND",
            ["voided", "is", "F"]
        ],
        columns: [
            search.createColumn({ name: "tranid" }),
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "type" }),
            search.createColumn({ name: "trandate" }),
            search.createColumn({ name: "custbody_voucher_number" }),
            search.createColumn({ name: "mainname" }),
            search.createColumn({ name: "account" }),
            search.createColumn({ name: "amount" }),
            search.createColumn({ name: "createdby" }),
            search.createColumn({ name: "formulatext", formula: codeExpr })
        ]
        });

        return getAllResult(s);
    };


    const searchJvPurchByJob = (jobId, fromDate, uptoDate) => {
        const codeExpr = "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END";

        const s = search.create({
        type: "journalentry",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters: [
            ["type", "anyof", "Journal"], "AND",
            ["job.internalidnumber", "isnotempty", ""], "AND",
            ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
            ["job.internalidnumber", "equalto", toStr(jobId, "")], "AND",
            ["accounttype", "anyof", "COGS", "AcctPay"], "AND",
            ["voided", "is", "F"]
        ],
        columns: [
            search.createColumn({ name: "tranid" }),
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "type" }),
            search.createColumn({ name: "trandate" }),
            search.createColumn({ name: "custbody_voucher_number" }),
            search.createColumn({ name: "mainname" }),
            search.createColumn({ name: "account" }),
            search.createColumn({ name: "amount" }),
            search.createColumn({ name: "createdby" }),
            search.createColumn({ name: "formulatext", formula: codeExpr })
        ]
        });

        return getAllResult(s);
    };


    const searchTxnByJob = (jobId, fromDate, uptoDate, nsTypes /* e.g., ["CustInvc"] */) => {
        const codeExpr = "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END";

        const s = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters: [
            ["taxline", "is", "F"], "AND",
            ["customgl", "is", "F"], "AND",
            ["mainline", "is", "F"], "AND",
            ["job.internalidnumber", "isnotempty", ""], "AND",
            ["type", "anyof"].concat(nsTypes), "AND",
            ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
            ["voided", "is", "F"],"AND",
            ["job.internalidnumber", "equalto", toStr(jobId, "")]
        ],
        columns: [
            search.createColumn({ name: "tranid" }),
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "lineuniquekey" }),
            search.createColumn({ name: "type" }),
            search.createColumn({ name: "trandate" }),
            search.createColumn({ name: "custbody_voucher_number" }),
            search.createColumn({ name: "mainname" }),
            search.createColumn({ name: "account" }),
            search.createColumn({ name: "amount" }),
            search.createColumn({ name: "createdby" }),
            search.createColumn({ name: "formulatext", formula: codeExpr })
        ]
        });

        return getAllResult(s);
    };

        const searchTxnByJobtotalpopb = (jobId, fromDate, uptoDate, nsTypes /* e.g., ["CustInvc"] */) => {

        const s = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters: [
            ["taxline", "is", "F"], "AND",
            ["customgl", "is", "F"], "AND",
            ["mainline", "is", "F"], "AND",
            ["job.internalidnumber", "isnotempty", ""], "AND",
            ["type", "anyof"].concat(nsTypes), "AND",
            ["trandate", "within", toStr(fromDate, ""), toStr(uptoDate, "")], "AND",
            ["voided", "is", "F"],"AND",
            ["job.internalidnumber", "equalto", toStr(jobId, "")]
        ],
        columns: [
            search.createColumn({ name: "tranid" }),
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "lineuniquekey" }),
            search.createColumn({ name: "type" }),
            search.createColumn({ name: "trandate" }),
            search.createColumn({ name: "custbody_voucher_number" }),
            search.createColumn({ name: "mainname" }),
            search.createColumn({ name: "account" }),
            search.createColumn({ name: "amount" }),
            search.createColumn({ name: "createdby" }),
        ]
        });

        return getAllResult(s);
    };

    const getProjectTransactions = (fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment) => {
        let filters = [
        ["type", "anyof", "SalesOrd", "VendCred", "CustInvc", "VendBill", "CustCred", "Journal", "PurchOrd", "ExpRept"],
        "AND", ["mainline", "any", ""],
        "AND", ["taxline", "is", "F"],
        "AND", ["trandate", "within", fromDate, uptoDate],
        "AND", ["voided", "is", "F"]
        ];
        if (selectedCustomers && selectedCustomers !== "" && selectedCustomers !== SEP) {
        const arr = selectedCustomers.split(SEP).filter(Boolean);
        if (arr.length) filters.push("AND", ["job.customer", "anyof", arr]);
        }
        if (selectedLocations && selectedLocations !== "" && selectedLocations !== SEP) {
        const arr = selectedLocations.split(SEP).filter(Boolean);
        if (arr.length) filters.push("AND", ["location", "anyof", arr]);
        }
        if (selectedDepartment && selectedDepartment !== "" && selectedDepartment !== SEP) {
        const arr = selectedDepartment.split(SEP).filter(Boolean);
        if (arr.length) filters.push("AND", ["department", "anyof", arr]);
        }
        const s = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters,

        columns: [
            search.createColumn({ name: "internalid", join: "job", summary: "GROUP" }),
            search.createColumn({ name: "formuladate", summary: "GROUP", formula: "{job.custentity_project_code_date}", lable : "Project Creation Date", sort: search.Sort.ASC }),
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL({job.custentity_subsidiary_loaction},' ' )" , label : "Location"}),
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL(REGEXP_SUBSTR({job.custentity_department}, '[^:]+$'),' ' )" , label : "Department" }),
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL({job.customer},' ' )" , label : "Customer" }),
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "CASE WHEN {job.entityid} IS NOT NULL AND INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END" , label: "Project Code" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Sales Order' AND ({custbody_approval_status}!='Rejected') THEN {amount} ELSE 0 END" , label : "SO Value"}),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Invoice' AND ({approvalstatus}!='Rejected') THEN {amount} ELSE 0 END" , label : "SB Value" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Journal' AND ({account.type}='Accounts Receivable' OR {account.type}='Income') AND ({approvalstatus}!='Rejected') THEN {amount} ELSE 0 END" , label : "JV(S) Value" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Credit Memo' THEN {amount} ELSE 0 END" , label : "CN Value"}),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Invoice' AND {posting}='T' THEN {amount} " + "WHEN {type}='Credit Memo' THEN {amount} " + "WHEN {type}='Journal' AND ({account.type}='Accounts Receivable' OR {account.type}='Income') AND {posting}='T' THEN {amount} " + "ELSE 0 END" , label : "Net Sales" }),
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL({job.custentity_billing_budget_history}, ' ')", label: "Billing Budget" }),
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "NVL({job.custentity_cost_budget_history}, ' ')", label: "Cost Budget" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Purchase Order' AND {approvalstatus}!='Rejected' THEN {amount} ELSE 0 END" , label : "PO Value"}),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Vendor Invoice' AND {approvalstatus}!='Rejected' THEN {amount} ELSE 0 END" , label : "PB Value"}),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Expense Report' AND {posting}='T' THEN {amount} ELSE 0 END" , label : "Expense Report"}),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Journal' AND ({account.type}='Accounts Payable' OR {account.type}='Cost of Goods Sold') AND ({approvalstatus}!='Rejected') THEN {amount} ELSE 0 END" ,label : "JV(P) Value" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Bill Credit' THEN {amount} ELSE 0 END" , label : "DN Value" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE " + "WHEN ({type}='Vendor Invoice' AND {approvalstatus}!='Rejected') THEN {amount} " + "WHEN ({type}='Expense Report' AND {posting}='T') THEN {amount} " + "WHEN {type}='Bill Credit' THEN {amount} " + "WHEN ({type}='Journal' AND ({account.type}='Accounts Payable' OR {account.type}='Cost of Goods Sold') AND {approvalstatus}!='Rejected') THEN {amount} " + "ELSE 0 END" , label : "Net Expense"  }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE " + "WHEN {type}='Purchase Order' AND {approvalstatus}!='Rejected' THEN {amount} " + "WHEN {type}='Journal' AND ({account.type}='Accounts Payable' OR {account.type}='Cost of Goods Sold') AND {approvalstatus}!='Rejected' THEN {amount} " + "WHEN {type}='Bill Credit' THEN {amount} " + "ELSE 0 END" , label : "Gross Expense" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type}='Sales Order' AND ({custbody_approval_status}!='Rejected') THEN {amount} " + "WHEN {type}='Purchase Order' AND {approvalstatus}!='Rejected' THEN -{amount} " + "ELSE 0 END" ,label : "Planned Margin" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "ABS(SUM(CASE WHEN {type}='Invoice' AND {posting}='T' THEN {amount} " + "WHEN {type}='Credit Memo' THEN {amount} " + "WHEN ({type}='Journal' AND ({account.type}='Accounts Receivable' OR {account.type}='Income') AND {posting}='T') THEN {amount} " + "ELSE 0 END)) - " + "ABS(SUM(CASE WHEN ({type}='Vendor Invoice' AND {approvalstatus}!='Rejected') THEN {amount} " + "WHEN ({type}='Expense Report' AND {posting}='T') THEN {amount} " + "WHEN {type}='Bill Credit' THEN {amount} " + "WHEN ({type}='Journal' AND ({account.type}='Accounts Payable' OR {account.type}='Cost of Goods Sold') AND {approvalstatus}!='Rejected') THEN {amount} " + "ELSE 0 END))" , label : "Actual Margin" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE    WHEN {type} = 'Purchase Order' AND {approvalstatus} != 'Rejected' THEN {amount}  WHEN {type} = 'Expense Report' AND {posting} = 'T' THEN {amount} ELSE 0  END", label: "Total PO"}),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE    WHEN {type} = 'Vendor Invoice' AND {approvalstatus} != 'Rejected' THEN {amount}  WHEN {type} = 'Expense Report' AND {posting} = 'T' THEN {amount} ELSE 0  END", label: "Total PB "}),
        ]
        });
        return getAllResult(s);
    };

    const getDeligateSoSbCn = (fromDate, uptoDate, selectedCustomers, selectedLocations, selectedDepartment) => {
        let filters = [
        ["job.internalidnumber", "isempty", ""],
        "AND", ["type", "anyof", "SalesOrd", "CustInvc", "CustCred"],
        "AND", ["trandate", "within", fromDate, uptoDate],
        "AND", ["mainline", "is", "F"],
        "AND", ["taxline", "is", "F"],
        "AND", ["voided", "is", "F"]
        ];
        if (selectedCustomers && selectedCustomers !== "" && selectedCustomers !== SEP) {
        const arr = selectedCustomers.split(SEP).filter(Boolean);
        if (arr.length) filters.push("AND", ["job.customer", "anyof", arr]);
        }
        if (selectedLocations && selectedLocations !== "" && selectedLocations !== SEP) {
        const arr = selectedLocations.split(SEP).filter(Boolean);
        if (arr.length) filters.push("AND", ["location", "anyof", arr]);
        }
        if (selectedDepartment && selectedDepartment !== "" && selectedDepartment !== SEP) {
        const arr = selectedDepartment.split(SEP).filter(Boolean);
        if (arr.length) filters.push("AND", ["department", "anyof", arr]);
        }
        const s = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters,
        columns: [
            search.createColumn({ name: "formulatext", summary: "GROUP", formula: "CASE WHEN {job.entityid} IS NOT NULL THEN CASE WHEN INSTR({job.entityid}, ' ') > 0 THEN SUBSTR({job.entityid}, 1, INSTR({job.entityid}, ' ') - 1) ELSE {job.entityid} END WHEN {cseg_ags_projectcod} IS NOT NULL THEN CASE WHEN INSTR({cseg_ags_projectcod}, ' ') > 0 THEN SUBSTR({cseg_ags_projectcod}, 1, INSTR({cseg_ags_projectcod}, ' ') - 1) ELSE {cseg_ags_projectcod} END ELSE NULL END" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Sales Order' AND ({custbody_approval_status} !='Rejected') THEN {amount} ELSE 0 END" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Invoice' AND( {approvalstatus} != 'Rejected')  THEN {amount} ELSE 0 END" }),
            search.createColumn({ name: "formulanumeric", summary: "SUM", formula: " CASE  WHEN {type} = 'Credit Memo'  THEN {amount} ELSE 0  END" })
        ]
        });
        return getAllResult(s);
    };

    const getDeligatesProject = (projectCode) => {
        const s = search.create({
        type: "job",
        filters: [[
            "entityid",
            "contains",
            projectCode
        ]],
        columns: [
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "formuladate", formula: "{custentity_project_code_date}" }),
            search.createColumn({ name: "formulatext", formula: "NVL({custentity_subsidiary_loaction},' ' )" }),
            search.createColumn({ name: "formulatext", formula: "NVL(REGEXP_SUBSTR({custentity_department}, '[^:]+$'),' ' )" }),
            // search.createColumn({ name: "formulatext", formula: "NVL({customer},' ' )" }),
            search.createColumn({ name: "formulatext", formula: "NVL({customer.entityid},' ' )" }),
            search.createColumn({ name: "formulatext", formula: "CASE WHEN INSTR({entityid}, ' ') > 0 THEN SUBSTR({entityid}, 1, INSTR({entityid}, ' ') - 1) ELSE {entityid}  END" })
        ]
        });
        return getAllResult(s);
    };

const formatAmount = (amount) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(toNum(amount));
};


    return { onRequest };
    });