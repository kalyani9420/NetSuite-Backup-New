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
                const csvContents = file.load({ id: 30554 }).getContents();
                const extractedData = parseCSV(csvContents);
                log.debug('extractedData', extractedData);
                return extractedData;
            } catch (error) {
                log.debug('Error from getInputData', error);
            }
        }


        function map(mapContext) {
            try {
                var csvContentInMap = JSON.parse(mapContext.value);
                log.debug('mapcontext values', csvContentInMap);
                const projectRecord = record.load({ type: 'job', id: csvContentInMap['Project ID'] });
                projectRecord.setSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 0, value: csvContentInMap['Billing Labour'] });
                projectRecord.setSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 2, value: csvContentInMap['Billing Expenses'] });
                projectRecord.setSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 4, value: csvContentInMap['Billing Supplier'] });
                projectRecord.setSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 6, value: csvContentInMap['Billing Other'] });
                projectRecord.setSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", line: 0, value: csvContentInMap['Costing Labour'] });
                projectRecord.setSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", line: 3, value: csvContentInMap['Costing Expenses'] });
                projectRecord.setSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", line: 5, value: csvContentInMap['Costing Supplier'] });
                projectRecord.setSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", line: 7, value: csvContentInMap['Costing Other'] });
                const recId = projectRecord.save();
                log.debug('recId', recId);
            } catch (error) {
                log.debug('Error from map', error);
            }
        }

        function parseCSV(csvContent) {
            var lines = csvContent.split(/\r?\n/);
            var headers = lines[0].match(/(".*?"|[^,]+)/g).map(header => header.replace(/^"|"$/g, '').trim());
            // log.debug('headers', headers);
            var extractedData = [];

            for (var i = 1; i < lines.length; i++) {
                if (lines[i].trim() === '') continue; // Skip empty lines

                var values = lines[i].match(/(".*?"|[^,]+)/g).map(value => value.replace(/^"|"$/g, '').trim());
                // log.debug('values', values);

                var rowData = {};
                headers.forEach((header, index) => {
                    var fieldValue = values[index];
                    // log.debug('fieldValue', fieldValue);
                    if (['Billing Budget', 'Costing Budget'].includes(header)) {
                        fieldValue = parseFloat(fieldValue.replace(/,/g, '')) || 0;
                    }
                    rowData[header] = fieldValue;
                    // log.debug('rowData[header]', rowData[header]);
                });

                extractedData.push(rowData);
            }
            // log.debug('extractedData', extractedData);

            return extractedData;
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