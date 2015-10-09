/*exported service*/
// product-list-item.ss
// ----------------
// Service to manage product list items requests
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
		,	id = request.getParameter('internalid') ? request.getParameter('internalid') : data.internalid
		,	product_list_id = request.getParameter('productlistid') ? request.getParameter('productlistid') : data.productlistid
		,	ProductListItem = Application.getModel('ProductListItem')
		,	user = nlapiGetUser();

		// This is to ensure customers can't query other customer's product lists.
		if (role !== 'shopper' && role !== 'customer_center')
		{
			user = parseInt(request.getParameter('user') || (data.productList && data.productList.owner) || user, 10);
		}
		
		switch (method)
		{
			case 'GET':
				Application.sendContent(id ? ProductListItem.get(user, id) : ProductListItem.search(user, product_list_id, true, {
						sort: request.getParameter('sort') ? request.getParameter('sort') : data.sort // Column name
					,	order: request.getParameter('order') ? request.getParameter('order') : data.order // Sort direction
					,	page: request.getParameter('page') || -1
				}));
			break;

			case 'POST':					
				Application.sendContent(ProductListItem.create(user, data), {'status': 201});
			break;

			case 'PUT':
				ProductListItem.update(user, id, data);
				Application.sendContent(ProductListItem.get(user, id));
			break;

			case 'DELETE':
				ProductListItem.delete(user, id);
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