/*exported service*/
// transaction-history.ss
// ----------------
// Service to list transactions
function service (request)
{
	'use strict';
	// Application is defined in ssp library commons.js
	try
	{
		// Only can get a order item if you are logged in
		if (session.isLoggedIn())
		{
			var method = request.getMethod()
			,	permissions = Application.getPermissions().transactions
			,	TransactionHistory = Application.getModel('TransactionHistory');

			if (permissions.tranCustInvc > 0 || permissions.tranCustCred > 0 || permissions.tranCustPymt > 0 || permissions.tranCustDep > 0 || permissions.tranDepAppl > 0)
			{
				switch (method)
				{
					case 'GET':
						Application.sendContent(TransactionHistory.search({
							filter: request.getParameter('filter')
						,	order: request.getParameter('order')
						,	sort: request.getParameter('sort')
						,	from: request.getParameter('from')
						,	to: request.getParameter('to')
						,	page: request.getParameter('page') || 1
						}));
					break;

					default:
						Application.sendError(methodNotAllowedError);
				}
			}
			else
			{
				Application.sendError(forbiddenError);
			}
		}
		else
		{
			// unauthorizedError is defined in ssp library commons.js
			Application.sendError(unauthorizedError);
		}
	}
	catch (e)
	{
		Application.sendError(e);
	}
}
