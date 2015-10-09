// Case.Collection.js
// -----------------------
// Case collection
define('Case.Collection', ['Case.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend ({

		url: _.getAbsoluteUrl('services/case.ss')

	,	model: Model

    ,   initialize: function ()
        {
            // The first time the collection is filled with data
            // we store a copy of the original collection
            this.once('sync reset', function ()
            {
                if (!this.original)
                {
                    this.original = this.clone();
                }
            });
        }
        
    ,   parse: function (response)
        {
            this.totalRecordsFound = response.totalRecordsFound;
            this.recordsPerPage = response.recordsPerPage;

            return response.records;
        }
        
	,   update: function (options)
        {
            var filter = options.filter || {};

            this.fetch({
                data: {
                    filter: filter.value
                ,   sort: options.sort.value
                ,   order: options.order                
                ,   page: options.page
                }
            ,   reset: true
            ,   killerId: options.killerId
            });
        }
	});
});