/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search'], (record, log, search) => {

    /**
     * Scheduled Script Entry Point
     * @param {Object} scriptContext
     * @since 2015.2
     */
    const execute = (scriptContext) => {
        var subsidiarySearchObj = search.create({
            type: "subsidiary",
            filters:
                [
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "name", label: "Name" }),
                    search.createColumn({ name: "city", label: "City" }),
                    search.createColumn({ name: "state", label: "State/Province" }),
                    search.createColumn({ name: "country", label: "Country" }),
                    search.createColumn({ name: "currency", label: "Currency" })
                ]
        });
        var searchResultCount = subsidiarySearchObj.runPaged().count;
        log.debug("subsidiarySearchObj result count", searchResultCount);
        var searchResult = subsidiarySearchObj.run().getRange(0, 50);
        for (let index = 0; index < searchResult.length; index++) {
            var internalID = searchResult[index].getValue({ name: "internalid", label: "Internal ID" });
            var id = record.submitFields({
                type: record.Type.SUBSIDIARY,
                id: internalID,
                values: {
                    custrecord_project_closure_days: 90
                },
            });
            log.debug('id' , id)

        }

    };

    return { execute };
});
