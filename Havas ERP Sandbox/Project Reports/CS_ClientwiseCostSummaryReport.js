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
 
      let csvContent = 'Location,Department,Customer,Project,Opening Balance,Total Debit,Total Credit,Closing Balance\n';
 
      for (let i = 1; i <= rowCount; i++) {
        const location   = nlapiGetLineItemValue(sublistId, 'custpage_location', i);
        const department = nlapiGetLineItemValue(sublistId, 'custpage_department', i);
        const customer   = nlapiGetLineItemValue(sublistId, 'custpage_customer', i);
        const project    = nlapiGetLineItemValue(sublistId, 'custpage_project', i);
        const opening    = nlapiGetLineItemValue(sublistId, 'custpage_opening_balance', i);
        const debit      = nlapiGetLineItemValue(sublistId, 'custpage_total_debit', i);
        const credit     = nlapiGetLineItemValue(sublistId, 'custpage_total_credit', i);
        const closing    = nlapiGetLineItemValue(sublistId, 'custpage_closing_balance', i);
 
        const row = [
          formatCSVCell(location),
          formatCSVCell(department),
          formatCSVCell(customer),
          formatCSVCell(project),
          formatCSVCell(opening),
          formatCSVCell(debit),
          formatCSVCell(credit),
          formatCSVCell(closing)
        ];
 
        csvContent += row.join(',') + '\n';
      }
 
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'clientwise_cost_report.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error exporting: ' + e.message);
    }
  }
 
  return {
    pageInit: pageInit,
    exportReport: exportReport
  };
});