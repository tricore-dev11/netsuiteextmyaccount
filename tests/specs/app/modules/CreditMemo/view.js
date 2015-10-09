define(['CreditMemo', 'TestHelper', './TestCasesData'], function (CreditMemo, TestHelper)
{
	'use strict';

	var helper = new TestHelper({
			applicationName: 'CreditMemoView'
		,	useItemKeyMapping: true
		,	loadTemplates: true
		,	environment: TestCasesData.environment
	});

	return describe('Credit Memo View', function()
	{

		describe('selectors', function(){
			
			_.each(TestCasesData.view, function (data, test_description)
			{

				var view = new CreditMemo.Views.Details({
						model: new CreditMemo.Model(data)
					,	application: helper.application
					})
				,	asserts = [
						{actual: function (view){ return view.$el.hasClass(view.attributes.class);}, operation:'toBeTruthy'}
					,	{selector:'.creditmemo-noinvoices', attribute:'size', operation:'toBe', result: data.invoices.length ? 0 : 1}
					,	{selector:'header .creditmemo-number', result: '#' + data.tranid}
					,	{selector:'header .creditmemo-amount', result: data.total_formatted}
					,	{selector:'.items-count', result: data.items.length}
					,	{selector:'.status', attribute: 'html', result: data.status}
					,	{selector:'.items-summary-subtotal', result: data.subtotal_formatted}
					,	{selector:'.items-summary-tax', result: data.taxtotal_formatted}
					,	{selector:'.items-summary-shipping', result: data.shippingcost_formatted}
					,	{selector:'.items-summary-total', result: data.total_formatted}
					,	{selector:'.creditmemo-remaining', result: data.invoices.length ? data.amountremaining_formatted : ''}
					,	{selector:'.creditmemo-memo', result: data.memo ? data.memo : ''}
					];

				view.render();
				
				helper.testViewSelectors(view, asserts, data, test_description);

			});	
		});

	});

});