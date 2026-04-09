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

      var recordForm = scriptContext.form;

      if (recordType == "job") {
        var cogsTable = getProjectCogs(recordId);

        var cogsFieldGroup = recordForm.addFieldGroup({
          id: "cogsfieldgroupid",
          label: "COGS",
        });

        // recordForm.addSubtab({
        //   id: "custpage_subtabid",
        //   label: "Subtab",
        // });
        // var subtab = recordForm.getSubtab({
        //   id: "custpage_subtabid",
        // });
        // log.debug('subtab' , subtab)

        // var test = recordForm.addField({
        //   id: "custpage_test",
        //   type: serverWidget.FieldType.TEXT,
        //   label: "COGS Table",
        //   container: "custtab_committed_pl",
        // });
        // log.debug('test' , test)

        var cogsField = recordForm.addField({
          id: "custpage_cogs_table",
          type: serverWidget.FieldType.INLINEHTML,
          label: "COGS Table",
          container: "cogsfieldgroupid",
        });
        cogsField.defaultValue = cogsTable;
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

  function getProjectCogs(projectId) {
    var jobSearchObj = search.create({
      type: "job",
      filters: [
        ["internalidnumber", "equalto", projectId],
        "AND",
        ["transaction.type", "anyof", "PurchOrd", "ExpRept"],
      ],
      columns: [
        search.createColumn({
          name: "amount",
          join: "transaction",
          summary: "SUM",
          label: "Total Amount",
        }),
        search.createColumn({
          name: "type",
          join: "transaction",
          summary: "GROUP",
          label: "Transaction Type",
          sort: search.Sort.ASC,
        }),
      ],
    });
    var searchResultCount = jobSearchObj.runPaged().count;
    log.debug("jobSearchObj result count", searchResultCount);
    var searchResult = jobSearchObj.run().getRange(0, 100);
    log.debug("searchResult result count", searchResult);

    var cogsJSON = {
      "Purchase Order": "0.0",
      "Expense Report": "0.0",
    };

    if (searchResultCount > 0) {
      for (var index = 0; index < searchResultCount; index++) {
        var cogsAmount = searchResult[index].getValue({
          name: "amount",
          join: "transaction",
          summary: "SUM",
          label: "Total Amount",
        });

        var cogsType = searchResult[index].getText({
          name: "type",
          join: "transaction",
          summary: "GROUP",
          label: "Transaction Type",
          sort: search.Sort.ASC,
        });

        log.debug(index, cogsType + " " + cogsAmount);
        cogsJSON[cogsType] = cogsAmount;
      }
    }

    log.debug("cogsJSON", cogsJSON);

    var htmlTable = "";
    htmlTable += "<html>";
    htmlTable += "<body>";
    htmlTable +=
      '<table style="text-align: center; width:60% ; padding-top: 10px; font-size: 13px;">';
    htmlTable +=
      '<tr style="border: 1px solid #ddd; text-align: left; background-color: #607799";>';
    htmlTable +=
      '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Total Purchase</th>';
    htmlTable +=
      '<th style="border: 1px solid #ddd; text-align: left; padding: 8px; width:30%; color : #ffffff">Total Expenses</th>';

    htmlTable += "</tr>";
    htmlTable += '<tr style="border: 1px solid #ddd; text-align: left;";>';
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%;">' +
      cogsJSON["Purchase Order"] +
      "</td>";
    htmlTable +=
      '<td style="border: 1px solid #ddd; text-align: left; padding: 5px; width:30%;">' +
      cogsJSON["Expense Report"] +
      "</td>";
    htmlTable += "</tr>";

    htmlTable += "</table>";
    htmlTable += "</body>";
    htmlTable += "</html>";

    return htmlTable;
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});

// [
//   {
//     values: {
//       "SUM(transaction.amount)": "1000.00",
//       "GROUP(transaction.type)": [{ value: "ExpRept", text: "Expense Report" }],
//     },
//   },
//   {
//     values: {
//       "SUM(transaction.amount)": "3000.00",
//       "GROUP(transaction.type)": [
//         { value: "PurchOrd", text: "Purchase Order" },
//       ],
//     },
//   },
// ];
