define(['PrintStatement', 'TestHelper', 'jasmineAjax'], function (PrintStatement, TestHelper)
{
	'use strict';

	var helper = new TestHelper({
			applicationName: 'PrintStatement'
		,	loadTemplates: true
		,	applicationConfiguration: {filterRangeQuantityDays: 30}
		,	startApplication: true
		,	environment: {permissions: {transactions: {tranStatement: 2}}}
	});

	return describe('PrintStatement Module', function ()
	{
		describe('Basic tests', function ()
		{
			beforeEach(function ()
			{
				jasmine.Ajax.install();
				jQuery.ajaxSetup({ cache:true}); //Prevent underscore parameter in request url
			});

			afterEach(function() {
				jasmine.Ajax.uninstall();
			});

			it('Check the form, click on both buttons and expect the requests are made.', function ()
			{
				var router = new PrintStatement.Router(helper.application);
				var view = router.printstatement();
				expect(view.template).toEqual('print_statement');
				expect(view.title).toEqual('Print a Statement');
				expect(view.page_header).toEqual('Print a Statement');
				expect(view.model.urlRoot).toEqual('services/print-statement.ss');

				expect(view.$('form [name=statementDate]').attr('type')).toEqual('date');
				expect(view.$('form [name=startDate]').attr('type')).toEqual('date');
				expect(view.$('form [name=inCustomerLocale]').attr('type')).toEqual('checkbox');
				expect(view.$('form [name=openOnly]').attr('type')).toEqual('checkbox');
				expect(view.$('form [name=consolidatedStatement]').attr('type')).toEqual('checkbox');
				expect(helper.application.getConfig('filterRangeQuantityDays')).toEqual(30);

				spyOn(view,'showError').andCallThrough();
				spyOn(view,'printStatement').andCallThrough();
				spyOn(view,'saveForm').andCallThrough();
				spyOn(window, 'open');

				var statementDate = new Date(view.$('form [name=statementDate]').val().replace(/-/g,'/')).getTime()
				,	startDate = new Date(view.$('form [name=startDate]').val().replace(/-/g,'/')).getTime();

				expect(window.open.callCount).toEqual(0, 'a window was not opened yet');
				view.$('form').submit();
				expect(view.printStatement.callCount).toEqual(1, 'printStatement called once');
				expect(view.showError.callCount).toEqual(0, 'showError not called yet');
				expect(view.saveForm.callCount).toEqual(0, 'saveForm not called yet');
				expect(window.open.callCount).toEqual(1, 'a window was opened');


				var origin = window.location.origin ?
					window.location.origin :
					(window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : ''))

				,	url_called = origin + '/test/checkout/' + 'download.ssp?statementDate='+statementDate+'&startDate='+startDate+'&email=&asset=print-statement&n=4';

				expect(window.open).toHaveBeenCalledWith(url_called);

				jasmine.Ajax.stubRequest('services/print-statement.ss').andReturn({ //Save and validate model
					responseText:JSON.stringify({url:'services/getEmail'}) //Get eMail url
				});

				jasmine.Ajax.stubRequest('services/getEmail').andReturn({
					responseText:'finish'
				});

				jasmine.Ajax.stubRequest('getEmail');

				view.$('[data-action=email]').click();

				waitsFor(function()
				{
					return jasmine.Ajax.requests.at(1) && jasmine.Ajax.requests.at(1).responseText === 'finish';
				});

				runs(function()
				{
					expect(view.printStatement.callCount).toEqual(2, 'printStatement called twice');
					expect(view.saveForm.callCount).toEqual(1,'saveForm called once');
					expect(window.open.callCount).toEqual(1,'window was not opened this time');
					expect(view.showError.callCount).toEqual(1,'showError called once');
				});
			});

			//TODO: put a lower permission.transactions.tranStatement, navigate and check for an error page.
		});
	});
});