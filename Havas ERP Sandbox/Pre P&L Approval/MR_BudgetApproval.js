/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/currentRecord", "N/query", "N/search", "N/record"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, query, search, record) => {
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
      var projectResult = getProject();

      if (projectResult != 0) {
        return projectResult;
      }
    } catch (error) {
      log.error("Error ", error.toString());
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
      var map_value = JSON.parse(mapContext.value);

      var ProjectId = map_value.values["GROUP(internalid)"];
      ProjectId = ProjectId[0].value;
      // log.debug("ProjectId", ProjectId);

      var BudgetType = map_value.values["GROUP(projectBudget.type)"];
      BudgetType = BudgetType[0].value;
      // log.debug("BudgetType", BudgetType);

      var BudgetTotalAmount = map_value.values["SUM(projectBudget.amount)"];
      // log.debug("BudgetTotalAmount", BudgetTotalAmount);

      mapContext.write({
        key: ProjectId,
        value: {
          BudgetType: BudgetType,
          BudgetTotalAmount: BudgetTotalAmount,
        },
      });
    } catch (error) {
      log.error("Error ", error.toString());
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
   *     for processingo
   * @since 2015.2
   */
  const reduce = (reduceContext) => {
    try {
      var reduce_key = reduceContext.key;
      var reduce_value = reduceContext.values;
      var i = 0;
      var tempVar;
      var budgetType;
      var budgetAmount;
      var budgetJSON = {
        BILLING: "0.0",
        COST: "0.0",
      };

      // log.debug("reduce_key", reduce_key);
      // log.debug("reduce_value", reduce_value);

      var reduceValues = JSON.parse(JSON.stringify(reduce_value));
      // log.debug("reduceValues", reduceValues[0]);
      // log.debug("reduceValues type", typeof reduceValues[0]);

      while (i < reduceValues.length) {
        tempVar = JSON.parse(reduceValues[i]);
        budgetType = tempVar["BudgetType"];
        budgetAmount = tempVar["BudgetTotalAmount"];

        budgetJSON[budgetType] = budgetAmount;

        i++;
      }

      log.debug("reduce_key", reduce_key);
      log.debug("budgetJSON", budgetJSON);

      var objRecord = record.load({
        type: record.Type.JOB,
        id: parseInt(reduce_key),
        isDynamic: true,
      });
      var plCost = objRecord.getSublistValue({
        sublistId: "plstatement",
        fieldId: "cost",
        line: 4,
      });
      var plRevenue = objRecord.getSublistValue({
        sublistId: "plstatement",
        fieldId: "revenue",
        line: 4,
      });

      log.debug("plCost : plRevenue ", plCost + " : " + plRevenue);

      if (
        parseFloat(plRevenue) > parseFloat(budgetJSON["BILLING"]) &&
        parseFloat(plCost) > parseFloat(budgetJSON["COST"])
      ) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: parseInt(reduce_key),
          values: {
            custentity_cost_budget_exceed: true,
            custentity_billing_budget_exceed: true,
            custentity_project_approval_status: 6
          },
        });
        log.debug("both exceed : ", id);
      } else if (parseFloat(plRevenue) > parseFloat(budgetJSON["BILLING"])) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: parseInt(reduce_key),
          values: {
            custentity_billing_budget_exceed: true,
            custentity_project_approval_status: 5
          },
        });
        log.debug("BILLING Exceed", id);
      } else if (parseFloat(plCost) > parseFloat(budgetJSON["COST"])) {
        var id = record.submitFields({
          type: record.Type.JOB,
          id: parseInt(reduce_key),
          values: {
            custentity_cost_budget_exceed: true,
            custentity_project_approval_status: 4
          },
        });
        log.debug("COST Exceed", id);
      } else {
        log.debug("None Exceed");
      }
    } catch (error) {
      log.error("Error ", error.toString());
    }
  };

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

  function getProject() {
    try {
      var jobSearchObj = search.create({
        type: "job",
        filters: [
          ["custentity_inital_approved", "is", "T"],
          "AND",
          ["status", "noneof", "1"],
          "AND",
          "NOT",
          [
            ["custentity_cost_budget_exceed", "is", "T"],
            "AND",
            ["custentity_billing_budget_exceed", "is", "T"],
          ],
        ],
        columns: [
          search.createColumn({
            name: "type",
            join: "projectBudget",
            summary: "GROUP",
            label: "Budget Type",
          }),
          search.createColumn({
            name: "amount",
            join: "projectBudget",
            summary: "SUM",
            label: "Amount",
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "Internal ID",
          }),
        ],
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var projectResult = jobSearchObj.run().getRange(0, 1000);

      if (searchResultCount > 0) {
        return projectResult;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error 1 : ", error);
    }
  }

  return { getInputData, map, reduce, summarize };
});
