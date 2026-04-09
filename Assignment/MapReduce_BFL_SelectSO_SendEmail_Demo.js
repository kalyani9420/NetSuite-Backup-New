/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/currentRecord' , "N/record", "N/runtime", "N/search", "N/render", 'N/file' , 'N/email'],
    /**
 * @param{currentRecord} currentRecord
 */
    (currentRecord , record, runtime, search, render, file , email) => {
       

        const getInputData = (inputContext) => {
			log.debug('Map Reduce')
			  var salesorder_id_array = runtime.getCurrentScript().getParameter({
                name: 'custscript11'
            });

          
            log.debug('Sales Order : ', salesorder_id_array);


            const arr = salesorder_id_array.split(',');

            log.debug('arr : ', arr);


            var output = [];
         

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

            			
			return output

        }

     

        const map = (mapContext) => 
			log.debug('key' , mapContext.key )
			log.debug('value' , mapContext.value )

			
			

        }

       
        // const reduce = (reduceContext) => {

        // }


        // const summarize = (summaryContext) => {

        // }

        return {getInputData , map }

    });
