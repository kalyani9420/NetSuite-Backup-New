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
                const csvContents = file.load({ id: 27435 }).getContents();
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

                let customer = csvContent['Customer Name (in Netsuite)'];
                let receiptVoucherNo = csvContent['Receipt Voucher Number'];
                let subsidiaryLocation = csvContent['Subsidiary Location'];
                let arAccount = csvContent['A/R Account'];
                let bankAccount = csvContent['Bank Account'];
                let date = csvContent['Receipt Date'];
                let invoiceVoucherNo = csvContent['Invoice Voucher Number'];
                let invoiceAmount = csvContent['Payment Amount'];
                let journalVoucherNo = csvContent['Journal Voucher Number'];
                let journalAmount = csvContent['Journal Amount to Apply'];
                let formattedDate = parseDate(date);

                log.debug('csvContent : ', 'customer : ' + customer + ' | subsidiaryLocation : ' + subsidiaryLocation + ' | arAccount : ' + arAccount + ' | receiptVoucherNo : ' + receiptVoucherNo + ' | bankAccount : ' +
                    bankAccount + ' | date : ' + formattedDate + ' | invoiceVoucherNo : ' + invoiceVoucherNo + ' | invoiceAmount : ' +
                    invoiceAmount + ' | journalVoucherNo : ' + journalVoucherNo + ' | journalAmount : ' + journalAmount);

                if (_logValidation(invoiceVoucherNo)) {
                    mapContext.write({
                        key: receiptVoucherNo,
                        value: {
                            customer: customer, subsidiaryLocation: subsidiaryLocation, arAccount: arAccount, bankAccount: bankAccount, date: date,
                            invoiceVoucherNo: invoiceVoucherNo, invoiceAmount: invoiceAmount, journalVoucherNo: journalVoucherNo, journalAmount: journalAmount,
                        },
                    });
                } else {
                    log.debug('Invalid Voucher No : ', invoiceVoucherNo);
                }
            } catch (error) {
                log.error('Error in map :', error);
            }
        }

        function reduce(reduceContext) {
            try {
                var receiptVoucherNo = reduceContext.key;
                var reduceValue = reduceContext.values;
                let bodyFieldObject = JSON.parse(reduceValue[0]);
                log.debug('reduceValue - ', reduceValue);
                let customer = bodyFieldObject['customer'];
                let subsidiaryLocation = bodyFieldObject['subsidiaryLocation'];
                let arAccount = bodyFieldObject['arAccount'];
                let bankAccount = bodyFieldObject['bankAccount'];
                let date = bodyFieldObject['date'];
                let formattedDate = parseDate(date);


                if (_logValidation(receiptVoucherNo) && _logValidation(customer) && _logValidation(subsidiaryLocation)
                    && _logValidation(arAccount) && _logValidation(bankAccount) && _logValidation(date)) {
                    log.debug('Inside If');
                    var objRecord = record.create({ type: record.Type.CUSTOMER_PAYMENT, isDynamic: true });
                    objRecord.setValue({ fieldId: 'customer', value: customer });
                    objRecord.setValue({ fieldId: 'aracct', value: arAccount });
                    objRecord.setValue({ fieldId: 'trandate', value: formattedDate });
                    objRecord.setValue({ fieldId: 'account', value: bankAccount });
                    objRecord.setValue({ fieldId: 'custbody_created_by', value: 131 });
                    objRecord.setValue({ fieldId: 'location', value: subsidiaryLocation });
                    objRecord.setValue({ fieldId: 'custbody_voucher_number', value: receiptVoucherNo });
                    for (let index = 0; index < reduceValue.length; index++) {
                        let lineLevelObject = JSON.parse(reduceValue[index]);
                        let invoiceVoucherNo = _logValidation(lineLevelObject['invoiceVoucherNo']) ? lineLevelObject['invoiceVoucherNo'] : null;
                        let invoiceAmount = _logValidation(lineLevelObject['invoiceAmount']) ? lineLevelObject['invoiceAmount'] : null;
                        let journalVoucherNo = _logValidation(lineLevelObject['journalVoucherNo']) ? lineLevelObject['journalVoucherNo'] : null;
                        let journalAmount = _logValidation(lineLevelObject['journalAmount']) ? lineLevelObject['journalAmount'] : null;

                        if (invoiceVoucherNo != null && invoiceAmount != null) {
                            let billLineNumber = objRecord.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'doc', value: invoiceVoucherNo });
                            log.debug('billLineNumber : ', billLineNumber);
                            if (billLineNumber !== -1) {
                                objRecord.selectLine({ sublistId: 'apply', line: billLineNumber });
                                objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                                if (_logValidation(invoiceAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(invoiceAmount) }); }
                                objRecord.commitLine({ sublistId: 'apply' });
                                log.debug('Commit Line  : ', ' Invoice Line commited in apply');
                            } else {
                                log.debug('Bill Not found in apply sublist : ', invoiceVoucherNo);
                            }
                        }
                        if (journalVoucherNo != null && journalAmount != null) {
                            let journalLineNumberInApply = objRecord.findSublistLineWithValue({ sublistId: 'apply', fieldId: 'doc', value: journalVoucherNo });
                            let journalLineNumberInCredit = objRecord.findSublistLineWithValue({ sublistId: 'credit', fieldId: 'doc', value: journalVoucherNo });
                            log.debug('journalLineNumberInApply : ', journalLineNumberInApply);
                            log.debug('journalLineNumberInCredit : ', journalLineNumberInCredit);
                            if (journalLineNumberInApply !== -1) {
                                objRecord.selectLine({ sublistId: 'apply', line: journalLineNumberInApply });
                                objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                                if (_logValidation(journalAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: Number(journalAmount) }); }
                                objRecord.commitLine({ sublistId: 'apply' });
                                log.debug('Commit Line  : ', ' Journal Line commited in apply');
                            }
                            else if (journalLineNumberInCredit !== -1) {
                                objRecord.selectLine({ sublistId: 'credit', line: journalLineNumberInCredit });
                                objRecord.setCurrentSublistValue({ sublistId: 'credit', fieldId: 'apply', value: true });
                                if (_logValidation(journalAmount)) { objRecord.setCurrentSublistValue({ sublistId: 'credit', fieldId: 'amount', value: Number(journalAmount) }); }
                                objRecord.commitLine({ sublistId: 'credit' });
                                log.debug('Commit Line  : ', ' Journal Line commited in credit');
                            } else {
                                log.debug('Journal Not found in apply/credit sublist : ', journalVoucherNo);
                            }
                        }
                    }
                    let paymentId = objRecord.save();
                    log.debug('paymentId : ', paymentId);

                } else {
                    log.debug('Error : Body Level Fields are missing for : ', receiptVoucherNo)
                }

            } catch (error) {
                log.error('Error in reduce :', error);
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

        return { getInputData, map, reduce }

    });