/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/runtime', 'N/search'],
    /**
     * @param{currentRecord} currentRecord
     */
    function (currentRecord, record, runtime, search) {
        function pageInit(scriptContext) {
            log.debug('pageInit')
        }

        function saveRecord(scriptContext) {
            try {
                let currentRecordObj = scriptContext.currentRecord;
                let currentRecordObjId = currentRecordObj.id;
                let initialNumber = currentRecordObj.getValue({ fieldId: 'custrecord_matrix_intial_number' });
                let currentNumber = currentRecordObj.getValue({ fieldId: 'custrecord_matrix_current_number' });
                let currentSubsidiary = currentRecordObj.getValue({ fieldId: 'custrecord_matrix_subsidiary' });
                !currentRecordObjId && _logValidation(initialNumber) ? currentRecordObj.setValue({ fieldId: 'custrecord_matrix_previous_intial_number', value: initialNumber }) : null; //Create Mode
                !currentNumber && _logValidation(currentRecordObjId) &&_logValidation(initialNumber) ? currentRecordObj.setValue({ fieldId: 'custrecord_matrix_previous_intial_number', value: initialNumber }): null; //Edit Mode
                let isMatrxiExist = getProjectMatrix(currentSubsidiary, currentRecordObjId);
                if (isMatrxiExist) {
                    alert('The project prefix has already been configured for the selected subsidiary. Please update the existing setup as needed; creating a duplicate configuration is not permitted');
                    return false;
                }
                return true;
            } catch (error) {
                log.debug('Error : ', error)
            }
        }
        function getProjectMatrix(currentSubsidiary, currentRecordObjId) {
            let filter = [["custrecord_matrix_subsidiary", "anyof", currentSubsidiary]];
            if (currentRecordObjId) filter.push("AND", ["internalidnumber", "notequalto", currentRecordObjId]);
            let projectPrefixMatrixSearch = search.create({
                type: "customrecord_project_prefix_matrix",
                filters: filter,
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" }),]
            });
            var searchResultCount = projectPrefixMatrixSearch.runPaged().count;
            return searchResultCount > 0 ? true : false;
        }

        function _logValidation(value) {
            return !(value == null || value === "" || value === "null" || value === undefined || value === "undefined" || value === "@NONE@" || value === "NaN");
        };

        return {
            pageInit: pageInit,
            saveRecord: saveRecord
        };

    });
