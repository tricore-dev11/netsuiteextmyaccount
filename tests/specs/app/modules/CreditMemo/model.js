define(['CreditMemo', 'ItemDetails.Collection','TestHelper','./TestCasesData'], function (CreditMemo, ItemDetailsCollection, TestHelper)	
{
	'use strict';

	var helper = new TestHelper({
		applicationName: 'CreditMemoModel'
	});


	return describe('Credit Memo Model', function()
	{

		describe('initialize', function()
		{
			it ('items is a instance of ItemDetailsCollection', function() {
				var model = new CreditMemo.Model();
				expect(model.get('items') instanceof ItemDetailsCollection).toBe(true);
			});
		});


		describe('validations', function()
		{
			_.each(TestCasesData.model, function (test, test_description)
			{
				var model = new CreditMemo.Model(test.data);
				helper.testModelValidations(model, test, test_description);
			});
			
		});

	});

});