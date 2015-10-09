// ProductList.Collection.js
// -----------------------
// Product List collection
define('ProductList.Collection', ['ProductList.Model'], function (Model)
{
	'use strict';

	return Backbone.Collection.extend({

		url: _.getAbsoluteUrl('services/product-list.ss')

	,	model: Model

		// Filter based on the iterator and return a collection of the same type
	,	filtered: function(iterator) {
			return new this.constructor(this.filter(iterator));
		}
	});
});