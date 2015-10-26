define(['CreditMemo','jasmineTypeCheck'], function (CreditMemo)
{
	'use strict';
	return describe('Credit Memo Module', function () 
	{
		describe('definition', function ()
		{
			it ('should define initial module properties', function ()
			{
				expect(CreditMemo.Views).toBeDefined();
				expect(CreditMemo.Model).toBeDefined();
			});
		});
	});
});