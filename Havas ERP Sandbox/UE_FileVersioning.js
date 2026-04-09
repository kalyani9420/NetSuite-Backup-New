/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/ui/serverWidget"], /**
 * @param{record} record
 */ (record, search, serverWidget) => {
  /**
   * Defines the function definition that is executed before record is loaded.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @param {Form} scriptContext.form - Current form
   * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
   * @since 2015.2
   */
  const beforeLoad = (scriptContext) => {
    // log.debug("beforeLoad", "beforeLoad");

    try {
      var form = scriptContext.form;
      var filesResult = getFiles();
      var fileId;
      var fileName;
      log.debug("filesResult", filesResult.length);

      if (filesResult != 0) {
        var fileVersion = form.addField({
          id: "custpage_file_versions",
          type: serverWidget.FieldType.MULTISELECT,
          label: "Files",
        });

        for (var index = 0; index < filesResult.length; index++) {
          fileId = filesResult[index].getValue({
            name: "internalid",
            label: "Internal ID",
          });

          fileName = filesResult[index].getValue({
            name: "name",
            label: "Name",
          });

          fileVersion.addSelectOption({
            value: fileId,
            text: fileName,
          });
        }
      }        

        var test = form.addField({
          id: "custpage_test",
          type: serverWidget.FieldType.TEXT,
          label: "Test Field",
          container: "custtab_file_version",
        });
        log.debug('test' , test)
    } catch (error) {
      log.debug("error", error.toString());
    }
  };

  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {
    var recordObj = scriptContext.newRecord;

    var selectedFiles = recordObj.getValue({
      fieldId: "custpage_file_versions",
    });
    log.debug("selectedFiles", selectedFiles);
  };

  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {};

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

  function getFiles() {
    try {
      var fileSearchObj = search.create({
        type: "file",
        filters: [],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
          search.createColumn({ name: "name", label: "Name" }),
        ],
      });

      var searchResultCount = fileSearchObj.runPaged().count;
      var fileArray = [];
      var start = 0,
        end = 1000,
        limit = searchResultCount;
      while (start < limit) {
        fileArray.push(...fileSearchObj.run().getRange(start, end));
        start += 1000;
        end += 1000;
      }
      log.debug("Total files ", fileArray.length);

      if (searchResultCount > 0) {
        return fileArray;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("error", error.toString());
    }
  }

  return { beforeLoad, beforeSubmit, afterSubmit };
});
