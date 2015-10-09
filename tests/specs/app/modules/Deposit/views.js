// Testing Deposit Views
define(['Deposit', 'TestHelper', './TestCasesData'], function (Deposit, TestHelper)
{
	'use strict';

	var helper = new TestHelper({
			applicationName: 'Deposit.View'
		,	loadTemplates: true
		,	environment: {siteSettings: {siteid: 1}}
	});

	describe('Deposit.Views', function ()
	{
		
		describe('selectors', function(){
			
			_.each(TestCasesData.view, function (data, test_description)
			{

				var view = new Deposit.Views.Details({
						model: new Deposit.Model(data)
					,	application: helper.application
					})
				,	asserts = [
						{actual: function (view){ return view.$el.hasClass(view.attributes.class);}, operation:'toBeTruthy'}
					,	{selector: 'header .deposit-payment', result: data.payment_formatted}
					,	{selector: 'header .deposit-number', result: '#' + data.tranid}
					,	{selector: '.deposit-memo', result: data.memo}
					,	{selector: '.status', attribute: 'html', result: data.status}

				];
				

				if (data.invoices && data.invoices.length)
				{
					var aditional_asserts = [
							{selector: '.deposit-applied', result: data.paid_formatted}
						,	{selector: '.deposit-invoice', attribute:'size', result: data.invoices.length}
						,	{selector: '[data-invoice-id]', attribute:'size', result: data.invoices.length}
						,	{selector: '.deposit-remaining', result: data.remaining_formatted}
					];

					asserts = _.union(aditional_asserts, asserts);

					_.each(data.invoices, function (invoice)
					{
						var data_id = '[data-invoice-id=' + invoice.invoice_id + '] '
						,	aditional_asserts = [
								{selector: data_id + '.invoice-number', result: invoice.refnum}
							,	{selector: data_id + '.invoice-date', result: invoice.invoicedate}
							,	{selector: data_id + '.deposit-application-date', result: invoice.depositdate}
							,	{selector: data_id + '.invoice-amount', result: invoice.amount_formatted}
						];
						asserts = _.union(aditional_asserts, asserts);
					});
				}

				view.render();
				
				helper.testViewSelectors(view, asserts, data, test_description);

			});	
		});
	});
});
