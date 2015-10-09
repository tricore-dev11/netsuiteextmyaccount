define('ReturnAuthorization.Collection', ['ReturnAuthorization.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({

		model: Model

	,	url: 'services/return-authorization.ss'

	,	parse: function (response)
		{
			this.totalRecordsFound = response.totalRecordsFound;
			this.recordsPerPage = response.recordsPerPage;

			return response.records;
		}

	,	update: function (options)
		{
			var range = options.range || {}
			,	from = range.from && _.stringToDate(range.from)
			,	to = range.to && _.stringToDate(range.to);

			this.fetch({
				data: {
					sort: options.sort.value
				,	order: options.order
				,	from: from ? from.getTime() : null
				,	to: to ? to.getTime()  : null
				,	page: options.page
				}
			,	reset: true
			,	killerId: options.killerId
			});
		}
	});
});