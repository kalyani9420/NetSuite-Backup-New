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
                const csvContents = file.load({ id: 27540 }).getContents();
                log.debug('csvContents', csvContents);
                const extractedData = parseCSV(csvContents);
                log.debug('extractedData', extractedData);
                log.debug('extractedData length', extractedData.length);
                
                return extractedData;
            } catch (error) {
                log.debug('Error in getInputData : ', error);
            }
        }


        function map(mapContext) {
            try {
                const csvKey = JSON.parse(mapContext.key);
                const csvContent = JSON.parse(mapContext.value);
                log.debug('mapcontext keys', csvKey);
                log.debug('mapcontext values', csvContent);

                let vendor = csvContent['Vendor /Employee Name (in Netsuite)'];
                let receiptVoucherNo = csvContent['Payment Voucher Number'];
                let subsidiaryLocation = csvContent['Subsidiary Location'];
                let apAccount = csvContent['A/P Account'];
                let bankAccount = csvContent['Bank Account'];
                let date = csvContent['Payment Date'];
                let billVoucherNo = csvContent['Vendor Invoice/ Bill Credit / Expense Report Voucher Number'];
                let billAmount = csvContent['Payment Amount'];
                let journalVoucherNo = csvContent['Journal Voucher Number'];
                let journalAmount = csvContent['Journal Amount to Apply'];
                let formattedDate = parseDate(date);

                log.debug('csvContent : ', 'vendor : ' + vendor + ' | subsidiaryLocation : ' + subsidiaryLocation + ' | apAccount : ' + apAccount + ' | receiptVoucherNo : ' + receiptVoucherNo + ' | bankAccount : ' +
                    bankAccount + ' | date : ' + formattedDate + ' | billVoucherNo : ' + billVoucherNo + ' | billAmount : ' +
                    billAmount + ' | journalVoucherNo : ' + journalVoucherNo + ' | journalAmount : ' + journalAmount);

                if (_logValidation(billVoucherNo)) {

                    var objRecord = record.create({ type: record.Type.VENDOR_PAYMENT, isDynamic: true });
                    objRecord.setValue({ fieldId: 'entity', value: vendor });
                    objRecord.setValue({ fieldId: 'apacct', value: apAccount });
                    objRecord.setValue({ fieldId: 'trandate', value: formattedDate });
                    objRecord.setValue({ fieldId: 'account', value: bankAccount });
                    objRecord.setValue({ fieldId: 'custbody_created_by', value: 131 });
                    objRecord.setValue({ fieldId: 'location', value: subsidiaryLocation });
                    objRecord.setValue({ fieldId: 'custbody_voucher_number', value: receiptVoucherNo });
                    let billLineNumber = objRecord.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'doc', value: billVoucherNo }); 
                    log.debug('billLineNumber : ', billLineNumber);
                    if (billLineNumber !== -1) {
                        objRecord.selectLine({ sublistId: 'apply', line: billLineNumber });
                        objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                        if (_logValidation(billAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(billAmount) }); }
                        objRecord.commitLine({ sublistId: 'apply' });
                    } else {
                        log.debug('Invoice Not found in apply sublist : ', billVoucherNo);
                    }

                    let journalLineNumberInApply = objRecord.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'doc', value: journalVoucherNo }); 
                    if (journalLineNumberInApply !== -1) {
                        objRecord.selectLine({ sublistId: 'apply', line: journalLineNumberInApply });
                        objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                        if (_logValidation(journalAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(journalAmount) }); }
                        objRecord.commitLine({ sublistId: 'apply' });
                    } else {
                        log.debug('Journal Not found in apply sublist : ', journalVoucherNo);
                    }
                    let paymentId = objRecord.save();
                    log.debug('paymentId : ', paymentId);
                    
                } else {
                    log.debug('Invalid Voucher No : ', billVoucherNo);
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
                    // log.debug('rowData[header]', rowData[header])
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