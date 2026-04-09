function example(jobId) {
    const sql = `SELECT entityid FROM job WHERE id = ?`;

    const result = query.runSuiteQL({
        query: sql,
        params: [jobId],
    }).asMappedResults();

    if (result.length > 0) {
        log.debug("Job EntityID", result[0].entityid);
        return result[0].entityid;
    }

    return null;
}


const getEmployeeByExternalIdSuiteQL = (externalId) => {
    try {
        const query = `
                SELECT id
                FROM employee
                WHERE externalid = ?
            `;

        const results = query.runSuiteQL({
            query: query,
            params: [externalId],
        });

        if (results && results.length > 0) {
            return results[0].id;
        }

        log.audit('Employee Not Found for External ID', `External ID: ${externalId}`);
        return null;
    } catch (error) {
        log.error('Error Fetching Employee by External ID (SuiteQL)', error.message);
        return null;
    }
};