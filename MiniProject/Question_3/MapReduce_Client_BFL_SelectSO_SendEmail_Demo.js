/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/format', 'N/runtime'],
    /**
     * @param{currentRecord} currentRecord
     */
    function (currentRecord, format, runtime) {

        var so_array = [];
        // var custName;
        var custFrom;
        var custTo;
        var objRecord;
        var first = 0;


        function pageInit(scriptContext) {
            objRecord = scriptContext.currentRecord


        }

        function fieldChanged(scriptContext) {
            objRecord = scriptContext.currentRecord

            // custName = objRecord.getValue({
            // fieldId: 'custpage_customer_name'
            // });
            console.log('test')

            custFrom = objRecord.getValue({
                fieldId: 'custpage_from_date'
            });

            custTo = objRecord.getValue({
                fieldId: 'custpage_to_date'
            });

            console.log('FromDate: ' + custFrom);
            console.log('ToDate: ' + custTo);

            if (scriptContext.fieldId == "custpage_from_date" || scriptContext.fieldId == "custpage_to_date") {
				

                console.log("Inside the condition")
                if (custFrom && custTo) {
                    custFrom_Format = format.format({
                        value: custFrom,
                        type: format.Type.DATE,
                    });
                    custTo_Format = format.format({
                        value: custTo,
                        type: format.Type.DATE,
                    });

                    var url =
                        "https://td2842407.app.netsuite.com/app/site/hosting/scriptlet.nl?script=796&deploy=1";
                    url +=
                        "&custpage_from_date=" +
                        custFrom_Format +
                        "&custpage_to_date=" +
                        custTo_Format +
						"&first=" + "0";


                    window.open(url, "_self");
                }
            }



            if (scriptContext.fieldId == 'custpage_checkbox') {
                // var objRecord = scriptContext.currentRecord

                var line_no = scriptContext.line

                var check_box_select = objRecord.getSublistValue({
                    sublistId: 'sales_order_sublist',
                    fieldId: 'custpage_checkbox',
                    line: line_no
                });

                var sales_order_select = objRecord.getSublistValue({
                    sublistId: 'sales_order_sublist',
                    fieldId: 'custpage_tranid',
                    line: line_no
                });
                so_array.push(sales_order_select)

            }


        }


        function setMemo() {

            custFrom_Format = format.format({ value: custFrom, type: format.Type.DATE })
            custTo_Format = format.format({ value: custTo, type: format.Type.DATE })
            var url = 'https://td2842407.app.netsuite.com/app/site/hosting/scriptlet.nl?script=796&deploy=1&compid=TSTDRV2842407'
            url += '&custpage_from_date=' + custFrom_Format + '&custpage_to_date=' + custTo_Format + '&custpage_arr=' + so_array;



            alert('Sending mail...')
            window.open(url, '_self');

        }

        function next() {

            // alert('next')
            // var scriptObj = runtime.getCurrentScript(); //scriptObj is a runtime.Script object
            console.log('Script ID: ' + objRecord);

            first = objRecord.getValue({
                fieldId: 'custpage_disable_field'
            });
			if(!first){
				first = 0
			}
            first = first + 10
			
           

            custFrom = objRecord.getValue({
                fieldId: 'custpage_from_date'
            });

            custTo = objRecord.getValue({
                fieldId: 'custpage_to_date'
            });

            custFrom_Format = format.format({ value: custFrom, type: format.Type.DATE })
            custTo_Format = format.format({ value: custTo, type: format.Type.DATE })
            var url = 'https://td2842407.app.netsuite.com/app/site/hosting/scriptlet.nl?script=796&deploy=1&compid=TSTDRV2842407'
            url += '&custpage_from_date=' + custFrom_Format + '&custpage_to_date=' + custTo_Format + '&first=' + first;

            window.open(url, '_self');

        }
        function previous() {
            alert('previous')
            alert(custFrom)
            alert(custTo)

        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            setMemo: setMemo,
            next: next,
            previous: previous
        };

    });