/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], function () {
  function pageInit(scriptContext) { }
 
  function exportReport() {
    try {
      const sublistId = "balances_sublist";
      const rowCount = nlapiGetLineItemCount(sublistId);
      let csvContent = "Location,Department,Customer,Project,Opening Balance,Total Debit,Total Credit,Closing Balance\n";
 
      for (let i = 1; i <= rowCount; i++) {
        const location = nlapiGetLineItemValue(sublistId, "custpage_location", i) ;
        const department = nlapiGetLineItemValue(sublistId, "custpage_department", i);
        const customer = nlapiGetLineItemValue(sublistId, "custpage_customer", i);
        const project = nlapiGetLineItemValue(sublistId, "custpage_project", i);
        const opening = nlapiGetLineItemValue(sublistId, "custpage_opening_balance", i);
        const debit = nlapiGetLineItemValue(sublistId, "custpage_total_debit", i);
        const credit = nlapiGetLineItemValue(sublistId, "custpage_total_credit", i);
        const closing = nlapiGetLineItemValue(sublistId, "custpage_closing_balance", i);
        csvContent += `"${stripHTMLTags(location)}", "${stripHTMLTags(department)}","${stripHTMLTags(customer)}", "${(project)}","${stripHTMLTags(opening)}","${stripHTMLTags(debit)}","${stripHTMLTags(credit)}","${stripHTMLTags(closing)}"\n`;
      }
 
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "clientwise_cost_report.csv";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Error exporting: " + e.message);
    }
  }
  function stripHTMLTags(input) {
    if(input != null){
      return input.replace(/<[^>]*>/g, '').trim();
    }
    else{
      return ""
    }
   
  }
 
  let _logValidation = value => {
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
 
  return {
    pageInit: pageInit,
    exportReport: exportReport,
  };
});