/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/file"], /**
    * @param{record} record
    * @param{search} search
    */
    (record, search, file) => {
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {
                const csvContents = file.load({ id: 18811 }).getContents();
                const extractedData = parseCSV(csvContents);
                log.debug('extractedData', extractedData);

                for (let i = 0; i < extractedData.length; i++) {
                    const rec = record.load({ type: 'job', id: extractedData[i]['InternalId'] });
                    // let amount = rec.getSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 4 });
                    // log.debug('amount', amount);

                    // rec.selectLine({sublistId: "bbudget", line: 3 });
                    // rec.setCurrentSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", value: extractedData[0]['Billing Budget'] });
                    // rec.commitLine({sublistId: "bbudget"});
                    rec.setSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 6, value: extractedData[i]['Billing Budget'] });

                    // rec.selectLine({sublistId: "cbudget", line: 3 });
                    // rec.setCurrentSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", value: extractedData[0]['Costing Budget'] });
                    // rec.commitLine({sublistId: "cbudget"});
                    rec.setSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", line: 7, value: extractedData[i]['Costing Budget'] });
                    var recId = rec.save();
                    log.debug('recId', recId);
                }


            } catch (error) {
                log.debug('Error from beforeLoad', error);
            }
        };

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
                    if (['Billing Budget', 'Costing Budget'].includes(header)) {
                        fieldValue = parseFloat(fieldValue.replace(/,/g, '')) || 0;
                    }
                    rowData[header] = fieldValue;
                });

                extractedData.push(rowData);
            }

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

        return { afterSubmit };
    });