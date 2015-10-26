define('TransactionHistory.Collection', ['TransactionHistory.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({

		model: Model

	,	url: 'services/transaction-history.ss'

	,	parse: function (response)
		{
			this.totalRecordsFound = response.totalRecordsFound;
			this.recordsPerPage = response.recordsPerPage;

			return response.records;
		}

	,	update: function (options)
		{
			var range = options.range || {};

			this.fetch({
				data: {
					filter: options.filter.value
				,	sort: options.sort.value
				,	order: options.order
				,	from: range.from ? new Date(range.from.replace(/-/g,'/')).getTime() : null
				,	to: range.to ? new Date(range.to.replace(/-/g,'/')).getTime() : null
				,	page: options.page
				}
			,	reset: true
			,	killerId: options.killerId
			});
		}
	});
});