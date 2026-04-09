/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/format", "N/https"], /**
 * @param{currentRecord} currentRecord
 */ function (currentRecord, format, https) {
  var projectArray = [];

  function pageInit(scriptContext) {}

  function generateBalance() {
    try {
      var objRecord = currentRecord.get();
      var startDate = objRecord.getText({
        fieldId: "custpage_start_date",
      });
      var endDate = objRecord.getText({
        fieldId: "custpage_end_date",
      });
      if (_logValidation(startDate) && _logValidation(endDate)) {
        var suiteletUrl =
          "https://9370186-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2218&deploy=1";
        suiteletUrl += "&startdate=" + startDate;
        suiteletUrl += "&enddate=" + endDate;

         window.open(suiteletUrl, "_self");
      }
      else{
        alert('Please enter both start and end date to generate a balance.')
      }
    } catch (error) {
      console.log("Error :", error);
    }
  }

  function _logValidation(value) {
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
    generateBalance: generateBalance,
  };
});
