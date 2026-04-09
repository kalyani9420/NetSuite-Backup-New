/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/search"], (serverWidget, search) => {
  let onRequest = scriptContext => {
    try {
      if (scriptContext.request.method === "GET") {
        let form = generateRequestForm();
        scriptContext.response.writePage(form);
      } else {
        let params = scriptContext.request.parameters;
        let fromDate = params.custpage_from_date;
        let uptoDate = params.custpage_upto_date;
        let form = generateOpeningBalances(fromDate, uptoDate);
        scriptContext.response.writePage(form);
      }
    } catch (error) {
      log.debug("Error", error);
    }
  };

  let generateRequestForm = () => {
    let form = serverWidget.createForm({ title: "Vendor Balance Search" });
    form.addField({ id: "custpage_from_date", label: "Start / From Date", type: serverWidget.FieldType.DATE });
    form.addField({ id: "custpage_upto_date", label: "End / Upto Date", type: serverWidget.FieldType.DATE });
    form.addSubmitButton({ label: "Generate Balace's" });
    return form;
  };

  let generateOpeningBalances = (fromDate, uptoDate) => {
    let form = serverWidget.createForm({ title: `Vendor Opening Balance [ ${fromDate} to ${uptoDate} ]` });
    let sublist = form.addSublist({ id: "balances_sublist", type: serverWidget.SublistType.LIST, label: "Balances" });

    let vendorMap = {};

    let allVendors = getAllVendors();
    allVendors.forEach(vendor => {
      let vendorID = vendor.id;
      let vendorName = vendor.getValue({ name: "entityid", label: "Name" });
      vendorMap[vendorName] = { name: vendorName, id: vendorID, openingBalance: 0, closingBalance: 0, debit: 0, credit: 0 };
    });

    let allOpeningBalance = getAllVendorOpeningBalance(fromDate);
    log.debug("allOpeningBalance", allOpeningBalance);
    allOpeningBalance.forEach(vendorBalance => {
      let vendorID = vendorBalance.getText({ name: "entity", summary: "GROUP" });
      let openingBalance = vendorBalance.getValue({ name: "amount", summary: "SUM" });
      if (vendorMap[vendorID]) vendorMap[vendorID].openingBalance = openingBalance;
    });

    let allClosingBalance = getAllVendorOpeningBalance(uptoDate);
    log.debug("allClosingBalance", allClosingBalance);
    allClosingBalance.forEach(vendorBalance => {
      let vendorID = vendorBalance.getText({ name: "entity", summary: "GROUP" });
      let closingBalance = vendorBalance.getValue({ name: "amount", summary: "SUM" });
      if (vendorMap[vendorID]) vendorMap[vendorID].closingBalance = closingBalance;
    });

    let allBalances = getDebitCreditBalance(fromDate, uptoDate);
    allBalances.forEach(vendorBalance => {
      let vendorID = vendorBalance.getText({ name: "entity", summary: "GROUP" });
      vendorBalance = JSON.parse(JSON.stringify(vendorBalance));
      let totalDebit = vendorBalance.values["SUM(formulanumeric)"];
      let totalCredit = vendorBalance.values["SUM(formulanumeric)_1"];
      if (vendorMap[vendorID]) [vendorMap[vendorID].debit, vendorMap[vendorID].credit] = [totalDebit, totalCredit];
    });

    sublist.addField({ id: "custpage_vendor", type: serverWidget.FieldType.TEXT, label: "Vendor" });
    sublist.addField({ id: "custpage_opening_balance", type: serverWidget.FieldType.CURRENCY, label: "Opening Balance" });
    sublist.addField({ id: "custpage_total_debit", type: serverWidget.FieldType.CURRENCY, label: "Total Debit" });
    sublist.addField({ id: "custpage_total_credit", type: serverWidget.FieldType.CURRENCY, label: "Total Credit" });
    sublist.addField({ id: "custpage_closing_balance", type: serverWidget.FieldType.CURRENCY, label: "Closing Balance" });

    let vendorLines = Object.entries(vendorMap);

    for (let count = 0; count < vendorLines.length; count++) {
      let [vendorID, vendorDetails] = vendorLines[count];
      sublist.setSublistValue({ id: "custpage_vendor", line: count, value: vendorDetails.name });
      sublist.setSublistValue({ id: "custpage_opening_balance", line: count, value: vendorDetails.openingBalance.toString() });
      sublist.setSublistValue({ id: "custpage_total_debit", line: count, value: Math.abs(vendorDetails.debit).toString() });
      sublist.setSublistValue({ id: "custpage_total_credit", line: count, value: Math.abs(vendorDetails.credit).toString() });
      sublist.setSublistValue({ id: "custpage_closing_balance", line: count, value: vendorDetails.closingBalance.toString() });
    }

    return form;
  };

  let getAllVendors = () => {
    let vendorSearchObj = search.create({
      type: "vendor",
      filters: [],
      columns: [search.createColumn({ name: "internalid", label: "Internal ID" }), search.createColumn({ name: "entityid", label: "Name", sort: search.Sort.ASC })],
    });
    return getAllResult(vendorSearchObj);
  };

  let getAllVendorOpeningBalance = date => {
    let openingBalanceSearch = search.create({
      type: "transaction",
      settings: [{ name: "consolidationtype", value: "NONE" }],
      filters: [
        [[["type", "anyof", "ExpRept", "VendCred", "VendPymt", "Custom108", "Journal"], "AND", ["accounttype", "anyof", "AcctPay"]], "OR", [["type", "anyof", "VendBill", "VPrep"], "AND", ["mainline", "is", "T"]]],
        "AND",
        ["trandate", "onorbefore", date],
        "AND",
        ["posting", "is", "T"],
      ],
      columns: [
        search.createColumn({ name: "entity", summary: "GROUP" }),
        search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END" }),
        search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END" }),
        search.createColumn({ name: "amount", summary: "SUM" }),
      ],
    });
    return getAllResult(openingBalanceSearch);
  };

  let getDebitCreditBalance = (fromDate, uptoDate) => {
    let balanceSearch = search.create({
      type: "transaction",
      settings: [{ name: "consolidationtype", value: "NONE" }],
      filters: [
        [[["type", "anyof", "ExpRept", "VendCred", "VendPymt", "Custom108", "Journal"], "AND", ["accounttype", "anyof", "AcctPay"]], "OR", [["type", "anyof", "VendBill", "VPrep"], "AND", ["mainline", "is", "T"]]],
        "AND",
        ["trandate", "within", fromDate, uptoDate],
        "AND",
        ["posting", "is", "T"],
      ],
      columns: [
        search.createColumn({ name: "entity", summary: "GROUP" }),
        search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} < 0 THEN {amount} ELSE 0 END" }),
        search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {amount} > 0 THEN {amount} ELSE 0 END" }),
        search.createColumn({ name: "amount", summary: "SUM" }),
      ],
    });

    return getAllResult(balanceSearch);
  };

  let getAllResult = customSearch => {
    let searchResultCount = customSearch.runPaged().count;
    let allResults = [];
    let [start, end, limit] = [0, 1000, searchResultCount];
    while (start < limit) {
      allResults.push(...customSearch.run().getRange(start, end));
      start += 1000;
      end += 1000;
    }
    return allResults;
  };

  return { onRequest };
});
