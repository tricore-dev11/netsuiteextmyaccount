// ProductList.Views.js
// -----------------------
// Views for handling Product Lists (CRUD)
define('ProductListAddedToCart.View', function ()
{
	'use strict';

	return Backbone.View.extend({
		
		template: 'product_list_added_to_cart'
		
	,	attributes: {'class': 'product-list-added-to-cart' }
		
	,	title: _('Added to Cart').translate()

	,	initialize: function (options)
		{						
			this.options = options;
			this.application = options.application;
		}

		// Render the view and show warning message if any item is not available to be added to the cart
	,	render: function ()
		{
			Backbone.View.prototype.render.apply(this);

			var list = this.options.list
			,	not_purchasable_items_count = this.options.not_purchasable_items_count;

			if (list && not_purchasable_items_count > 0)
			{
				var warning_message = not_purchasable_items_count === 1 ? _('One item not available for purchase was not added to the cart.').translate() : _('$(0) items not available for purchase were not added to the cart.').translate(not_purchasable_items_count);

				this.showWarningMessage(warning_message);
			}			
		}

	,	showWarningMessage: function (message)
		{
			this.$('[data-warning-message]').empty().append(message);
		}

	});

});
