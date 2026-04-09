/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/currentRecord', 'N/search', 'N/error', 'N/runtime'],
    /**
 * @param{record} record
 */
    (record, currentRecord, search, error, runtime) => {

        const beforeSubmit = (scriptContext) => {
            try {
                if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                    log.debug('New Project')
                    let currentUser = runtime.getCurrentUser();
                    let currentSubsidiary = currentUser.subsidiary;
                    log.debug('currentSubsidiary', currentSubsidiary);
                    let searchArray = getProjectMatrix(currentSubsidiary);
                    log.debug('projectPrefixObj', searchArray);
                    if (searchArray == null) {
                        log.debug('Error : ', 'Project Prefix has not setup');
                        let prefix_error = error.create({
                            name: 'PROJECT_PREFIX_SETUP_REQUIRE',
                            message: 'The project prefix setup for your current subsidiary has not yet been completed. Please contact your administrator to initiate this setup. You will be able to create projects only after the setup has been successfully completed',
                            notifyOff: false
                        });
                        throw prefix_error.message;
                    }
                } else {
                    log.debug('Old Project')
                }
            } catch (error) {
                if (error == 'The project prefix setup for your current subsidiary has not yet been completed. Please contact your administrator to initiate this setup. You will be able to create projects only after the setup has been successfully completed') {
                    log.debug('inside if catch')
                    throw error;
                } else {
                    log.debug('Error : ', error)
                }
            }

        }

        const afterSubmit = (scriptContext) => {
            try {
                let currentRecordObj = scriptContext.newRecord;
                let currentRecordObjId = currentRecordObj.id;
                log.debug('currentRecordObj', currentRecordObj);
                log.debug('currentRecordObj.id', currentRecordObj.id);
                if (scriptContext.type === scriptContext.UserEventType.CREATE) {
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
                        let previousNumber = parseInt(searchArray[0].getValue({ name: "custrecord_matrix_previous_intial_number", label: "Previous Initial Number" }));
                        log.debug('', prefix + ' ' + intialNumber + ' ' + currentNumber);
                        if (!currentNumber) {
                            projectCodeNumber = intialNumber;
                            projectCode = `${prefix}${projectCodeNumber}`;
                        }
                        else if (previousNumber != intialNumber) {
                            projectCodeNumber = intialNumber;
                            projectCode = `${prefix}${projectCodeNumber}`;
                            record.submitFields({ type: 'customrecord_project_prefix_matrix', id: prefixRecordId, values: { custrecord_matrix_previous_intial_number: intialNumber }, });
                        }
                        else {
                            projectCodeNumber = currentNumber + 1;
                            projectCode = `${prefix}${projectCodeNumber}`;
                        }
                        log.debug('project code', projectCode);
                        let objRecord = record.load({ type: record.Type.JOB, id: currentRecordObjId });
                        objRecord.setValue({ fieldId: 'entityid', value: projectCode, ignoreFieldChange: true });
                        let recordId = objRecord.save();
                        if (recordId) {
                            let isCodeDuplicate = isProjectCodeExist(recordId, projectCode);
                            if (isCodeDuplicate == true) {
                                projectCodeNumber = projectCodeNumber + 1;
                                projectCode = `${prefix}${projectCodeNumber}`;
                                log.debug('Project code after duplication found', projectCode);
                                objRecord.setValue({ fieldId: 'entityid', value: projectCode, ignoreFieldChange: true });
                                record.submitFields({ type: 'customrecord_project_prefix_matrix', id: prefixRecordId, values: { custrecord_matrix_current_number: projectCodeNumber } });
                            } else {
                                log.debug('No duplication found for current Project code', projectCode);
                                record.submitFields({ type: 'customrecord_project_prefix_matrix', id: prefixRecordId, values: { custrecord_matrix_current_number: projectCodeNumber } });
                            }
                        }
                    } else {
                        log.debug('Error : ', 'Project Prefix has not setup');
                        let prefix_error = error.create({
                            name: 'PROJECT_PREFIX_SETUP_REQUIRE',
                            message: 'The project prefix setup for your current subsidiary has not yet been completed. Please contact your administrator to initiate this setup. You will be able to create projects only after the setup has been successfully completed',
                            notifyOff: false
                        });
                        throw prefix_error.message;
                    }
                } else {
                    log.debug('Old Project')
                }
            } catch (error) {
                if (error == 'The project prefix setup for your current subsidiary has not yet been completed. Please contact your administrator to initiate this setup. You will be able to create projects only after the setup has been successfully completed') {
                    log.debug('inside if catch')
                    throw error;
                } else {
                    log.debug('Error : ', error)
                }
            }

        }

        const getProjectMatrix = (currentSubsidiary) => {
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

        const isProjectCodeExist = (currentInternalId, currentProjectCode) => {
            var jobSearchObj = search.create({
                type: "job",
                filters: [["entityid", "contains", currentProjectCode], "AND", ["internalidnumber", "notequalto", currentInternalId]],
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });
            var searchResultCount = jobSearchObj.runPaged().count;
            return searchResultCount > 0 ? true : false;
        }

        const _logValidation = (value) => {
            return !(value == null || value === "" || value === "null" || value === undefined || value === "undefined" || value === "@NONE@" || value === "NaN");
        };
        return { beforeSubmit, afterSubmit }

    });
