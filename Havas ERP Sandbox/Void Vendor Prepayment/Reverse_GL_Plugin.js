/**
 * @NApiVersion 2.1
 * @NScriptType CustomGLPlugin
 */
define(['N/record', 'N/log'], function (record, log) {

    function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
        try {
            log.debug('Inside GL Pluggin')
            let recordType = transactionRecord.transactionRecord.recordType;
            let recordId = transactionRecord.transactionRecord.id;
            log.debug("recordId | recordType", recordId + " | " + recordType);
            if (recordType !== record.Type.VENDOR_PREPAYMENT) { return; }
            let recordObj = record.load({ type: recordType, id: recordId })
            let isVoided = recordObj.getValue({ fieldId: 'custbody_voided' });
            log.debug("isVoided", isVoided);
            log.debug("isVoided", typeof isVoided);
            // log.debug('standardLine Count ', transactionRecord.standardLines);
            if (JSON.stringify(isVoided) != 'false') {
                log.debug("inside void", "inside void");
                let payeeName = Number( recordObj.getValue({ fieldId: 'entity' }));
                let account = Number(recordObj.getValue({ fieldId: 'account' }));
                let paymentAmount = Number(recordObj.getValue({ fieldId: 'payment' }));
                let prepaymentAcccount = Number(recordObj.getValue({ fieldId: 'prepaymentaccount' }));
                log.debug("payeeName", payeeName);

                // Debit Line on GL Impact
                let debitLine = transactionRecord.customLines.addNewLine();
                debitLine.accountId = account;
                debitLine.debitAmount = paymentAmount;
                debitLine.entityId = payeeName;
                debitLine.memo = 'Void Prepayment';
                debitLine.isBookSpecific = false;

                // Credit Line on GL Impact
                let creditLine = transactionRecord.customLines.addNewLine();
                creditLine.accountId = prepaymentAcccount;
                creditLine.creditAmount = paymentAmount;
                creditLine.entityId = payeeName;
                creditLine.memo = 'Void Prepayment';
                creditLine.isBookSpecific = false;

            }

        } catch (e) {
            log.error('Error in customizeGlImpact', e);
        }
    }

    function _logValidation(value) {
        if (value != null && value != "" && value != "null" && value != undefined && value != "undefined" && value != "@NONE@" && value != "NaN") { return true; }
        else { return false; }
    }

    return {
        customizeGlImpact: customizeGlImpact
    };
});

