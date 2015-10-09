// ProductLists.Model.js 
// -----------------------
// Model for handling Product Lists (CRUD)
define('ProductList.Model',['ProductListItem.Collection'], function (ProductListItemCollection)
{
	'use strict';

	function validateLength (value, name)
	{
		var max_length = 300;

		if (value && value.length > max_length)
		{
			return _('$(0) must be at most $(1) characters').translate(name, max_length);
		}
	}

	function validateName (value, name)
	{
		if (!value)
		{
			return _('Name is required').translate();
		}

		return validateLength(value, name);
	}

	return Backbone.Model.extend(
	{
		urlRoot: _.getAbsoluteUrl('services/product-list.ss')

	,	defaults : {
			name: ''
		,	description: ''
		,	items : new ProductListItemCollection()
		,	scope : {id: '2', name: 'private'}
		,	type : {id: '1', name: 'default'}
		}

	,	validation:
		{
			name: { fn: validateName }

		,	description: { fn: validateLength }
		}

		// redefine url to avoid possible cache problems from browser
	,	url: function()
		{
			var base_url = Backbone.Model.prototype.url.apply(this, arguments);
			
			return base_url + '&t=' + new Date().getTime();
		}

	,	initialize: function (data)
		{
			var collection;

			if (data && data.items)
			{
				collection = new ProductListItemCollection(data.items);
			}
			else
			{
				collection = new ProductListItemCollection([]);
			}
			
			this.set('items', collection);			
		}

		// Returns true if an item with id: pli_to_add_id and options: pli_to_add_options is already in this product list. Options could be empty.
	,	checked: function (item_to_add_id, item_to_add_options)
		{
			return this.get('items').some(function (pli)
			{			
				if (pli.item.internalid === item_to_add_id)
				{
					var pli_options = pli.get('options');
					
					if (_.isEmpty(pli_options) && _.isEmpty(item_to_add_options))
					{
						return true;
					}
					else
					{
						return _.isEqual(pli_options, item_to_add_options);
					}					
				}

				return false;
			});
		}

		// Returns all the items which are out of stock.
	,	getOutOfStockItems: function(items_to_check)
		{
			var items = !_.isUndefined(items_to_check) ? items_to_check : this.get('items');

			return items.filter(function(product_list_item) 
			{
				return !product_list_item.get('item').ispurchasable; 
			});			
		}

		// Returns all the items which do not fulfill minimum quantity requirements.
	,	getNotPurchasableItemsDueToMinimumQuantity: function(items_to_check)
		{
			var items = !_.isUndefined(items_to_check) ? items_to_check : this.get('items');

			return items.filter(function(product_list_item) 
			{
				return !product_list_item.fulfillsMinimumQuantityRequirement();
			});
		}

		// Returns true if at least one item is checked.
	,	someCheckedItemsExist: function()
		{
			return this.get('items').some(function(product_list_item)
			{
				return product_list_item.get('checked');
			});
		}

		// Returns true if the the items in the product list can be added to the cart by the following conditions:
		// 1.- Items > 0
		// 2.- No out of stock items
		// 3.- No items which do not fulfill minimum quantity items
		// only_checked_items determines if we are considering only checked items.
	,	canBeAddedToCart: function(only_checked_items)
		{
			var items = !_.isUndefined(only_checked_items) ? this.get('items').filter(function (product_list_item) {
				return product_list_item.get('checked');
			}) : this.get('items');
			
			return items.length && this.getOutOfStockItems(items).length === 0 && this.getNotPurchasableItemsDueToMinimumQuantity(items).length === 0;
		}
	});
});