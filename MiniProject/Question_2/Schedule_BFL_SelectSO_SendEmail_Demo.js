/**
* @NApiVersion 2.1
* @NScriptType ScheduledScript
*/
define(["N/log", "N/record", "N/runtime", "N/search", "N/render", 'N/file' , 'N/email' ],
    (log, record, runtime, search, render, file , email) => {

        const execute = (scriptContext) => {
            var salesorder_id_array = runtime.getCurrentScript().getParameter({
                name: 'custscript6'
            });

            var cust_name = runtime.getCurrentScript().getParameter({
                name: 'custscript7'
            });
            var from_date = runtime.getCurrentScript().getParameter({
            var from_date = runtime.getCurrentScript().getParameter({
                name: 'custscript8'
            });
            var to_date = runtime.getCurrentScript().getParameter({
                name: 'custscript9'
            });
			var cust_id = runtime.getCurrentScript().getParameter({
                name: 'custscript10'
            });

            // log.debug('Sales Order : ', salesorder_id_array);

            log.debug('Sales Order : ', cust_name + from_date + to_date);

            const arr = salesorder_id_array.split(',');

            // log.debug('arr : ', arr);


            var output = [];
            var temp;
            var customer_information = {
                'name': cust_name,
                'from': from_date,
                'to': to_date

            }


            for (var i = 0; i < arr.length; i++) {
                var a = parseInt(arr[i]);

                var fieldLookUp = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: a,
                    columns: ['tranid', 'trandate', 'amount', 'status']
                });

                temp = {
                    'id': fieldLookUp.tranid,
                    'date': fieldLookUp.trandate,
                    'amount': fieldLookUp.amount,
                    'status': fieldLookUp.status[0].text,
                }
                output.push(temp);




            }

            log.debug('o/p', output)

            salesorder_json = {
                customers: output
            }
            log.debug('salesorder_json', salesorder_json)

            var renderer = render.create();
            renderer.setTemplateByScriptId({
                scriptId: 'CUSTTMPL_109_T2816485_175'
            });
            log.debug('1')

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "results",
                data: salesorder_json
            });
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "resultKey",
                data: { customerInput: customer_information }
            });
            log.debug('2')

            var salesPdf = renderer.renderAsPdf();

            log.debug('3')

            salesPdf.folder = 650;

            log.debug('4')

            var file_id = salesPdf.save();

            log.debug('file_id', file_id)
			
			var fileObj = file.load({
					id: file_id
			});
			log.debug('fileObj', fileObj)

            var emailSubject = "Sales Order pdf attachment email for : " + cust_name;
            var emailBody =
                "Hello " +
                cust_name +
                " this is email for your sales order , PDF file has been attached ";

			log.debug('cust_id',cust_id)
            email.send({
                author: -5,
                recipients: cust_id,
                subject: emailSubject,
                body: emailBody,
                attachments: [fileObj]
            });

            log.debug("Email Sent");






        };

        return { execute };
    });

