/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/format'],
    /**
     * @param{currentRecord} currentRecord
     */
    function (currentRecord, format) {

        var so_array = [];
        var custName;
        var custFrom;
        var custTo;


        function pageInit(scriptContext) {


        }

        function fieldChanged(scriptContext) {
            var objRecord = scriptContext.currentRecord

            custName = objRecord.getValue({
                fieldId: 'custpage_customer_name'
            });

            custFrom = objRecord.getValue({
                fieldId: 'custpage_from_date'
            });

            custTo = objRecord.getValue({
                fieldId: 'custpage_to_date'
            });



            if (
                scriptContext.fieldId == "custpage_customer_name" ||
                scriptContext.fieldId == "custpage_from_date" ||
                scriptContext.fieldId == "custpage_to_date"
            ) {
                

                if (custName && custFrom && custTo) {
                    custFrom_Format = format.format({
                        value: custFrom,
                        type: format.Type.DATE,
                    });
                    custTo_Format = format.format({
                        value: custTo,
                        type: format.Type.DATE,
                    });

                    var url =
                        "https://tstdrv2816485.app.netsuite.com/app/site/hosting/scriptlet.nl?script=846&deploy=1";
                    url +=
                        "&custpage_customer_name=" +
                        custName +
                        "&custpage_from_date=" +
                        custFrom_Format +
                        "&custpage_to_date=" +
                        custTo_Format;
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
            var url = 'https://tstdrv2816485.app.netsuite.com/app/site/hosting/scriptlet.nl?script=846&deploy=1&compid=TSTDRV2816485'
            url += '&custpage_customer_name=' + custName + '&custpage_from_date=' + custFrom_Format + '&custpage_to_date=' + custTo_Format + '&custpage_arr=' + so_array;



            alert('Sending mail...')
            window.open(url, '_self');

        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            setMemo: setMemo
        };

    });