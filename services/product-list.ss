/*exported service*/
// product-list.ss
// ----------------
// Service to manage product list requests
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		var context = nlapiGetContext()
		,	role = context.getRoleId()
		,	method = request.getMethod()
		,	data = JSON.parse(request.getBody() || '{}')
		,	id = request.getParameter('internalid') || data.internalid
		,	ProductList = Application.getModel('ProductList')
		,	user = nlapiGetUser();

		// This is to ensure customers can't query other customer's product lists.
		if (role !== 'shopper' && role !== 'customer_center')
		{
			user = request.getParameter('user') || (data.owner && data.owner.id) || user;
		}

		switch (method)
		{
			case 'GET':	
				if (id)
				{
					if (id === 'later')
					{						
						Application.sendContent(ProductList.getSavedForLaterProductList(user));
					}
					else
					{
						Application.sendContent(ProductList.get(user, id));
					}					
				}
				else
				{
					Application.sendContent(ProductList.search(user, 'name'));
				}					
			break;

			case 'POST':
				var internalid = ProductList.create(user, data);

				Application.sendContent(ProductList.get(user, internalid), {'status': 201});
			break;

			case 'PUT':
				ProductList.update(user, id, data);
				Application.sendContent(ProductList.get(user, id));
			break;

			case 'DELETE':
				ProductList.delete(user, id);
				Application.sendContent({'status': 'ok'});
			break;
				
			default: 
				// methodNotAllowedError is defined in ssp library commons.js
				Application.sendError(methodNotAllowedError);
		}
	}
	catch (e)
	{
		Application.sendError(e);
	}
}