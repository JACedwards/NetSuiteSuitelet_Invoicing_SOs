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

        function clearFilters (event) {

            let suiteletUrl = getBaseURL();

            window.location.href = suiteletUrl

        }
        
        // Error handling when user clicks Invoice Selected Sales Orders button 
                //without having checked any sales orders to invoice
        function noSelections (event) {

            let suiteletUrl = getBaseURL();

            let currentRec = currentRecord.get();

            debugger;
            console.log(currentRec);

            let hiddenCustIds = currentRec.getValue({
                fieldId: 'custpage_hidden_cust_filter'
            });
            
            if (hiddenCustIds === undefined || hiddenCustIds === ''){
                hiddenCustIds = '';
            }

            else {
                hiddenCustIds = '&customers_filtered=' + hiddenCustIds.replaceAll('\u0005',',')
            }

            let hiddenGreaterAmount = currentRec.getValue({
                fieldId: 'custpage_hidden_more_filter'
            });
            
            if (hiddenGreaterAmount === undefined || hiddenGreaterAmount === ''){
                hiddenGreaterAmount = '';
            }

            else {
                hiddenGreaterAmount = '&greater=' + hiddenGreaterAmount
            }

            let hiddenLesserAmount = currentRec.getValue({
                fieldId: 'custpage_hidden_less_filter'
            });
            
            if (hiddenLesserAmount === undefined || hiddenLesserAmount === ''){
                hiddenLesserAmount = '';
            }

            else {
                hiddenLesserAmount = '&less=' + hiddenLesserAmount
            }

            let hiddenStatus = currentRec.getValue({
                fieldId: 'custpage_hidden_status_filter'
            });
            
            if (hiddenStatus === undefined || hiddenStatus === ''){
                hiddenStatus = '';
            }

            else {
                hiddenStatus = '&status=' + hiddenStatus
            }
                  
            window.location.href = suiteletUrl + hiddenCustIds + hiddenGreaterAmount + hiddenLesserAmount + hiddenStatus
                
        }
        

        //Get base URL from custom record to simplify other functions in this file
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
        clearFilters: clearFilters,
        noSelections : noSelections,
        getBaseURL: getBaseURL
        };
    
    });
