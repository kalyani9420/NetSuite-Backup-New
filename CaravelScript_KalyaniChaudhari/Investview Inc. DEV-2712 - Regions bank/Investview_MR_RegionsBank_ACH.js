/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
/**
*Description: The Map Reduce script to generate Payment files in WIRE XML format"
  Script Name: Investview_MR_RegionsBank_WIRE.js
  Author: Akanksha Bhardwaj
  Company: Caravel
  Date: 05-03-2024 
  Script Modification Log:
  -- version--     -- Date --         -- Modified By --     --Requested By--      -- Description --
       1.0         05-03-2024         Akanksha Bhardwaj       Habib Abdullahi        Create a Map Reduce script to generate Payment files in WIRE XML format
*/
define(["N/currentRecord", "N/search", "N/file", "N/format", "N/runtime", "N/record"], (
  currentRecord,
  search,
  file,
  format,
  runtime,
  record
) => {
  const getInputData = (inputContext) => {
    var scriptObj = runtime.getCurrentScript();
    var company_legal_name = scriptObj.getParameter({
      name: "custscript_company_bank_legal_name",
    });
    // var company_bank_id = scriptObj.getParameter({
    //   name: "custscript_company_bank_id",
    // });
    var company_bank_zip = scriptObj.getParameter({
      name: "custscript_company_bank_zip",
    });
    var company_bank_city = scriptObj.getParameter({
      name: "custscript_company_bank_city",
    });
    var company_bank_state = scriptObj.getParameter({
      name: "custscript_company_bank_state",
    });
    var company_bank_country = scriptObj.getParameter({
      name: "custscript_company_bank_country",
    });
    var company_bank_address = scriptObj.getParameter({
      name: "custscript_company_bank_address",
    });
    // var company_bank_account_no = scriptObj.getParameter({
    //   name: "custscript_company_bank_account_number",
    // });
    var company_bank_currency = scriptObj.getParameter({
      name: "custscript_company_bank_currency",
    });
    var company_bank_number = scriptObj.getParameter({
      name: "custscript_company_bank_number",
    });
    var vendorpaymentSearchObj = search.create({
      type: "vendorpayment",
      filters: [
        ["type", "anyof", "VendPymt"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["accountmain", "anyof", "731", "732", "733"],
        "AND",
        ["custbody_cp_vendorbillpaymentmethod", "anyof", "7"],
        "AND",
        ["custbody_xml_payment_file_genarated", "is", "F"],
        "AND",
        ["trandate", "onorbefore", "today"],
        "AND",
        ["custbody_status_approval", "anyof", "3"],
      ],
      columns: [
        search.createColumn({
          name: "ordertype",
          sort: search.Sort.ASC,
          label: "Order Type",
        }),
        search.createColumn({ name: "mainline", label: "*" }),
        search.createColumn({ name: "trandate", label: "Date" }),
        search.createColumn({ name: "type", label: "Type" }),
        search.createColumn({ name: "entity", label: "Name" }),
        search.createColumn({ name: "account", label: "Account" }),
        search.createColumn({ name: "amount", label: "Amount" }),
        search.createColumn({ name: "transactionnumber", label: "Transaction Number" }),
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "memomain", label: "Memo (Main)" }),
        search.createColumn({
          name: "internalid",
          join: "vendor",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "address1",
          join: "vendor",
          label: "Address 1",
        }),
        search.createColumn({
          name: "address2",
          join: "vendor",
          label: "Address 2",
        }),
        search.createColumn({
          name: "address3",
          join: "vendor",
          label: "Address 3",
        }),
        search.createColumn({
          name: "city",
          join: "vendor",
          label: "City",
        }),
        search.createColumn({
          name: "state",
          join: "vendor",
          label: "State/Province",
        }),
        search.createColumn({
          name: "billcountry",
          join: "vendor",
          label: "Billing Country",
        }),
        search.createColumn({
          name: "country",
          join: "vendor",
          label: "Country",
        }),
        search.createColumn({
          name: "zipcode",
          join: "vendor",
          label: "Zip Code",
        }),
        search.createColumn({
          name: "countrycode",
          join: "vendor",
          label: "Country Code",
        }),
      ],
    });
    var searchResultCount = vendorpaymentSearchObj.runPaged().count;
    log.debug("vendorpaymentSearchObj result count", searchResultCount);
    var result = vendorpaymentSearchObj.run().getRange({ start: 0, end: 100 });
    var result_length = result.length;

    if (result.length > 0) {
      var arr_search_result = [];

      for (var i = 0; i < result.length; i++) {
        var bill_date = result[i].getValue({
          name: "trandate",
          label: "Date",
        });

        var vendor_name = result[i].getText({
          name: "entity",
          label: "Name",
        });
        var bill_account = result[i].getValue({
          name: "account",
          label: "Account",
        });
        var bill_amount = result[i].getValue({
          name: "amount",
          label: "Amount",
        });
        var bill_id = result[i].getText({
          name: "internalid",
          label: "Internal ID",
        });
        var bill_memo = result[i].getValue({ name: "memomain", label: "Memo (Main)" });
        var vendor_id = result[i].getText({
          name: "internalid",
          join: "vendor",
          label: "Internal ID",
        });
        var transaction_number = result[i].getValue({
          name: "transactionnumber",
          label: "Transaction Number"
        });
        var vendor_address = result[i].getValue({
          name: "address1",
          join: "vendor",
          label: "Address 1",
        });
        var vendor_city = result[i].getValue({
          name: "city",
          join: "vendor",
          label: "City",
        });
        var vendor_state = result[i].getValue({
          name: "state",
          join: "vendor",
          label: "State/Province",
        });
        var vendor_country = result[i].getValue({
          name: "country",
          join: "vendor",
          label: "Country",
        });
        var vendor_zip_code = result[i].getValue({
          name: "zipcode",
          join: "vendor",
          label: "Zip Code",
        });
        var vendor_country_code = result[i].getValue({
          name: "countrycode",
          join: "vendor",
          label: "Country Code",
        });
        // var getAddress = getAddress('a' , null , 'c');
        // log.debug('getAddress', getAddress)

        // log.debug("bill_date", bill_date);
        // log.debug("vendor_name", vendor_name);
        // log.debug("bill_account", bill_account);
        // log.debug("bill_amount", bill_amount);
        // log.debug("bill_id", bill_id);
        // log.debug("vendor_id", vendor_id);
        // log.debug("vendor_address", vendor_address);
        // log.debug("vendor_city", vendor_city);
        // log.debug("vendor_state", vendor_state);
        // log.debug("vendor_country", vendor_country);
        // log.debug("vendor_zip_code", vendor_zip_code);
        // log.debug("vendor_country_code", vendor_country_code);

        var accountno_fieldLookUp = search.lookupFields({
          type: 'account',
          id: bill_account,
          columns: ['custrecord_pay_account_number']
        });

        var pay_company_account_number = accountno_fieldLookUp.custrecord_pay_account_number;

        log.debug('accountno_fieldLookUp', accountno_fieldLookUp.custrecord_pay_account_number);



        var customrecord_2663_entity_bank_detailsSearchObj = search.create({
          type: "customrecord_2663_entity_bank_details",
          filters: [["custrecord_2663_parent_vendor", "anyof", vendor_id]],
          columns: [
            search.createColumn({
              name: "name",
              sort: search.Sort.ASC,
              label: "Name",
            }),
            search.createColumn({ name: "scriptid", label: "Script ID" }),
            search.createColumn({
              name: "custrecord_2663_entity_bank_type",
              label: "Type",
            }),
            search.createColumn({
              name: "custrecord_2663_entity_file_format",
              label: "Payment File Format",
            }),
            search.createColumn({
              name: "custrecord_9572_subsidiary",
              label: "Subsidiary",
            }),
            search.createColumn({ name: "internalid", label: "Internal ID" }),
            search.createColumn({
              name: "custrecord_bank_account_routing_number",
              label: "Bank Account Routing Number",
            }),
            search.createColumn({
              name: "custrecord_2663_entity_acct_no",
              label: "Bank Account Number",
            }),
            search.createColumn({
              name: "custrecord_2663_entity_iban",
              label: "IBAN",
            }),
            search.createColumn({
              name: "custrecord_2663_entity_bic",
              label: "BIC",
            }),
          ],
        });
        var searchResultCount =
          customrecord_2663_entity_bank_detailsSearchObj.runPaged().count;
        log.debug(
          "customrecord_2663_entity_bank_detailsSearchObj result count",
          searchResultCount
        );
        var result_vednor_bank = customrecord_2663_entity_bank_detailsSearchObj
          .run()
          .getRange({ start: 0, end: 100 });

        log.debug('result_vednor_bank', result_vednor_bank)

        var entity_bank_name = result_vednor_bank[0].getValue({
          name: "name",
          label: "Name",
        });

        var entity_bank_routing_Number = result_vednor_bank[0].getValue({
          name: "custrecord_bank_account_routing_number",
          label: "Bank Account Routing Number",
        });
        var entity_bank_acc_no = result_vednor_bank[0].getValue({
          name: "custrecord_2663_entity_acct_no",
          label: "Bank Account Number",
        });
        var entity_bank_ibn = result_vednor_bank[0].getValue({
          name: "custrecord_2663_entity_iban",
          label: "IBAN",
        });
        var entity_bank_bic = result_vednor_bank[0].getValue({
          name: "custrecord_2663_entity_bic",
          label: "BIC",
        });

        // log.debug("entity_bank_routing_Number", entity_bank_routing_Number);
        // log.debug("entity_bank_acc_no", entity_bank_acc_no);
        // log.debug("entity_bank_ibn", entity_bank_ibn);
        // log.debug("entity_bank_bic", entity_bank_bic);
        var format_bill_date = parseAndFormatDateString(bill_date);
        log.debug("format_bill_date", format_bill_date);

        arr_search_result.push({
          key: bill_id,
          values: {
            bill_date: format_bill_date,
            vendor_name: vendor_name,
            bill_account: bill_account,
            bill_amount: bill_amount,
            bill_memo: bill_memo,
            vendor_id: vendor_id,
            transaction_number: transaction_number,
            vendor_address: vendor_address,
            vendor_city: vendor_city,
            vendor_state: vendor_state,
            vendor_country: vendor_country,
            vendor_zip_code: vendor_zip_code,
            entity_bank_name: entity_bank_name,
            entity_bank_acc_no: entity_bank_acc_no,
            entity_bank_routing_Number: entity_bank_routing_Number,
            entity_bank_ibn: entity_bank_ibn,
            entity_bank_bic: entity_bank_bic,
            company_legal_name: company_legal_name,
            // company_bank_id: company_bank_id,
            company_bank_zip: company_bank_zip,
            company_bank_city: company_bank_city,
            company_bank_state: company_bank_state,
            company_bank_country: company_bank_country,
            company_bank_address: company_bank_address,
            company_bank_account_no: pay_company_account_number,
            company_bank_currency: company_bank_currency,
            company_bank_number: company_bank_number
          },
        });

        // log.debug('arr_search_result' , JSON.parse(arr_search_result.key));
        log.debug("arr_search_result", arr_search_result);
      }
    }

    return arr_search_result;
  };

  const map = (mapContext) => {
    var map_value = JSON.parse(mapContext.value);

    // log.debug("map_", map_value);
    log.debug("map_value_key", map_value.key);
    log.debug("map_value_value", map_value.values);

    var billDate = map_value.values.bill_date;
    var transactionnumber = map_value.values.transaction_number;
    var resultLength = map_value.values.result_length;
    var billId = map_value.key;
    var billAmount = map_value.values.bill_amount;
    var billMemo = map_value.values.bill_memo;
    var entityBankName = map_value.values.entity_bank_name;
    var billAccount = map_value.values.bill_account;
    var entityBankAccNo = map_value.values.entity_bank_acc_no;
    var entityBankRoutingNo = map_value.values.entity_bank_routing_Number;
    var entityBankBIC = map_value.values.entity_bank_bic;
    var entityBankIBAN = map_value.values.entity_bank_ibn;
    var vendorName = map_value.values.vendor_name;
    var vendorZip = map_value.values.vendor_zip_code;
    var vendorAddress = map_value.values.vendor_address;
    var vendorCity = map_value.values.vendor_city;
    var vendorState = map_value.values.vendor_state;
    var vendorCountry = map_value.values.vendor_country;
    var companyBankLegalName = map_value.values.company_legal_name;
    // var companyBankId = map_value.values.company_bank_id;
    var companyBankZip = map_value.values.company_bank_zip;
    var companyBankCity = map_value.values.company_bank_city;
    var companyBankState = map_value.values.company_bank_state;
    var companyBankCountry = map_value.values.company_bank_country;
    var companyBankAddress = map_value.values.company_bank_address;
    var companyBankAccountNo = map_value.values.company_bank_account_no;
    var companyBankCurrency = map_value.values.company_bank_currency;
    var companyBankNumber = map_value.values.company_bank_number

    var vendorbillSearchObj = search.create({
      type: "vendorbill",
      filters: [
        ["type", "anyof", "VendBill"],
        "AND",
        ["applyingtransaction.type", "anyof", "VendPymt"],
        "AND",
        ["applyingtransaction.internalidnumber", "equalto", billId],
      ],
      columns: [
        search.createColumn({
          name: "ordertype",
          sort: search.Sort.ASC,
          label: "Order Type",
        }),
        search.createColumn({ name: "mainline", label: "*" }),
        search.createColumn({ name: "amount", label: "Amount" }),
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "currency", label: "Currency" })
      ],
    });
    var result = vendorbillSearchObj.run().getRange({ start: 0, end: 100 });
    log.debug('line result length', result.length);
    var result_length = result.length;

    if (result.length > 0) {
      var xmlValue = "";
      for (var i = 0; i < result.length; i++) {
        var bill_amount = result[i].getValue({
          name: "amount",
          label: "Amount",
        });
        var bill_currency = result[i].getValue({
          name: "currency", label: "Currency"
        });
        log.debug('bill_currency', bill_currency)
        var currency_fieldLookUp = search.lookupFields({
          type: 'currency',
          id: bill_currency,
          columns: ['symbol']
        });
        var currency_symbol = currency_fieldLookUp.symbol;
        log.debug('currency_fieldLookUp', currency_fieldLookUp.symbol)

        log.debug('bill_amount', bill_amount);
        xmlValue += "\n\t<CdtTrfTxInf>";
        xmlValue += "\n\t\t<PmtId>";
        xmlValue += "\n\t\t\t<EndToEndId>" + transactionnumber + "</EndToEndId>";
        xmlValue += "\n\t\t</PmtId>";
        xmlValue += "\n\t\t<Amt>";
        xmlValue += "\n\t\t\t<InstdAmt Ccy='" + currency_symbol + "'>" + Math.abs(bill_amount) + "</InstdAmt>";
        xmlValue += "\n\t\t</Amt>";
        xmlValue += "\n\t\t<ChrgBr>" + "DEBT" + "</ChrgBr>";
        xmlValue += "\n\t\t<CdtrAgt>";
        xmlValue += "\n\t\t\t<FinInstnId>";
        // xmlValue += "\n\t\t\t\t<BIC>" + entityBankBIC + "</BIC>";
        xmlValue += "\n\t\t\t\t<ClrSysMmbId>";
        xmlValue += "\n\t\t\t\t\t<ClrSysId>";
        xmlValue += "\n\t\t\t\t\t\t<Cd>" + "USABA" + "</Cd>";
        xmlValue += "\n\t\t\t\t\t</ClrSysId>";
        xmlValue += "\n\t\t\t\t\t<MmbId>" + entityBankRoutingNo + "</MmbId>";
        xmlValue += "\n\t\t\t\t</ClrSysMmbId>";
        xmlValue += "\n\t\t\t\t<Nm>" + entityBankName + "</Nm>";
        xmlValue += "\n\t\t\t\t<PstlAdr>";
        xmlValue += "\n\t\t\t\t\t<PstCd>" + vendorZip + "</PstCd>";
        xmlValue += "\n\t\t\t\t\t<TwnNm>" + vendorCity + "</TwnNm>";
        xmlValue += "\n\t\t\t\t\t<CtrySubDvsn>" + vendorState + "</CtrySubDvsn>";
        xmlValue += "\n\t\t\t\t\t<Ctry>" + vendorCountry + "</Ctry>";
        xmlValue += "\n\t\t\t\t\t<AdrLine>" + vendorAddress + "</AdrLine>";
        xmlValue += "\n\t\t\t\t</PstlAdr>";
        xmlValue += "\n\t\t\t</FinInstnId>";
        xmlValue += "\n\t\t</CdtrAgt>";
        xmlValue += "\n\t<Cdtr>";
        xmlValue += "\n\t\t<Nm>" + entityBankName + "</Nm>";
        xmlValue += "\n\t\t\t\t<PstlAdr>";
        xmlValue += "\n\t\t\t\t\t<PstCd>" + vendorZip + "</PstCd>";
        xmlValue += "\n\t\t\t\t\t<TwnNm>" + vendorCity + "</TwnNm>";
        xmlValue += "\n\t\t\t\t\t<CtrySubDvsn>" + vendorState + "</CtrySubDvsn>";
        xmlValue += "\n\t\t\t\t\t<Ctry>" + vendorCountry + "</Ctry>";
        xmlValue += "\n\t\t\t\t\t<AdrLine>" + vendorAddress + "</AdrLine>";
        xmlValue += "\n\t\t\t\t</PstlAdr>";
        xmlValue += "\n\t</Cdtr>";
        xmlValue += "\n\t<CdtrAcct>";
        // xmlValue += "\n\t\t<Id>";
        // xmlValue += "\n\t\t\t<IBAN>" + entityBankIBAN +"</IBAN>";
        // xmlValue += "\n\t\t</Id>";
        xmlValue += "\n\t\t<Id>";
        xmlValue += "\n\t\t\t<Othr>";
        xmlValue += "\n\t\t\t\t<Id>" + entityBankAccNo + "</Id>";
        xmlValue += "\n\t\t\t</Othr>";
        xmlValue += "\n\t\t</Id>";
        xmlValue += "\n\t\t<Tp>";
        xmlValue += "\n\t\t\t<Cd>" + "CACC" + "</Cd>";
        xmlValue += "\n\t\t</Tp>";
        xmlValue += "\n\t</CdtrAcct>";
        xmlValue += "\n\t\t<RmtInf>";
        xmlValue += "\n\t\t\t<Ustrd>" + billMemo + "</Ustrd>";
        xmlValue += "\n\t\t</RmtInf>";
        xmlValue += "\n\t</CdtTrfTxInf>";
      }
      xmlValue += "\n</PmtInf>";
      xmlValue += "\n</CstmrCdtTrfInitn>";
      xmlValue += "\n</Document>";

    }



    log.debug("xmlvalue", xmlValue);

    mapContext.write({
      key: billId,
      value: {
        xmlString: xmlValue,
        billDate: billDate,
        billAccount: billAccount,
        resultLength: result_length,
        transactionNumber: transactionnumber,
        companyBankLegalName: companyBankLegalName,
        entityBankName: entityBankName,
        // companyBankId: companyBankId,
        companyBankZip: companyBankZip,
        companyBankCity: companyBankCity,
        companyBankState: companyBankState,
        companyBankCountry: companyBankCountry,
        companyBankAddress: companyBankAddress,
        companyBankAccountNo: companyBankAccountNo,
        companyBankCurrency: companyBankCurrency,
        companyBankNumber: companyBankNumber
      },
    });
  };

  const reduce = (reduceContext) => {
    // let parsedObject = JSON.parse(reduceContext.values[j]);
    var reduce_key = reduceContext.key;
    var reduce_value = reduceContext.values;

    log.debug("reduce_key", reduce_key);
    log.debug("reduce_value", reduce_value);
    var content = JSON.parse(reduce_value);
    log.debug("reduce_value.toString() typeof ", typeof content.xmlString);
    var xmlEntityTemplate = content.xmlString;
    var billDate = content.billDate;
    var billAccount = content.billAccount;
    var resultLength = content.resultLength;
    var transactionNumber = content.transactionNumber;
    var companyBankLegalName = content.companyBankLegalName;
    // var companyBankId = content.companyBankId;
    var companyBankZip = content.companyBankZip;
    var companyBankCity = content.companyBankCity;
    var companyBankState = content.companyBankState;
    var companyBankCountry = content.companyBankCountry;
    var companyBankAddress = content.companyBankAddress;
    var companyBankAccountNo = content.companyBankAccountNo;
    var companyBankCurrency = content.companyBankCurrency;
    var companyBankNumber = content.companyBankNumber;
    var entityBankName = content.entityBankName
    log.debug("billDate", billDate);
    log.debug("resultLength", resultLength);
    log.debug("companyBankLegalName", companyBankLegalName);

    var todaysDate = new Date();

    var xmlValue =
      '<?xml version="1.0" encoding="UTF-8" ?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
    xmlValue += "\n<CstmrCdtTrfInitn>";
    xmlValue += "\n<GrpHdr>";
    xmlValue += "\n\t<MsgId>" + transactionNumber + "</MsgId>";
    xmlValue += "\n\t<CreDtTm>" + getISOTime(todaysDate) + "</CreDtTm>";
    xmlValue += "\n\t<NbOfTxs>" + resultLength + "</NbOfTxs>";
    xmlValue += "\n\t<InitgPty>";
    xmlValue += "\n\t\t<Id>";
    xmlValue += "\n\t\t\t<OrgId>";
    xmlValue += "\n\t\t\t\t<Othr>";
    xmlValue += "\n\t\t\t\t\t<Id>" + getCompanyId(billAccount) + "</Id>";
    xmlValue += "\n\t\t\t\t\t<SchmeNm>";
    xmlValue += "\n\t\t\t\t\t\t<Cd>" + "CUST" + "</Cd>";
    xmlValue += "\n\t\t\t\t\t</SchmeNm>";
    xmlValue += "\n\t\t\t\t</Othr>";
    xmlValue += "\n\t\t\t</OrgId>";
    xmlValue += "\n\t\t</Id>";
    xmlValue += "\n\t</InitgPty>";
    xmlValue += "\n</GrpHdr>";
    xmlValue += "\n<PmtInf>";
    xmlValue += "\n\t<PmtInfId>" + billDate + "</PmtInfId>";
    xmlValue += "\n\t<PmtMtd>" + "TRF" + "</PmtMtd>";
    xmlValue += "\n\t<NbOfTxs>" + resultLength + "</NbOfTxs>";
    xmlValue += "\n\t<PmtTpInf>";
    xmlValue += "\n\t\t<SvcLvl>";
    xmlValue += "\n\t\t\t<Cd>" + "NURG" + "</Cd>";
    xmlValue += "\n\t\t</SvcLvl>";
    xmlValue += "\n\t\t<LclInstrm>";
    xmlValue += "\n\t\t\t<Cd>" + "CCD" + "</Cd>";
    xmlValue += "\n\t\t</LclInstrm>";
    xmlValue += "\n\t</PmtTpInf>";
    xmlValue += "\n\t<ReqdExctnDt>" + billDate + "</ReqdExctnDt>";
    xmlValue += "\n\t<Dbtr>";
    xmlValue += "\n\t\t<Nm>" + companyBankLegalName + "</Nm>";
    xmlValue += "\n\t\t\t<PstlAdr>";
    xmlValue += "\n\t\t\t\t<PstCd>" + companyBankZip + "</PstCd>";
    xmlValue += "\n\t\t\t\t<TwnNm>" + companyBankCity + "</TwnNm>";
    xmlValue += "\n\t\t\t\t<CtrySubDvsn>" + companyBankState + "</CtrySubDvsn>";
    xmlValue += "\n\t\t\t\t<Ctry>" + companyBankCountry + "</Ctry>";
    xmlValue += "\n\t\t\t\t<AdrLine>" + companyBankAddress + "</AdrLine>";
    xmlValue += "\n\t\t\t</PstlAdr>";
    xmlValue += "\n\t\t<Id>";
    xmlValue += "\n\t\t\t<OrgId>";
    xmlValue += "\n\t\t\t\t<Othr>";
    xmlValue += "\n\t\t\t\t\t<Id>" + getCompanyId(billAccount) + "</Id>";
    xmlValue += "\n\t\t\t\t\t<SchmeNm>";
    xmlValue += "\n\t\t\t\t\t\t<Prtry>" + "ACH" + "</Prtry>";
    xmlValue += "\n\t\t\t\t\t</SchmeNm>";
    xmlValue += "\n\t\t\t\t</Othr>";
    xmlValue += "\n\t\t\t</OrgId>";
    xmlValue += "\n\t\t</Id>";
    xmlValue += "\n\t</Dbtr>";
    xmlValue += "\n\t<DbtrAcct>";
    xmlValue += "\n\t\t<Id>";
    xmlValue += "\n\t\t\t<Othr>";
    xmlValue += "\n\t\t\t\t<Id>" + companyBankAccountNo + "</Id>";
    xmlValue += "\n\t\t\t</Othr>";
    xmlValue += "\n\t\t</Id>";
    xmlValue += "\n\t\t<Tp>";
    xmlValue += "\n\t\t\t<Cd>" + "CACC" + "</Cd>";
    xmlValue += "\n\t\t</Tp>";
    xmlValue += "\n\t\t<Ccy>" + companyBankCurrency + "</Ccy>";
    xmlValue += "\n\t</DbtrAcct>";
    xmlValue += "\n\t<DbtrAgt>";
    xmlValue += "\n\t\t<FinInstnId>";
    xmlValue += "\n\t\t\t<ClrSysMmbId>";
    xmlValue += "\n\t\t\t<ClrSysId>";
    xmlValue += "\n\t\t\t\t<Cd>" + "USABA" + "</Cd>";
    xmlValue += "\n\t\t\t</ClrSysId>";
    xmlValue += "\n\t\t\t<MmbId>" + companyBankNumber + "</MmbId>";
    xmlValue += "\n\t\t\t</ClrSysMmbId>";
    xmlValue += "\n\t\t\t<PstlAdr>";
    xmlValue += "\n\t\t\t\t<PstCd>" + companyBankZip + "</PstCd>";
    xmlValue += "\n\t\t\t\t<TwnNm>" + companyBankCity + "</TwnNm>";
    xmlValue += "\n\t\t\t\t<CtrySubDvsn>" + companyBankState + "</CtrySubDvsn>";
    xmlValue += "\n\t\t\t\t<Ctry>" + companyBankCountry + "</Ctry>";
    xmlValue += "\n\t\t\t\t<AdrLine>" + companyBankAddress + "</AdrLine>";
    xmlValue += "\n\t\t\t</PstlAdr>";
    xmlValue += "\n\t\t</FinInstnId>";
    xmlValue += "\n\t</DbtrAgt>";
    xmlValue += "\n\t<ChrgBr>" + "DEBT" + "</ChrgBr>"
    xmlValue += xmlEntityTemplate;

    var xml_String = xmlValue;

    log.debug("xml_String", xml_String);

    var temp_todaysDate = new Date();
    var full_year_today = temp_todaysDate.getFullYear();
    var month_today = temp_todaysDate.getMonth() + 1;
    var day_today = temp_todaysDate.getDate();
    var formatted_month_today = (month_today < 10) ? ('0' + month_today) : month_today;
    var formatted_day_today = (day_today < 10) ? ('0' + day_today) : day_today;
    
    var hours = temp_todaysDate.getHours();
    var minutes = temp_todaysDate.getMinutes();
    var seconds = temp_todaysDate.getSeconds();
    var formatted_hours = (hours < 12) ? (hours + 12) : hours;
    var formatted_minutes = (minutes < 10) ? ('0' + minutes) : minutes;
    var formatted_second = (seconds < 10) ? ('0' + seconds) : seconds;


    var formatted_current_date = formatted_month_today + '' + formatted_day_today + '' + full_year_today;
    var formatted_current_time = formatted_hours +''+ formatted_minutes + '' + formatted_second;

    log.debug("Time: ", formatted_current_time);
    log.debug("formatted_month_today: ", formatted_month_today);
    log.debug("formatted_day_today: ", formatted_day_today);
    log.debug("formatted_hours: ", formatted_hours);
    log.debug("formatted_second: ", formatted_second);

    var file_name = "InvestviewPayables_" + formatted_current_date + "_" + formatted_current_time + "_ACH" + ".xml";
    let fileObj = file.create({
      name: file_name,
      fileType: file.Type.XMLDOC,
      contents: xml_String,
      folder: 1064,
    });
    log.debug("fileObj", fileObj);
    let savedId = fileObj.save();
    log.debug("savedId", savedId);

    if (savedId) {
      log.debug('saveid reduce_key', reduce_key)
      log.debug('typeof reduce_key', typeof reduce_key)
      var x = record.submitFields({
        type: record.Type.VENDOR_PAYMENT,
        id: reduce_key,
        values: {
          'custbody_xml_payment_file_genarated': true
        }
      });
      log.debug('x', x);
    }

  };

  const summarize = (summaryContext) => { };
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

  function getISOTime(date) {
    var iso_date = date.toISOString();
    var [ISODate, TimeZone] = iso_date.split(".");
    log.debug("ISODate", ISODate);

    return ISODate;
  }

  function parseAndFormatDateString(rawDateString) {
    var date = format.parse({
      value: rawDateString,
      type: format.Type.DATE,
    });
    var full_year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    if (month < 10) {
      month = "0" + month;
    }
    if (day < 10) {
      day = "0" + day;
    }
    var formatted_date = full_year + "-" + month + "-" + day;
    log.debug("parsedDate", formatted_date);
    return formatted_date;
  }


  function getCompanyId(account_id) {
    log.debug('account_id', account_id);
    log.debug('typeof account_id', typeof account_id);

    var company_id;
    if (account_id === '731') {
      company_id = 2870369205;
    }
    else if (account_id === '732') {
      company_id = 2862871335;
    }
    else if (account_id === '733') {
      company_id = 2462108710;
    }
    else {
      company_id = 0;
    }
    log.debug('company_id', company_id);

    return company_id;

  }


  function getAddress(add1, add2, add3) {
    var add = "";
    if (!_logValidation(add1)) {
      add = add + add1;
    }
    if (!_logValidation(add2)) {
      if (!_logValidation(add)) {
        add = add + "," + add2;
      } else {
        add = add2;
      }
    }
    if (!_logValidation(add3)) {
      if (!_logValidation(add)) {
        add = add + "," + add3;
      } else {
        add = add3;
      }
    }
    return add;
  }

  return { getInputData, map, reduce, summarize };
});
