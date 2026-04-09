/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/ui/serverWidget"], /**
 * @param{record} record
 */ (record, search, serverWidget) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {
    try {
      var recordId = scriptContext.newRecord.id;
      var recordType = scriptContext.newRecord.type;
      var recordObj = scriptContext.newRecord;

      if (recordType == "job") {
        var cogsTable = getProjectCogs(recordId);
        var committedPlTable = getCommittedPL(recordId);

        var cogsTable = recordObj.setValue({
          fieldId: "custentity_cogs_calculation",
          value: cogsTable,
        });
        log.debug("cogsTable : ", cogsTable);

        var committedPl = recordObj.setValue({
          fieldId: "custentity_commiteed_pl",
          value: committedPlTable,
        });
        log.debug("committedPl : ", committedPl);
      }
    } catch (error) {
      log.debug("Error : ", error);
    }
  };

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {};

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */

  const afterSubmit = (scriptContext) => {};

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

  function formatIndianNumber(num) {
    return num.toLocaleString("en-IN");
  }

  function getCommittedPL(projectId) {
    var projectFilter = [
      [
        ["internalidnumber", "equalto", projectId],
        "AND",
        ["transaction.type", "anyof", "PurchOrd"],
        "AND",
        ["transaction.approvalstatus", "anyof", "2"],
      ],
      "OR",
      [
        ["transaction.type", "anyof", "SalesOrd"],
        "AND",
        ["transaction.custbody_approval_status", "anyof", "2"],
        "AND",
        ["internalidnumber", "equalto", projectId],
      ],
      "OR",
      [
        ["transaction.type", "anyof", "ExpRept"],
        "AND",
        ["internalidnumber", "equalto", projectId],
        "AND",
        [
          "transaction.status",
          "anyof",
          "ExpRept:F",
          "ExpRept:G",
          "ExpRept:I",
          "ExpRept:J",
        ],
      ],
      "OR",
      [
        ["transaction.type", "anyof", "Journal"],
        "AND",
        ["internalidnumber", "equalto", projectId],
        "AND",
        ["transaction.approvalstatus", "anyof", "2"],
      ],
    ];

    var projectColumn = [
      search.createColumn({
        name: "netamount",
        join: "transaction",
        summary: "SUM",
        label: "Amount (Net)",
      }),
      search.createColumn({
        name: "type",
        join: "transaction",
        summary: "GROUP",
        label: "Type",
        sort: search.Sort.ASC,
      }),
    ];

    var searchResult = getProjectSearch(projectFilter, projectColumn);

    var committedPnLJSON = {
      "Purchase Order": "0.0",
      "Expense Report": "0.0",
      "Sales Order": "0.0",
      "Journal": "0.0",
      "Profit Margin": "0.0",
    };
    var profitCalculation = "0.0";
    var profitMargin = "0.0";

    if (searchResult != 0) {
      for (var index = 0; index < searchResult.length; index++) {
        var transactionAmount = searchResult[index].getValue({
          name: "netamount",
          join: "transaction",
          summary: "SUM",
          label: "Amount (Net)",
        });

        var transactionType = searchResult[index].getText({
          name: "type",
          join: "transaction",
          summary: "GROUP",
          label: "Type",
          sort: search.Sort.ASC,
        });

        log.debug(index, transactionType + " " + transactionAmount);
        committedPnLJSON[transactionType] =
          parseFloat(committedPnLJSON[transactionType]) + parseFloat(transactionAmount);
      }
    }

    log.debug("committedPnLJSON", committedPnLJSON);

    var profitCalculation =
      parseFloat(committedPnLJSON["Sales Order"]) -
      (parseFloat(committedPnLJSON["Purchase Order"]) +
        parseFloat(committedPnLJSON["Expense Report"]) +
        parseFloat(Math.abs(committedPnLJSON["Journal"])));

    if (_logValidation(parseFloat(profitCalculation))) {
      var profitMargin =
        (profitCalculation / parseFloat(committedPnLJSON["Sales Order"])) * 100;
        committedPnLJSON["Profit Margin"] = Math.abs(profitMargin).toFixed(2);
    }

    log.debug("profitCalculation", profitCalculation);
    log.debug("profitMargin", profitMargin);
    // log.debug(
    //   'formatIndianNumber(parseFloat(Math.abs(committedPnLJSON["Journal"]))) ',
    //   formatIndianNumber(parseFloat(Math.abs(committedPnLJSON["Journal"])))
    // );

    var htmlTable = "";
    htmlTable += "<html>";
    htmlTable += "<body>";
    htmlTable +=
      '<table style="text-align: center; width:60% ; padding-top: 10px; font-size: 13px;">'
    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #607799; color : #ffffff">' +
      "Sales Order" +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width: 50%; background-color: #dfe4eb">' +
      formatIndianNumber(parseFloat(committedPnLJSON["Sales Order"])) +
      ".00";
    ("</td>");
    htmlTable += "</tr>";
    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #607799; color : #ffffff">' +
      "Purchase Order" +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
      formatIndianNumber(parseFloat(committedPnLJSON["Purchase Order"])) +
      ".00";
    ("</td>");
    htmlTable += "</tr>";

    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #607799; color : #ffffff">' +
      "Expense Report" +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
      formatIndianNumber(parseFloat(committedPnLJSON["Expense Report"])) +
      ".00";
    ("</td>");
    htmlTable += "</tr>";

    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #607799; color : #ffffff">' +
      "Journal" +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
      formatIndianNumber(parseFloat(Math.abs(committedPnLJSON["Journal"]))) +
      ".00";
    ("</td>");
    htmlTable += "</tr>";

    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #607799; color : #ffffff">' +
      "Profit" +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
      formatIndianNumber(profitCalculation) +
      ".00";
    ("</td>");
    htmlTable += "</tr>";

    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;">';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #607799; color : #ffffff">' +
      "Margin" +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:50%; background-color: #dfe4eb">' +
      committedPnLJSON["Profit Margin"] +
      " %" +
      "</td>";
    htmlTable += "</tr>";

    htmlTable += "</table>";
    htmlTable += "</body>";
    htmlTable += "</html>";

    return htmlTable;
  }

  function getProjectCogs(projectId) {
    try {
      var projectFilter = [
        [
          ["internalidnumber", "equalto", projectId],
          "AND",
          ["transaction.type", "anyof", "PurchOrd"],
          "AND",
          ["transaction.approvalstatus", "anyof", "2"],
        ],

        "OR",
        [
          ["transaction.type", "anyof", "ExpRept"],
          "AND",
          ["internalidnumber", "equalto", projectId],
          "AND",
          [
            "transaction.status",
            "anyof",
            "ExpRept:F",
            "ExpRept:G",
            "ExpRept:I",
            "ExpRept:J",
          ],
        ],

        "OR",
        [
          ["transaction.type", "anyof", "Journal"],
          "AND",
          ["internalidnumber", "equalto", projectId],
          "AND",
          ["transaction.approvalstatus", "anyof", "2"],
        ],
      ];

      var projectColumn = [
        search.createColumn({
          name: "netamount",
          join: "transaction",
          summary: "SUM",
          label: "Amount (Net)",
        }),
        search.createColumn({
          name: "type",
          join: "transaction",
          summary: "GROUP",
          label: "Type",
          sort: search.Sort.ASC,
        }),
      ];

      var searchResult = getProjectSearch(projectFilter, projectColumn);

      var cogsJSON = {
        "Purchase Order": "0.0",
        "Expense Report": "0.0",
        "Journal": "0.0",
      };

      if (searchResult != 0) {
        for (var index = 0; index < searchResult.length; index++) {
          var cogsAmount = searchResult[index].getValue({
            name: "netamount",
            join: "transaction",
            summary: "SUM",
            label: "Amount (Net)",
          });

          var cogsType = searchResult[index].getText({
            name: "type",
            join: "transaction",
            summary: "GROUP",
            label: "Type",
            sort: search.Sort.ASC,
          });

          log.debug(index, cogsType + " " + cogsAmount);
          cogsJSON[cogsType] =
            parseFloat(cogsJSON[cogsType]) + parseFloat(cogsAmount);
        }
      }

      log.debug("cogsJSON", cogsJSON);

      var totalAmount =
        parseFloat(cogsJSON["Purchase Order"]) +
        parseFloat(cogsJSON["Expense Report"]) +
        parseFloat(cogsJSON["Journal"]);

      var htmlTable = "";
      htmlTable += "<html>";
      htmlTable += "<body>";
      htmlTable +=
        '<table style="text-align: center; width:60% ; padding-top: 10px; font-size: 13px;">';
      htmlTable +=
        '<tr style="border: 1px solid #ddd; text-align: left; background-color: #607799";>';
      htmlTable +=
        '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:25%; color : #ffffff">Purchase</th>';
      htmlTable +=
        '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:25%; color : #ffffff">Expenses</th>';
      htmlTable +=
        '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:25%; color : #ffffff">Journal</th>';

      htmlTable +=
        '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:40%; color : #ffffff">Total </th>';

      htmlTable += "</tr>";
      htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
      htmlTable +=
        '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:25%;">' +
        formatIndianNumber(parseFloat(cogsJSON["Purchase Order"])) +
        ".00" +
        "</td>";
      htmlTable +=
        '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:25%;">' +
        formatIndianNumber(parseFloat(cogsJSON["Expense Report"])) +
        ".00" +
        "</td>";
      htmlTable +=
        '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:25%;">' +
        formatIndianNumber(parseFloat(cogsJSON["Journal"])) +
        ".00" +
        "</td>";
      htmlTable +=
        '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:40%;">' +
        formatIndianNumber(parseFloat(totalAmount)) +
        ".00" +
        "</td>";
      htmlTable += "</tr>";
      htmlTable += "</table>";
      htmlTable += "</body>";
      htmlTable += "</html>";

      return htmlTable;
    } catch (error) {
      log.debug("Error ", error);
    }
  }

  function getProjectSearch(projectFilter, projectColumn) {
    try {
      var jobSearchObj = search.create({
        type: "job",
        filters: projectFilter,
        columns: projectColumn,
      });

      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var searchResult = jobSearchObj.run().getRange(0, 100);
      log.debug("searchResult result count", searchResult);

      if (searchResultCount > 0) {
        return searchResult;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error : ", error);
    }
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});
