/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(["N/currentRecord", "N/record", "N/task"], /**
 * @param{currentRecord} currentRecord
 */
(currentRecord, record, task) => {
  /**
   * Defines the WorkflowAction script trigger point.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
   * @param {string} scriptContext.type - Event type
   * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
   * @since 2016.1
   */
  const onAction = (scriptContext) => {
    log.debug("WorkflowAction", "WorkflowAction");

    try {
      var projectObject = scriptContext.newRecord;
      var projectId = projectObject.id;
      log.debug("projectId : ", projectId);

      if (_logValidation(projectId)) {
        var triggerMapReduce = task.create({
          taskType: task.TaskType.MAP_REDUCE,
          scriptId: "customscript_mr_pay_when_paid", //322
          deploymentId: "customdeploy_mr_button_trigger",
          params: { custscript_project_id: projectId ,
            custscript_is_bulk_release: 'true'
           },
        });

        log.debug("task : ", triggerMapReduce);
        var mrTaskId = triggerMapReduce.submit();
        log.debug("mrTaskId : ", mrTaskId);
      }
      else{
        log.debug('Invalid Project Id : ' , projectId )
      }
    } catch (error) {
      log.debug("Error : ", error.toString());
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

  return { onAction };
});
