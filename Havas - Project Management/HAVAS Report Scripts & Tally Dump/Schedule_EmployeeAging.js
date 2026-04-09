/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/currentRecord', 'N/search'],
    /**
 * @param{currentRecord} currentRecord
 */
    (currentRecord, search) => {

        let daysJson = { 1: 9, 2: 14, 3: 24, 4: 29, 5: 59 }

        const execute = (scriptContext) => {
            try {

                //Script Parameters
                let asOfDate = '25/05/2025';
                let dateRange = 2;
                let employeeCheckTotal = fetchCheckTotal(asOfDate, dateRange);
                let employeeExpenseTotal = getExpense(asOfDate);
                if (employeeExpenseTotal != null) {
                    let order = ["fifth", "fourth", "third", "second", "first"];
                    employeeExpenseTotal.forEach(expense => {
                        let employeeId = expense.getValue({ name: "mainname", summary: "GROUP", label: "Main Line Name" });
                        expense = JSON.parse(JSON.stringify(expense));
                        let expenseAmount = Number(expense.values["SUM(formulanumeric)"]);

                        if(employeeId == 27){
                          log.debug('employeeId expenseAmount', employeeId + '         ' + expenseAmount);
                        log.debug('employeeCheckTotal[employeeId] Before', employeeCheckTotal[employeeId]);
                        }
                        
                        if (employeeCheckTotal.hasOwnProperty(employeeId)) {
                            for (let key of order) {
                                let currentCheckTotal = Number(employeeCheckTotal[employeeId][key]);
                                if (expenseAmount <= 0) break;
                                if (currentCheckTotal >= expenseAmount) {
                                    employeeCheckTotal[employeeId][key] = currentCheckTotal - expenseAmount;
                                    expenseAmount = 0;
                                } else {
                                    expenseAmount -= currentCheckTotal;
                                    employeeCheckTotal[employeeId][key] = 0;
                                }
                            }
                        }
                        else {
                            log.debug('Employee not found in employeeCheckTotal{}', employeeId);
                        }
                        if(employeeId == 27) log.debug('employeeCheckTotal[employeeId] After', employeeCheckTotal[employeeId]);
                    });
                } else { }
                log.debug('employeeCheckTotal', employeeCheckTotal);
            } catch (error) {
                log.debug('Error in execute ', error)
            }
        }
        const fetchCheckTotal = (toDate, dateRange) => {
            try {

                let employeeCheckTotal = {};

                let days = daysJson[dateRange]
                let firstToDate = toDate
                let firstFromDate = getDateBefore(toDate, days);
                let secondToDate = getPreviousDate(firstFromDate);
                let secondFromDate = getDateBefore(secondToDate, days);
                let thirdToDate = getPreviousDate(secondFromDate);
                let thirdFromDate = getDateBefore(thirdToDate, days);
                let fourthToDate = getPreviousDate(thirdFromDate);
                let fourthFromDate = getDateBefore(fourthToDate, days);
                let fifthToDate = getPreviousDate(fourthFromDate);

                let firstCheckResult = getChecks(firstFromDate, firstToDate);
                let secondCheckResult = getChecks(secondFromDate, secondToDate);
                let thirdCheckResult = getChecks(thirdFromDate, thirdToDate);
                let fourthCheckResult = getChecks(fourthFromDate, fourthToDate);
                let fifthCheckResult = getChecks(null, fifthToDate);
                let expenseResult = getExpense(toDate);

                if (firstCheckResult != null) {
                    firstCheckResult.forEach(check => {
                        let employeeId = check.getValue({ name: "mainname", summary: "GROUP", label: "Main Line Name" });
                        check = JSON.parse(JSON.stringify(check));
                        let amountTotal = check.values["SUM(formulanumeric)"];
                        employeeCheckTotal.hasOwnProperty(employeeId) ? employeeCheckTotal[employeeId].first = amountTotal : employeeCheckTotal[employeeId] = { first: amountTotal, second: 0.0, third: 0.0, fourth: 0.0, fifth: 0.0 };
                    });
                }

                if (secondCheckResult != null) {
                    secondCheckResult.forEach(check => {
                        let employeeId = check.getValue({ name: "mainname", summary: "GROUP", label: "Main Line Name" });
                        check = JSON.parse(JSON.stringify(check));
                        let amountTotal = check.values["SUM(formulanumeric)"];
                        employeeCheckTotal.hasOwnProperty(employeeId) ? employeeCheckTotal[employeeId].second = amountTotal : employeeCheckTotal[employeeId] = { first: 0.0, second: amountTotal, third: 0.0, fourth: 0.0, fifth: 0.0 };
                    });
                }

                if (thirdCheckResult != null) {
                    thirdCheckResult.forEach(check => {
                        let employeeId = check.getValue({ name: "mainname", summary: "GROUP", label: "Main Line Name" });
                        check = JSON.parse(JSON.stringify(check));
                        let amountTotal = check.values["SUM(formulanumeric)"];
                        employeeCheckTotal.hasOwnProperty(employeeId) ? employeeCheckTotal[employeeId].third = amountTotal : employeeCheckTotal[employeeId] = { first: 0.0, second: 0.0, third: amountTotal, fourth: 0.0, fifth: 0.0 };
                    });
                }

                if (fourthCheckResult != null) {
                    fourthCheckResult.forEach(check => {
                        let employeeId = check.getValue({ name: "mainname", summary: "GROUP", label: "Main Line Name" });
                        check = JSON.parse(JSON.stringify(check));
                        let amountTotal = check.values["SUM(formulanumeric)"];
                        employeeCheckTotal.hasOwnProperty(employeeId) ? employeeCheckTotal[employeeId].fourth = amountTotal : employeeCheckTotal[employeeId] = { first: 0.0, second: 0.0, third: 0.0, fourth: amountTotal, fifth: 0.0 };
                    });
                }

                if (fifthCheckResult != null) {
                    fifthCheckResult.forEach(check => {
                        let employeeId = check.getValue({ name: "mainname", summary: "GROUP", label: "Main Line Name" });
                        check = JSON.parse(JSON.stringify(check));
                        let amountTotal = check.values["SUM(formulanumeric)"];
                        employeeCheckTotal.hasOwnProperty(employeeId) ? employeeCheckTotal[employeeId].fifth = amountTotal : employeeCheckTotal[employeeId] = { first: 0.0, second: 0.0, third: 0.0, fourth: 0.0, fifth: amountTotal };
                    });
                }

                return Object.keys(employeeCheckTotal).length > 0 ? employeeCheckTotal : null;

            } catch (error) {
                log.debug('Error in fetchCheckTotal search', error);
            }

        }


        const getChecks = (fromDate, toDate) => {
            try {
                let checkFilter = [["type", "anyof", "Check"], "AND", ["mainline", "is", "T"], "AND", ["posting", "is", "T"]];
                _logValidation(fromDate) ? checkFilter.push('AND', ["trandate", "onorafter", fromDate],) : null;
                _logValidation(toDate) ? checkFilter.push('AND', ["trandate", "onorbefore", toDate],) : null;
                let checkSearchObj = search.create({
                    type: "check",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: checkFilter,
                    columns: [
                        search.createColumn({ name: "mainname", summary: "GROUP", label: "Main Line Name" }),
                        search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE  WHEN {type} = 'Check' THEN NVL(ABS({amount}), 0) ELSE 0 ", label: "Check Total" })
                    ]END
                });
                let searchResultCount = checkSearchObj.runPaged().count;
                log.debug('searchResultCount', searchResultCount)
                return searchResultCount > 0 ? getAllResult(checkSearchObj) : null;
            } catch (error) {
                log.debug('Error in getChecks search', error);
            }
        }

        const getExpense = (toDate) => {
            try {
                let expenseFilter = [["type", "anyof", "ExpRept"], "AND", ["advance", "greaterthan", "0"], "AND", ["advanceaccount", "anyof", "1454"], "AND", ["mainline", "is", "T"], "AND", ["posting", "is", "T"],];
                _logValidation(toDate) ? expenseFilter.push("AND", ["trandate", "before", toDate],) : null;
                var expensereportSearchObj = search.create({
                    type: "expensereport",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: expenseFilter,
                    columns: [
                        search.createColumn({ name: "mainname", summary: "GROUP", label: "Main Line Name" }),
                        search.createColumn({ name: "formulanumeric", summary: "SUM", formula: "CASE WHEN {type} = 'Expense Report' THEN NVL(ABS({advance}), 0)   ELSE 0 END", label: "Formula (Numeric)" })
                    ]
                });
                let searchResultCount = expensereportSearchObj.runPaged().count;
                log.debug('searchResultCount', searchResultCount)
                return searchResultCount > 0 ? getAllResult(expensereportSearchObj) : null;
            } catch (error) {
                log.debug('Error in getExpense search', error);
            }
        }

        let getAllResult = (customSearch) => {
            let searchResultCount = customSearch.runPaged().count;
            let allResults = [];
            let [start, end, limit] = [0, 1000, searchResultCount];
            while (start < limit) {
                allResults.push(...customSearch.run().getRange(start, end));
                start += 1000;
                end += 1000;
            }
            return allResults;
        };

        let getDateBefore = (inputDate, days) => {
            let [day, month, year] = inputDate.split('/').map(Number);
            let date = new Date(year, month - 1, day);
            date.setDate(date.getDate() - days);
            let formattedDay = String(date.getDate()).padStart(2, '0');
            let formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
            let formattedYear = date.getFullYear();
            return `${formattedDay}/${formattedMonth}/${formattedYear}`;
        }

        let getPreviousDate = (dateStr) => {
            let [day, month, year] = dateStr.split("/").map(Number);
            let date = new Date(year, month - 1, day);
            date.setDate(date.getDate() - 1);
            let prevDay = String(date.getDate()).padStart(2, "0");
            let prevMonth = String(date.getMonth() + 1).padStart(2, "0");
            let prevYear = date.getFullYear();
            return `${prevDay}/${prevMonth}/${prevYear}`;
        };

        let _logValidation = (value) => {
            if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "NaN") {
                return true;
            } else {
                return false;
            }
        }


        return { execute }

    });
