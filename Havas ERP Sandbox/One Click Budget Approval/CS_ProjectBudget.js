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

  function fieldChanged(scriptContext) {
    try {
      var objRecord = scriptContext.currentRecord;
      if (scriptContext.fieldId == "custpage_customer_list") {
        var customerName = objRecord.getValue({
          fieldId: "custpage_customer_list",
        });
        console.log(customerName);
        if (_logValidation(customerName)) {
          pageRefresh(customerName, projectArray);
        } else {
          pageRefresh(0);
        }
      }

      if (scriptContext.fieldId == "custpage_select") {
        var lineNo = scriptContext.line;
        console.log("lineNo", lineNo);
        var isSelect = objRecord.getSublistValue({
          sublistId: "project_sublist",
          fieldId: "custpage_select",
          line: lineNo,
        });
        var projectId = objRecord.getSublistValue({
          sublistId: "project_sublist",
          fieldId: "custpage_project_internalid",
          line: lineNo,
        });
        console.log("projectId", projectId);

        if (isSelect == true) {
          projectArray.push(projectId);
          console.log("projectArray", projectArray);
        }

        if (isSelect == false) {
          if (projectArray.indexOf(projectId) !== -1) {
            projectArray = projectArray.filter(function (item) {
              return item !== projectId;
            });
          }
          console.log("projectArray", projectArray);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  function pageRefresh(customerName) {
    var url =
      "https://9370186-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2107&deploy=1";
    if (customerName != 0) {
      url += "&customer=" + customerName;
    }
    window.open(url, "_self");
  }

  function approveProjectBudget() {
    console.log("projectArray", projectArray);
    if (projectArray.length > 0) {
      // https.get({
      //   url:
      //     "https://9370186-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2107&deploy=1&selectedProject=" +
      //     projectArray,
      //   headers: {
      //     name: "Accept-Language",
      //     value: "en-us",
      //   },
      // });
      var url =
        "https://9370186-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2107&deploy=1&selectedProject=" +
        projectArray;
      window.open(url, "_self");
    } else {
      alert("No project has been chosen to approve its budget.");
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
    fieldChanged: fieldChanged,
    pageRefresh: pageRefresh,
    approveProjectBudget: approveProjectBudget,
  };
});
