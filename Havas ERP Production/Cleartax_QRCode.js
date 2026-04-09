/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/https', 'N/url', 'N/encode','N/file'], function(record, log, https, url, encode, file) {

    function beforeLoad(scriptContext) {
        var newRecord = scriptContext.newRecord;
        log.debug('newRecord',newRecord.id)        
        try {
            var jsonData = newRecord.getValue({ fieldId: 'custbody_psg_ei_certified_edoc' });
            log.debug('jsonData',jsonData)

            var fileobj = file.load({
                id: jsonData
            })
            log.debug('fileobj',fileobj)

            var filecontent = fileobj.getContents();
            log.debug('filecontent',filecontent)

            // ar signedQrValue = parsedData.SignedQRCode;
            //     log.debug('signedQrValue',signedQrValue)

                var govt_response = filecontent.govt_response;
                log.debug('govt_response',govt_response)
            if (filecontent) {
                var parsedData = JSON.parse(filecontent);
                log.debug('parsedData',parsedData)

                log.debug('typeof parsedData',typeof parsedData)

                var govt_response = parsedData.govt_response;
                log.debug('govt_response',govt_response)

                var signedQrValue = parsedData.govt_response.SignedQRCode;
                log.debug('signedQrValue',signedQrValue)

                if (signedQrValue) {
                    var qrCodeUrl = (signedQrValue);

                    newRecord.setValue({
                        fieldId: 'custbody_qr_code_register',
                        value: qrCodeUrl
                    });
                } else {
                    log.error({ title: 'No Signed QR Value', details: 'Signed QR value not found in JSON' });
                }
            } else {
                log.error({ title: 'No JSON Data', details: 'JSON data field is empty' });
            }

        } catch (e) {
            log.error({ title: 'Error', details: e.message });
        }
    }

    /**
     * Function to generate the QR code image URL using an external QR code generation API
        */
         function generateQrCode(value) {
            try {
                //You can use an external API for QR code generation (e.g., Google Chart API or a third-party service)
             var apiUrl = 'https://chart.googleapis.com/chart';
              var qrCodeUrl = apiUrl + '?chs=150x150&cht=qr&chl=' + encodeURIComponent(value);

              return qrCodeUrl;
           } catch (e) {
                log.error({ title: 'QR Code Generation Failed', details: e.message });
                return null;
            }
        }

    return {
        beforeLoad: beforeLoad
    };

});
