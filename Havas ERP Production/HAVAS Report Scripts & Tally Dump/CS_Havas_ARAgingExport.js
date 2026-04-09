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
      const sublistId = 'ar_aging_sublist';
      const rowCount = nlapiGetLineItemCount(sublistId);

      let csvContent ='Customer,1-30 Days,31-60 Days,61-90 Days,>90 Days\n';

      for (let i = 1; i <= rowCount; i++) {
        const customer = nlapiGetLineItemValue(sublistId, 'custpage_customer_name', i);
        const first = nlapiGetLineItemValue(sublistId, 'custpage_first', i);
        const second = nlapiGetLineItemValue(sublistId, 'custpage_second', i);
        const third = nlapiGetLineItemValue(sublistId, 'custpage_third', i);
        const fourth = nlapiGetLineItemValue(sublistId, 'custpage_forth', i);
        const row = [ formatCSVCell(customer), formatCSVCell(first), formatCSVCell(second), formatCSVCell(third), formatCSVCell(fourth),];
        csvContent += row.join(',') + '\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'A/R Aging.csv';
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