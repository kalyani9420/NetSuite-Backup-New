/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {
  function pageInit(scriptContext) {}

  function exportReport() {
    try {
      const sublistId = "balances_sublist";
      const rowCount = nlapiGetLineItemCount(sublistId);
      let csvContent = "Customer,Opening Balance,Total Debit,Total Credit,Closing Balance\n";

      for (let i = 1; i <= rowCount; i++) {
        const customer = nlapiGetLineItemValue(sublistId, "custpage_customer", i) || "";
        const opening = nlapiGetLineItemValue(sublistId, "custpage_opening_balance", i) || "";
        const debit = nlapiGetLineItemValue(sublistId, "custpage_total_debit", i) || "";
        const credit = nlapiGetLineItemValue(sublistId, "custpage_total_credit", i) || "";
        const closing = nlapiGetLineItemValue(sublistId, "custpage_closing_balance", i) || "";   
        csvContent += `"${customer}","${opening}","${debit}","${credit}","${closing}"\n`;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "customer_balances.csv";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Error exporting: " + e.message);
    }
  }

  

  return {
    pageInit: pageInit,
    exportReport: exportReport,
  };
});
