/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/currentRecord", "N/record", "N/ui/serverWidget", "N/search" , "N/url"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record, serverWidget, search , url) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (scriptContext) => {
    if (scriptContext.request.method === "GET") {
      try {
        var projectid = scriptContext.request.parameters.projectid;
        log.debug("project id ", projectid);
        var form = serverWidget.createForm({
          title: "Project Report",
        });

        form.clientScriptFileId = 9713;

        var projectName = form.addField({
          id: "custpage_select_project",
          type: serverWidget.FieldType.SELECT,
          label: "Select Project",
          source: "job",
        });

        projectName.updateDisplaySize({
          height: 60,
          width: 750,
        });

        if (projectid) {
          projectName.defaultValue = projectid;
        }

        var projectreport = form.addField({
          id: "custpage_project_report",
          type: serverWidget.FieldType.INLINEHTML,
          label: "Project Report",
        });

        projectreport.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW,
        });

        projectreport.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTROW,
        });

        if (projectid) {
          var getTable = getProjectReport(projectid);
          projectreport.defaultValue = getTable;
        }

        scriptContext.response.writePage(form);
      } catch (error) {
        log.debug("Error : ", error.toString());
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

    function getProjectReport(projectid) {
      var projectTable = "";
      var AR_AP_OutOfPocket_Table = get_AR_AP_OutOfPocket_Table(projectid);
      var Customer_Vendor_Invoices = get_Customer_Vendor_Invoices(projectid);
      if (AR_AP_OutOfPocket_Table != 0 && Customer_Vendor_Invoices != 0) {
        projectTable += AR_AP_OutOfPocket_Table;
        projectTable += Customer_Vendor_Invoices;
      } else {
        projectTable += '<br><br><div style="width: 80vw; font-family: Arial, serif; font-size: 15px;">No Transactions Found</div>';
      }

      return projectTable;
    }

    function get_AR_AP_OutOfPocket_Table(projectid) {
      var accountReceivable = 0.0;
      var accountPayable = 0.0;
      var vendorpayment = 0.0;
      var customerpayment = 0.0;
      var outOfPocketExpense = 0.0;

      log.debug("project id :  ", projectid);

      projectFilter = [["internalid", "anyof", projectid]];
      projectColumn = [
        search.createColumn({
          name: "type",
          join: "transaction",
          summary: "GROUP",
          label: "Type",
          sort: search.Sort.ASC,
        }),
        search.createColumn({
          name: "amount",
          join: "transaction",
          summary: "SUM",
          label: "Amount",
        }),
      ];
      var searchResult = projectSearch(projectFilter, projectColumn);

      if (searchResult.length > 0) {
        for (var index = 0; index < searchResult.length; index++) {
          var transactionType = searchResult[index].getValue({
            name: "type",
            join: "transaction",
            summary: "GROUP",
            label: "Type",
          });

          var transactionAmount = searchResult[index].getValue({
            name: "amount",
            join: "transaction",
            summary: "SUM",
            label: "Amount",
          });

          if (transactionType == "SalesOrd") {
            accountReceivable = transactionAmount;
          } else if (transactionType == "PurchOrd") {
            accountPayable = transactionAmount;
          } else if (transactionType == "CustInvc") {
            customerpayment = transactionAmount;
          } else if (transactionType == "VendBill") {
            vendorpayment = transactionAmount;
          } else {
            log.debug("Invalid Transaction Result");
          }

          if (parseFloat(vendorpayment) > parseFloat(customerpayment)) {
            outOfPocketExpense =
              parseFloat(customerpayment) - parseFloat(vendorpayment);
          } else {
            outOfPocketExpense = 0.0;
          }

          // transactionType == "SalesOrd" ? accountReceivable = transactionAmount : accountReceivable = 0.0;
          // transactionType == "PurchOrd" ? accountPayable = transactionAmount : accountPayable = 0.0;
          // transactionType == "CustInvc" ? customerpayment = transactionAmount : customerpayment = 0.0;
          // transactionType == "VendBill" ? vendorpayment = transactionAmount : vendorpayment = 0.0;
          // vendorpayment > customerpayment ?  outOfPocketExpense = customerpayment - vendorpayment : outOfPocketExpense = 0.0;
        }
        log.debug(
          " transaction : ",
          accountReceivable +
            " " +
            accountPayable +
            " " +
            customerpayment +
            " " +
            vendorpayment +
            " " +
            outOfPocketExpense
        );

        var htmlTable = "";
        htmlTable += "<br>";
        htmlTable += "<br>";
        htmlTable +=
          '<table style="border-collapse: collapse; width: 80vw; font-family: Arial, serif; font-size: 15px;border: 1px solid #D3D3D3;">';
        htmlTable +=
          '<tr style="background-color:#607799; text-align: center; border: 1px solid #D3D3D3;">';
        htmlTable +=
          "<th style='padding: 8px;width: 20vw; border: 1px solid #D3D3D3; color: #ffffff;'>Account Receivable</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 20vw; border: 1px solid #D3D3D3; color: #ffffff;'>Account Payable</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 20vw; border: 1px solid #D3D3D3; color: #ffffff;'>Out Of Pocket Expense</th>";
        htmlTable += "</tr>";
        htmlTable += "<tr style='border: 1px solid #D3D3D3;'>";
        htmlTable +=
          "<td style='padding: 8px;width: 20vw; border: 1px solid #D3D3D3;'>" +
          accountReceivable +
          "</td>";
        htmlTable +=
          "<td style='padding: 8px;width: 20vw; border: 1px solid #D3D3D3;'>" +
          accountPayable +
          "</td>";
        htmlTable +=
          "<td style='padding: 8px;width: 20vw; border: 1px solid #D3D3D3;'>" +
          outOfPocketExpense +
          "</td>";
        htmlTable += "</tr>";
        htmlTable += "</table>";

        return htmlTable;
      } else {
        return 0;
      }
    }

    function get_Customer_Vendor_Invoices(projectid) {
      var vendorBill = [];
      var customerInvoice = [];
      var vendorBillLength = 0;
      var customerInvoiceLength = 0;
      var tablerow = 0;
      var BillTemp;
      var InvoiceTemp;
      var transactionType;
      var internalId;
      var transactionNumber;
      var amount;
      var status;
      var fieldLookUp;
      var accountDomain = url.resolveDomain({
        hostType: url.HostType.APPLICATION,
    });

      projectFilter = [
        ["internalid", "anyof", projectid],
        "AND",
        ["transaction.type", "anyof", "VendBill", "CustInvc"],
      ];
      projectColumn = [
        search.createColumn({
          name: "type",
          join: "transaction",
          label: "Type",
        }),
        search.createColumn({
          name: "internalid",
          join: "transaction",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "transactionnumber",
          join: "transaction",
          label: "Transaction Number",
        }),
        search.createColumn({
          name: "amount",
          join: "transaction",
          label: "Amount",
        }),
        search.createColumn({
          name: "statusref",
          join: "transaction",
          label: "Status",
        }),
      ];
      var searchResult = projectSearch(projectFilter, projectColumn);

      log.debug("searchResult bill invoice", searchResult);

      if (searchResult.length > 0) {
        for (var index = 0; index < searchResult.length; index++) {
          transactionType = searchResult[index].getValue({
            name: "type",
            join: "transaction",
            label: "Type",
          });
          internalId = searchResult[index].getValue({
            name: "internalid",
            join: "transaction",
            label: "Internal ID",
          });
          transactionNumber = searchResult[index].getValue({
            name: "transactionnumber",
            join: "transaction",
            label: "Transaction Number",
          });
          amount = searchResult[index].getValue({
            name: "amount",
            join: "transaction",
            label: "Amount",
          });
          status = searchResult[index].getText({
            name: "statusref",
            join: "transaction",
            label: "Status",
          });

          if (transactionType == "CustInvc") {
            fieldLookUp = search.lookupFields({
              type: search.Type.INVOICE,
              id: internalId,
              columns: ["entity"],
            });
            entityName = fieldLookUp.entity[0]["text"];
            var invoiceArr = {
              internalId: internalId,
              transactionNumber: transactionNumber,
              entityName: entityName,
              amount: amount,
              status: status,
            };
            customerInvoice.push(invoiceArr);
          }
          if (transactionType == "VendBill") {
            fieldLookUp = search.lookupFields({
              type: search.Type.VENDOR_BILL,
              id: internalId,
              columns: ["entity"],
            });
            entityName = fieldLookUp.entity[0]["text"];
            var billArr = {
              internalId: internalId,
              transactionNumber: transactionNumber,
              entityName: entityName,
              amount: amount,
              status: status,
            };
            vendorBill.push(billArr);
          }
        }

        log.debug("customerInvoice", customerInvoice);
        log.debug("vendorBill", vendorBill);

        vendorBillLength = vendorBill.length;
        customerInvoiceLength = customerInvoice.length;
        customerInvoiceLength > vendorBillLength
          ? (tablerow = customerInvoiceLength)
          : (tablerow = vendorBillLength);

        var htmlTable = "";
        htmlTable += "<br>";
        htmlTable += "<br>";
        htmlTable +=
          '<table style="border-collapse: collapse; width: 90vw; font-family: Arial, serif; font-size: 15px;border: 1px solid #D3D3D3;">';

        htmlTable +=
          '<tr style="background-color:#607799; text-align: center;  width: 90vw; border: 1px solid #D3D3D3;">';
        htmlTable +=
          "<th style='padding: 8px;width: 45.3vw; border: 1px solid #D3D3D3; color: #ffffff;'> Customer Invoice </th>";
        htmlTable +=
          "<th style='padding: 8px;width: 45vw; border: 1px solid #D3D3D3; color: #ffffff;'> Vendor Invoice </th>";
        htmlTable += "</tr>";
        htmlTable += "</table>";
        htmlTable +=
          '<table style="border-collapse: collapse; width: 90vw; font-family: Arial, serif; font-size: 15px;border: 1px solid #D3D3D3;">';

        htmlTable +=
          '<tr style="background-color:#607799; text-align: center;  width: 90vw; border: 1px solid #D3D3D3;">';
        htmlTable +=
          "<th style='padding: 8px;width: 5vw; border: 1px solid #D3D3D3; color: #ffffff;'>Invoice #</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3; color: #ffffff;'>Customer Name</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 10vw; border: 1px solid #D3D3D3; color: #ffffff;'>Amount</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3; color: #ffffff;'>Status</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 5vw; border: 1px solid #D3D3D3; color: #ffffff;'>Bill #</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3; color: #ffffff;'>Vendor Name</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 10vw; border: 1px solid #D3D3D3; color: #ffffff;'>Amount</th>";
        htmlTable +=
          "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3; color: #ffffff;'>Status</th>";
        htmlTable += "</tr>";

        for (var index = 0; index < tablerow; index++) {
          BillTemp = vendorBill[index];
          InvoiceTemp = customerInvoice[index];

          log.debug("BillTemp", BillTemp);
          log.debug("InvoiceTemp", InvoiceTemp);

          htmlTable +=
            '<tr style="text-align: center;  width: 90vw; border: 1px solid #D3D3D3;">';

          customerInvoiceLength > 0 &&
          _logValidation(InvoiceTemp["transactionNumber"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 5vw; border: 1px solid #D3D3D3;'>" +
                "<a href='https://"+ accountDomain +'/app/accounting/transactions/custinvc.nl?id='+InvoiceTemp["internalId"]+"'>" + InvoiceTemp["transactionNumber"] + "</a>" +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 5vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");

          customerInvoiceLength > 0 && _logValidation(InvoiceTemp["entityName"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                InvoiceTemp["entityName"] +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");
          customerInvoiceLength > 0 && _logValidation(InvoiceTemp["amount"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 10vw; border: 1px solid #D3D3D3;'>" +
                InvoiceTemp["amount"] +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 10vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");
          customerInvoiceLength > 0 && _logValidation(InvoiceTemp["status"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                InvoiceTemp["status"] +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");

          vendorBillLength > 0 && _logValidation(BillTemp["transactionNumber"])
            ? (htmlTable +=
              "<th style='padding: 8px;width: 5vw; border: 1px solid #D3D3D3;'>" +
              "<a href='https://"+ accountDomain +'/app/accounting/transactions/vendbill.nl?id='+BillTemp["internalId"]+"'>" + BillTemp["transactionNumber"] + "</a>" +
              "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 5vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");
          vendorBillLength > 0 && _logValidation(BillTemp["entityName"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                BillTemp["entityName"] +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");
          vendorBillLength > 0 && _logValidation(BillTemp["amount"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 10vw; border: 1px solid #D3D3D3;'>" +
                BillTemp["amount"] +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 10vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");
          vendorBillLength > 0 && _logValidation(BillTemp["status"])
            ? (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                BillTemp["status"] +
                "</th>")
            : (htmlTable +=
                "<th style='padding: 8px;width: 15vw; border: 1px solid #D3D3D3;'>" +
                "" +
                "</th>");

          htmlTable += "</tr>";

          customerInvoiceLength--;
          vendorBillLength--;
        }
        htmlTable += "</table>";

        log.debug("htmlTable", htmlTable);

        return htmlTable;
      }
      else{
        return 0;
      }
    }

    function projectSearch(projectFilter, projectColumn) {
      var jobSearchObj = search.create({
        type: "job",
        filters: projectFilter,
        columns: projectColumn,
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var searchResult = jobSearchObj.run().getRange(0, 100);
      log.debug("searchResult", searchResult);
      return searchResult;
    }
  };

  return { onRequest };
});

// [
//   {
//     values: {
//       "GROUP(transaction.type)": [{ value: "VendBill", text: "Bill" }],
//       "SUM(transaction.amount)": "1000.00",
//     },
//   },
//   {
//     values: {
//       "GROUP(transaction.type)": [{ value: "CustInvc", text: "Invoice" }],
//       "SUM(transaction.amount)": "15607500.00",
//     },
//   },
//   {
//     values: {
//       "GROUP(transaction.type)": [
//         { value: "PurchOrd", text: "Purchase Order" },
//       ],
//       "SUM(transaction.amount)": "10.00",
//     },
//   },
//   {
//     values: {
//       "GROUP(transaction.type)": [{ value: "SalesOrd", text: "Sales Order" }],
//       "SUM(transaction.amount)": "3205500.00",
//     },
//   },
// ];

// https://9370186-sb1.app.netsuite.com/app/accounting/transactions/custinvc.nl?id=1462&whence=
// https://9370186-sb1.app.netsuite.com/app/accounting/transactions/vendbill.nl?id=1723
