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
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        function getInputData(inputContext) {
            try {
                const csvContents = file.load({ id: 18811 }).getContents();
                const extractedData = parseCSV(csvContents);
                log.debug('extractedData', extractedData);
                return extractedData;
            } catch (error) {
                log.debug('Error from getInputData', error);
            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        function map(mapContext) {
            try {
                var csvContentInMap = JSON.parse(mapContext.value);
                log.debug('mapcontext values', csvContentInMap);
                const projectRecord = record.load({ type: 'job', id: csvContentInMap['InternalId'] });
                projectRecord.setSublistValue({ sublistId: "bbudget", fieldId: "amount_1_", line: 6, value: csvContentInMap['Billing Budget'] });
                projectRecord.setSublistValue({ sublistId: "cbudget", fieldId: "amount_1_", line: 7, value: csvContentInMap['Costing Budget'] });
                const recId = projectRecord.save();
                log.debug('recId', recId);
            } catch (error) {
                log.debug('Error from map', error);
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

        return { getInputData, map }

    });