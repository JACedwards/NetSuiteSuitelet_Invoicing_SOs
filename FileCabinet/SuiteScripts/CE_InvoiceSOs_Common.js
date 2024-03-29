/**
 * @NApiVersion 2.x
 */

define(['N/currentRecord', 'N/file', 'N/format/i18n', 'N/query', 'N/record', 'N/redirect', 'N/render', 'N/runtime', 'N/search', 'N/task', 'N/ui/serverWidget', 'N/url', 'N/format/i18n'],
    /**
 * @param {currentRecord} currentRecord
 * @param {file} file
 * @param {i18n} i18n
 * 
 * @param {query} query
 * @param {record} record
 * @param {redirect} redirect
 * 
 * @param {render} render
 * @param {runtime} runtime
 * @param {search} search
 * @param {task} task
 * @param {serverWidget} serverWidget
 * @param {url} url
 */
    (currentRecord, file, i18n, query, record, redirect, render, runtime, search, task, serverWidget, url, format) => {

    //<>Need to make lots of sample sos
    //<>clean up.  May not need to return some of the functions since only being used within this file now.  
        //(Should I integrate code from separate functions in this file where I have helper function within helper funtion  If I don't, group support functions right under main functions which use them)?
        //Have to functions doing sameish thing, handling when no sales orders are checkboxed.     
            //One persisits customer filter data, I don't think the other does.  
            //Check to see if I can combine them.
            //They are used at different places in main code.



        //Stores suitelet landing page URL for use in client script
        function storeSuiteletUrl(acctId, scriptUrl, acctUrl){
    
            acctId = acctId.replace('_', '-')
            let acctUrlInd = acctUrl.indexOf('.app')
            acctUrl = acctUrl.slice(acctUrlInd);
            scriptUrl = scriptUrl.split('=');
            let scriptId = scriptUrl[1].split('&')[0]
            let deployId = scriptUrl[2].split('&')[0]
            let appUrl = scriptUrl[0] + '='

            let url = 'https://' + acctId.toLowerCase() + acctUrl + appUrl + scriptId + '&deploy=' + deployId

            const custRecUrlData = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });

            custRecUrlData.setValue({
                    fieldId : 'custrecord_suitlet_base_url',
                    value : url
                })

            custRecUrlData.save();

            return url;
        }

        //gets landing page sublist data (sales order, customer, amount, so status)
        function getData(request) {
            let filteredCustomers = request.parameters.customers_filtered;
            let status = request.parameters.status;
            let greaterThan = request.parameters.greater || '';

            let lessThan = request.parameters.less || '';

            let customFilterQuery;
            let statusQuery;

            // filter by status
            if (status == undefined || status == '0') {
                statusQuery = `('Sales Order : Partially Fulfilled', 'Sales Order : Pending Billing/Partially Fulfilled ', 'Sales Order : Pending Billing')`
            }
            else if (status == '1') {
                statusQuery = `('Sales Order : Partially Fulfilled')`
            }
            else if (status == '2') {
                statusQuery = `('Sales Order : Pending Billing/Partially Fulfilled ')`
            }
            if (status == '3') {
                statusQuery = `('Sales Order : Pending Billing')`
            }

            // filter by customer
            if (filteredCustomers !== 'AAA' && filteredCustomers !== undefined && filteredCustomers.length !== 0) {
                let custIds = filteredCustomers.split(',').map(e => e = parseInt(e));
                customFilterQuery = ` AND entity IN (${custIds})`
            }

            let baseQuery = `SELECT 
                                number, BUILTIN.DF(status), BUILTIN.DF(entity), foreigntotal, entity, id  
                            FROM 
                                transaction
                            WHERE 
                                recordtype = 'salesorder'  
                            AND 
                                BUILTIN.DF(status) 
                                    IN ${statusQuery}` 
            

            if (customFilterQuery !== undefined && filteredCustomers.length !== 0) {
                baseQuery += customFilterQuery;
                }

            //Filter by amount greater than                   
            if (greaterThan.length != 0) {
                baseQuery = baseQuery + 
                `AND
                    foreigntotal > ${parseInt(greaterThan)}`
            }
            //Filter by amount less than                   
            if (lessThan.length != 0) {
                baseQuery = baseQuery + 
                `AND
                    foreigntotal < ${parseInt(lessThan)}`
            }
            
            const results = query.runSuiteQLPaged({
                query: baseQuery
            });
            
            let objectArray = [];
            let resultIterator = results.iterator();
            resultIterator.each(function(page) {
            let pageIterator = page.value.data.iterator();
            pageIterator.each(function(row) {
                objectArray.push({
                        numberSO: row.value.values[0],
                        status: row.value.values[1],
                        customer: row.value.values[2],
                        amount: row.value.values[3],
                        customerID: row.value.values[4],
                        soInternalId: row.value.values[5]
                    });
                return true;
            });
            return true;
            });
            log.debug('objectArray at commmon 143', objectArray)

            return objectArray;
        }


        //Creates landing page form
        const initializeForm = (context, request) => {
            const form = serverWidget.createForm({
                title : 'Invoice Sales Orders'
            });

            form.clientScriptModulePath = 'SuiteScripts/CE_Invoice_SalesOrders_Suitelet/CE_InvoiceSOs_Client.js'

            form.addSubmitButton({
                id : 'invoice_all',
                label : 'Invoice Selected Sales Orders',
            });

            let multiSelect = form.addField({
                id : 'custpage_multiselect',
                type : serverWidget.FieldType.MULTISELECT,
                label : 'Customer Filter',
                source: 'customer'
            });

            if (request !== undefined) { // enables customer filter data to persist across multiple filtering attempts
                multiSelect.defaultValue = request.parameters['customers_filtered'];
            }

            let amountGreaterThan = form.addField({
                id : 'custpage_greaterthan',
                type : serverWidget.FieldType.CURRENCY,
                label : 'Amount: Greater Than'
            });

            if (request !== undefined) { // enables greater than amount filter data to persist across multiple filtering attempts
                amountGreaterThan.defaultValue = request.parameters['greater'];
            }
            

            amountGreaterThan.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTCOL
            });

            let amountLessThan = form.addField({
                id : 'custpage_lessthan',
                type : serverWidget.FieldType.CURRENCY,
                label : 'Amount: Less Than'
            });

            if (request !== undefined) { // enables less than amount filter data to persist across multiple filtering attempts
                amountLessThan.defaultValue = request.parameters['less'];
            }

            // status dropdown/select

            let selectStatusField = form.addField({
                id : 'custpage_selectstatus',
                type : serverWidget.FieldType.SELECT,
                label : 'Status'
            });

            if (request !== undefined) { // enables status filter data to persist across multiple filtering attempts
                selectStatusField.defaultValue = request.parameters['status'];
            }

            selectStatusField.updateBreakType({
                breakType : serverWidget.FieldBreakType.STARTCOL
            });

            selectStatusField.addSelectOption({
                value : '0',
                text : '(All Statuses)'
            });            
            
            selectStatusField.addSelectOption({
                // value : 'Sales Order : Partially Fulfilled', (create constant)
                value : '1',
                text : 'Partially Fulfilled'
            });
            
            selectStatusField.addSelectOption({
                // value : 'Sales Order : Pending Billing/Partially Fulfilled',
                value : '2',
                text : 'Pending Billing / Partially Fulfilled'
            });    

            selectStatusField.addSelectOption({
                // value : 'Sales Order : Pending Billing', create constant
                value : '3',
                text : 'Pending Billing'
            });


            form.addButton({ 
                id : 'filter_status',
                label : 'Filter',
                functionName : 'filterAll'
            });
            
            const soSublist = form.addSublist({
                id : 'custpage_sales_orders',
                label: 'Sales Orders',
                type: serverWidget.SublistType.LIST
            });

            soSublist.addMarkAllButtons();

            soSublist.addField({
                id: 'custpage_checkbox',
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
                });

            soSublist.addField({
                id: 'sales_order_num',
                label: 'Sales Order',
                type: serverWidget.FieldType.TEXT,
                });

            soSublist.addField({
                id: 'customer',
                label: 'Customer',
                type: serverWidget.FieldType.TEXT,
                });

            soSublist.addField({
                id: 'amount',
                label: 'Amount',
                type: serverWidget.FieldType.TEXT,
                align : serverWidget.LayoutJustification.RIGHT
                });
                
            soSublist.addField({
                id: 'status',
                label: 'Status',
                type: serverWidget.FieldType.TEXT,
                });

            let salesOrderIdField = soSublist.addField({ //passes SO internal ids to Map/Reduce
                id: 'custpage_so_internal_id',
                label: 'Sales Order Id',
                type: serverWidget.FieldType.TEXT,
                });
            salesOrderIdField.updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });

            return form;
        }  



        //populates landing page sublist with data
        const populateLandingForm = (form, request, salesOrderData) => {

            const soSublist = form.getSublist({
                id : 'custpage_sales_orders'
                });
                            
            const data = salesOrderData;
            let baseURL = getAccountURL();


            data.forEach((datum, index) => {
                log.debug('sales order number at common 308', datum.numberSO)
                soSublist.setSublistValue({
                    id: 'sales_order_num',
                    line: index,
                    value: datum.numberSO
                });
                soSublist.setSublistValue({
                    id: 'status',
                    line: index,
                    value: 
                    `
                    <a style="font-family: 'Open Sans', sans-serif; margin-top: -20px" >${datum.status.slice(14)}</a>           
                    `
                });
                soSublist.setSublistValue({
                    id: 'customer',
                    line: index,
                    value: 
                    `
                    <a style="font-family: 'Open Sans', sans-serif; margin-left: -35px; margin-top: -20px" >${datum.customer}</a>           
                    `
                });

                // (formats numbers as currency)
                let curFormatter = format.getCurrencyFormatter({currency: "USD"});
                amount = curFormatter.format({number: datum.amount}); 
                soSublist.setSublistValue({
                    id: 'amount',
                    line: index,
                    value: 
                    `
                    <a style="font-family: 'Open Sans', sans-serif; margin-top: -20px" >${amount}</a>           
                    `
                });

                soSublist.setSublistValue({
                    id: 'custpage_so_internal_id',
                    line: index,
                    value: datum.soInternalId
                });
            })

        }

        //gets data from cust rec for final page
        //(sales order numbers + ids / invoice numbers + ids)
        function getInvoiceData() {
        
            let custRecData = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });

            let sonumInvnumInvId = custRecData.getValue({
                fieldId : 'custrecord_ce_invoice_data'
            });

            return sonumInvnumInvId;
        }        


        //Creates form for final page
        const initializeFinalForm = () => {
            const form = serverWidget.createForm({
                title : 'Completed Invoices'
            });

            form.clientScriptModulePath = '/SuiteScripts/CE_Invoice_SalesOrders_Suitelet/CE_InvoiceSOs_Client.js'

            form.addButton({
                id : 'filter',
                label : 'Return to Invoicing Page',
                functionName : 'noSelections'
            });

            const invSublist = form.addSublist({
                id : 'custpage_invoices',
                label: 'Sales Orders + Invoices',
                type: serverWidget.SublistType.LIST
            });

            invSublist.addField({
                id: 'so',
                label: 'Sales Order Number',
                type: serverWidget.FieldType.TEXT,
              });
            
            invSublist.addField({
                id: 'invoice_num',
                label: 'Invoice Number',
                type: serverWidget.FieldType.TEXTAREA,
              });

            return form;
        }   


        //populates final suitelet page sublist with data
        const populateFinalSublist = (form) => {

            const invSublist = form.getSublist({
                id : 'custpage_invoices'
                });
                            
            let baseURL = getAccountURL();
            
            let data = getInvoiceData();
            data = JSON.parse(data);

            data.forEach((datum, index) => {
                
                invSublist.setSublistValue({
                    id: 'so',
                    line: index,
                    value: `
                        <a style="font-family: 'Open Sans', sans-serif; margin-left: 50px; padding-top: -10px" target="_blank" href="${baseURL}/app/accounting/transactions/salesord.nl?id=${datum.pair[3]}">${datum.pair[0]}</a>           
                    `
                });

                invSublist.setSublistValue({
                    id: 'invoice_num',
                    line: index,
                    value:  `
                        <a style="font-family: 'Open Sans', sans-serif; margin-left: 48px; padding-top: -10px"target="_blank" href="${baseURL}/app/accounting/transactions/custinvc.nl?id=${datum.pair[2]}">${datum.pair[1]}</a>
                    ` 
                });
            })
        }


        //Processes messy selection checkbox data

        function soSelectionProcessing(soCheckBoxes){
            
            soCheckBoxes = soCheckBoxes.replaceAll(',', '&')
            const regex = /[\u0002]/g
            soCheckBoxes = soCheckBoxes.replace(regex, ',');
            soCheckBoxes = soCheckBoxes.split(',')
            const regexx01 = /[\x01]/g
            let soCheckBoxesArray = [];
            let tempString = '';
            for (let j = 0; j < soCheckBoxes.length; j++) {
                tempString = soCheckBoxes[j].replace(regexx01, ',')
                tempString = tempString.split(',');
                soCheckBoxesArray.push(tempString);
                tempString = []
            }

            return soCheckBoxesArray;
        }  
        
        
        //Runs map/reduce
        function runMapReduce(soIdAndNumber) {

            let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ce_invoice_sos_mr',
                params: {
                    custscript_so_num_id_object : JSON.stringify(soIdAndNumber)}
            });
        
            let mrTaskId = mrTask.submit();
        
            redirect.toSuitelet({
                scriptId: 'customscript_ce_invoice_suitlet',
                deploymentId: 'customdeploy_ce_invoice_suitlet',
                parameters: {
                    'mr_task_id': mrTaskId
                }
            })
        }

        
        function noSalesOrdersSelected(request, response) {
            const form = serverWidget.createForm({
                title : 'Please use checkboxes to select specific Sales Orders before clicking the "Invoice" button.'
            });
            form.clientScriptModulePath = '/SuiteScripts/CE_Invoice_SalesOrders_Suitelet/CE_InvoiceSOs_Client.js'
            form.addButton({
                id : 'filter',
                label : 'Return to Invoicing Page',
                functionName : 'noSelections'
            });

            //Facilitates persistence of earlier customer filters
            //   if Invoice All button is clicked without any SO's being checkboxed
            hiddenCustData=form.addField({
                id: 'custpage_hidden_cust_filter',
                type: serverWidget.FieldType.TEXT,
                label: 'Hidden customer data',
            });
            hiddenCustData.updateDisplayType({
                displayType : serverWidget.FieldDisplayType.HIDDEN
            });
            let hiddenCustomers = request.parameters.custpage_multiselect;
            hiddenCustData.defaultValue = hiddenCustomers;
            
            response.writePage({
                pageObject: form
            });
        }

        function salesOrderSelectionData(soCheckBoxes){

            let soCheckBoxesArray = soSelectionProcessing(soCheckBoxes);
            let soOrderNums = []
            let soIdAndNumber = []

            for (let k = 0; k < soCheckBoxesArray.length; k++){
                if (soCheckBoxesArray[k][0] === "T"){
                    soOrderNums.push(soCheckBoxesArray[k][1])
                    soIdAndNumber.push([parseInt(soCheckBoxesArray[k][5]), parseInt(soCheckBoxesArray[k][1])])
                }
            }
            soOrderNums = soOrderNums.join(', ')

            return { soOrderNums, soIdAndNumber }
        }

        function errorNoSoSelects(){
            const form = serverWidget.createForm({
                title : 'Please use checkboxes to select specific Sales Orders before clicking the "Invoice" button.'
            });
            form.clientScriptModulePath = '/SuiteScripts/CE_Invoice_SalesOrders_Suitelet/CE_InvoiceSOs_Client.js'
            form.addButton({
                id : 'filter',
                label : 'Return to Invoicing Page',
                functionName : 'noSelections'
            });
            response.writePage({
                pageObject: form
            });
        }

        function mrProcessingComplete(response){
            const finalInvoiceForm = initializeFinalForm();
            populateFinalSublist(finalInvoiceForm);
            response.writePage({
                pageObject: finalInvoiceForm
            });
        }

        function mrStillProcessing(statusOfMr, response){
            const form = serverWidget.createForm({
                title : 'Invoicing Sales Orders'
                });

            let statusMessage = form.addField({
                id : 'custpage_status_message',
                type : serverWidget.FieldType.INLINEHTML,
                label : 'Status Message'
            })

            if (statusOfMr.stage === null){

            statusMessage.defaultValue = ` 
                    <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; margin-left: 20px">Please wait while invoices are processed</p>
                    <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; margin-left: 40px">Current stage: <span style="color:blue">  PENDING</span></p>
                    <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; margin-left: 40px">Current status: <span style="color:blue">  ${statusOfMr.status}</span.</p>
                    `
            }
            else{
                statusMessage.defaultValue = ` 
                    <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; margin-left: 20px">Please wait while invoices are processed</p>
                    <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; margin-left: 40px">Current stage: <span style="color:blue">  ${statusOfMr.stage}</span></p>
                    <p style="font-size: 16px; font-family: 'Open Sans', sans-serif; margin-left: 40px">Current status: <span style="color:blue">  ${statusOfMr.status}</span.</p>
                `
            }
            let autoRefresh = form.addField({
                id : 'custpage_autorefesh',
                type : serverWidget.FieldType.INLINEHTML,
                label : 'Auto Refresh'
            });
            autoRefresh.defaultValue = `
                <script>
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                </script>
            `;

            response.writePage({
                pageObject: form
            });
        }

        function errorNoCustomersToFilter(response){
            const form = serverWidget.createForm({
                title : 'Before using the "Filter by Customer" button, please choose customers in the CUSTOMER FILTER box.'
            });
            form.clientScriptModulePath = '/SuiteScripts/CE_Invoice_SalesOrders_Suitelet/CE_InvoiceSOs_Client.js' 
            form.addButton({
                id : 'filter',
                label : 'Return to Invoicing Page',
                functionName : 'noSelections'
            });
            response.writePage({
                pageObject: form
            });
        }

        function getAccountURL () {

            const fetchSuiteletUrl = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });

            let suiteletUrl = fetchSuiteletUrl.getValue({
                fieldId : 'custrecord_suitlet_base_url'
            });

            let baseURL = suiteletUrl.split('/app');

            return baseURL[0];

        } 
               
    //<>Some of these won't need to be returned since only being used within this file now.
    return {
        storeSuiteletUrl : storeSuiteletUrl,
        getData : getData,
        initializeForm : initializeForm,
        populateLandingForm : populateLandingForm,
        getInvoiceData : getInvoiceData,
        initializeFinalForm : initializeFinalForm,
        populateFinalSublist : populateFinalSublist,
        soSelectionProcessing : soSelectionProcessing,
        runMapReduce : runMapReduce,
        noSalesOrdersSelected : noSalesOrdersSelected,
        salesOrderSelectionData : salesOrderSelectionData,
        errorNoSoSelects : errorNoSoSelects,
        mrProcessingComplete : mrProcessingComplete,
        mrStillProcessing : mrStillProcessing,
        errorNoCustomersToFilter : errorNoCustomersToFilter,
        getAccountURL: getAccountURL
 
    }
        
});
