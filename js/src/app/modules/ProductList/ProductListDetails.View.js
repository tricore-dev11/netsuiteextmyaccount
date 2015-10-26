// ProductList.Views.js
// -----------------------
// Views for handling Product Lists (CRUD)
define('ProductListDetails.View'
,	['ProductListItem.Collection','ProductListDeletion.View', 'ProductList.Model', 'ItemDetails.Model', 'ProductListLists.View', 'ProductListAddedToCart.View', 'ProductListItemEdit.View', 'ProductListItem.Model', 'ProductListControl.Views', 'ListHeader']
,	function (ProductListItemCollection, ProductListDeletionView, ProductListModel, ItemDetailsModel, ProductListListsView, ProductListAddedToCartView, ProductListItemEditView, ProductListItemModel, ProductListControlViews, ListHeader)
{
	'use strict';

	return Backbone.View.extend({

		template: 'product_list_details'
	,	className: 'ProductListDetailsView'

	,	attributes: {'class': 'ProductListDetailsView'}

	,	events: {
			// items events
			'click [data-action="add-to-cart"]' : 'addItemToCartHandler'
		,	'click [data-action="add-items-to-cart"]': 'addItemsToCartBulkHandler'

		,	'click [data-action="delete-item"]' : 'askDeleteListItem'
		,   'click [data-action="delete-items"]': 'deleteItemsHandler'

		,	'click [data-action="edit-item"]' : 'askEditListItem'
		,	'click [data-action="update-item-quantity"]': 'updateListItemQuantity'
		,	'click [data-ui-action="show-edit-notes"]' : 'showEditNotes'
		,	'click [data-ui-action="cancel-edit-notes-form"]' : 'showViewNotes'
		,	'click [data-ui-action="plus-one"]' : 'addPlusOne'
		,	'click [data-ui-action="minus-one"]' : 'addMinusOne'
		,	'click [data-action="add-list-to-cart"]': 'addListToCart_'

		,	'click [data-action="edit-list"]': 'editListHandler'
		,	'click [data-action="delete-list"]': 'deleteListHandler'

		,	'change [name="item_quantity"]': 'updateItemQuantity'
		,	'keyup [name="item_quantity"]': 'updateItemQuantity'
		,	'submit [data-action="update-quantity-item-list"]': 'updateItemQuantityFormSubmit'

		,	'click [data-type="product-list-item"]': 'toggleProductListItemHandler'
		}

	,	sortOptions: [
			{
				value: 'name'
			,	name: _('Sort by name').translate()
			,	selected: true
			}
		,	{
				value: 'price'
			,	name: _('Sort by price').translate()
			}
		,	{
				value: 'created'
			,	name: _('Sort by date Added').translate()
			}
		,	{
				value: 'priority'
			,	name: _('Sort by priority').translate()
			}
		]

	,	initialize: function (options)
		{
			this.options = options;
			this.model = options.model;
			this.application = options.application;
			this.cart = this.application.getCart();

			this.displayOptions = this.application.getConfig('product_lists.itemsDisplayOptions');

			this.sflMode = options.sflMode;
			this.addToCartCallback = options.addToCartCallback;
			this.includeSortingFilteringHeader = options.includeSortingFilteringHeader;
			this.title = this.model.get('name');

			this.collection = this.model.get('items');
			this.collection.productListId = this.model.get('internalid');

			this.setupListHeader(this.collection);

			// set css class for the current display option
			// this.$el.addClass('display-' + this.getCurrentDisplayOpt());
			this.collection.on('reset', jQuery.proxy(this, 'render'));
		}

	,	setupListHeader: function(collection)
		{
			if (!this.includeSortingFilteringHeader)
			{
				return;
			}
			var self = this;

			this.listHeader = new ListHeader({
				view: this
			,	application: this.application
			,	headerMarkup : function()
				{
					return SC.macros.productListBulkActions(self.model);
				}
			,	hideFilterExpandable : function()
				{
					return this.collection.length < 2;
				}
			,	selectable: true
			,	collection: collection
			,	sorts: this.sortOptions
			,	displays: this.displayOptions
			});
		}

		// add this list to cart handler
	,	addListToCart_: function ()
		{
			this.addListToCart(this.model);
		}

	,	addListToCart: ProductListListsView.prototype.addListToCart

		// Shows the delete confirmation modal view
	,	askDeleteListItem : function (e)
		{
			e.stopPropagation();

			this.deleteConfirmationView = new ProductListDeletionView({
				application: this.application
			,	parentView: this
			,	target: e.target
			,	title: _('Delete selected items').translate()
			,	body: _('Are you sure you want to remove selected items?').translate()
			,	confirmLabel: _('Yes').translate()
			,	confirm_delete_method: 'deleteListItemHandler'
			});

			this.application.getLayout().showInModal(this.deleteConfirmationView);
		}

		// Add a particular item into the cart
	,	addItemToCartHandler : function (e)
		{
			e.stopPropagation();
			e.preventDefault();

			var self = this
			,	selected_product_list_item_id = self.$(e.target).closest('article').data('id')
			,	selected_product_list_item = self.model.get('items').findWhere({
					internalid: selected_product_list_item_id.toString()
				})
			,	selected_item = selected_product_list_item.get('item')
			,	selected_item_internalid = selected_item.internalid
			,	item_detail = self.getItemForCart(selected_item_internalid, selected_product_list_item.get('quantity'));

			item_detail.set('_optionsDetails', selected_item.itemoptions_detail);
			item_detail.setOptionsArray(selected_product_list_item.getOptionsArray(), true);

			var add_to_cart_promise = this.addItemToCart(item_detail)
			,	whole_promise = null;

			if (this.sflMode)
			{
				whole_promise = jQuery.when(add_to_cart_promise, this.deleteListItem(selected_product_list_item)).then(jQuery.proxy(this, 'executeAddToCartCallback'));
			}
			else
			{
				whole_promise = jQuery.when(add_to_cart_promise).then(jQuery.proxy(this, 'showConfirmationHelper', selected_product_list_item));
			}

			if (whole_promise)
			{
				this.disableElementsOnPromise(whole_promise, 'article[data-item-id="' + selected_item_internalid + '"] a, article[data-item-id="' + selected_item_internalid + '"] button');
			}
		}

	,	_getSelection:function()
		{
			var self = this
			,	items = []
			,	items_for_cart = []
			,	button_selector = [];

			//Filter items for bulk operation
			_.each(this.collection.models, function(item_in_list)
			{
				//irrelevant items: no-op
				if (item_in_list.get('checked') !== true)
				{
					return;
				}

				items.push(item_in_list);
				var item_internal_id = item_in_list.get('item').internalid;
				var item_for_cart = self.getItemForCart(item_internal_id, item_in_list.get('quantity'), item_in_list.get('options'));

				items_for_cart.push(item_for_cart);
				button_selector.push('article[data-item-id="' + item_internal_id + '"] a, article[data-item-id="' + item_internal_id + '"] button');
			});

			//items: backbone models representing selected items
			//items_for_cart: selected models ready to be inserted into a cart
			//button_selector: all the buttons that should be disabled when performing a batch operation
			return {
					items: items
				,	items_for_cart: items_for_cart
				,	button_selector: button_selector

			};

		}


	,	addItemsToCartBulkHandler:function(ev)
		{
			ev.preventDefault();

			var self = this;
			var selected_models = this._getSelection();

			//no items selected: no opt
			if (selected_models.items.length < 1)
			{
				return;
			}

			var button_selector = selected_models.button_selector.join(',');

			//add items to cart
			var add_to_cart_promise = this.cart.addItems(selected_models.items_for_cart);
			add_to_cart_promise.then( function()
			{
				self.unselectAll();
				self.showConfirmationHelper();
			});

			if (add_to_cart_promise)
			{
				this.disableElementsOnPromise(add_to_cart_promise, button_selector);
			}
		}

	,	deleteItemsHandler:function(ev)
		{
			ev.preventDefault();

			var self = this
			,	selected_models = this._getSelection()
			,	delete_promises = [];


			if(selected_models.items.length < 1)
			{
				return;
			}

			//there are two collections with the same information this.model and the one on application
			//should remove the item on both
			var app_item_list = _.findWhere(self.application.getProductLists().models, {id: self.model.id});

			_.each(selected_models.items, function(item)
			{
				//fix already used in "deleteListItem"
				item.url = ProductListItemModel.prototype.url;

				app_item_list && app_item_list.get('items').remove(item);
				delete_promises.push(item.destroy().promise());
			});

			jQuery.when.apply(jQuery, delete_promises).then(function()
			{
				self.render();
				self.application.getLayout().updateMenuItemsUI();
				self.showConfirmationMessage(_('The selected items were removed from your product list').translate());
			});
		}

		//this is called from the ListHeader when you check select all.
	,	selectAll:function()
		{
			_.each(this.collection.models, function(item)
			{
				item.set('checked', true);
			});
			this.render();
		}

	,	unselectAll:function()
		{
			_.each(this.collection.models, function(item)
			{
				item.set('checked', false);
			});
			this.render();
		}


	,	executeAddToCartCallback: function()
		{
			if (!this.addToCartCallback)
			{
				return;
			}

			this.addToCartCallback();
		}

	,	showConfirmationHelper: function(selected_item)
		{
			this.showConfirmationMessage(_('Good! The items were successfully added to your cart. You can continue to <a href="#" data-touchpoint="viewcart">view cart and checkout</a>').translate());

			//selected item may be undefined
			if (_.isUndefined(selected_item) === true)
			{
				return;
			}

			this.addedToCartView = new ProductListAddedToCartView({
				application: this.application
			,	parentView: this
			,	item: selected_item
			});

			this.application.getLayout().showInModal(this.addedToCartView);
		}

		// Gets the ItemDetailsModel for the cart
	,	getItemForCart: function (id, qty, opts)
		{
			return new ItemDetailsModel({
				internalid: id
			,	quantity: qty
			,	options: opts
			});
		}

		// Adds the item to the cart
	,	addItemToCart: function (item)
		{
			return this.cart.addItem(item);
		}

		// Product list item deletion handler
	,	deleteListItemHandler: function (target)
		{
			var self = this
			,	itemid = jQuery(target).closest('article').data('id')
			,	product_list_item = this.model.get('items').findWhere({
					internalid: itemid + ''
				});

			var success = function ()
			{
				if (self.application.getLayout().updateMenuItemsUI)
				{
					self.application.getLayout().updateMenuItemsUI();
				}

				self.deleteConfirmationView.$containerModal.modal('hide');
				self.render();
				self.showConfirmationMessage(_('The item was removed from your product list').translate());

			};

			var productList = self.application.getProductLists().where({internalid: self.model.id });

			if (productList.length > 0)
			{
				productList[0].get('items').remove(product_list_item);
			}

			self.deleteListItem(product_list_item, success);
		}

		// Remove an product list item from the current list
	,	deleteListItem: function (product_list_item, successFunc)
		{
			this.model.get('items').remove(product_list_item);

			product_list_item.url = ProductListItemModel.prototype.url;
			var promise = product_list_item.destroy();
			promise && successFunc && promise.done(function()
			{
				successFunc();
			});
		}

		// Edit a product list item from the current list
	,	askEditListItem : function(e)
		{
			e.stopPropagation();

			var product_list_itemid = this.$(e.target).closest('article').data('id')
			,	selected_item = this.model.get('items').findWhere({
				internalid: product_list_itemid.toString()
			});

			this.editView = new ProductListItemEditView({
				application: this.application
			,	parentView: this
			,	target: e.target
			,	model: selected_item
			,	title: _('Edit Item').translate()
			,	confirm_edit_method: 'editListItemHandler'
			});

			this.editView.showInModal();
		}

		// Updates product list item quantity from the current list
	,	updateListItemQuantity : function(e)
		{
			e.preventDefault();

			var product_list_itemid = this.$(e.target).closest('article').data('id')
			,	selected_pli = this.model.get('items').findWhere({internalid: product_list_itemid.toString()})
			,	minimum_quantity = selected_pli.get('item').minimumquantity;

			this.updateItemQuantityHelper(selected_pli, minimum_quantity);
		}

		// Product list item edition handler
	,	editListItemHandler: function (product_list_item)
		{
			var self = this
			,	edit_result = product_list_item.save();

			if (!edit_result)
			{
				return;
			}

			edit_result.done(function (new_attributes)
			{
				var new_model = new ProductListItemModel(new_attributes);

				self.model.get('items').add(new_model, {merge: true});
				self.editView.$containerModal.modal('hide');
				self.editView.destroy();
				self.render();
			});
		}

		// Retrieve the current (if any) items display option
	,	getDisplayOption: function ()
		{
			var search = (this.options.params && this.options.params.display) || 'list';

			return _(this.displayOptions).findWhere({
				id: search
			});
		}

	,	render: function()
		{
			Backbone.View.prototype.render.apply(this, arguments);

			var self = this
			,	out_of_stock_items = []
			,	items = this.model.get('items')
			,	is_single_list = this.application.ProductListModule.isSingleList();

			items.each(function(item) {
				if (!item.get('item').ispurchasable)
				{
					out_of_stock_items.push(item);
				}

				self.renderOptions(item);

				if (!is_single_list)
				{
					self.renderMove(item);
				}

			});

			var warning_message = null;

			if (out_of_stock_items.length === 1)
			{
				warning_message =  _('$(0) of $(1) items in your list is currently not available for purchase. If you decide to add the list to your cart, only available products will be added.').translate(out_of_stock_items.length, items.length);
			}
			else if (out_of_stock_items.length > 1)
			{
				warning_message =  _('$(0) of $(1) items in your list are currently not available for purchase. If you decide to add the list to your cart, only available products will be added.').translate(out_of_stock_items.length, items.length);
			}

			if (warning_message)
			{
				self.showWarningMessage(warning_message);
			}

			return this;
		}

		// Render the item options (matrix and custom)
	,	renderOptions: function (pli_model)
		{
			var item_detail_model = pli_model.get('itemDetails');
			var posible_options = item_detail_model.getPosibleOptions();

			// Will render all options with the macros they were configured
			this.$('article[data-id="' + pli_model.id + '"]').find('div[data-type="all-options"]').each(function (index, container)
			{
				var $container = jQuery(container).empty()
				,	exclude = _.map(($container.data('exclude-options') || '').split(','), function (result)
					{
						return jQuery.trim(result);
					})
				,	result_html = '';

				_.each(posible_options, function (posible_option)
				{
					if (!_.contains(exclude, posible_option.cartOptionId))
					{
						result_html += item_detail_model.renderOptionSelected(posible_option);
					}
				});

				$container.append(result_html);

				if(result_html.length === 0)
				{
					$container.remove();
				}
			});
		}

		// Renders the move control for a product list
	,	renderMove: function (product_list_model)
		{
			var self = this;

			var container = this.$('article[data-id="' + product_list_model.id + '"]').find('div[data-type="productlist-control-move"]');
			var control = new ProductListControlViews.Control({
				collection: self.getMoveLists(self.application.getProductLists(), self.model, product_list_model)
			,	product: product_list_model.get('item')
			,	application: self.application
			,	moveOptions:
				{
					parentView: self
				,	productListItem: product_list_model
				}
			});

			jQuery(container).empty().append(control.$el);
			control.render();
		}

		// Filters all lists so it does not include the current list and the lists where the item is already present
	,	getMoveLists: function (all_lists, current_list, list_item)
		{
			return all_lists.filtered( function(model)
			{
				return model.get('internalid') !== current_list.get('internalid') &&
					!model.get('items').find(function (product_item)
					{
						return product_item.get('item').internalid+'' === list_item.get('item').internalid+'';
					});
			});
		}

		// Shows the edit modal view
	,	editListHandler: function(event)
		{
			event.preventDefault();
			ProductListListsView.prototype.editList.apply(this, [this.model]);
		}

		// Shows the delete modal view
	,	deleteListHandler: function(event)
		{
			event.preventDefault();
			this.deleteConfirmationView = new ProductListDeletionView({
				application: this.application
			,	parentView: this
			,	target: null
			,	title: _('Delete list').translate()
			,	body: _('Are you sure you want to remove this list?').translate()
			,	confirm_delete_method: 'deleteList'
			});
			this.application.getLayout().showInModal(this.deleteConfirmationView);
		}

		// Delete confirm callback
	,	deleteList: function()
		{
			var self = this
			,	list = this.model;
			this.application.getProductLists().remove(list);
			list.url = ProductListModel.prototype.url;

			list.destroy().done(function ()
			{
				self.deleteConfirmationView.$containerModal.modal('hide');
				Backbone.history.navigate('/productlists', {trigger: true});
				self.application.getLayout().updateMenuItemsUI();
				self.application.getLayout().currentView.showConfirmationMessage(
					_('Your $(0) list was removed').
						translate('<span class="product-list-name">' + list.get('name') + '</span>')
				);
			});
		}

		// Get the label for showContent()
	,	getViewLabel: function ()
		{
			return 'productlist_' + (this.model.get('internalid') ? this.model.get('internalid') : 'tmpl_' + this.model.get('templateid'));
		}

		// override showContent() for showing the breadcrumb
	,	showContent: function()
		{
			var breadcrumb = [
				{
					text: _('Product Lists').translate(),
					href: '/productlists'
				}
			,	{
					text: this.model.get('name'),
					href: '/productlist/' + (this.model.get('internalid') ? this.model.get('internalid') : 'tmpl_' + this.model.get('templateid'))
				}
			];
			if (this.application.ProductListModule.isSingleList())
			{
				breadcrumb.splice(0, 1); //remove first
			}
			this.application.getLayout().showContent(this, this.getViewLabel(), breadcrumb);
		}

		// Updates quantity on form submit.
	,	updateItemQuantityFormSubmit: function (e)
		{
			e.preventDefault();
			this.updateItemQuantity(e);
		}

		// Helper function. Used in updateItemQuantity and updateListItemQuantity functions.
	,	updateItemQuantityHelper: function(selected_item, new_quantity)
		{
			selected_item.set('quantity', new_quantity);

			var self = this
			,	edit_result = selected_item.save();

			if (edit_result)
			{
				edit_result.done(function (new_attributes)
				{
					var new_model = new ProductListItemModel(new_attributes);

					self.model.get('items').add(new_model, {merge: true});
					self.render();
				});
			}

			return edit_result;
		}

		// updateItemQuantity:
		// executes on blur of the quantity input
		// Finds the item in the product list, updates its quantity and saves the list model
	,	updateItemQuantity: _.debounce(function (e)
		{
			e.preventDefault();

			var product_list_itemid = this.$(e.target).closest('article').data('id')
			,	selected_item = this.model.get('items').findWhere({internalid: product_list_itemid.toString()})
			,	options = jQuery(e.target).closest('form').serializeObject()
			,	$input = jQuery(e.target).closest('form').find('[name="item_quantity"]')
			,	new_quantity = parseInt(options.item_quantity, 10)
			,	current_quantity = parseInt(selected_item.get('quantity'), 10);

			new_quantity = (new_quantity > 0) ? new_quantity : current_quantity;

			$input.val(new_quantity);

			if (new_quantity ===  current_quantity)
			{
				return;
			}

			$input.val(new_quantity).prop('disabled', true);

			var edit_promise = this.updateItemQuantityHelper(selected_item, new_quantity);

			if (!edit_promise)
			{
				return;
			}

			edit_promise.always(function ()
			{
				$input.prop('disabled', false);
			});

		}, 600)

	,	toggleProductListItemHandler: function (e)
		{
			this.toggleProductListItem(jQuery(e.target).closest('article').data('id'));
		}

	,	toggleProductListItem: function (pli)
		{
			pli = this.collection.get(pli);

			if (pli)
			{
				this[pli.get('checked') ? 'unselectProductListItem' : 'selectProductListItem'](pli);

				this.render();
			}
		}

	,	selectProductListItem: function (pli)
		{
			if (pli)
			{
				pli.set('checked', true);
			}
		}

	,	unselectProductListItem: function (pli)
		{
			if (pli)
			{
				pli.set('checked', false);
			}
		}
	});
});
