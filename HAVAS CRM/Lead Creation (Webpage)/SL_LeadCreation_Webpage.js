/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/currentRecord", "N/record", "N/ui/serverWidget"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record, serverWidget) => {
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
        var form = serverWidget.createForm({
          title: "lead Enquiry",
        });
        form.clientScriptModulePath = "SuiteScripts/CL_LeadCreation_Webpage.js";

        var selectTypeField = form.addField({
          id: "custpage_lead_type",
          type: serverWidget.FieldType.SELECT,
          label: "Type",
        });

        selectTypeField.addSelectOption({
          value: "",
          text: "",
        });

        selectTypeField.addSelectOption({
          value: "Company",
          text: "Company",
        });

        selectTypeField.addSelectOption({
          value: "Individual",
          text: "Individual",
        });

        form.addField({
          id: "custpage_lead_companyname",
          type: serverWidget.FieldType.TEXT,
          label: "Company Name",
        });

        form.addField({
          id: "custpage_lead_firstname",
          type: serverWidget.FieldType.TEXT,
          label: "First Name",
        });

        form.addField({
          id: "custpage_lead_lastname",
          type: serverWidget.FieldType.TEXT,
          label: "Last Name",
        });

        var leadEmail = form.addField({
          id: "custpage_lead_email",
          type: serverWidget.FieldType.EMAIL,
          label: "Email",
        });

        var leadPhone = form.addField({
          id: "custpage_lead_phone",
          type: serverWidget.FieldType.PHONE,
          label: "Phone",
        });

        var selectInterest = form.addField({
          id: "custpage_lead_interest",
          type: serverWidget.FieldType.SELECT,
          label: "Interest",
        });

        selectInterest.addSelectOption({
          value: "Media",
          text: "Media",
        });

        selectInterest.addSelectOption({
          value: "Creative",
          text: "Creative",
        });

        selectInterest.addSelectOption({
          value: "Health",
          text: "Health",
        });
        selectInterest.addSelectOption({
          value: "Other",
          text: "Other",
        });
        selectTypeField.isMandatory = true;
        leadEmail.isMandatory = true;
        leadPhone.isMandatory = true;
        selectInterest.isMandatory = true;

        form.addSubmitButton({
          label: "Submit",
        });

        scriptContext.response.writePage(form);
      } catch (error) {
        log.debug("error ", error);
      }
    } else {
      const leadType = scriptContext.request.parameters.custpage_lead_type;
      const leadEmail = scriptContext.request.parameters.custpage_lead_email;
      const leadPhone = scriptContext.request.parameters.custpage_lead_phone;
      const leadInterest =
        scriptContext.request.parameters.custpage_lead_interest;

      var objRecord = record.create({
        type: record.Type.LEAD,
        isDynamic: true,
      });

      objRecord.setValue({
        fieldId: "email",
        value: leadEmail,
      });

      objRecord.setValue({
        fieldId: "phone",
        value: leadPhone,
      });

      if(leadInterest == "Media"){
        objRecord.setValue({
          fieldId: "subsidiary",
          value: 12,
        });
      }
      else if(leadInterest == "Creative"){
        objRecord.setValue({
          fieldId: "subsidiary",
          value: 13,
        });
      }
      else if(leadInterest == "Health"){
        objRecord.setValue({
          fieldId: "subsidiary",
          value: 14,
        });
      }
      else{
        objRecord.setValue({
          fieldId: "subsidiary",
          value: 6,
        });
      }
      

      if (leadType == "Company") {
        const leadCompanyName =
          scriptContext.request.parameters.custpage_lead_companyname;

          objRecord.setValue({
            fieldId: "isperson",
            value: "F",
          });
    
          objRecord.setValue({
            fieldId: "companyname",
            value: leadCompanyName,
          });
       
      }
      if (leadType == "Individual") {
        const leadFirstName =
          scriptContext.request.parameters.custpage_lead_firstname;
        const leadLastName =
          scriptContext.request.parameters.custpage_lead_lastname;

          objRecord.setValue({
            fieldId: "isperson",
            value: "T",
          });
    
          objRecord.setValue({
            fieldId: "firstname",
            value: leadFirstName,
          });

          objRecord.setValue({
            fieldId: "lastname",
            value: leadLastName,
          });
     
      }

      var id = objRecord.save();
      log.debug("lead id : ", id);
    }
  };

  return { onRequest };
});

