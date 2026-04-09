/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
  "N/currentRecord",
  "N/search",
  "N/record",
  "N/email",
  "N/render",
  "N/file",
], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, search, record, email, render, file) => {
  const getInputData = (inputContext) => {
    var invoiceSearchObj = getInvoices();

    var searchResultCount = invoiceSearchObj.runPaged().count;
    log.debug("invoiceSearchObj result count", searchResultCount);
    // var result = folderSearchObj.run().getRange(0, 10);
    var invoiceSearchResult = invoiceSearchObj.run().getRange(0, 1000);
    log.debug("invoiceSearchResult", invoiceSearchResult);

    var invoiceArray = [];

    if(searchResultCount > 0){

      for (var i = 0; i < searchResultCount; i++) {
        var customerId = invoiceSearchResult[i].getValue({
          name: "internalid",
          join: "customer",
          label: "Internal ID",
        });
        var invoiceId = invoiceSearchResult[i].getValue({
          name: "internalid",
          label: "Internal ID",
        });
        var invoiceDate = invoiceSearchResult[i].getValue({
          name: "trandate",
          label: "Date",
        });
        var invoiceMemo = invoiceSearchResult[i].getValue({
          name: "memo",
          label: "Memo",
        });
        var invoiceCurrency = invoiceSearchResult[i].getText({
          name: "currency",
          label: "Currency",
        });
        var invoiceAmount = invoiceSearchResult[i].getValue({
          name: "amount",
          label: "Amount",
        });
        var invoiceAmountRemain = invoiceSearchResult[i].getValue({
          name: "amountremaining",
          label: "Amount Remaining",
        });
        var invoiceDueDate = invoiceSearchResult[i].getValue({
          name: "duedate",
          label: "Due Date/Receive By",
        });
        var invoiceDaysOverdue = invoiceSearchResult[i].getValue({
          name: "daysoverdue",
          label: "Days Overdue",
        });
        var invoiceDocumentId = invoiceSearchResult[i].getValue({
          name: "tranid",
          label: "Document Number",
        });
  
        invoiceArray.push({
          key: customerId,
          values: {
            invoiceId: invoiceId,
            invoiceMemo: invoiceMemo,
            invoiceDate: invoiceDate,
            invoiceCurrency: invoiceCurrency,
            invoiceAmount: invoiceAmount,
            invoiceAmountRemain: invoiceAmountRemain,
            invoiceDueDate: invoiceDueDate,
            invoiceDocumentId: invoiceDocumentId,
            invoiceDaysOverdue: invoiceDaysOverdue,
          },
        });
      }
      log.debug("invoiceArray", invoiceArray);
  
      return invoiceArray;

    }
    else{
      log.debug('Search Result Count : ' + searchResultCount )
    }

   
  };

  const map = (mapContext) => {
    var mapValue = JSON.parse(mapContext.value);
    log.debug("mapValue Key", mapValue.key);
    log.debug("mapValue Value", mapValue.values);

    var customerId = mapValue.key;
    var invoiceId = mapValue.values.invoiceId;
    var invoiceDate = mapValue.values.invoiceDate;
    var invoiceMemo = mapValue.values.invoiceMemo;
    var invoiceCurrency = mapValue.values.invoiceCurrency;
    var invoiceAmount = mapValue.values.invoiceAmount;
    var invoiceAmountRemain = mapValue.values.invoiceAmountRemain;
    var invoiceDueDate = mapValue.values.invoiceDueDate;
    var invoiceDocumentId = mapValue.values.invoiceDocumentId;
    var invoiceDaysOverdue = mapValue.values.invoiceDaysOverdue;

    log.debug(
      "Key - Value",
      customerId +
        " " +
        invoiceId +
        " " +
        invoiceDate +
        " " +
        invoiceAmount +
        " " +
        invoiceAmountRemain +
        " " +
        invoiceDueDate +
        " " +
        invoiceDaysOverdue +
        " " +
        invoiceMemo +
        " " +
        invoiceCurrency +
        " " +
        invoiceDocumentId
    );

    mapContext.write({
      key: customerId,
      value: {
        invoiceId: invoiceId,
        invoiceDate: invoiceDate,
        invoiceMemo: invoiceMemo,
        invoiceCurrency: invoiceCurrency,
        invoiceAmount: invoiceAmount,
        invoiceAmountRemain: invoiceAmountRemain,
        invoiceDueDate: invoiceDueDate,
        invoiceDaysOverdue: invoiceDaysOverdue,
        invoiceDocumentId: invoiceDocumentId,
      },
    });
  };

  const reduce = (reduceContext) => {
    var reduceCustomer = reduceContext.key;
    var reduceInvoices = reduceContext.values;
    log.debug("reduceCustomer", reduceCustomer);
    log.debug("reduceInvoices", reduceInvoices);
    // log.debug("JSON parse reduceInvoices", JSON.parse(reduceInvoices));
    // log.debug("typeof reduceInvoices", typeof reduceInvoices);
    // log.debug("reduceContext.values", reduceContext.values.length);
    // log.debug("reduceInvoices.length", reduceInvoices.length);

    var DaysOverdues = [];
    var procedureOverdueDays = [];
    var invoiceIds = [];
    var tempReduceInvoice;
    var emailTemplate;
    var pdfTemplate;
    var customerLevel;
    var dunningManager;
    var dunningLevel;
    var emailAttachments = [];
    var onlyOverdueInvoice;

    for (var i = 0; i < reduceInvoices.length; i++) {
      var tempReduceInvoice = JSON.parse(reduceInvoices[i]);
      if (_logValidation(tempReduceInvoice.invoiceDaysOverdue)) {
        DaysOverdues.push(parseInt(tempReduceInvoice.invoiceDaysOverdue));
      }
      if (_logValidation(tempReduceInvoice.invoiceId)) {
        invoiceIds.push(parseInt(tempReduceInvoice.invoiceId));
      }
    }

    var temp = DaysOverdues.sort(function (a, b) {
      return a - b;
    });
    log.debug("DaysOverdues", DaysOverdues);

    var customerObject = record.load({
      type: record.Type.CUSTOMER,
      id: reduceCustomer,
      isDynamic: true,
    });

    var customerDunningProcedure = customerObject.getValue({
      fieldId: "custentity_custlevel_dunning_procedure",
    });

    log.debug("customerDunningProcedure", customerDunningProcedure);

    var customerPauseDunning = customerObject.getValue({
      fieldId: "custentity_custlevel_dunning_pause",
    });

    log.debug("customerPauseDunning", customerPauseDunning);

    if (
      _logValidation(customerDunningProcedure) &&
      _logValidation(DaysOverdues) &&
      customerPauseDunning == false
    ) {
      var dunningProcedureObj = record.load({
        type: "customrecord_dunning_procedure",
        id: customerDunningProcedure,
        isDynamic: true,
      });

      var levelLines = dunningProcedureObj.getLineCount({
        sublistId: "recmachcustrecord_dun_level_link",
      });

      log.debug("levelLines", levelLines);

      for (var i = 0; i < levelLines; i++) {
        var overdueDay = dunningProcedureObj.getSublistValue({
          sublistId: "recmachcustrecord_dun_level_link",
          fieldId: "custrecord_dunning_level_days_overdue",
          line: i,
        });
        procedureOverdueDays.push(parseInt(overdueDay));
      }
      log.debug("procedureOverdueDays", procedureOverdueDays);

      log.debug("DaysOverdues.length", DaysOverdues.length);

      loop1: for (var j = DaysOverdues.length - 1; j >= 0; j--) {
        for (var i = 0; i < procedureOverdueDays.length; i++) {
          // log.debug("level", DaysOverdues[j]+ ' ' + procedureOverdueDays[i]);
          // log.debug("inside loop", "inside loop");

          if (DaysOverdues[j] === procedureOverdueDays[i]) {
            log.debug(
              "Level Match",
              procedureOverdueDays[i] + " " + DaysOverdues[j]
            );

            emailTemplate = dunningProcedureObj.getSublistValue({
              sublistId: "recmachcustrecord_dun_level_link",
              fieldId: "custrecord_dunning_level_email_template",
              line: i,
            });
            pdfTemplate = dunningProcedureObj.getSublistValue({
              sublistId: "recmachcustrecord_dun_level_link",
              fieldId: "custrecord_dunning_level_pdf_template",
              line: i,
            });
            dunningManager = dunningProcedureObj.getValue({
              fieldId: "custrecord_dunning_manager",
            });
            onlyOverdueInvoice = dunningProcedureObj.getValue({
              fieldId: "custrecord_dunning_only_overdue_invoices",
            });

            customerLevel = procedureOverdueDays[i];
            procedureOverdueDays.sort(function (a, b) {
              return a - b;
            });
            dunningLevel = procedureOverdueDays.indexOf(customerLevel);
            dunningLevel += 1;

            log.debug(
              "email pdf dunningManager",
              emailTemplate + " " + pdfTemplate + " " + dunningManager
            );

            break loop1;
          }
        }
      }

      if (_logValidation(emailTemplate) && _logValidation(pdfTemplate)) {
        log.debug("Invoice Id ", invoiceIds);

        var emailAttachments = createAttachments(invoiceIds, pdfTemplate);
        // createAttachments(invoiceIds);
        log.debug("emailAttachments", emailAttachments);

        var mergeResult = render.mergeEmail({
          templateId: emailTemplate,
          entity: {
            type: "employee",
            id: parseInt(dunningManager),
          },
          recipient: {
            type: "customer",
            id: parseInt(reduceCustomer),
          },
        });
        var emailBody = mergeResult.body;
        log.debug("emailBody", emailBody);
        var invoiceTable = getInvoiceTable(reduceInvoices);
        log.debug("invoiceTable", invoiceTable);
        emailBody = emailBody.replace(/{invoiceTable}/g, invoiceTable);
        log.debug("emailBody 2 ", emailBody);

        // var renderer = render.create();
        // renderer.setTemplateById({
        //   scriptId: "custemailtmpl_dunning_email_template2",
        // });

        // var customer_information = {
        //   'name': 'Test Customer',
        // };

        // renderer.addCustomDataSource({
        //   format: render.DataSource.OBJECT,
        //   alias: "resultKey",
        //   data: { customerInput: customer_information },
        // });

        // log.debug("2");

        // var salesPdf = renderer.renderAsString();

        // log.debug("salesPdf", salesPdf);

        email.send({
          author: dunningManager,
          recipients: reduceCustomer,
          subject: mergeResult.subject,
          body: emailBody,
          attachments: emailAttachments,
        });

        var customerEmail = search.lookupFields({
          type: search.Type.CUSTOMER,
          id: reduceCustomer,
          columns: ["email"],
        });
        log.debug("customerEmail ", customerEmail.email);

        var managerEmail = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: dunningManager,
          columns: ["email"],
        });
        log.debug("managerEmail ", managerEmail.email);

        var lastSentEmail = getSentEmail(
          managerEmail.email,
          customerEmail.email
        );

        log.debug("lastSentEmail", lastSentEmail);

        var tempId = record.submitFields({
          type: record.Type.CUSTOMER,
          id: reduceCustomer,
          values: {
            custentity_custlevel_dunning_level: dunningLevel,
            custentity_custlevel_last_email: lastSentEmail,
          },
        });

        log.debug("tempId", tempId);
      } else {
        log.debug(
          "Error : ",
          "No Invoice Overdue Match With Dunning Procedure"
        );
      }

      // var dunningProcedureString = JSON.stringify(dunningProcedureObj);

      // var dunningProcedureJson = JSON.parse(dunningProcedureString);
      // log.debug('dunningProcedureJson' , dunningProcedureJson)
      // log.debug('tempJson.sublists' , dunningProcedureJson.sublists.recmachcustrecord_dun_level_link)
      // var tempObj = dunningProcedureJson.sublists.recmachcustrecord_dun_level_link
      // log.debug('tempObj' , tempObj)
      // log.debug('tempObj.length' , dunningProcedureJson.sublists.recmachcustrecord_dun_level_link['line 1'])

      // log.debug("dunningProcedure", dunningProcedure);
      // log.debug("dunningProcedure[0]", dunningProcedure[0]);
      // log.debug("typeof dunningProcedure", typeof dunningProcedure);
      // log.debug("dunningProcedure.sublists", dunningProcedure.sublists);
      // var temp = JSON.parse(dunningProcedure);
      // log.debug("dunningProcedure.fields", temp.fields);
      // log.debug("dunningProcedure.sublists", temp.sublists);
      // log.debug('dunningProcedure.sublists.recmachcustrecord_dun_level_link' , dunningProcedure.sublists.recmachcustrecord_dun_level_link)
      // log.debug('dunningProcedure.sublists.recmachcustrecord_dun_level_link[0]' , dunningProcedure.sublists.recmachcustrecord_dun_level_link[0])
    } else {
      log.debug(
        "Error : ",
        "Procedure has not assign to customer OR Invoice has not due date"
      );
    }
  };

  const summarize = (summaryContext) => {};

  function getInvoices() {
    var invoiceSearchObj = search.create({
      type: "invoice",
      settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["amountremainingisabovezero", "is", "T"],
        "AND",
        ["customer.custentity_custlevel_dunning_procedure", "noneof", "@NONE@"],
        "AND", 
        ["daysoverdue","notequalto","0"]
      ],
      columns: [
        search.createColumn({ name: "ordertype", label: "Order Type" }),
        search.createColumn({ name: "mainline", label: "*" }),
        search.createColumn({ name: "trandate", label: "Date" }),
        search.createColumn({ name: "tranid", label: "Document Number" }),
        search.createColumn({ name: "entity", label: "Name" }),
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({
          name: "internalid",
          join: "customer",
          label: "Internal ID",
        }),
        search.createColumn({ name: "account", label: "Account" }),
        search.createColumn({ name: "memo", label: "Memo" }),
        search.createColumn({ name: "currency", label: "Currency" }),
        search.createColumn({ name: "amount", label: "Amount" }),
        search.createColumn({
          name: "amountremaining",
          label: "Amount Remaining",
        }),
        search.createColumn({ name: "duedate", label: "Due Date/Receive By" }),
        search.createColumn({ name: "daysoverdue", label: "Days Overdue" }),
      ],
    });

    return invoiceSearchObj;
  }

  // function createAttachments(invoiceIds) {
  //   var pdfTemplate = file.load("./invoicePdfTemplate.xml");
  //   log.debug("pdfTemplate", pdfTemplate);
  //   var myFile;
  //   var invoicePdf;
  //   var attachments = [];

  //   for (var i = 0; i < invoiceIds.length; i++) {
  //     log.debug("invoiceIds[i]", invoiceIds[i]);
  //     log.debug("pdfTemplate.getContents()", pdfTemplate.getContents());

  //     myFile = render.create();

  //     myFile.templateContent = pdfTemplate.getContents();
  //     log.debug("inside function", "inside function");

  //     myFile.addRecord(
  //       "record",
  //       record.load({
  //         type: record.Type.INVOICE,
  //         id: invoiceIds[i],
  //       })
  //     );
  //     invoicePdf = myFile.renderAsPdf();
  //     invoicePdf.name = "Invoice#" + invoiceIds[i] + ".pdf";
  //     log.debug("invoicePdf", invoicePdf);
  //     attachments.push(invoicePdf);

  //     log.debug("attachments", attachments);
  //   }

  //   return attachments;

  //   // var xmlTmplFile = file.load(
  //   //   "Templates/PDF Templates/invoicePDFTemplate.xml"
  //   // );
  //   // var myFile = render.create();
  //   // myFile.templateContent = xmlTplFile.getContents();
  //   // myFile.addRecord(
  //   //   "record",
  //   //   record.load({
  //   //     type: record.Type.INVOICE,
  //   //     id: 37,
  //   //   })
  //   // );
  //   // var invoicePdf = myFile.renderAsPdf();
  // }

  function createAttachments(invoiceIds, pdfTemplate) {
    var myFile;
    var invoicePdf;
    var attachments = [];

    for (var i = 0; i < invoiceIds.length; i++) {
      log.debug("invoiceIds[i]", invoiceIds[i]);
      myFile = render.create();
      myFile.setTemplateById(pdfTemplate);

      log.debug("inside function", "inside function");

      myFile.addRecord(
        "record",
        record.load({
          type: record.Type.INVOICE,
          id: invoiceIds[i],
        })
      );
      invoicePdf = myFile.renderAsPdf();
      invoicePdf.name = "Invoice#" + invoiceIds[i] + ".pdf";
      log.debug("invoicePdf", invoicePdf);
      attachments.push(invoicePdf);

      log.debug("attachments", attachments);
    }

    return attachments;
  }

  function getInvoiceTable(Invoices) {
    var htmlTable = "";
    htmlTable +=
      '<table border="1" style="font-family: sans-serif; font-size: 12px">';
    htmlTable += '<tr style="background-color:#e3e3e3">';
    htmlTable += "<th>Invoice #</th>";
    htmlTable += "<th>Description</th>";
    htmlTable += "<th>Invoice Date</th>";
    htmlTable += "<th>Due Date</th>";
    htmlTable += "<th>Currency</th>";
    htmlTable += "<th>Amount</th>";
    htmlTable += "</tr>";

    for (var i = 0; i < Invoices.length; i++) {

      var tempReduceInvoice = JSON.parse(Invoices[i]);

      log.debug('tempReduceInvoice.invoiceId' , tempReduceInvoice.invoiceId)

      var invoiceObject = record.load({
        type: record.Type.INVOICE,
        id: tempReduceInvoice.invoiceId,
        isDynamic: true,
      });

      var invoiceDunningProcedure = invoiceObject.getValue({
        fieldId: "custbody_invlevel_dunning_procedure",
      });
      
      log.debug('invoiceDunningProcedure' , invoiceDunningProcedure)
      log.debug('typeof invoiceDunningProcedure' , typeof invoiceDunningProcedure)

      htmlTable += "<tr>";

      if(invoiceDunningProcedure != ''){
        htmlTable += "<td>" + tempReduceInvoice.invoiceDocumentId + "*" + "</td>";
      }
      else{
        htmlTable += "<td>" + tempReduceInvoice.invoiceDocumentId + "</td>";
      }
      htmlTable += "<td>" + tempReduceInvoice.invoiceMemo + "</td>";
      htmlTable += "<td>" + tempReduceInvoice.invoiceDate + "</td>";
      htmlTable += "<td>" + tempReduceInvoice.invoiceDueDate + "</td>";
      htmlTable += "<td>" + tempReduceInvoice.invoiceCurrency + "</td>";
      htmlTable += "<td>" + tempReduceInvoice.invoiceAmount + "</td>";
      htmlTable += "</tr>";

      if(invoiceDunningProcedure != ''){
        htmlTable += "<div>" + "A separate dunning letter may be sent for  marked invoice." + "</div>";    
      }
    }

    htmlTable += "</table>";

    return htmlTable;
  }

  function getSentEmail(fromEmail, toEmail) {
    var sentemailSearchObj = search.create({
      type: "sentemail",
      filters: [
        ["from", "contains", fromEmail],
        "AND",
        ["torecipients", "contains", toEmail],
      ],
      columns: [
        search.createColumn({
          name: "sentdate",
          label: "Sent Date",
          sort: search.Sort.DESC,
        }),
        search.createColumn({ name: "sentdate", label: "Sent Date" }),
      ],
    });
    var result = sentemailSearchObj.run().getRange(0, 10);
    var lastEmailSent = result[0].getValue({
      name: "sentdate",
      label: "Sent Date",
    });

    return lastEmailSent;
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

  return { getInputData, map, reduce, summarize };
});
