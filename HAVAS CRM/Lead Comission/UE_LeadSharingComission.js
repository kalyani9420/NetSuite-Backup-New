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
      var InvoiceObj = scriptContext.newRecord;
      var InvoiceId = scriptContext.newRecord.id;
      var InvoiceSubsidiary = InvoiceObj.getValue({
        fieldId: "subsidiary",
      });
      var commissionPercent = InvoiceObj.getValue({
        fieldId: "custbody_commission_percent",
      });
      var customerId = InvoiceObj.getValue({
        fieldId: "entity",
      });

      log.debug("InvoiceId", InvoiceId);
      log.debug("InvoiceSubsidiary", InvoiceSubsidiary);
      var isFirstInvoiceOfCustomer = isFirstInvoice(customerId);
      log.debug("isFirstInvoiceOfCustomer", isFirstInvoiceOfCustomer);

      if (isFirstInvoiceOfCustomer == 1) {
        var SalesTeamMember = getSalesTeamMember(InvoiceId);
        log.debug("SalesTeamMember", SalesTeamMember);
        if (getSalesTeamMember != 0) {
          var CommissionTeamMember = getCommissionTeam(
            SalesTeamMember,
            InvoiceSubsidiary
          );
          log.debug("CommissionTeamMember 2", CommissionTeamMember);
          if (CommissionTeamMember != 0) {
            createInterCompanyPO(
              CommissionTeamMember,
              InvoiceId,
              commissionPercent
            );
          } else {
            log.debug(
              "Note : ",
              "No Commission Sales Team Assign in thi sales"
            );
          }
        } else {
          log.debug("Note : ", "No Sales Team Assign in this sales");
        }
      }
    } catch (error) {
      log.debug("Error 1 :", error);
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

  function getSalesTeamMember(InvoiceId) {
    var invoiceSearchObj = search.create({
      type: "invoice",
      settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["internalidnumber", "equalto", InvoiceId],
        "AND",
        ["appliedtotransaction.type", "anyof", "SalesOrd"],
      ],
      columns: [
        search.createColumn({
          name: "salesteammember",
          label: "Sales Team Member",
        }),
        search.createColumn({ name: "contribution", label: "Contribution %" }),
      ],
    });
    var searchResultCount = invoiceSearchObj.runPaged().count;
    log.debug("invoiceSearchObj result count", searchResultCount);
    var searchResult = invoiceSearchObj.run().getRange(0, 100);
    log.debug("searchResult result", searchResult);
    if (searchResultCount > 0) {
      return searchResult;
    } else {
      return 0;
    }
  }

  function getCommissionTeam(salesTeamMember, InvoiceSubsidiary) {
    var teamMember;
    var employeeFieldLookUp;
    var commissionTeamMember = [];
    var searchResult = salesTeamMember;
    log.debug("searchResult", searchResult);

    for (var index = 0; index < searchResult.length; index++) {
      teamMember = searchResult[index].getValue({
        name: "salesteammember",
        join: "appliedToTransaction",
        label: "Sales Team Member",
      });
      log.debug("teamMember", teamMember);

      employeeFieldLookUp = search.lookupFields({
        type: search.Type.EMPLOYEE,
        id: teamMember,
        columns: ["subsidiary"],
      });
      log.debug("InvoiceSubsidiary", InvoiceSubsidiary);

      log.debug(
        "employeeFieldLookUp.subsidiary[0].value",
        employeeFieldLookUp.subsidiary[0].value
      );

      if (
        parseInt(InvoiceSubsidiary) !=
        parseInt(employeeFieldLookUp.subsidiary[0].value)
      ) {
        log.debug("Inside If", "Inside If");
        commissionTeamMember.push(
          parseInt(employeeFieldLookUp.subsidiary[0].value)
        );
      }
    }
    log.debug("commissionTeamMember", commissionTeamMember);

    if (commissionTeamMember.length > 0) {
      return commissionTeamMember;
    } else {
      return 0;
    }
  }

  function isFirstInvoice(customerId) {
    var invoiceSearchObj = search.create({
      type: "invoice",
      settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["customer.internalidnumber", "equalto", customerId],
        "AND",
        ["mainline", "is", "T"],
      ],
      columns: [
        search.createColumn({ name: "tranid", label: "Document Number" }),
      ],
    });
    var searchResultCount = invoiceSearchObj.runPaged().count;
    log.debug("invoiceSearchObj result count", searchResultCount);

    if (searchResultCount == 1) {
      return 1;
    } else {
      return 0;
    }
  }

  function createInterCompanyPO(
    CommissionTeamMember,
    InvoiceId,
    commissionPercent
  ) {
    for (var index = 0; index < CommissionTeamMember.length; index++) {
      var TeamMember = CommissionTeamMember[index];
      log.debug("TeamMember", TeamMember);

      var interCompanyVendor = getIntercompanyEntity("vendor", TeamMember);
      var interCompanyItem = getIntercompanyItem();
      var commissionAmount = 0;
      var salesOrderAmount = getSalesOrderAmount(InvoiceId);
      log.debug("interCompanyVendor", interCompanyVendor);
      log.debug("interCompanyItem", interCompanyItem);

      if (salesOrderAmount != 0) {
        var commissionAmount = parseFloat(
          (parseInt(commissionPercent) * parseFloat(salesOrderAmount)) / 100
        ).toFixed(2);
      }

      if (interCompanyItem != 0 && interCompanyVendor != 0) {
        var purchaseObject = record.create({
          type: record.Type.PURCHASE_ORDER,
          isDynamic: true,
          defaultValues: {
            entity: interCompanyVendor,
            subsidiary: TeamMember,
          },
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

        //   var id = record.submitFields({
        //     type: record.Type.INVOICE,
        //     id: InvoiceId,
        //     values: {
        //       custbody_commission_po: purchaseId,
        //     },
        //   });
        //   log.debug("id", id);
      }
    }
  }

  function getSalesOrderAmount(InvoiceId) {
    var invoiceSearchObj = search.create({
      type: "invoice",
      settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["internalidnumber", "equalto", InvoiceId],
        "AND",
        ["appliedtotransaction.type", "anyof", "SalesOrd"],
      ],
      columns: [
        search.createColumn({
          name: "type",
          join: "appliedToTransaction",
          label: "Type",
        }),
        search.createColumn({
          name: "tranid",
          join: "appliedToTransaction",
          label: "Document Number",
        }),

        search.createColumn({
          name: "taxtotal",
          join: "appliedToTransaction",
          label: "Amount (Transaction Tax Total)",
        }),
        search.createColumn({
          name: "total",
          join: "appliedToTransaction",
          label: "Amount (Transaction Total)",
        }),
        search.createColumn({
          name: "custbody_stc_amount_after_discount",
          join: "appliedToTransaction",
          label: "Amount after discount",
        }),
      ],
    });
    var searchResultCount = invoiceSearchObj.runPaged().count;
    log.debug("invoiceSearchObj result count", searchResultCount);
    var searchResult = invoiceSearchObj.run().getRange(0, 10);
    var salesOrderAmount;
    if (searchResultCount > 0) {
      (salesOrderAmount = searchResult[0].getValue({
        name: "custbody_stc_amount_after_discount",
        join: "appliedToTransaction",
        label: "Amount after discount",
      })),
        log.debug("salesOrderAmount 1", salesOrderAmount);
    } else {
      salesOrderAmount = 0;
    }

    return salesOrderAmount;
  }

  function getSalesOrderAmount(InvoiceId) {
    var invoiceSearchObj = search.create({
      type: "invoice",
      settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
      filters: [
        ["type", "anyof", "CustInvc"],
        "AND",
        ["internalidnumber", "equalto", InvoiceId],
        "AND",
        ["appliedtotransaction.type", "anyof", "SalesOrd"],
      ],
      columns: [
        search.createColumn({
          name: "type",
          join: "appliedToTransaction",
          label: "Type",
        }),
        search.createColumn({
          name: "tranid",
          join: "appliedToTransaction",
          label: "Document Number",
        }),

        search.createColumn({
          name: "taxtotal",
          join: "appliedToTransaction",
          label: "Amount (Transaction Tax Total)",
        }),
        search.createColumn({
          name: "total",
          join: "appliedToTransaction",
          label: "Amount (Transaction Total)",
        }),
        search.createColumn({
          name: "custbody_stc_amount_after_discount",
          join: "appliedToTransaction",
          label: "Amount after discount",
        }),
      ],
    });
    var searchResultCount = invoiceSearchObj.runPaged().count;
    log.debug("invoiceSearchObj result count", searchResultCount);
    var searchResult = invoiceSearchObj.run().getRange(0, 10);
    var salesOrderAmount;
    if (searchResultCount > 0) {
      (salesOrderAmount = searchResult[0].getValue({
        name: "custbody_stc_amount_after_discount",
        join: "appliedToTransaction",
        label: "Amount after discount",
      })),
        log.debug("salesOrderAmount 1", salesOrderAmount);
    } else {
      salesOrderAmount = 0;
    }

    return salesOrderAmount;
  }

  function getIntercompanyEntity(recordType, fromSubsidary) {
    try {
      var enitySearchObj = search.create({
        type: recordType,
        filters: [["representingsubsidiary", "anyof", fromSubsidary]],
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
      log.debug("error 3 : ", error);
    }
  }

  function getIntercompanyItem() {
    try {
      var itemSearchObj = search.create({
        type: "item",
        filters: [["custitem1", "is", "T"]],
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
      log.debug("error 2", error);
    }
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});
