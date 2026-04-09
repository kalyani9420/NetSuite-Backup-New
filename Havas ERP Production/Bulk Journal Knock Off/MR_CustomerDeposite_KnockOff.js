/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/file'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{search} search
 */
    function (record, file) {

        function getInputData(inputContext) {
            try {
                const csvContents = file.load({ id: 28242 }).getContents();
                log.debug('csvContents', csvContents);
                const extractedData = parseCSV(csvContents);
                log.debug('extractedData', extractedData);
                return extractedData;
            } catch (error) {
                log.debug('Error in getInputData : ', error);
            }
        }


        function map(mapContext) {
            try {
                const csvContent = JSON.parse(mapContext.value);
                log.debug('mapcontext values', csvContent);

                let depositeId = csvContent['Customer Deposit Voucher Number'];
                let date = csvContent['Customer Deposit Application Date'];
                let InvoiceNumber = csvContent['Customer Invoice Voucher Number'];
                let InvoiceAmount = csvContent['Customer Invoice Amount'];
                let arAccount = csvContent['A/R Account'];
                let formattedDate = parseDate(date);


                log.debug('csvContent : ', 'depositeId : ' + depositeId + ' | date : ' +
                    date + ' | InvoiceNumber : ' + InvoiceNumber + ' | InvoiceAmount : ' + InvoiceAmount + ' | arAccount : ' + arAccount);

                if (_logValidation(depositeId)) {
                    var objRecord = record.transform({ fromType: 'customerdeposit', fromId: depositeId, toType: 'depositapplication', isDynamic: true, });
                        objRecord.setValue({ fieldId: 'trandate', value: formattedDate });
                        objRecord.setValue({ fieldId: 'aracct', value: arAccount });
                        let InvoiceLineNumber = objRecord.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: InvoiceNumber });
                        log.debug('InvoiceLineNumber : ', InvoiceLineNumber);
                        if (InvoiceLineNumber !== -1) {
                            objRecord.selectLine({ sublistId: 'apply', line: InvoiceLineNumber });
                            objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                            if (_logValidation(InvoiceAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(InvoiceAmount) }); }
                            objRecord.commitLine({ sublistId: 'apply' });
                        } else {
                            log.debug('Invoice Not found in apply sublist : ', InvoiceNumber);
                        }
                        let depositeApplication = objRecord.save();
                        log.debug('depositeApplication : ', depositeApplication);

                } else {
                    log.debug('Invalid Voucher No : ', depositeId);
                }
            } catch (error) {
                log.error('Error in map :', error);
            }
        }

        function parseCSV(csvContent) {
            var lines = csvContent.split(/\r?\n/);
            var headers = lines[0].match(/(".*?"|[^,]+)/g).map(header => header.replace(/^"|"$/g, '').trim());
            var extractedData = [];

            for (var i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue; // Skip empty lines
                var values = lines[i].match(/(".*?"|[^,]+)/g).map(value => value.replace(/^"|"$/g, '').trim());
                var rowData = {};
                headers.forEach((header, index) => {
                    var fieldValue = values[index];
                    rowData[header] = fieldValue;
                    log.debug('rowData[header]', rowData[header])
                });

                extractedData.push(rowData);
            }
            return extractedData;
        }

        function parseDate(dateString) {
            if (Object.prototype.toString.call(dateString) === "[object Date]" && !isNaN(dateString)) { return dateString; }
            if (typeof dateString !== "string") {
                console.log("Invalid dateString:", dateString); throw new Error("Invalid date format. Expected a string in 'DD/MM/YYYY' format.");
            }
            var dateParts = dateString.split("/");
            if (dateParts.length !== 3) {
                throw new Error("Invalid date format. Expected 'DD/MM/YYYY'.");
            }
            var day = parseInt(dateParts[0], 10);
            var month = parseInt(dateParts[1], 10) - 1;
            var year = parseInt(dateParts[2], 10);
            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                throw new Error("Invalid date parts in 'DD/MM/YYYY' format.");
            }
            return new Date(year, month, day);
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

        return { getInputData, map }

    });



// try {
//             let depositeId = "39044";
//             let date = parseDate('29/11/2025');
//             let InvoiceNumber = "22197";
//             let InvoiceAmount = "50";
//             let arAccount = "2287";
//             var objRecord = record.transform({ fromType: 'customerdeposit', fromId: depositeId, toType: 'depositapplication', isDynamic: true, });
//             objRecord.setValue({ fieldId: 'trandate', value: date });
//             objRecord.setValue({ fieldId: 'aracct', value: arAccount });
//             let InvoiceLineNumber = objRecord.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'internalid', value: InvoiceNumber });
//             log.debug('InvoiceLineNumber : ', InvoiceLineNumber);
//             if (InvoiceLineNumber !== -1) {
//                 objRecord.selectLine({ sublistId: 'apply', line: InvoiceLineNumber });
//                 objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
//                 if (_logValidation(InvoiceAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(InvoiceAmount) }); }
//                 objRecord.commitLine({ sublistId: 'apply' });
//             } else {
//                 log.debug('Invoice Not found in apply sublist : ', InvoiceNumber);
//             }
//             let depositeApplication = objRecord.save();
//             log.debug('depositeApplication : ', depositeApplication);

//         } catch (error) {
//             log.debug('Error in getInputData : ', error);
//         }