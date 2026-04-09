/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search"], /**
 * @param{record} record
 */ (record, search) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {};

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
  const afterSubmit = (scriptContext) => {
    try {
      log.debug("afterSubmit", "afterSubmit");
      var OpportunityObj = scriptContext.newRecord;
      var OpportunityId = scriptContext.newRecord.id;
      var fromSubsidary = OpportunityObj.getValue({
        fieldId: "custbody_from_subsidary",
      });
      var toSubsidary = OpportunityObj.getValue({
        fieldId: "custbody_to_subsidary",
      });
      var opportunityAmount = OpportunityObj.getValue({
        fieldId: "projectedtotal",
      });
      var commissionPercent = OpportunityObj.getValue({
        fieldId: "custbody_commission_percent",
      });
      var commissionTransferPO = OpportunityObj.getValue({
        fieldId: "custbody_lt_commission",
      });
      var customerId = OpportunityObj.getValue({
        fieldId: "entity",
      });
      log.debug("commissionPercent", commissionPercent);
      log.debug("opportunityAmount", opportunityAmount);
      log.debug("commissionTransferPO", commissionTransferPO);
      log.debug("customerId", customerId);
      log.debug("fromSubsidary", fromSubsidary);
      log.debug("isFirstInvoice(customerId)", isFirstInvoice(customerId));

      if (
        _logValidation(fromSubsidary) &&
        _logValidation(toSubsidary) &&
        _nullValidation(commissionTransferPO) &&
        isFirstInvoice(customerId) == 1
      ) {
        var interCompanyVendor = getIntercompanyEntity("vendor", fromSubsidary);
        var interCompanyItem = getIntercompanyItem();
        var commissionAmount = 0;
        log.debug("interCompanyVendor", interCompanyVendor);
        log.debug("interCompanyItem", interCompanyItem);

          var commissionAmount = parseFloat(
            (parseInt(commissionPercent) * parseFloat(opportunityAmount)) / 100
          ).toFixed(2);
          log.debug("commissionAmount", commissionAmount);

        

        if (interCompanyItem != 0 && interCompanyVendor != 0) {
          var purchaseObject = record.create({
            type: record.Type.PURCHASE_ORDER,
            isDynamic: true,
            defaultValues: {
              entity: interCompanyVendor,
              subsidiary: toSubsidary,
            },
          });
          purchaseObject.setValue({
            fieldId: "custbody_type_of_expense",
            value: 2,
          });
          purchaseObject.setValue({
            fieldId: "custbody_in_nature_of_document",
            value: 1,
          });

          purchaseObject.selectNewLine({
            sublistId: "item",
          });

          purchaseObject.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "item",
            value: interCompanyItem,
          });
          purchaseObject.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: 1,
          });

          purchaseObject.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "rate",
            value: commissionAmount,
          });

          purchaseObject.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "description",
            value: "Incentive",
          });

          purchaseObject.commitLine({
            sublistId: "item",
          });

          var purchaseId = purchaseObject.save();
          log.debug("purchaseId", purchaseId);

          var id = record.submitFields({
            type: record.Type.OPPORTUNITY,
            id: OpportunityId,
            values: {
              custbody_lt_commission: purchaseId,
            },
          });
          log.debug("id", id);
        }
      }
    } catch (error) {
      log.debug("Error :", error);
    }
  };

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

  function _nullValidation(val) {
    if (
      val == null ||
      val == undefined ||
      val == "" ||
      val.toString() == "undefined" ||
      val.toString() == "NaN" ||
      val.toString() == "null"
    ) {
      return true;
    } else {
      return false;
    }
  }

  function getIntercompanyEntity(recordType, fromSubsidary) {
    try {
      var enitySearchObj = search.create({
        type: recordType,
        filters: ["representingsubsidiary", "anyof", fromSubsidary],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      var searchResultCount = enitySearchObj.runPaged().count;
      log.debug("vendorSearchObj result count", searchResultCount);
      if (searchResultCount > 0) {
        var entitySearchResult = enitySearchObj.run().getRange(0, 10);
        log.debug("entitySearchResult result count", entitySearchResult);
        var vendorId = entitySearchResult[0].getValue({
          name: "internalid",
          label: "Internal ID",
        });
        log.debug("vendorId", vendorId);

        return vendorId;
      } else {
        log.debug("Note : ", "No Intercompany Entity Found");
        return 0;
      }
    } catch (error) {
      log.debug("error : ", error);
    }
  }

  function getIntercompanyItem() {
    try {
      var itemSearchObj = search.create({
        type: "item",
        filters: [["custitem_is_commission_item", "is", "T"]],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      var searchResultCount = itemSearchObj.runPaged().count;
      log.debug("itemSearchObj result count", searchResultCount);
      if (searchResultCount > 0) {
        var entitySearchResult = itemSearchObj.run().getRange(0, 10);
        log.debug("entitySearchResult result count", entitySearchResult);
        var itemId = entitySearchResult[0].getValue({
          name: "internalid",
          label: "Internal ID",
        });
        log.debug("itemId", itemId);

        return itemId;
      } else {
        log.debug("Note : ", "No Intercompany Item Found");
        return 0;
      }
    } catch (error) {
      log.debug("error", error);
    }
  }

  function isFirstInvoice(customerId) {
    var opportunitySearchObj = search.create({
      type: "opportunity",
      filters: [["entity", "anyof", customerId]],
      columns: [search.createColumn({ name: "trandate", label: "Date" })],
    });
    var searchResultCount = opportunitySearchObj.runPaged().count;
    log.debug("invoiceSearchObj result count", searchResultCount);

    if (searchResultCount == 1) {
      return 1;
    } else {
      return 0;
    }
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});
