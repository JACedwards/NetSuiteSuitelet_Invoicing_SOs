
/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */
define(['N/ui/serverWidget'], function(serverWidget) {
    function render(params) {
        var portlet = params.portlet;
        portlet.title = 'Sales Order Invoicing Suitelet';
        var suiteletUrl = 'https://td2916882.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2951&deploy=1';  // Replace with your Suitelet URL
        var html = '<a href="' + suiteletUrl + '" target="_blank">Go to Suitelet</a>';
        portlet.html = html;
    }
    return {
        render: render
    };
});
