/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/currentRecord", "N/search", "N/record"], /**
 * @param{currentRecord} currentRecord
 */ function (currentRecord, search, record) {
        function pageInit(scriptContext) {
            try {
                var poRecordObj = scriptContext.currentRecord;
                var poProject;
                var currentProject = poRecordObj.getValue({ fieldId: "custpage_p2p_data", });
                var natureOfDocument = poRecordObj.getField({ fieldId: "custbody_in_nature_of_document", });
                natureOfDocument.isDisplay = true;
                var purchaseDate = poRecordObj.getValue({ fieldId: "trandate", });
                var sourceProject = JSON.parse(currentProject);
                poProject = sourceProject.p2pJobId;
                if (_logValidation(poProject)) {
                    var projectBudgetStatus = search.lookupFields({
                        type: search.Type.JOB,
                        id: poProject,
                        columns: ["custentity_project_approval_status", "custentity_inital_approved", "custentity_closure_date"],
                    });
                    var cloureDate = projectBudgetStatus.custentity_closure_date;
                    var formattedpurchaseDate = parseDate(purchaseDate);
                    var formattedcloureDate = parseDate(cloureDate);
                    var isprojectclose = compareDates(formattedpurchaseDate, formattedcloureDate);
                    if (Object.keys(projectBudgetStatus).length != 0 && (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0 || projectBudgetStatus.custentity_inital_approved == false)) {
                        var isInitialApproved = projectBudgetStatus.custentity_inital_approved;
                        if (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0) {
                            var projectBudgetStatus = projectBudgetStatus.custentity_project_approval_status[0].value;
                            var alertMsg = getAlertJSON(projectBudgetStatus);
                        }
                        if (isInitialApproved === false) {
                            alert("The budget has not been generated for the selected project. Please create a project budget and obtain approval.");
                        } else if (isprojectclose === 1) {
                            alert("The closure date for the selected project has already passed.");
                        } else if (alertMsg != 0) {
                            alert(alertMsg);
                        } else { }
                    } else { }
                } else { }
            } catch (error) {
                log.debug("error : ", error);
            }
        }

        function fieldChanged(scriptContext) {
            try {
                if (scriptContext.fieldId == "entity") {
                    var poRecordObj = scriptContext.currentRecord;
                    var poProject;
                    var currentProject = poRecordObj.getValue({ fieldId: "custpage_p2p_data" });
                    var sourceProject = JSON.parse(currentProject);
                    poProject = sourceProject.p2pJobId;
                    if (_logValidation(poProject)) {
                        var projectBudgetStatus = search.lookupFields({
                            type: search.Type.JOB,
                            id: poProject,
                            columns: ["custentity_subsidiary_loaction", "custentity_line_of_business", "custentity_department", "projectedenddate",],
                        });
                        poRecordObj.setValue({ fieldId: "custbody_project_reference", value: poProject });
                        if (projectBudgetStatus.projectedenddate.length == 10) {
                            var projectDate = parseDate(projectBudgetStatus.projectedenddate);
                            poRecordObj.setValue({ fieldId: "custbody_project_end_date", value: projectDate, });
                        } else {
                            poRecordObj.setValue({
                                fieldId: "custbody_project_end_date", value: null,
                            });
                        }
                        if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
                            poRecordObj.setValue({ fieldId: "location", value: projectBudgetStatus.custentity_subsidiary_loaction[0].value });
                        } else {
                            poRecordObj.setValue({ fieldId: "location", value: "" });
                        }
                        if (projectBudgetStatus.custentity_line_of_business.length === 1) {
                            poRecordObj.setValue({ fieldId: "class", value: projectBudgetStatus.custentity_line_of_business[0].value });
                        } else {
                            poRecordObj.setValue({ fieldId: "class", value: "" });
                        }
                        if (projectBudgetStatus.custentity_department.length === 1) {
                            poRecordObj.setValue({ fieldId: "department", value: projectBudgetStatus.custentity_department[0].value });
                        } else {
                            poRecordObj.setValue({ fieldId: "department", value: "" });
                        }
                    }
                }

                if (scriptContext.fieldId == "customer") {
                    var poRecordObj = scriptContext.currentRecord;
                    var poProject;
                    if (scriptContext.sublistId == "item") {
                        poProject = poRecordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "customer" });
                    } else {
                        poProject = poRecordObj.getCurrentSublistValue({ sublistId: "expense", fieldId: "customer" });
                    }
                    var purchaseDate = poRecordObj.getValue({ fieldId: "trandate", });
                    if (_logValidation(poProject)) {
                        var projectBudgetStatus = search.lookupFields({
                            type: search.Type.JOB,
                            id: poProject,
                            columns: ["custentity_subsidiary_loaction", "custentity_line_of_business", "custentity_department", "custentity_project_approval_status", "custentity_inital_approved", "custentity_closure_date"],
                        });
                        if (projectBudgetStatus.custentity_subsidiary_loaction.length === 1) {
                            poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: projectBudgetStatus.custentity_subsidiary_loaction[0].value });
                        } else {
                            poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: "" });
                        }
                        if (projectBudgetStatus.custentity_line_of_business.length === 1) {
                            poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "class", value: projectBudgetStatus.custentity_line_of_business[0].value });
                        } else {
                            poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "class", value: "" });
                        }
                        if (projectBudgetStatus.custentity_department.length === 1) {
                            poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "department", value: projectBudgetStatus.custentity_department[0].value });
                        } else {
                            poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "department", value: "" });
                        }

                        var cloureDate = projectBudgetStatus.custentity_closure_date;
                        var formattedpurchaseDate = parseDate(purchaseDate);
                        var formattedcloureDate = parseDate(cloureDate);
                        var isprojectclose = compareDates(formattedpurchaseDate, formattedcloureDate);
                        if (Object.keys(projectBudgetStatus).length != 0 && (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0 || projectBudgetStatus.custentity_inital_approved == false)) {
                            var isInitialApproved = projectBudgetStatus.custentity_inital_approved;
                            if (Object.keys(projectBudgetStatus.custentity_project_approval_status).length != 0) {
                                var projectBudgetStatus = projectBudgetStatus.custentity_project_approval_status[0].value;
                                var alertMsg = getAlertJSON(projectBudgetStatus);
                            }
                            if (isInitialApproved === false) {
                                alert("The budget has not been generated for the selected project. Please create a project budget and obtain approval.");
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "customer", value: "", ignoreFieldChange: true, forceSyncSourcing: true, });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: "", });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "department", value: "", });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "class", value: "", });
                            } else if (alertMsg != 0) {
                                alert(alertMsg);
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "customer", value: "", ignoreFieldChange: true, forceSyncSourcing: true, });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: "", });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "department", value: "", });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "class", value: "", });

                            } else if (isprojectclose === 1) {
                                alert("The closure date for the selected project has already passed.");
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "customer", value: "", ignoreFieldChange: true, forceSyncSourcing: true, });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: "", });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "department", value: "", });
                                poRecordObj.setCurrentSublistValue({ sublistId: "item", fieldId: "class", value: "", });
                            } else {
                            }
                        }
                    }
                }
            } catch (error) {
                console.log("error : ", error);
            }
        }

        function validateLine(scriptContext) {
            try {
                var poRecordObj = scriptContext.currentRecord;
                var poRecordId = scriptContext.currentRecord.id;
                var poProjectStatus = poRecordObj.getValue({
                    fieldId: "approvalstatus",
                });
                log.debug("poRecordId", poRecordId);
                log.debug("poProjectStatus", poProjectStatus);
                var lineProject = poRecordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "customer", });
                var polineAmount = poRecordObj.getCurrentSublistValue({ sublistId: "item", fieldId: "amount", });
                if (poRecordId != "") {
                    if (_logValidation(lineProject)) {
                        var getPurchase = getPurchaseSales(lineProject, "PurchOrd", "ExpRept", poRecordId);
                        log.debug("Except Existing : getPurchase", getPurchase);
                        var getProjectCostBudget = getProjectBudget(lineProject, "COST");
                        if (getPurchase != 0 || getPurchase == 0) {
                            var currentSalesTotal = parseFloat(polineAmount) + parseFloat(getPurchase);
                            if (currentSalesTotal > parseFloat(getProjectCostBudget)) {
                                alert("This purchase is exceeding the cost budget for the selected project.");
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }
                } else {
                    if (_logValidation(lineProject)) {
                        var getPurchase = getPurchaseSales(lineProject, "PurchOrd", "ExpRept", 0);
                        log.debug("getPurchase", getPurchase);
                        var getProjectCostBudget = getProjectBudget(lineProject, "COST");
                        if (getPurchase != 0 || getPurchase == 0) {
                            var currentSalesTotal = parseFloat(polineAmount) + parseFloat(getPurchase);
                            if (currentSalesTotal > parseFloat(getProjectCostBudget)) {
                                alert("This purchase is exceeding the cost budget for the selected project.");
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }
                }
            } catch (error) {
                console.log("Error : ", error.toString());
            }
        }

        function saveRecord(scriptContext) {
            try {
                var poRecObj = scriptContext.currentRecord;
                var poInternalId = String(poRecObj.id);
                log.debug("poInternalId", poInternalId);
                log.debug("poRecObj", poRecObj);
                var lineCount = poRecObj.getLineCount({ sublistId: "item" });
                var count = 0;
                log.debug("lineCount", lineCount);
                if (lineCount > 0) {
                    var poMap = new Map();
                    for (var i = 0; i < lineCount; i++) {
                        var projectId = poRecObj.getSublistValue({ sublistId: "item", fieldId: "customer", line: i });
                        if (_logValidation(projectId)) {
                            var projectLineAmount = Number(poRecObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: i, }));
                            if (poMap.size == 0) {
                                poMap.set(projectId, projectLineAmount);
                                continue;
                            }
                            if (poMap.has(projectId)) {
                                var newAmount = Number(poMap.get(projectId)) + Number(projectLineAmount);
                                poMap.set(projectId, newAmount);
                                continue;
                            }
                            poMap.set(projectId, projectLineAmount);
                        }
                    }

                    if (poMap.size == 1) {
                        var projectKey = poMap.keys().next().value;
                        log.debug('projectKey', projectKey)

                        if (_logValidation(projectKey)) {
                            var projectClassifications = search.lookupFields({
                                type: search.Type.JOB,
                                id: projectKey,
                                columns: ["custentity_subsidiary_loaction", "custentity_line_of_business", "custentity_department", "projectedenddate"],
                            });
                            log.debug("projectClassifications", projectClassifications);
                            var projectRecord = record.load({ type: record.Type.JOB, id: projectKey, });
                            var projectCode = projectRecord.getValue({ fieldId: 'entityid' });
                            var projectName = projectRecord.getValue({ fieldId: 'companyname' });
                            var projectClass = poRecObj.getValue({ fieldId: 'class' });
                            var projectDepartment = poRecObj.getValue({ fieldId: 'department' });
                            var projectLocation = poRecObj.getValue({ fieldId: 'location' });
                            log.debug('projectCode', projectCode)
                            log.debug('projectName', projectName)
                            var projeReferenceName = "";
                            projeReferenceName += _logValidation(projectCode) ? projectCode : "";
                            projeReferenceName += _logValidation(projectName) ? " : " + projectName : "";
                            log.debug('projeReferenceName', projeReferenceName)
                            if (projectClassifications.projectedenddate.length == 10) {
                                var projectDate = parseDate(projectClassifications.projectedenddate);
                                poRecObj.setValue({ fieldId: "custbody_project_end_date", value: projectDate, });
                            } else {
                                poRecObj.setValue({ fieldId: "custbody_project_end_date", value: null, });
                            }

                            if (projeReferenceName != "") {
                                poRecObj.setValue({ fieldId: "custbody_project_name_ref_for_pdf", value: projeReferenceName, });
                            }
                            else {
                                poRecObj.setValue({ fieldId: "custbody_project_name_ref_for_pdf", value: "", });
                            }

                            if (!_logValidation(projectClass)) {
                                if (projectClassifications.custentity_line_of_business.length === 1) {
                                    poRecObj.setValue({ fieldId: "class", value: projectClassifications.custentity_line_of_business[0].value, });
                                } else {
                                    poRecObj.setValue({ fieldId: "class", value: "", });
                                }
                            }

                            if (!_logValidation(projectDepartment)) {
                                if (projectClassifications.custentity_department.length === 1) {
                                    poRecObj.setValue({ fieldId: "department", value: projectClassifications.custentity_department[0].value, });
                                } else {
                                    poRecObj.setValue({ fieldId: "department", value: "", });
                                }

                            }

                            if (!_logValidation(projectLocation)) {
                                if (projectClassifications.custentity_subsidiary_loaction.length === 1) {
                                    poRecObj.setValue({ fieldId: "location", value: projectClassifications.custentity_subsidiary_loaction[0].value, });
                                } else {
                                    poRecObj.setValue({ fieldId: "location", value: "", });
                                }

                            }

                        }
                    }

                    if (poMap.size > 1) {
                        poRecObj.setValue({ fieldId: "custbody_project_name_ref_for_pdf", value: "Multiple Project", });
                    }


                    if (poMap.size > 0) {
                        poMap.forEach((value, key) => {
                            log.debug("key", key);
                            log.debug("value", value);
                        });
                        var popUp = "Costing Budget is exceeding for the following project: ";
                        if (poInternalId == "") {
                            poMap.forEach((value, key) => {
                                log.debug("Inside 1st If");
                                log.debug("The key is", key);
                                var existingPoAmount = getPurchaseSales(key, "PurchOrd", "ExpRept", 0);
                                log.debug("existingPoAmount", existingPoAmount);
                                var cbudget = Number(getProjectBudget(key, "COST"));
                                log.debug("cbudget", cbudget);
                                if (Number(existingPoAmount) + Number(poMap.get(key)) > cbudget) {
                                    var projectNameLookup = search.lookupFields({
                                        type: search.Type.JOB,
                                        id: key,
                                        columns: ["entityid"],
                                    });
                                    // var splitArray = projectName.entityid.split(" : ");
                                    // var projectName = splitArray[1];
                                    log.debug('projectNameLookup' , projectNameLookup)
                                    var projectId = projectNameLookup.entityid;
                                    count++;
                                    if (count == 1) popUp += `${projectId}`;
                                    else popUp += ` & ${projectId}`;
                                }
                            });
                        } else if (poInternalId != "") {
                            poMap.forEach((value, key) => {
                                log.debug("Inside else");
                                log.debug("The key is", key);
                                var existingPoAmount = Number(
                                    getPurchaseSales(key, "PurchOrd", "ExpRept", poInternalId)
                                );
                                log.debug("existingPoAmount", existingPoAmount);
                                var cbudget = Number(getProjectBudget(key, "COST"));
                                log.debug("cbudget", cbudget);
                                if (existingPoAmount + Number(poMap.get(key)) > cbudget) {
                                    var projectNameLookup = search.lookupFields({ type: search.Type.JOB, id: key, columns: ["entityid"], });
                                    // var splitArray = projectName.entityid.split(" : ");
                                    // var projectName = splitArray[1];
                                    log.debug('projectNameLookup' , projectNameLookup)
                                    var projectId = projectNameLookup.entityid;
                                    count++;
                                    if (count == 1) popUp += `${projectId}`;
                                    else popUp += ` & ${projectId}`;
                                }
                            });
                        }
                    }
                }
                if (count > 0) {
                    alert(popUp);
                    return false;
                }
                return true;
            } catch (e) {
                log.debug("The error is", e);
            }
        }

        function _logValidation(value) {
            if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "NaN") {
                return true;
            } else {
                return false;
            }
        }

        function parseDate(dateString) {
            if (
                Object.prototype.toString.call(dateString) === "[object Date]" &&
                !isNaN(dateString)
            ) {
                return dateString;
            }

            var dateParts = dateString.split("/");
            var day = parseInt(dateParts[0], 10);
            var month = parseInt(dateParts[1], 10) - 1;
            var year = parseInt(dateParts[2], 10);

            return new Date(year, month, day);
        }

        function compareDates(date1, date2) {
            var parsedDate1 = parseDate(date1);
            var parsedDate2 = parseDate(date2);

            if (parsedDate1 > parsedDate2) {
                return 1;
            } else {
                return 0;
            }
        }
        function getPurchaseSales(
            projectId,
            transactionType1,
            transactionType2,
            currentTransactionId
        ) {
            try {
                var currentTransId = currentTransactionId;
                var filter;
                var column;

                if (currentTransId == 0) {
                    filter = [[["internalidnumber", "equalto", projectId], "AND", ["transaction.type", "anyof", transactionType1, transactionType2], "AND", ["transaction.approvalstatus", "anyof","1","2","3","11"], "AND", ["transaction.status", "noneof", "ExpRept:E", "ExpRept:V", "ExpRept:H", "ExpRept:D",],],];

                    column = [
                        search.createColumn({ name: "netamount", join: "transaction", summary: "SUM", label: "Amount (Net)", }),
                        search.createColumn({ name: "type", join: "transaction", summary: "GROUP", label: "Type", sort: search.Sort.ASC, }),
                    ];
                } else {
                    filter = [[["internalidnumber", "equalto", projectId], "AND", ["transaction.type", "anyof", transactionType1, transactionType2], "AND", ["transaction.approvalstatus", "anyof","1","2","3","11"], "AND", ["transaction.status", "noneof", "ExpRept:E", "ExpRept:V", "ExpRept:H", "ExpRept:D",], "AND", ["transaction.internalidnumber", "notequalto", currentTransId],],];

                    column = [
                        search.createColumn({ name: "netamount", join: "transaction", summary: "SUM", label: "Amount (Net)", }),
                        search.createColumn({ name: "type", join: "transaction", summary: "GROUP", label: "Type", sort: search.Sort.ASC, }),
                    ];
                }
                var jobSearchObj = search.create({ type: "job", filters: filter, columns: column, });

                var searchResultCount = jobSearchObj.runPaged().count;
                log.debug("jobSearchObj result count", searchResultCount);
                var searchresult = jobSearchObj.run().getRange(0, 10);
                var i = 0;
                var totalsales = 0;
                if (searchResultCount > 0) {
                    while (i < searchResultCount) {
                        var transactionAmount = searchresult[i].getValue({ name: "netamount", join: "transaction", summary: "SUM", label: "Amount (Net)", });
                        totalsales += parseFloat(transactionAmount);
                        i++;
                    }

                    return totalsales;
                } else {
                    return 0;
                }
            } catch (error) {
                log.debug("error : ", error.toString());
            }
        }

        function getProjectBudget(projectId, budgetType) {
            try {
                var jobSearchObj = search.create({
                    type: "job",
                    filters: [["internalidnumber", "equalto", projectId], "AND", ["projectbudget.type", "anyof", budgetType],],
                    columns: [search.createColumn({ name: "type", join: "projectBudget", summary: "GROUP", label: "Budget Type", }), search.createColumn({ name: "amount", join: "projectBudget", summary: "SUM", label: "Amount", sort: search.Sort.ASC, }),],
                });
                var searchResultCount = jobSearchObj.runPaged().count;
                log.debug("jobSearchObj result count", searchResultCount);
                var projectBudget = jobSearchObj.run().getRange(0, 100);

                if (searchResultCount > 0) {
                    var budgetAmount = projectBudget[0].getValue({ name: "amount", join: "projectBudget", summary: "SUM", label: "Amount", sort: search.Sort.ASC, });
                    return budgetAmount;
                } else {
                    return 0;
                }
            } catch (error) {
                log.debug("Error 2 : ", error.toString());
            }
        }

        function getAlertJSON(budgetStatus) {
            var alertJson = {
                1: "The budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval.",
                3: "The project owner has rejected the budget for the selected project. Kindly obtain the necessary approval.",
                4: "The budget for the selected project has been revised but not submitted to the project owner for approval. Kindly obtain the necessary approval.",
                5: "The revised budget for the selected project is pending approval from the project owner. Kindly obtain the necessary approval.",
                7: "The revised budget for the selected project has been rejected by the project owner. Kindly obtain the necessary approval.",
            };

            if (budgetStatus in alertJson) {
                return alertJson[budgetStatus];
            } else {
                return 0;
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            validateLine: validateLine,
            saveRecord: saveRecord,
        };
    });
