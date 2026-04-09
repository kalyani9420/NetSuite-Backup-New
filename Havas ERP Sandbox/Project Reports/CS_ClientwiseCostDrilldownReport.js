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
 
      let csvContent = 'Record Type,Voucher No,Account,Debit,Credit\n';
 
      for (let i = 1; i <= rowCount; i++) {
        const recordType   = nlapiGetLineItemValue(sublistId, 'custpage_record_type', i);
        const voucherNo = nlapiGetLineItemValue(sublistId, 'custpage_voucher_number', i);
        const account   = nlapiGetLineItemValue(sublistId, 'custpage_account', i);
        const debit    = nlapiGetLineItemValue(sublistId, 'custpage_debit', i);
        const credit    = nlapiGetLineItemValue(sublistId, 'custpage_credit', i)
 
        const row = [
          formatCSVCell(recordType),
          formatCSVCell(voucherNo),
          formatCSVCell(account),
          formatCSVCell(debit),
          formatCSVCell(credit),
        ];
 
        csvContent += row.join(',') + '\n';
      }
 
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'clientwise_cost_drilldown_report.csv';
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