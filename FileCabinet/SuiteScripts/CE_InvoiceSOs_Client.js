/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record'],

    /**
    * @param {currentRecord} currentRecord
    * @param {record} record
    * @param {Object} scriptContext
    * @param {Record} scriptContext.currentRecord - Current form record
    * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
    */

    function(currentRecord, record) {
        
        // Filter Sales Orders by any combination of customer, amount range, status
        function filterAll (event) {

            let urlBase = getBaseURL();
            let currentRec = currentRecord.get();
            
            let customers = currentRec.getValue({
                fieldId: 'custpage_multiselect'
            });
            customers = customers.join(',');
            let customerURL = '&customers_filtered=' + customers;

            let status = currentRec.getValue({
                fieldId: 'custpage_selectstatus'
            });
            let statusURL = '&status=' + status;

            let amountGreaterThan = currentRec.getValue({
                fieldId: 'custpage_greaterthan'
            });
            let greaterURL = '&greater=' + amountGreaterThan;

            let amountLessThan = currentRec.getValue({
                fieldId: 'custpage_lessthan'
            });
            let lessURL = '&less=' + amountLessThan;
  
            window.onbeforeunload = null;
            window.location.href = urlBase + customerURL + statusURL + greaterURL + lessURL;
        }

        /** Error handling when user clicks Invoice All button without having checked any sales orders to invoice*/
        
        //Get base URL from custom record to simplify functions in this file
        function noSelections (event) {

            const fetchSuiteletUrl = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });

            let suiteletUrl = fetchSuiteletUrl.getValue({
                fieldId : 'custrecord_suitlet_base_url'
            });

            let currentRec = currentRecord.get();
            let hiddenCustIds = currentRec.getValue({
                fieldId: 'custpage_hidden_cust_filter'
            });
            
            if (hiddenCustIds === undefined){
                window.location.href = suiteletUrl;
            }
                
            else {
                if (hiddenCustIds === ''){
                    window.location.href = suiteletUrl;
                }
                //Allows any filtered customer id's to persist, when button clicked to return to start page, 
                //    after Invoice All button clicked with no SO's checked
                else {
                    hiddenCustIds = hiddenCustIds.replaceAll('\u0005',',');           
                    window.location.href = suiteletUrl + '&customers_filtered=' + hiddenCustIds
                }

            }
        }

        function getBaseURL() {
            const fetchSuiteletUrl = record.load({
                type : 'customrecord_ce_inv_mr_results',
                id: 1
            });

            let suiteletUrl = fetchSuiteletUrl.getValue({
                fieldId : 'custrecord_suitlet_base_url'
            });

            return suiteletUrl;
        }

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function pageInit(scriptContext) {
        }

    return {
        pageInit: pageInit,
        filterAll: filterAll,
        noSelections : noSelections,
        getBaseURL: getBaseURL
        };
    
    });
