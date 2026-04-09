/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(["N/currentRecord", "N/email", "N/record"], /**
 * @param{currentRecord} currentRecord
 */
(currentRecord, email, record) => {
  /**
   * Defines the Scheduled script trigger point.
   * @param {Object} scriptContext
   * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
   * @since 2015.2
   */
  const execute = (scriptContext) => {
    var vendorSearchObj = search.create({
      type: "vendor",
      filters: [
        [
          ["category", "noneof", "2", "1", "4", "3"],
          "AND",
          ["representingsubsidiary", "anyof", "@NONE@"],
        ],
      ],
      columns: [
        search.createColumn({ name: "entityid", label: "Name" }),
        search.createColumn({ name: "email", label: "Email" }),
        search.createColumn({ name: "phone", label: "Phone" }),
        search.createColumn({ name: "altphone", label: "Office Phone" }),
        search.createColumn({ name: "fax", label: "Fax" }),
        search.createColumn({ name: "altemail", label: "Alt. Email" }),
        search.createColumn({
          name: "custentity_11724_pay_bank_fees",
          label: "Vendor Bank Fees",
        }),
        search.createColumn({
          name: "custentity_9572_vendor_entitybank_sub",
          label: "Vendor Entity Bank Subsidiary",
        }),
        search.createColumn({
          name: "custentity_9572_vendor_entitybank_format",
          label: "Vendor Entity Bank Format",
        }),
        search.createColumn({ name: "internalid", label: "Internal ID" }),
      ],
    });
    var searchResultCount = vendorSearchObj.runPaged().count;
    log.debug("vendorSearchObj result count", searchResultCount);
    var searchResult = vendorSearchObj.run().getRange(0, 1000);

    for (var index = 0; index < searchResult.length; index++) {
      var internalID = searchResult.getValue({
        name: "internalid",
        label: "Internal ID",
      });

      var VendorDeleted = record.delete({
        type: record.Type.VENDOR,
        id: internalID,
      });

      log.debug('VendorDeleted' , VendorDeleted)
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
