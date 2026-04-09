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
                log.debug('currentRecordObj', currentRecordObj);
                log.debug('currentRecordObj.id', currentRecordObj.id);
                if (!currentRecordObj.id) {
                    log.debug('New Project')
                    let currentUser = runtime.getCurrentUser();
                    let currentSubsidiary = currentUser.subsidiary;
                    log.debug('currentSubsidiary', currentSubsidiary);
                    let searchArray = getProjectMatrix(currentSubsidiary);
                    log.debug('projectPrefixObj', searchArray);
                    let projectCode = '';
                    let projectCodeNumber = 0;
                    if (searchArray != null) {
                        let prefixRecordId = searchArray[0].getValue({ name: "internalid", label: "Internal ID" });
                        let prefix = searchArray[0].getValue({ name: "custrecord_matrix_code_prefix", label: "Project Code Prefix" });
                        let intialNumber = parseInt(searchArray[0].getValue({ name: "custrecord_matrix_intial_number", label: "Initial Number" }));
                        let currentNumber = parseInt(searchArray[0].getValue({ name: "custrecord_matrix_current_number", label: "Current Number" }));
                        let previousNumber = parseInt(searchArray[0].getValue({name: "custrecord_matrix_previous_intial_number", label: "Previous Initial Number"}));
                        log.debug('', prefix + ' ' + intialNumber + ' ' + currentNumber);
                        if (!currentNumber) {
                            projectCodeNumber = intialNumber;
                            projectCode = `${prefix}${projectCodeNumber}`;
                        } 
                        else if(previousNumber != intialNumber){
                            projectCodeNumber = intialNumber;
                            projectCode = `${prefix}${projectCodeNumber}`;
                            record.submitFields({ type: 'customrecord_project_prefix_matrix', id: prefixRecordId, values: { custrecord_matrix_previous_intial_number : intialNumber }, });
                        } 
                        else {
                            projectCodeNumber = currentNumber + 1;
                            projectCode = `${prefix}${projectCodeNumber}`;
                        }
                        log.debug('project code', projectCode);
                        currentRecordObj.setValue({ fieldId: 'entityid', value: projectCode });
                        record.submitFields({ type: 'customrecord_project_prefix_matrix', id: prefixRecordId, values: { custrecord_matrix_current_number: projectCodeNumber }, });
                        return true;
                    } else {
                        alert('The project prefix setup for your current subsidiary has not yet been completed. Please contact your administrator to initiate this setup. You will be able to create projects only after the setup has been successfully completed.')
                        return false;
                    }
                } else {
                    log.debug('Old Project')

                }
                return true;
            } catch (error) {
                log.debug('Error : ', error)
            }
        }
        function getProjectMatrix(currentSubsidiary) {
            let projectPrefixMatrixSearch = search.create({
                type: "customrecord_project_prefix_matrix",
                filters: [["custrecord_matrix_subsidiary", "anyof", currentSubsidiary]],
                columns: [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "custrecord_matrix_subsidiary", label: "Subsidiary" }),
                    search.createColumn({ name: "custrecord_matrix_intial_number", label: "Initial Number" }),
                    search.createColumn({ name: "custrecord_matrix_code_prefix", label: "Project Code Prefix" }),
                    search.createColumn({ name: "custrecord_matrix_current_number", label: "Current Number" }),
                    search.createColumn({ name: "custrecord_matrix_previous_intial_number", label: "Previous Initial Number" })
                ]
            });
            var searchResultCount = projectPrefixMatrixSearch.runPaged().count;
            return searchResultCount > 0 ? projectPrefixMatrixSearch.run().getRange(0, 1) : null;
        }

        function _logValidation(value) {
            return !(value == null || value === "" || value === "null" || value === undefined || value === "undefined" || value === "@NONE@" || value === "NaN");
        };

        return {
            pageInit: pageInit,
            saveRecord: saveRecord
        };

    });
