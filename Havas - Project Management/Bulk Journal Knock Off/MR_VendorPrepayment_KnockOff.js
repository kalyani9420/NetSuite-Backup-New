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
                const csvContents = file.load({ id: 28244 }).getContents();
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

                let prepaymentId = csvContent['Vendor Prepayment Voucher Number'];
                let date = csvContent['Vendor Prepayment Application Date'];
                let billVoucherNo = csvContent['Vendor Invoice Voucher Number'];
                let billAmount = csvContent['Vendor Invoice Amount'];
                let apAccount = csvContent['A/P Account'];
                let formattedDate = parseDate(date);


                log.debug('csvContent : ', 'prepaymentId : ' + prepaymentId + ' | date : ' +
                    formattedDate + ' | billVoucherNo : ' + billVoucherNo + ' | billAmount : ' + billAmount + ' | apAccount : ' + apAccount);

                if (_logValidation(prepaymentId)) {
                    var objRecord = record.transform({ fromType: 'vendorprepayment', fromId: prepaymentId, toType: 'vendorprepaymentapplication', isDynamic: true, });
                    objRecord.setValue({ fieldId: 'trandate', value: formattedDate });
                    objRecord.setValue({ fieldId: 'account', value: apAccount });
                    let billLineNumber = objRecord.findSublistLineWithValue({ sublistId: 'bill', fieldId: 'doc', value: billVoucherNo });
                    log.debug('billLineNumber : ', billLineNumber);
                    if (billLineNumber !== -1) {
                        objRecord.selectLine({ sublistId: 'bill', line: billLineNumber });
                        objRecord.setCurrentSublistValue({ sublistId: 'bill', fieldId: 'apply', value: true });
                        if (_logValidation(billAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'bill', fieldId: 'amount', value: Number(billAmount) }); }
                        objRecord.commitLine({ sublistId: 'bill' });
                    } else {
                        log.debug('Invoice Not found in apply sublist : ', billVoucherNo);
                    }
                    let prepaymentApplication = objRecord.save();
                    log.debug('prepaymentApplication : ', prepaymentApplication);

                } else {
                    log.debug('Invalid Voucher No : ', prepaymentId);
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
                log.debug("Invalid dateString:", dateString); throw new Error("Invalid date format. Expected a string in 'DD/MM/YYYY' format.");
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



// let prepaymentId = "39177";
// let date = parseDate('29/11/2025');
// let billVoucherNo = "3858";
// let billAmount = "100";
// let apAccount = "2453";
// var objRecord = record.transform({ fromType: 'vendorprepayment', fromId: prepaymentId, toType: 'vendorprepaymentapplication', isDynamic: true, });
// objRecord.setValue({ fieldId: 'trandate', value: date });
// objRecord.setValue({ fieldId: 'account', value: apAccount });
// let billLineNumber = objRecord.findSublistLineWithValue({ sublistId: 'bill', fieldId: 'doc', value: billVoucherNo });
// log.debug('billLineNumber : ', billLineNumber);
// if (billLineNumber !== -1) {
//     objRecord.selectLine({ sublistId: 'bill', line: billLineNumber });
//     objRecord.setCurrentSublistValue({ sublistId: 'bill', fieldId: 'apply', value: true });
//     if (_logValidation(billAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'bill', fieldId: 'amount', value: Number(billAmount) }); }
//     objRecord.commitLine({ sublistId: 'bill' });
// } else {
//     log.debug('Invoice Not found in apply sublist : ', billVoucherNo);
// }
// let paymentId = objRecord.save();
// log.debug('paymentId : ', paymentId);