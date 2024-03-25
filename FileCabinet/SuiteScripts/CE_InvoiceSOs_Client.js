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
        
        function filterAll (event) {
            debugger;
            let url = window.location.href;
            let urlBase = findBaseUrl(url);
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
        
        //Gets base URL from custom record to simplify functions in this file
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


        //  <>Storing suitelet url on custom record, so can update this function by grabbling
        //  complete url from custom record and slicing off bit after /app. 
        //  already created this type of function in Common file.
        function findBaseUrl(url){

            let l = 0;
            let r = 7;
            let equalSign = 0
            let baseUrl = ''
            let flag = true
            while (flag) {
        
                if (url.slice(l,r) === 'deploy='){
                    baseUrl = url.slice(l,r)
                    equalSign = r
                    flag = false
                }
                else{
                    l+=1;
                    r+=1;
                }
            }
        
            flag = true
            while (flag) {
        
                if (url[equalSign] === '&'){
                    url = url.slice(0, equalSign)
                    flag = false
                }
                
                else if (equalSign > url.length){
                    url = url
                    flag = false
                }
        
                equalSign +=1
            }
            return url;
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
        findBaseUrl : findBaseUrl
        };
    
    });
