/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/currentRecord', "N/record", "N/runtime", "N/search", "N/render", 'N/file', 'N/email'],
    /**
 * @param{currentRecord} currentRecord
 */
    (currentRecord, record, runtime, search, render, file, email) => {


        const getInputData = (inputContext) => {
            // log.debug('Map Reduce')
            var salesorder_id_array = runtime.getCurrentScript().getParameter({
                name: 'custscript1'
            });


            // log.debug('Sales Order : ', salesorder_id_array);


            const arr = salesorder_id_array.split(',');

            // log.debug('arr : ', arr);


            var output = [];


            for (var i = 0; i < arr.length; i++) {
                var a = parseInt(arr[i]);

                var fieldLookUp = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: a,
                    columns: ['tranid', 'trandate', 'amount', 'status', 'entity']
                });

                temp = {
                    'id': fieldLookUp.tranid,
                    'date': fieldLookUp.trandate,
                    'amount': fieldLookUp.amount,
                    'status': fieldLookUp.status[0].text,
                    'name': fieldLookUp.entity
                }
                output.push(temp);

            }

            log.debug('o/p', output)
			
			


            return output

        }



        const map = (mapContext) => {
            // log.debug('key -  value', mapContext.key + " " + mapContext.value + " TYPE :  " +  typeof mapContext.value)

			var mapValue = JSON.parse(mapContext.value);
			
            var sales_Id = mapValue.id;
            var sales_Date = mapValue.date;
            var sales_Amount = mapValue.amount;
            var sales_Status = mapValue.status;
            var customer_Id = mapValue.name[0].value;

            // log.debug('sales_Id', sales_Id)
            // log.debug('sales_Date', sales_Date)
            // log.debug('sales_Amount', sales_Amount)
            // log.debug('sales_Status', sales_Status)
            // log.debug('customer_Id', customer_Id)



            mapContext.write({
                key: customer_Id,
                value: {
                    custpage_sales_Id: sales_Id,
                    custpage_sales_Date: sales_Date,
                    custpage_sales_Amount: sales_Amount,
                    custpage_sales_Status: sales_Status,
					custpage_sales_customer_name: mapValue.name[0].text,

					
                }
            });



        }


        const reduce = (reduceContext) => {
            log.debug('Key', reduceContext.key)
			log.debug('values', reduceContext.values)
			var arr_temp = []
			var cust_id = parseInt(reduceContext.key)
			log.debug('cust_id', typeof cust_id )

			
			
			for(var i = 0 ; i< reduceContext.values.length ; i++){
				arr_temp.push(JSON.parse(reduceContext.values[i]))
			}
			log.debug('arr_temp' , arr_temp)
			log.debug('arr_temp 0 ' , arr_temp[0])
			log.debug('arr_temp type' , typeof arr_temp[0])

			// var reduce_value = JSON.parse(reduceContext.values)
			
			salesorder_json = {
                customers: arr_temp
            }
            log.debug('salesorder_json', salesorder_json)
			
			var customer_information = {
                'name': arr_temp[0].custpage_sales_customer_name
     
            }
			
			
			log.debug('customer_information', customer_information)

            var renderer = render.create();
            renderer.setTemplateByScriptId({
                scriptId: 'CUSTTMPL_107_TD2842407_423'
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
			
			log.debug('salesPdf' ,salesPdf)
			
		
            // log.debug('3')

            // salesPdf.folder = 851;

            // log.debug('4')

            // var file_id = salesPdf.save();

            // log.debug('file_id', file_id)
			
			// var fileObj = file.load({
					// id: file_id
			// });
			// log.debug('fileObj', fileObj)
			
			var emailSubject = "Sales Order pdf attachment email for : " + arr_temp[0].custpage_sales_customer_name;
            var emailBody =
                "Hello " +
                arr_temp[0].custpage_sales_customer_name +
                " this is email for your sales order , PDF file has been attached ";

			log.debug('cust_id',cust_id)
            email.send({
                author: -5,
                recipients: cust_id,
                subject: emailSubject,
                body: emailBody,
                attachments: [salesPdf]
            });

            log.debug("Email Sent");
			
			


        }



        const summarize = (summaryContext) => {

        }

        return { getInputData, map, reduce, summarize }

    });
