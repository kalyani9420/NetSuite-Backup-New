/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/currentRecord", "N/search", "N/record", "N/runtime"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, search, record, runtime) => {
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
    var scriptObj = runtime.getCurrentScript();
    var projectId = scriptObj.getParameter({
      name: "custscript_project_id",
    });

    try {
      var jobFilter = [];
      var jobIdArray = [];
      var jobId;

      if (_logValidation(projectId)) {
        log.debug("Button Processing", projectId);
        jobFilter.push(["custentity_hold_released", "any", ""], "AND", [
          "internalid",
          "anyof",
          projectId,
        ]);
      } else {
        log.debug("Bulk Processing", "Bulk Processing");
        //  jobFilter.push(["custentity_hold_released", "is", "F"], "AND", [
        //    "internalid",
        //    "anyof",
        //    "3280",
        //    "3281",
        //  ]);
        jobFilter.push(["custentity_hold_released", "any", ""]);
      }

      var jobResult = getJobDetails(jobFilter, "GetProjects");
      log.debug("Result : ", jobResult);

      if (jobResult != 0) {
        for (var index = 0; index < jobResult.length; index++) {
          jobId = _logValidation(
            jobResult[index].getValue({
              name: "internalid",
              label: "Internal ID",
            })
          )
            ? jobResult[index].getValue({
                name: "internalid",
                label: "Internal ID",
              })
            : -1;

          if (jobId != -1) {
            jobIdArray.push(jobId);
          }
        }
        log.debug("jobIdArray : ", jobIdArray);

        return jobIdArray;
      } else {
        log.debug("Note : ", "No Project Found");
      }
    } catch (error) {
      log.debug("error : ", error.toString());
    }
  };

  /**
   * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
   * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
   * context.
   * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
   *     is provided automatically based on the results of the getInputData stage.
   * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
   *     function on the current key-value pair
   * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
   *     pair
   * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} mapContext.key - Key to be processed during the map stage
   * @param {string} mapContext.value - Value to be processed during the map stage
   * @since 2015.2
   */

  const map = (mapContext) => {
    try {
      var scriptObj = runtime.getCurrentScript();
      var projectId = scriptObj.getParameter({
        name: "custscript_project_id",
      });

      var isBulkRelease = scriptObj.getParameter({
        name: "custscript_is_bulk_release",
      });

      log.debug("projectId in MAP", projectId);
      log.debug("isBulkRelease in MAP", isBulkRelease);

      log.debug("mapContext", mapContext);
      log.debug("mapContext", typeof mapContext);
      var mapValue = JSON.parse(JSON.stringify(mapContext));
      // log.debug("map_value_key", mapValue.key);
      var projectId = mapValue.value;
      var Filter = [];
      var paidInvoiceCount = 0;
      var billId;

      Filter.push(["internalidnumber", "equalto", projectId], "AND", [
        "transaction.type",
        "anyof",
        "CustInvc",
      ]);

      var jobResult;
      jobResult = getJobDetails(Filter, "GetInvoices");

      if (jobResult != 0) {
        for (var index = 0; index < jobResult.length; index++) {
          invoiceStatus = _logValidation(
            jobResult[index].getValue({
              name: "statusref",
              join: "transaction",
              label: "Status",
            })
          )
            ? jobResult[index].getValue({
                name: "statusref",
                join: "transaction",
                label: "Status",
              })
            : -1;
          log.debug("Status : ", invoiceStatus);

          if (invoiceStatus == "paidInFull") {
            paidInvoiceCount += 1;
          }
        }

        if (jobResult.length == paidInvoiceCount && isBulkRelease != "true") {
          Filter = [
            ["internalidnumber", "equalto", projectId],
            "AND",
            ["transaction.type", "anyof", "VendBill"],
            "AND",
            ["transaction.paymenthold", "is", "T"],
          ];

          jobResult = getJobDetails(Filter, "GetBills");

          log.debug("projectTask", projectTask);

          var projectTask = getProjectTask(projectId);
          if (projectTask != 0) {
            for (var index = 0; index < projectTask.length; index++) {
              taskId = _logValidation(
                projectTask[index].getValue({
                  name: "internalid",
                  label: "Internal ID",
                })
              )
                ? projectTask[index].getValue({
                    name: "internalid",
                    label: "Internal ID",
                  })
                : -1;
              if (taskId != -1) {
                var id = record.submitFields({
                  type: record.Type.PROJECT_TASK,
                  id: taskId,
                  values: {
                    custevent_enable_pay_when_paid: false,
                  },
                });
                log.debug("task id ", id);
              }
            }
          }

          if (jobResult != 0) {
            for (var index = 0; index < jobResult.length; index++) {
              billId = _logValidation(
                jobResult[index].getValue({
                  name: "internalid",
                  join: "transaction",
                  label: "Internal ID",
                })
              )
                ? jobResult[index].getValue({
                    name: "internalid",
                    join: "transaction",
                    label: "Internal ID",
                  })
                : -1;
              if (billId != -1) {
                var id = record.submitFields({
                  type: record.Type.VENDOR_BILL,
                  id: billId,
                  values: {
                    paymenthold: false,
                  },
                });
                log.debug("id ", id);
              }
            }

            var id = record.submitFields({
              type: record.Type.JOB,
              id: projectId,
              values: {
                custentity_hold_released: true,
              },
            });
            log.debug("id ", id);
          }
        } else if (isBulkRelease == "true") {
          log.debug("isBulkRelease ", "isBulkRelease");
          Filter = [
            ["internalidnumber", "equalto", projectId],
            "AND",
            ["transaction.type", "anyof", "VendBill"],
            "AND",
            ["transaction.paymenthold", "is", "T"],
          ];

          jobResult = getJobDetails(Filter, "GetBills");

          var projectTask = getProjectTask(projectId);

          log.debug("projectTask", projectTask);

          if (projectTask != 0) {
            for (var index = 0; index < projectTask.length; index++) {
              taskId = _logValidation(
                projectTask[index].getValue({
                  name: "internalid",
                  label: "Internal ID",
                })
              )
                ? projectTask[index].getValue({
                    name: "internalid",
                    label: "Internal ID",
                  })
                : -1;
              if (taskId != -1) {
                var id = record.submitFields({
                  type: record.Type.PROJECT_TASK,
                  id: taskId,
                  values: {
                    custevent_enable_pay_when_paid: false,
                  },
                });
                log.debug("task id ", id);
              }
            }
          }

          if (jobResult != 0) {
            log.debug("isBulkRelease jobResult ", jobResult);
            for (var index = 0; index < jobResult.length; index++) {
              billId = _logValidation(
                jobResult[index].getValue({
                  name: "internalid",
                  join: "transaction",
                  label: "Internal ID",
                })
              )
                ? jobResult[index].getValue({
                    name: "internalid",
                    join: "transaction",
                    label: "Internal ID",
                  })
                : -1;
              if (billId != -1) {
                var id = record.submitFields({
                  type: record.Type.VENDOR_BILL,
                  id: billId,
                  values: {
                    paymenthold: false,
                  },
                });
                log.debug("id ", id);
              }
            }

            var id = record.submitFields({
              type: record.Type.JOB,
              id: projectId,
              values: {
                custentity_hold_released: true,
              },
            });
            log.debug("id ", id);
          }
        } else {
          log.debug("Unpaid Invoices : ", jobResult.length - paidInvoiceCount);
        }
      } else {
        log.debug("Note : ", "No Invoices Found In Project");
      }
    } catch (error) {
      log.debug("error : ", error.toString());
    }
  };

  /**
   * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
   * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
   * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
   *     provided automatically based on the results of the map stage.
   * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
   *     reduce function on the current group
   * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
   * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} reduceContext.key - Key to be processed during the reduce stage
   * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
   *     for processing
   * @since 2015.2
   */
  const reduce = (reduceContext) => {};

  /**
   * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
   * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
   * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
   * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
   *     script
   * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
   * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
   * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
   * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
   *     script
   * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
   * @param {Object} summaryContext.inputSummary - Statistics about the input stage
   * @param {Object} summaryContext.mapSummary - Statistics about the map stage
   * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
   * @since 2015.2
   */
  const summarize = (summaryContext) => {};

  function getJobDetails(jobFilter, projectFlag) {
    var jobSearchObj = search.create({
      type: "job",
      filters: jobFilter,
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        //  search.createColumn({ name: "altname", label: "Name" }),
        search.createColumn({ name: "customer", label: "Customer" }),
      ],
    });

    if (projectFlag == "GetInvoices") {
      var columns = [
        search.createColumn({
          name: "internalid",
          join: "transaction",
          label: "Internal ID",
        }),
        search.createColumn({
          name: "type",
          join: "transaction",
          label: "Type",
        }),
        search.createColumn({
          name: "statusref",
          join: "transaction",
          label: "Status",
        }),
      ];
      var invoiceColumns = jobSearchObj.columns;
      invoiceColumns.push(...columns);
      jobSearchObj.columns = invoiceColumns;
    }

    if (projectFlag == "GetBills") {
      var columns = [
        search.createColumn({
          name: "internalid",
          join: "transaction",
          label: "Internal ID",
        }),
      ];
      var invoiceColumns = jobSearchObj.columns;
      invoiceColumns.push(...columns);
      jobSearchObj.columns = invoiceColumns;
    }

    var searchResultCount = jobSearchObj.runPaged().count;
    log.debug("jobSearchObj result count", searchResultCount);
    var jobResult = jobSearchObj.run().getRange(0, 1000);

    if (searchResultCount > 0) {
      return jobResult;
    } else {
      return 0;
    }
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

  function getProjectTask(projectId) {
    var projecttaskSearchObj = search.create({
      type: "projecttask",
      filters: [["project", "anyof", projectId]],
      columns: [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({
          name: "custevent_enable_pay_when_paid",
          label: "Pay When Paid",
        }),
      ],
    });
    var searchResultCount = projecttaskSearchObj.runPaged().count;
    log.debug("projecttaskSearchObj result count", searchResultCount);
    var taskResult = projecttaskSearchObj.run().getRange(0, 1000);

    if (searchResultCount > 0) {
      return taskResult;
    } else {
      return 0;
    }
  }

  return { getInputData, map, reduce, summarize };
});
