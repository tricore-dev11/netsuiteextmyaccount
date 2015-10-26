define(['Deposit', 'OrderPaymentmethod.Collection', 'Invoice.Collection'], function (Deposit, OrderPaymentmethodCollection, InvoiceCollection)
{
	'use strict';

	return describe('Deposit Model', function ()
	{
		describe('Initialization', function ()
		{
			it ('should attach on property lists changes', function ()
			{
				var model = new Deposit.Model();

				expect(model.get('paymentmethods')).toBeA(OrderPaymentmethodCollection);
				expect(model.get('invoices')).toBeA(InvoiceCollection);
			});
		});
	});
});