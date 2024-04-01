/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

// Purpose of Suitelet is to invoice any selected sales orders (which can be filtered by customers (multiselect) and individual sales order (checkbox))

define(['N/file', 'N/render', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/task', 'N/url', 'N/runtime', '/SuiteScripts/CE_Invoice_SalesOrders_Suitelet/CE_InvoiceSOs_Common'],
 /**
 * @param {file} file
 * @param {render} render
 * @param {search} search
 * @param {record} record
 * @param {serverWidget} serverWidget
 * @param {task} task
 * @param {url} url
 * @param {runtime} runtime
 * @param {Object} context
 * @param {ServerRequest} context.request - Incoming request
 * @param {ServerResponse} context.response - Suitelet response
 */

    (file, render, search, record, serverWidget, task, url, runtime, common) => {

        const onRequest = (context) => {            
            const request = context.request;
            const response = context.response;
            
            if (request.method == 'GET'){

                let mrTask = request.parameters.mr_task_id;
                let letterCheck = request.parameters.customers_filtered;
                let status = request.parameters.status;
                log.debug('status', status);
                log.debug('status Type', typeof status);


                if (letterCheck == 'AAA') {
                    common.errorNoCustomersToFilter(response);
                }
                else if (mrTask) { //check if map/reduce has started running

                    let statusOfMr = task.checkStatus({
                        taskId: mrTask
                    });

                    // write final invoice page
                    if (statusOfMr.status === 'COMPLETE') {   
                        const finalInvoiceForm = common.initializeFinalForm();
                        common.populateFinalSublist(finalInvoiceForm);                        
                        common.mrProcessingComplete(response);
                    }
                    else {  //writes invoice still processing page
                        common.mrStillProcessing(statusOfMr, response)
                    }
                }
                else{  

                    //Store landing page url of suitelet, on custom record,for use by client script
                    let acctId = runtime.accountId;
                    let currScript = runtime.getCurrentScript();
                    let scriptUrl = url.resolveScript({
                        scriptId: currScript.id,
                        deploymentId: currScript.deploymentId,
                        returnExternalURL: true
                    });
                    let acctNum = acctId.split('_')[0]
                    let acctUrl = url.resolveDomain({
                        hostType: url.HostType.APPLICATION,
                        accountId: acctNum
                    });
                    common.storeSuiteletUrl(acctId, scriptUrl, acctUrl);
                    
                    //Write landing page
                    
                    //Initializes landing page form
                    const invoiceForm = common.initializeForm(context, request);

                    //Gather data for landing page form
                    const salesOrderData = common.getData(request);

                    // Populates landing page form
                    common.populateLandingForm(invoiceForm, request, salesOrderData);

                    //writes landing page form
                    response.writePage({
                        pageObject: invoiceForm
                    });
                }
            }

            else {  //POST Request

                //Processes data from landing page form
                let selectedSalesOrders = request.parameters.custpage_sales_ordersdata;
                log.debug('POST (FORM) soData suitelet file 96 -- before processed', selectedSalesOrders)


                let soData = common.salesOrderSelectionData(selectedSalesOrders);  


                log.debug('POST (FORM) soData suitelet file 102 -- afterProcessed', soData)
                
                // If no Sales Orders have been checked before the Invoicing button
                //      is clicked, renders page with error message and button to return
                //      to landing page.
                if (soData.soOrderNums === '') {
                    common.noSalesOrdersSelected(request, response);
                }

                else {
                
                // Runs map/reduce
                // common.runMapReduce(soData.soIdAndNumber);
                }
    
            }
        }

        



        return {onRequest}
    }
);

