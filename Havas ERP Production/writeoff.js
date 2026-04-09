/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/currentRecord", "N/record", "N/search"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record, search) => {
  /**
   * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
   * @param {Object} inputContext
   * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Object} inputContext.ObjectRef - Object that references the input data
   * @typedef {Object} ObjectRef
   * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
   * @property {string} ObjectRef.type - Type of the record instance that contains the input data
   * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
   * @since 2015.2
   */

  const getInputData = (inputContext) => {
    try {
      var transactionSearchObj = search.create({
        type: "transaction",
        settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
        filters: [
          ["type", "anyof", "VendBill", "CustInvc"],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          ["custbody_write_off_je_ref", "noneof", "@NONE@"],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
          search.createColumn({ name: "type", label: "Type" }),
          search.createColumn({
            name: "custbody_write_off_je_ref",
            label: "Write Off JE Reference",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTBODY_WRITE_OFF_JE_REF",
            label: "Internal ID",
          }),
        ],
      });
      var searchResultCount = transactionSearchObj.runPaged().count;
      log.debug("transactionSearchObj result count", searchResultCount);
      var resultsearch = transactionSearchObj.run().getRange(0, 1000);
      return resultsearch;
    } catch (error) {
      log.debug("Error : ", error);
    }
  };

  const map = (mapContext) => {
    try {
      var mapvalue = mapContext.value;
      var temp = JSON.parse(mapvalue);
      var mapValues = temp.values;
      var recordJSON = mapValues.type;
      var recordType = recordJSON[0].value;
      var jeJSON = mapValues.custbody_write_off_je_ref;
      var jeId = jeJSON[0].value;
      var transactionJSON = mapValues.internalid;
      var transactionId = transactionJSON[0].value;
      // log.debug("mapvalue", mapvalue);
    //   log.debug("mapValues", mapValues);
      // log.debug("recordJSON", recordJSON);
    //   log.debug("recordType", recordType);
      // log.debug("transactionJSON", transactionJSON);
    //   log.debug("transactionId", transactionId);
    //   log.debug("jeJSON", jeJSON);
      log.debug("jeId", jeId);
      var journalId = record.delete({
        type: record.Type.JOURNAL_ENTRY,
        id: parseInt(jeId),
      });
      log.debug("journalId", journalId);
    //   if ((recordType = "CustInvc")) {
    //     var invoiceRecord = record.load({
    //       type: record.Type.INVOICE,
    //       id: parseInt(transactionId),
    //     });
    //     var savedInvoice = invoiceRecord.save();
    //     log.debug("savedInvoice", savedInvoice);
    //   }
    //   if ((recordType = "VendBill")) {
    //     var billRecord = record.load({
    //       type: record.Type.VENDOR_BILL,
    //       id: parseInt(transactionId),
    //     });
    //     var savedBill = billRecord.save();
    //     log.debug("savedBill", savedBill);
    //   }
    } catch (error) {
      log.debug("Error : ", error);
    }
  };

  const reduce = (reduceContext) => {};

  const summarize = (summaryContext) => {};

  return { getInputData, map, reduce, summarize };
});
