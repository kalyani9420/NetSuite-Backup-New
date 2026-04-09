/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/record",
  "N/ui/serverWidget",
  "N/search",
], /**
 * @param{record} record
 * @param{serverWidget} serverWidget
 */ (record, serverWidget, search) => {
    function onRequest(scriptContext) {
      try {
        if (scriptContext.request.method === "GET") {
          const startDate = scriptContext.request.parameters.startdate;
          const endDate = scriptContext.request.parameters.enddate;

          log.debug("startdate", startDate);
          log.debug("endate", endDate);

          var form = serverWidget.createForm({
            title: "Customer Opening Balance",
          });

          form.clientScriptModulePath =
            "SuiteScripts/CS_CustomerOpeningBalance.js";

          var startDateField = form.addField({
            id: "custpage_start_date",
            label: "Start Date",
            type: serverWidget.FieldType.DATE,
          });
          if(_logValidation(startDate)){
            startDateField.defaultValue = startDate; 
          }
          var endDateField = form.addField({
            id: "custpage_end_date",
            label: "End Date",
            type: serverWidget.FieldType.DATE,
          });
          if(_logValidation(endDate)){
            endDateField.defaultValue = endDate; 
          }

          var customerSublist = form.addSublist({
            id: "balances_sublist",
            type: serverWidget.SublistType.LIST,
            label: "Balances"
          });
          customerSublist.addField({
            id: "custpage_customer_name",
            type: serverWidget.FieldType.TEXT,
            label: "Vendor"
          });
          customerSublist.addField({
            id: "custpage_opening_balance",
            type: serverWidget.FieldType.CURRENCY,
            label: "Opening Balance"
          });
          customerSublist.addField({
            id: "custpage_debit",
            type: serverWidget.FieldType.CURRENCY,
            label: "Total Debit"
          });
          customerSublist.addField({
            id: "custpage_credit",
            type: serverWidget.FieldType.CURRENCY,
            label: "Total Credit"
          });
          customerSublist.addField({
            id: "custpage_closing_balance",
            type: serverWidget.FieldType.CURRENCY,
            label: "Closing Balance"
          });

          if (_logValidation(startDate) && _logValidation(endDate)) {
            var customerLines = generateOpeningBalances(startDate, endDate);
            log.debug('customerLines', customerLines)
            log.debug('customerLines length', customerLines.length)
            for (var count = 0; count < customerLines.length; count++) {
              var [customerID, customerDetails] = customerLines[count];
              log.debug('customerDetails.name', customerDetails.name.toString())
              customerSublist.setSublistValue({
                id: "custpage_customer_name",
                line: count,
                value: customerDetails.name,
              });
              // log.debug('customerDetails.openingBalance.toString()', customerDetails.openingBalance.toString())
              customerSublist.setSublistValue({
                id: "custpage_opening_balance",
                line: count,
                value: customerDetails.openingBalance.toString(),
              });
              // log.debug('Math.abs(customerDetails.debit).toString()', Math.abs(customerDetails.debit).toString())
              customerSublist.setSublistValue({
                id: "custpage_debit",
                line: count,
                value: Math.abs(customerDetails.debit).toString(),
              });
              // log.debug('Math.abs(customerDetails.debit).toString()', Math.abs(customerDetails.credit).toString())

              customerSublist.setSublistValue({
                id: "custpage_credit",
                line: count,
                value: Math.abs(customerDetails.credit).toString(),
              });
              // log.debug('customerDetails.closingBalance.toString()', customerDetails.closingBalance.toString())

              customerSublist.setSublistValue({
                id: "custpage_closing_balance",
                line: count,
                value: customerDetails.closingBalance.toString(),
              });

            }
          }

          form.addButton({
            id: "generatebalance",
            label: "Generate Balance",
            functionName: "generateBalance()",
          });

          scriptContext.response.writePage(form);
        }
      } catch (error) {
        log.debug("Error 1 : ", error);
      }
    }

    function generateOpeningBalances(startDate, endDate) {
      try {
        var customerMap = {};

        var allCustomers = getAllCustomers();
        allCustomers.forEach((customer) => {
          var customerID = customer.id;
          var customerName = customer.getValue({
            name: "entityid",
            label: "Name",
          });
          customerMap[customerName] = {
            name: customerName,
            id: customerID,
            openingBalance: 0,
            closingBalance: 0,
            debit: 0,
            credit: 0,
          };
        });

        log.debug("allCustomers", allCustomers);

        var allOpeningBalance = getAllCustomerOpeningBalance(startDate);
        log.debug("allOpeningBalance", allOpeningBalance);
        allOpeningBalance.forEach((customerBalance) => {
          var customerID = customerBalance.getText({
            name: "entity",
            summary: "GROUP",
          });
          var openingBalance = customerBalance.getValue({
            name: "amount",
            summary: "SUM",
          });
          if (customerMap[customerID])
            customerMap[customerID].openingBalance = openingBalance;
        });

        var allClosingBalance = getAllCustomerOpeningBalance(endDate);
        log.debug("allClosingBalance", allClosingBalance);
        allClosingBalance.forEach((customerBalance) => {
          var customerID = customerBalance.getText({
            name: "entity",
            summary: "GROUP",
          });
          var closingBalance = customerBalance.getValue({
            name: "amount",
            summary: "SUM",
          });
          if (customerMap[customerID])
            customerMap[customerID].closingBalance = closingBalance;
        });

        var allDebitCreditBalance = getDebitCreditBalance(startDate, endDate);
        log.debug("allDebitCreditBalance", allDebitCreditBalance);
        allDebitCreditBalance.forEach((customerBalance) => {
          var customerID = customerBalance.getText({
            name: "entity",
            summary: "GROUP",
          });
          customerBalance = JSON.parse(JSON.stringify(customerBalance));
          var totalDebit = customerBalance.values["SUM(formulanumeric)"];
          var totalCredit = customerBalance.values["SUM(formulanumeric)_1"];
          if (customerMap[customerID])
            [customerMap[customerID].debit, customerMap[customerID].credit] = [
              totalDebit,
              totalCredit,
            ];
        });

        log.debug("customerMap", customerMap);

        var customerLines = Object.entries(customerMap);

        return customerLines;
      } catch (error) {
        log.debug("Error 2 : ", error);
      }
    }

    function getAllCustomerOpeningBalance(date) {
      var openingBalanceSearch = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "NONE" }],
        filters: [
          [
            ["type", "anyof", "CustCred", "CustPymt", "Journal", "Custom113"],
            "AND",
            ["accounttype", "anyof", "AcctRec"],
          ],
          "OR",
          [["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"]],
          "AND",
          ["trandate", "onorbefore", date],
          "AND",
          ["posting", "is", "T"],
        ],
        columns: [
          search.createColumn({ name: "entity", summary: "GROUP" }),
          search.createColumn({
            name: "formulanumeric",
            summary: "SUM",
            formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END",
          }),
          search.createColumn({
            name: "formulanumeric",
            summary: "SUM",
            formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END",
          }),
          search.createColumn({ name: "amount", summary: "SUM" }),
        ],
      });
      var temp = getAllResult(openingBalanceSearch);
      return getAllResult(openingBalanceSearch);
    }

    var getDebitCreditBalance = (startDate, endDate) => {
      var balanceSearch = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "NONE" }],
        filters: [
          [
            ["type", "anyof", "CustCred", "CustPymt", "Journal", "Custom113"],
            "AND",
            ["accounttype", "anyof", "AcctRec"],
          ],
          "OR",
          [["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"]],
          "AND",
          ["trandate", "within", startDate, endDate],
          "AND",
          ["posting", "is", "T"],
        ],
        columns: [
          search.createColumn({ name: "entity", summary: "GROUP" }),
          search.createColumn({
            name: "formulanumeric",
            summary: "SUM",
            formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END",
          }),
          search.createColumn({
            name: "formulanumeric",
            summary: "SUM",
            formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END",
          }),
          search.createColumn({ name: "amount", summary: "SUM" }),
        ],
      });

      return getAllResult(balanceSearch);
    };

    function getAllCustomers() {
      try {
        var customerSearchObj = search.create({
          type: "customer",
          filters: [],
          columns: [
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({
              name: "entityid",
              label: "Name",
              sort: search.Sort.ASC,
            }),
          ],
        });
        return getAllResult(customerSearchObj);
      } catch (error) {
        log.debug("Error 3 : ", error);
      }
    }

    function getAllResult(customSearch) {
      try {
        var searchResultCount = customSearch.runPaged().count;
        var allResults = [];
        var [start, end, limit] = [0, 1000, searchResultCount];
        while (start < limit) {
          allResults.push(...customSearch.run().getRange(start, end));
          start += 1000;
          end += 1000;
        }
        return allResults;
      } catch (error) {
        log.debug("Error 4 : ", error);
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
      onRequest: onRequest,
    };
  });
