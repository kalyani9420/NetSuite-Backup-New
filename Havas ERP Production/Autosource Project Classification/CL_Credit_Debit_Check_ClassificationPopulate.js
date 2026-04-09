/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search"], /**
  * @param{currentRecord} currentRecord
  */ function (currentRecord, search) {
   /**
    * Function to be executed after page is initialized.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
    *
    * @since 2015.2
    */
   function pageInit(scriptContext) {}
 
   /**
    * Function to be executed when field is changed.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    * @param {string} ~ - Field name
    * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
    * @param {number} scriptContext.columnNum - Line number~. Will be undefined if not a matrix field
    *
    * @since 2015.2
    */
   function fieldChanged(scriptContext) {
    // alert(scriptContext.fieldId)

     try {
        // console.log(scriptContext.currentRecord)
        // console.log(scriptContext.currentRecord.type)
       
       if (scriptContext.fieldId == "job" && scriptContext.currentRecord.type == "creditmemo") {
         // alert('job')
         var soRecordObj = scriptContext.currentRecord;
         // var soRecordObj = scriptContext.currentRecord;
 
         var soProject = soRecordObj.getValue({
           fieldId: "job",
         });
 
         if (_logValidation(soProject)) {
           var projectClassificationLookup = search.lookupFields({
             type: search.Type.JOB,
             id: soProject,
             columns: [
               "custentity_subsidiary_loaction",
               "custentity_line_of_business",
               "custentity_department",
             ],
           });
 
           // alert("test 2");
           // alert(projectClassificationLookup.custentity_subsidiary_loaction.length);
           // var temp = projectClassificationLookup.custentity_subsidiary_loaction[0].value
           // alert(temp);
 
           if (projectClassificationLookup.custentity_subsidiary_loaction.length === 1) {
             // alert("inside if");
             soRecordObj.setValue({
               fieldId: "location",
               value:
                 projectClassificationLookup.custentity_subsidiary_loaction[0].value,
             });
           } else {
             // alert("inside else");
             soRecordObj.setValue({
               fieldId: "location",
               value: "",
             });
           }
           // alert("test 2");
           if (projectClassificationLookup.custentity_line_of_business.length === 1) {
             // alert("inside if");
             soRecordObj.setValue({
               fieldId: "class",
               value: projectClassificationLookup.custentity_line_of_business[0].value,
             });
           } else {
             // alert("inside else");
             soRecordObj.setValue({
               fieldId: "class",
               value: "",
             });
           }
           // alert("test 3");
           if (projectClassificationLookup.custentity_department.length === 1) {
             // alert("inside if");
             soRecordObj.setValue({
               fieldId: "department",
               value: projectClassificationLookup.custentity_department[0].value,
             });
           } else {
             // alert("inside else");
             soRecordObj.setValue({
               fieldId: "department",
               value: "",
             });
           }
         } else {
           soRecordObj.setValue({
             fieldId: "location",
             value: "",
           });
           soRecordObj.setValue({
             fieldId: "class",
             value: "",
           });
 
           soRecordObj.setValue({
             fieldId: "department",
             value: "",
           });
         }
       }

       if (scriptContext.fieldId == "customer" && (scriptContext.currentRecord.type == "vendorcredit" || scriptContext.currentRecord.type == "check" )){
        // alert('test 1')
        // alert(scriptContext.sublistId)
        var sublistName = scriptContext.sublistId;
        var currentRecord = scriptContext.currentRecord;
        var currentProject = currentRecord.getCurrentSublistValue({
          sublistId: sublistName,
          fieldId: "customer",
        });
        // alert(currentProject)

        if (_logValidation(currentProject)) {
          var projectClassificationLookup = search.lookupFields({
            type: search.Type.JOB,
            id: currentProject,
            columns: [
              "custentity_department",
              "custentity_line_of_business",
              "custentity_subsidiary_loaction",
            ],
          });

          if (
            projectClassificationLookup.custentity_subsidiary_loaction
              .length === 1
          ) {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: "location",
              value:
                projectClassificationLookup.custentity_subsidiary_loaction[0]
                  .value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: "location",
              value: "",
            });
          }
          if (
            projectClassificationLookup.custentity_line_of_business.length === 1
          ) {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: "class",
              value:
                projectClassificationLookup.custentity_line_of_business[0]
                  .value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: "class",
              value: "",
            });
          }
          if (projectClassificationLookup.custentity_department.length === 1) {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: "department",
              value: projectClassificationLookup.custentity_department[0].value,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: sublistName,
              fieldId: "department",
              value: "",
            });
          }
        }
        else{
          currentRecord.setCurrentSublistValue({
            sublistId: sublistName,
            fieldId: "location",
            value: "",
          });
          currentRecord.setCurrentSublistValue({
            sublistId: sublistName,
            fieldId: "class",
            value: "",
          });
          currentRecord.setCurrentSublistValue({
            sublistId: sublistName,
            fieldId: "department",
            value: "",
          });

        }
      }

      if (scriptContext.fieldId == "purchaseorder" && scriptContext.currentRecord.type == "vendorprepayment") {
        // alert('job')
        var preRecordObj = scriptContext.currentRecord;
        // var soRecordObj = scriptContext.currentRecord;

        var poRecordObj = preRecordObj.getValue({
          fieldId: "purchaseorder",
        });

        if (_logValidation(poRecordObj)) {
          var projectClassificationLookup = search.lookupFields({
            type: search.Type.PURCHASE_ORDER,
            id: poRecordObj,
            columns: [
              "location",
              "class",
              "department"
            ],
          });

          // alert("test 2");
          // alert(projectClassificationLookup.custentity_subsidiary_loaction.length);
          // var temp = projectClassificationLookup.custentity_subsidiary_loaction[0].value
          // alert(temp);

          if (projectClassificationLookup.location.length === 1) {
            // alert("inside if");
            preRecordObj.setValue({
              fieldId: "location",
              value:
                projectClassificationLookup.location[0].value,
            });
          } else {
            // alert("inside else");
            preRecordObj.setValue({
              fieldId: "location",
              value: "",
            });
          }
          // alert("test 2");
          if (projectClassificationLookup.class.length === 1) {
            // alert("inside if");
            preRecordObj.setValue({
              fieldId: "class",
              value: projectClassificationLookup.class[0].value,
            });
          } else {
            // alert("inside else");
            preRecordObj.setValue({
              fieldId: "class",
              value: "",
            });
          }
          // alert("test 3");
          if (projectClassificationLookup.department.length === 1) {
            // alert("inside if");
            preRecordObj.setValue({
              fieldId: "department",
              value: projectClassificationLookup.department[0].value,
            });
          } else {
            // alert("inside else");
            preRecordObj.setValue({
              fieldId: "department",
              value: "",
            });
          }
        } else {
          preRecordObj.setValue({
            fieldId: "location",
            value: "",
          });
          preRecordObj.setValue({
            fieldId: "class",
            value: "",
          });

          preRecordObj.setValue({
            fieldId: "department",
            value: "",
          });
        }
      }

      if (scriptContext.fieldId == "salesorder" && scriptContext.currentRecord.type == "customerdeposit") {
        // alert('job')
        var depositeRecordObj = scriptContext.currentRecord;
        // var soRecordObj = scriptContext.currentRecord;

        var soRecordObj = depositeRecordObj.getValue({
          fieldId: "salesorder",
        });

        if (_logValidation(soRecordObj)) {
          var projectClassificationLookup = search.lookupFields({
            type: search.Type.SALES_ORDER,
            id: soRecordObj,
            columns: [
              "location",
              "class",
              "department"
            ],
          });

          // alert("test 2");
          // alert(projectClassificationLookup.custentity_subsidiary_loaction.length);
          // var temp = projectClassificationLookup.custentity_subsidiary_loaction[0].value
          // alert(temp);

          if (projectClassificationLookup.location.length === 1) {
            // alert("inside if");
            depositeRecordObj.setValue({
              fieldId: "location",
              value:
                projectClassificationLookup.location[0].value,
            });
          } else {
            // alert("inside else");
            depositeRecordObj.setValue({
              fieldId: "location",
              value: "",
            });
          }
          // alert("test 2");
          if (projectClassificationLookup.class.length === 1) {
            // alert("inside if");
            depositeRecordObj.setValue({
              fieldId: "class",
              value: projectClassificationLookup.class[0].value,
            });
          } else {
            // alert("inside else");
            depositeRecordObj.setValue({
              fieldId: "class",
              value: "",
            });
          }
          // alert("test 3");
          if (projectClassificationLookup.department.length === 1) {
            // alert("inside if");
            depositeRecordObj.setValue({
              fieldId: "department",
              value: projectClassificationLookup.department[0].value,
            });
          } else {
            // alert("inside else");
            depositeRecordObj.setValue({
              fieldId: "department",
              value: "",
            });
          }
        } else {
          depositeRecordObj.setValue({
            fieldId: "location",
            value: "",
          });
          depositeRecordObj.setValue({
            fieldId: "class",
            value: "",
          });

          depositeRecordObj.setValue({
            fieldId: "department",
            value: "",
          });
        }
      }
     
     } catch (error) {
       console.log("error : ", error);
     }
   }
 
   /**
    * Function to be executed when field is slaved.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    * @param {string} scriptContext.fieldId - Field name
    *
    * @since 2015.2
    */
   function postSourcing(scriptContext) {}
 
   /**
    * Function to be executed after sublist is inserted, removed, or edited.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    *
    * @since 2015.2
    */
   function sublistChanged(scriptContext) {}
 
   /**
    * Function to be executed after line is selected.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    *
    * @since 2015.2
    */
   function lineInit(scriptContext) {}
 
   /**
    * Validation function to be executed when field is changed.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    * @param {string} scriptContext.fieldId - Field name
    * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
    * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
    *
    * @returns {boolean} Return true if field is valid
    *
    * @since 2015.2
    */
   function validateField(scriptContext) {}
 
   /**
    * Validation function to be executed when sublist line is committed.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    *
    * @returns {boolean} Return true if sublist line is valid
    *
    * @since 2015.2
    */
   function validateLine(scriptContext) {
    
   }
 
   /**
    * Validation function to be executed when sublist line is inserted.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    *
    * @returns {boolean} Return true if sublist line is valid
    *
    * @since 2015.2
    */
   function validateInsert(scriptContext) {}
 
   /**
    * Validation function to be executed when record is deleted.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.sublistId - Sublist name
    *
    * @returns {boolean} Return true if sublist line is valid
    *
    * @since 2015.2
    */
   function validateDelete(scriptContext) {}
 
   /**
    * Validation function to be executed when record is saved.
    *
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @returns {boolean} Return true if record is valid
    *
    * @since 2015.2
    */
   function saveRecord(scriptContext) {
    
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
 
 
   return {
     pageInit: pageInit,
     fieldChanged: fieldChanged,
     // postSourcing: postSourcing,
     // sublistChanged: sublistChanged,
     // lineInit: lineInit,
     // validateField: validateField,
    //  validateLine: validateLine,
     // validateInsert: validateInsert,
     // validateDelete: validateDelete,
    //  saveRecord: saveRecord,
   };
 });
 