/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/currentRecord", "N/record", "N/runtime", "N/search"], /**
 * @param{currentRecord} currentRecord
 */ (currentRecord, record, runtime, search) => {
  const getInputData = (inputContext) => {
    try {
      var scriptObj = runtime.getCurrentScript();
      var projectArray = scriptObj.getParameter({
        name: "custscript_project_array",
      });
      log.debug("projectArray: ", projectArray);
      var temp = projectArray.split(",");
      log.debug("temp: ", temp);

      log.debug("temp: ", typeof temp);
      return temp;
    } catch (error) {
      console.log(error);
    }
  };

  const map = (mapContext) => {
    var mapKey = mapContext.key;
    var projectId = mapContext.value;
    var projectManager = "";

    log.debug("mapKey", mapKey);
    log.debug("mapValue", mapValue);

    var cost_projectBudget = parseFloat(getProjectBudget(projectId, "COST"));
    var billing_projectBudget = parseFloat(
      getProjectBudget(projectId, "BILLING")
    );
    var ProjectfieldLookUp = search.lookupFields({
      type: search.Type.JOB,
      id: projectId,
      columns: [
        "custentity_project_approval_status",
        "projectmanager",
        "entityid",
        "companyname",
      ],
    });
    var projectCode = ProjectfieldLookUp.entityid;
    var projectName = ProjectfieldLookUp.companyname.split(":")[1];
    budgetStatus =
      ProjectfieldLookUp.custentity_project_approval_status[0].value;

    log.debug("budgetStatus", budgetStatus);

    if (budgetStatus == "1") {
      // Pending Budget Approval
      var id = record.submitFields({
        type: record.Type.JOB,
        id: projectId,
        values: {
          custentity_project_approval_status: 2, //Budget Approved
          custentity_cost_budget_history: cost_projectBudget,
          custentity_billing_budget_history: billing_projectBudget,
          custentity_rejection_reason: "",
        },
      });

      if (_logValidation(ProjectfieldLookUp.custentity_project_owner[0])) {
        projectOwner = ProjectfieldLookUp.custentity_project_owner[0].value;
      } else {
        log.debug("Error : ", "Project Owner Not defined");
      }
      if (_logValidation(ProjectfieldLookUp.projectmanager[0])) {
        projectManager = ProjectfieldLookUp.projectmanager[0].value;
      } else {
        log.debug("Error : ", "Project Manager Not defined");
      }

      if (projectManager != "" && projectOwner != "") {
        email.send({
          author: projectOwner,
          recipients: projectManager,
          subject:
            "Project Budget Approval Status : " +
            projectCode +
            " " +
            projectName,
          body: "Your project budget has been approved by the project owner.",
        });
        log.debug("Mail Sent", "Mail Sent");
      }
    }
    if (budgetStatus == "5") {
      // Pending Modified Budget Approval
      var id = record.submitFields({
        type: record.Type.JOB,
        id: projectId,
        values: {
          custentity_project_approval_status: 6, //Modified Budget Approved
          custentity_rejection_reason: "",
        },
      });
      scriptContext.response.write("Your record has been successfully saved.");

      if (_logValidation(ProjectfieldLookUp.custentity_project_owner[0])) {
        projectOwner = ProjectfieldLookUp.custentity_project_owner[0].value;
      } else {
        log.debug("Error : ", "Project Owner Not defined");
      }
      if (_logValidation(ProjectfieldLookUp.projectmanager[0])) {
        projectManager = ProjectfieldLookUp.projectmanager[0].value;
      } else {
        log.debug("Error : ", "Project Manager Not defined");
      }

      if (projectManager != "" && projectOwner != "") {
        email.send({
          author: projectOwner,
          recipients: projectManager,
          subject:
            "Project Budget Approval Status : " +
            projectCode +
            " " +
            projectName,
          body: "Your project budget has been approved by the project owner.",
        });
        log.debug("Mail Sent", "Mail Sent");
      }
    }

    log.debug("Get id", id);

    log.debug("Get Trigger", projectId + " " + response);
  };

  const reduce = (reduceContext) => {};

  const summarize = (summaryContext) => {};

  function getProjectBudget(projectId, budgetType) {
    try {
      var jobSearchObj = search.create({
        type: "job",
        filters: [
          ["internalidnumber", "equalto", projectId],
          "AND",
          ["projectbudget.type", "anyof", budgetType],
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
            sort: search.Sort.ASC,
          }),
        ],
      });
      var searchResultCount = jobSearchObj.runPaged().count;
      log.debug("jobSearchObj result count", searchResultCount);
      var projectBudget = jobSearchObj.run().getRange(0, 100);

      if (searchResultCount > 0) {
        var budgetAmount = projectBudget[0].getValue({
          name: "amount",
          join: "projectBudget",
          summary: "SUM",
          label: "Amount",
          sort: search.Sort.ASC,
        });
        return budgetAmount;
      } else {
        return 0;
      }
    } catch (error) {
      log.debug("Error 2 : ", error.toString());
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

  return { getInputData, map, reduce, summarize };
});
