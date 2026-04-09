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
 
  function exportReportDrillDown() {
    try {
      const sublistId = 'ar_aging_sublist';
      const rowCount = nlapiGetLineItemCount(sublistId);

      let csvContent ='Transaction Type,Date,Voucher Number,Location,Age,Amount\n';

      for (let i = 1; i <= rowCount; i++) {
        const transactionType = nlapiGetLineItemValue(sublistId, 'custpage_transaction_type', i);
        const transactionDate = nlapiGetLineItemValue(sublistId, 'custpage_transaction_date', i);
        const voucherNumber = nlapiGetLineItemValue(sublistId, 'custpage_voucher_number', i);
        const location = nlapiGetLineItemValue(sublistId, 'custpage_location', i);
        const age = nlapiGetLineItemValue(sublistId, 'custpage_age', i);
        const amount = nlapiGetLineItemValue(sublistId, 'custpge_amount', i);
        const row = [ formatCSVCell(transactionType), formatCSVCell(transactionDate), formatCSVCell(voucherNumber), formatCSVCell(location), formatCSVCell(age), formatCSVCell(amount)];
        csvContent += row.join(',') + '\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'A/R Aging Detail.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.log('Error exporting: ' + e.message);
    }
  }

  return { pageInit, exportReportDrillDown };
});