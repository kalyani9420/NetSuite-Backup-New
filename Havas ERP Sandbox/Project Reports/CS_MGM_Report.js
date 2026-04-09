/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {
  function pageInit(scriptContext) { }
 
  function stripHTMLTags(input) {
    if (input != null) {
      return input.replace(/<[^>]*>/g, '').trim();
    } else {
      return '';
    }
  }
  function hasValue(value) {
    return (
      value != null &&
      value !== '' &&
      value !== 'null' &&
      value !== undefined &&
      value !== 'undefined' &&
      value !== '@NONE@' &&
      value !== 'NaN'
    );
  }
  function formatCSVCell(raw) {
    const v = stripHTMLTags(raw);
    return hasValue(v) ? `"${v}"` : '';
  }
 
  function exportReport() {
    try {
      const sublistId = 'balances_sublist';
      const rowCount = nlapiGetLineItemCount(sublistId);

      let csvContent ='Creation Date,Location,Department,Customer,Project Code, Billing Budget,SO Value,SB Value,JV Sales,CN Value,Net Sales,Cost Budget,PO Value,PB Value,Expense Report,Total PO,Total PB,JV Purchase,DN Value,Net Expense,Gross Expense,Planned Margin,Actual Margin,Actual Margin %\n';

      for (let i = 1; i <= rowCount; i++) {
        const creationDate = nlapiGetLineItemValue(sublistId, 'custpage_creation_date', i);
        const location = nlapiGetLineItemValue(sublistId, 'custpage_location', i);
        const department = nlapiGetLineItemValue(sublistId, 'custpage_department', i);
        const customer = nlapiGetLineItemValue(sublistId, 'custpage_customer', i);
        const code = nlapiGetLineItemValue(sublistId, 'custpage_code', i);
        const billingBudget = nlapiGetLineItemValue(sublistId, 'custpage_billing_budget', i);
        const soValue = nlapiGetLineItemValue(sublistId, 'custpage_so_value', i);
        const sbValue = nlapiGetLineItemValue(sublistId, 'custpage_sb_value', i);
        const jvSales = nlapiGetLineItemValue(sublistId, 'custpage_jv_sale', i);
        const cnValue = nlapiGetLineItemValue(sublistId, 'custpage_cn_value', i);
        const netSales = nlapiGetLineItemValue(sublistId, 'custpage_net_sale', i);
        const costBudget = nlapiGetLineItemValue(sublistId, 'custpage_cost_budget_history', i);
        const poValue = nlapiGetLineItemValue(sublistId, 'custpage_po_value', i);
        const pbValue = nlapiGetLineItemValue(sublistId, 'custpage_pb_value', i);
        const expReport = nlapiGetLineItemValue(sublistId, 'custpage_exp_report', i);

        
        const totalPO = nlapiGetLineItemValue(sublistId, 'custpage_total_po', i);
        const totalPB = nlapiGetLineItemValue(sublistId, 'custpage_total_pb', i);

        const jvPurchase = nlapiGetLineItemValue(sublistId, 'custpage_jv_purchase', i);
        const dnValue = nlapiGetLineItemValue(sublistId, 'custpage_dn_value', i);
        const netExpense = nlapiGetLineItemValue(sublistId, 'custpage_net_expense', i);
        const grossExpense = nlapiGetLineItemValue(sublistId, 'custpage_gross_expense', i);
        const plannedMargin = nlapiGetLineItemValue(sublistId, 'custpage_planned_margin', i);
        const actualMargin = nlapiGetLineItemValue(sublistId, 'custpage_actual_margin', i);
        const actualMarginPercent = nlapiGetLineItemValue(sublistId, 'custpage_actual_margin_percent', i);

        const row = [
          formatCSVCell(creationDate),
          formatCSVCell(location),
          formatCSVCell(department),
          formatCSVCell(customer),
          formatCSVCell(code),
          formatCSVCell(billingBudget),
          formatCSVCell(soValue),
          formatCSVCell(sbValue),
          formatCSVCell(jvSales),
          formatCSVCell(cnValue),
          formatCSVCell(netSales),
          formatCSVCell(costBudget),
          formatCSVCell(poValue),
          formatCSVCell(pbValue),
          formatCSVCell(expReport),
          formatCSVCell(totalPO),
          formatCSVCell(totalPB),
          formatCSVCell(jvPurchase),
          formatCSVCell(dnValue),
          formatCSVCell(netExpense),
          formatCSVCell(grossExpense),
          formatCSVCell(plannedMargin),
          formatCSVCell(actualMargin),
          formatCSVCell(actualMarginPercent)
        ];

        csvContent += row.join(',') + '\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'MGM_Report.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error exporting: ' + e.message);
    }
  }

  return { pageInit, exportReport };
});