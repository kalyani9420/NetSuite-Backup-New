/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search"], (serverWidget, search) => {
    const onRequest = (context) => {
        try {
            if (scriptContext.request.method === 'GET') {
                let form = getReportForm();
                scriptContext.response.writePage(form);
            } else if (scriptContext.request.method === 'POST') {
                let params = scriptContext.request.parameters || {};
                let form = getReportForm(project , startDate , endDate);
                scriptContext.response.writePage(form);
            }

        } catch (error) {
            log.debug("Error From Get Request", error);
        }

    }


    let getReportForm = (project , startDate , endDate) => {
        let form = serverWidget.createForm({ title: "PO vs PB & Expense Report" });
        let project = form.addField({ id: "custpage_project", type: serverWidget.FieldType.SELECT, label: "Select Project", source: "job" });
        project.isMandatory = true;
        let fromDate = form.addField({ id: "custpage_from_date", type: serverWidget.FieldType.DATE, label: "From Date" });
        let toDate = form.addField({ id: "custpage_to_date", type: serverWidget.FieldType.DATE, label: "To Date" });
        let sublist = form.addSublist({ id: "custpage_report_sublist", type: serverWidget.SublistType.LIST, label: "Report", });
        sublist.addField({ id: "custpage_profit_center", label: "Profit Center", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_budgeted_amount", label: "Budgeted Amount", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_po_number", label: "PO Number", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_vendor", label: "Vendor/Employee", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_po_amount", label: "PO Amount", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_po_to_be_booked", label: "PO to be Booked", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_purchase_bill_no", label: "Purchase Bill No./Expense Voucher No.", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_location", label: "Period", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_year", label: "Year", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_pb_amount", label: "PB Amount/Expense Amount", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_tds_amount", label: "TDS Amount", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_dn_voucher_no", label: "DN Voucher No.", type: serverWidget.FieldType.TEXT });
        sublist.addField({ id: "custpage_dn_amount", label: "DN Amount", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_pb_dn", label: "PB - DN", type: serverWidget.FieldType.CURRENCY });
        sublist.addField({ id: "custpage_bill_to_be_booked", label: "Bill to be Booked", type: serverWidget.FieldType.CURRENCY });
        form.addSubmitButton({ label: "Generate Report" });
        return form;
    };

    const _logValidation = (value) => {
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



    return { onRequest };
});