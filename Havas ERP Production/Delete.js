/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(["N/currentRecord", "N/email", "N/record", "N/search"]
/**
 * @param{currentRecord} currentRecord
 */, (currentRecord, email, record, search) => {
  /**
   * Defines the Scheduled script trigger point.
   * @param {Object} scriptContext
   * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
   * @since 2015.2
   */
  const execute = (scriptContext) => {
    // var vendorSearchObj = search.create({
    //   type: "vendor",
    //   filters: [
    //     [
    //       [
    //         ["category", "noneof", "2", "1", "4", "3"],
    //         "AND",
    //         ["representingsubsidiary", "anyof", "@NONE@"],
    //         "AND",
    //         ["internalid", "noneof", "-3"],
    //       ],
    //     ],
    //   ],
    //   columns: [
    //     search.createColumn({ name: "entityid", label: "Name" }),
    //     search.createColumn({ name: "email", label: "Email" }),
    //     search.createColumn({ name: "phone", label: "Phone" }),
    //     search.createColumn({ name: "altphone", label: "Office Phone" }),
    //     search.createColumn({ name: "fax", label: "Fax" }),
    //     search.createColumn({ name: "altemail", label: "Alt. Email" }),
    //     search.createColumn({
    //       name: "custentity_11724_pay_bank_fees",
    //       label: "Vendor Bank Fees",
    //     }),
    //     search.createColumn({
    //       name: "custentity_9572_vendor_entitybank_sub",
    //       label: "Vendor Entity Bank Subsidiary",
    //     }),
    //     search.createColumn({
    //       name: "custentity_9572_vendor_entitybank_format",
    //       label: "Vendor Entity Bank Format",
    //     }),
    //     search.createColumn({ name: "internalid", label: "Internal ID" }),
    //   ],
    // });
    // var searchResultCount = vendorSearchObj.runPaged().count;
    // log.debug("vendorSearchObj result count", searchResultCount);
    // var searchResult = vendorSearchObj.run().getRange(0, 1000);

    // var customerSearchObj = search.create({
    //     type: "customer",
    //     filters:
    //     [
    //        ["stage","anyof","CUSTOMER"], 
    //        "AND", 
    //        ["representingsubsidiary","anyof","@NONE@"]
    //     ],
    //     columns:
    //     [
    //        search.createColumn({name: "entityid", label: "Name"}),
    //        search.createColumn({name: "email", label: "Email"}),
    //        search.createColumn({name: "phone", label: "Phone"}),
    //        search.createColumn({name: "altphone", label: "Office Phone"}),
    //        search.createColumn({name: "fax", label: "Fax"}),
    //        search.createColumn({name: "contact", label: "Primary Contact"}),
    //        search.createColumn({name: "altemail", label: "Alt. Email"}),
    //        search.createColumn({name: "internalid", label: "Internal ID"})
    //     ]
    //  });
    //  var searchResultCount = customerSearchObj.runPaged().count;
    //  log.debug("customerSearchObj result count",searchResultCount);
    //  var searchResult = customerSearchObj.run().getRange(0 , 1000)


    var customrecord_2663_entity_bank_detailsSearchObj = search.create({
        type: "customrecord_2663_entity_bank_details",
        filters:
        [
        ],
        columns:
        [
           search.createColumn({name: "name", label: "Name"}),
           search.createColumn({ name: "internalid",
            label: "Internal ID",}),
           search.createColumn({name: "custrecord_2663_entity_bank_type", label: "Type"}),
           search.createColumn({name: "custrecord_2663_entity_file_format", label: "Payment File Format"}),
           search.createColumn({name: "custrecord_9572_subsidiary", label: "Subsidiary"})
        ]
     });
     var searchResultCount = customrecord_2663_entity_bank_detailsSearchObj.runPaged().count;
     log.debug("customrecord_2663_entity_bank_detailsSearchObj result count",searchResultCount);
     var searchResult = customrecord_2663_entity_bank_detailsSearchObj.run().getRange(0 , 1000);
 
    for (var index = 0; index < searchResult.length; index++) {
      var internalID = searchResult[index].getValue({
        name: "internalid",
        label: "Internal ID",
      });

      var CustomerDeleted = record.delete({
        type: "customrecord_2663_entity_bank_details",
        id: internalID,
      });

      log.debug("CustomerDeleted", CustomerDeleted);
    }
  };
  //This Function Sends the mail to the Contact.
  // function sendMail() {

  // 	try {

  // 	} catch (error) {
  // 		log.debug('error' , error)

  // 	}

  // }

  return { execute };
});
