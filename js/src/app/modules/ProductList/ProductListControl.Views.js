// ProductListControl.Views.js
// -----------------------
// The Control view that let the user add an item to a list from the pdp or quickview. 
// It supports 1) the single list experience and 2) the move item functionality.
define('ProductListControl.Views',['ProductList.Model','ProductListItem.Collection', 'Session'], function (ProductListModel, ProductListItemCollection, Session)
{
	'use strict';

	var Views = {};

	// The main control view
	Views.Control = Backbone.View.extend({
		
		template: 'product_list_control'
		
	,	attributes: {'class': 'dropdown product-lists'}

	,	events:
		{
				'click [data-type="show-new-list"]': 'showNewProductList'
			,	'click [data-action="show-productlist-control"]' : 'toggleProductListControl'
		}

	,	initialize: function (options)
		{
			this.product = options.product;
			this.collection = options.collection;
			this.application = options.application;
			this.moveOptions = options.moveOptions;

			if (this.moveOptions)
			{
				this.mode = 'move';
			}
			
			// need to hide the menu (data-type="productlist-control") when clicked outside, so we register here a click handler on the document.: 
			jQuery(document).click(function(event)
			{
				if (jQuery(event.target).parents().index(jQuery(event.target).closest('[data-type^="productlist-control"]')) === -1 && jQuery(event.target).attr('class') && jQuery(event.target).attr('class').indexOf('productlist-control') === -1)
				{
					if(jQuery('[data-type="productlist-control"]').is(':visible'))
					{
						var $control = jQuery('[data-type="productlist-control"]');
						
						// return the control to its initial state
						$control.find('form[data-type="add-new-list-form"]').hide();
						$control.find('[data-type="show-add-new-list-form"]').show();

						$control.slideUp();
					}
				}
			});
		}

		// Render the control view, appending the items views and add new list form
	,	render: function ()
		{
			// if the control is currently visible then we remember that !
			this.is_visible =  this.$('[data-type="productlist-control"]').is(':visible');			
			
			Backbone.View.prototype.render.apply(this);
			
			var self = this;

			self.collection.each(function (model)
			{
				var view = new Views.ControlItem({
					model: model
				,	product: self.product
				,	application : self.application
				,	parentView: self
				});

				self.$('ul').prepend(view.render().el);
			});

			var new_product_list_model = this.getNewProductListModel()
			,	new_item_view = new Views.ControlNewItem({
					model: new_product_list_model
				,	application : self.application
				,	parentView: self
				});
			
			self.$('[data-type="new-item-container"]').html(new_item_view.render().el);

			// we don't want to disable the control button for guest users because we want to send them to login page on click
			if (this.application.getUser().get('isLoggedIn') === 'T' && !self.isReadyForList())
			{
				self.$('[data-action="show-productlist-control"]').attr('disabled', 'true');
			}
			
			// also we don't want to erase any previous confirmation messages
			self.confirm_message && self.saveAndShowConfirmationMessage(self.confirm_message);
		}

		// This method is overridden in POS.
	,	getNewProductListModel: function ()
		{
			return new ProductListModel();
		}

		// Show/Hide the control
	,	toggleProductListControl: function(e)
		{
			if (this.mode === 'move')
			{
				e && e.stopPropagation();
			}
			
			// Check if the user is logged in
			if (!this.validateLogin())
			{
				return;
			}

			var $control = this.$('[data-type="productlist-control"]');

			if ($control.is(':visible'))
			{				
				// return the control to its initial state
				$control.find('form[data-type="add-new-list-form"]').hide();
				$control.find('[data-type="show-add-new-list-form"]').show();

				$control.slideUp();
			}
			else
			{
				// When in move mode, hide any other instance of the product list control in the page before sliding down.
				if (this.mode === 'move')
				{
					jQuery('[data-type="productlist-control"]').hide();
				}				

				$control.slideDown();
			}
		}

		// if the user is not logged in we redirect it to login page and then back to the PDP. 
	,	validateLogin: function ()
		{
			if (this.application.getUser().get('isLoggedIn') === 'F')
			{
				var login = Session.get('touchpoints.login');
				
				login += '&origin=' + this.application.getConfig('currentTouchpoint');

				if (this.$el.closest('.modal-product-detail').size() > 0) //we are in the quick view
				{
					var hashtag = this.$el.closest('.modal-product-detail').find('[data-name="view-full-details"]').data('hashtag');
					login += '&origin_hash=' + hashtag.replace('#/', '');
				}
				else
				{
					login += '&origin_hash=' + Backbone.history.fragment;
				}
							
				window.location.href = login;
				
				return false;
			}

			return true;
		}

		// validates the passed gift cert item and return false and render an error message if invalid. 
	,	validateGiftCertificate: function (item) 
		{
			if (item.itemOptions && item.itemOptions.GIFTCERTRECIPIENTEMAIL)
			{
				if (!Backbone.Validation.patterns.email.test(item.itemOptions.GIFTCERTRECIPIENTEMAIL.label))
				{
					this.render(); //for unchecking the just checked checkbox
					this.showError(_('Recipient email is invalid').translate());
					
					return false;
				}
			}
			return true;
		}

	,	getItemOptions: function (itemOptions)
		{
			var result = {};

			_.each(itemOptions, function (value, name)
			{
				result[name] = { value: value.internalid, displayvalue: value.label };
			});

			return result;
		}

		// Adds the product to the newly created list, renders the control and shows a confirmation msg
	,	addNewProductToList: function (newList)
		{
			this.addItemToList(this.product, newList, true);
			this.saveAndShowConfirmationMessage(
				this.$('.ul-product-lists [type="checkbox"]:checked').size() > 1 ?
					_('Good! You added this item to your product lists').translate() :
					_('Good! You added this item to your product list').translate()
			);
		}

		// Add a new product list item into a product list
	,	addItemToList: function (product, productList, dontShowMessage)
		{
			if (!this.validateGiftCertificate(this.product))
			{
				return;
			}

			var self = this;

			if (!productList.get('internalid')) //this is a predefined list
			{
				productList.save().done(function(data)
				{
					var new_model = new ProductListModel(data); 

					self.application.getProductLists().add(new_model, {merge: true});
					self.doAddItemToList(product, new_model, dontShowMessage);
				});
			}
			else
			{
				self.doAddItemToList(product, productList, dontShowMessage);
			}
		}

		// This method is overridden in POS
	,	getNewItemData: function (product, productList)
		{
			return {
					description: ''
				,	options: this.getItemOptions(product.itemOptions)
				,	quantity: product.get('quantity')
				,	productList: {
						id: productList.get('internalid')
					,	owner: productList.get('owner').id
					}
				,	item: {
						internalid: this.getProductId(product)
					}
			};
		}

		// Adds the new item to the collection
	,	doAddItemToList: function (product, productList, dontShowMessage)
		{
			var self = this
			,	product_list_item = this.getNewItemData(product, productList);

			productList.get('items').create(product_list_item, {
				success: function ()
				{
					self.collection.trigger('changed');
					self.render();

					if (!dontShowMessage)
					{
						self.saveAndShowConfirmationMessage(
							self.$('.ul-product-lists [type="checkbox"]:checked').size() > 1 ?
								_('Good! You added this item to your product lists').translate() :
								_('Good! You added this item to your product list').translate()
						);
					}
				}
			});
		}

		// Check for predefined list before moving
	,	moveProductHandler: function (destination)
		{
			var self = this;

			if (!destination.get('internalid')) //this is a predefined list
			{
				destination.save().done(function(data)
				{
					var new_product_list = new ProductListModel(data);
				
					self.application.getProductLists().add(new_product_list, {merge: true});
					self.moveProduct(new_product_list);
				});
			}
			else
			{
				self.application.getProductLists().add(destination, {merge: true});
				self.moveProduct(destination);
			}
		}

		// Moves the item to the destination list
	,	moveProduct: function (destination)
		{
			var self = this
			,	original_item = this.moveOptions.productListItem
			,	original_item_clone = original_item.clone()
			,	details_view = this.moveOptions.parentView;

			original_item_clone.set('productList', {
				id: destination.get('internalid')
			});

			self.toggleProductListControl();

			destination.get('items').create(original_item_clone,
			{
				success: function (saved_model)
				{
					var app = details_view.application
					,	from_list = self.application.getProductLists().findWhere({internalid: self.moveOptions.parentView.model.get('internalid') })
					,	to_list = self.application.getProductLists().findWhere({internalid: destination.get('internalid')});

					self.doMoveProduct(from_list, to_list, original_item, saved_model);

					details_view.model.get('items').remove(original_item);
					details_view.render();
					
					app.getLayout().updateMenuItemsUI();
					app.getLayout().currentView.showConfirmationMessage(
						_('Good! You successfully moved the item from this to $(0)').
							translate('<a href="/productlist/' + destination.get('internalid') + '">' + destination.get('name') + '</a>')
					);					
				}
			});
		}

		// Adds the item clone to the destination list and removes the original from its list
	,	doMoveProduct: function (from, to, original_model, saved_model)
		{
			// if add not defined, create the collection
			if (to.get('items') instanceof Array)
			{
				to.set('items', new ProductListItemCollection());
			}
			
			// add the item to the application collection
			to.get('items').add(saved_model);
			
			from.get('items').remove(original_model);
			this.collection.trigger('changed');
		}

		// Gets the internal product id for a store item considering it could be a matrix child.
	,	getProductId: function (product)
		{
			if (this.application.ProductListModule)
			{
				return this.application.ProductListModule.internalGetProductId(product);
			}
			else
			{
				return product.get('_id') + '';
			}
		}

		// Determines if the control is visible
	,	isAvailable: function ()
		{
			//if you want to disable the product list experience you instead can return: this.application.getUser().get('isLoggedIn') === 'T';
			return true;
		}

		// Determines if the control should be enabled or not. This default behavior is that any item can be added
		// to a list no matter if it is purchasable. Also it will be enabled for guest users in which case it will 
		// redirect the user to the login page. The only condition is that matrix item has to have the options selected. 
	,	isReadyForList: function ()
		{
			return this.mode === 'move' || this.product.isSelectionComplete();
			// if you want to add only purchasable products to a product list then you can change the above with: 
			// return this.product.isReadyForCart();
		}

		// Shows the create new product list form
	,	showNewProductList: function (e)
		{
			var link = jQuery(e.target);

			link.siblings('[data-type="add-new-list-form"]').show();
			link.hide();
			this.$('[data-type="new-product-list-name"]').focus();
		}

		// Renders a confirmation message storing message parameter and also stores the message
	,	saveAndShowConfirmationMessage: function (message)
		{
			this.confirm_message = message;
			
			this.showConfirmationMessage(this.confirm_message);
		}

		// Hides the confirmation message
	,	hideConfirmationMessage: function()
		{
			this.confirm_message = null;
			this.$('[data-confirm-message]').hide();
		}
	});
	
	// ControlItem
	// Sub View that represents an item and a checkbox in the control
	Views.ControlItem = Backbone.View.extend({

		tagName: 'li'
		
	,	template: 'product_list_control_item'

	,	events: {
			'click [data-action="product-list-item"]' : 'pListItemHandler'
		}

	,	initialize: function (options)
		{
			this.model = options.model;
			this.product = options.product;
			this.application = options.application;
			this.parentView = options.parentView;
		}

		// Determines if an item is checked if the item belongs the list
		// Whilst on move mode, returns always false
	,	checked: function ()
		{
			return this.parentView.mode !== 'move' ? this.model.checked(this.parentView.getProductId(this.product), this.parentView.getItemOptions(this.product.itemOptions)) : false;
		}

		// if move mode enabled, move the item, if not, an item is added/removed from a list
	,	pListItemHandler: function (e)
		{
			var self = this
			,	checkbox = jQuery(e.target);

			if (self.parentView.mode === 'move')
			{
				self.moveProduct();
			}
			else
			{
				self.addRemoveProduct(checkbox);
			}
		}

		// Moves an item to another list
	,	moveProduct: function ()
		{
			this.parentView.moveProductHandler(this.model);
		}

		// Adds/removes an item from a list
	,	addRemoveProduct: function ($checkbox)
		{
			if ($checkbox.is(':checked'))
			{
				// add to list
				this.parentView.addItemToList(this.product, this.model);
			}
			else
			{
				// remove from list
				this.removeItemFromList(this.product);
			}
		}

		// Remove a product list item from the product list
	,	removeItemFromList: function (product)
		{
			var self = this
			,	product_id = this.parentView.getProductId(product)
			,	product_item = self.model.get('items').find(function (item)
				{
					return parseInt(item.get('item').internalid, 10) === parseInt(product_id, 10);
				});

			if (product_item)
			{
				product_item.set('productList', {
					id: self.model.get('internalid')
				,	owner: self.model.get('owner').id
				});
				this.model.get('items').remove(product_item);

				product_item.destroy().done(function ()
				{
					self.model.collection.trigger('changed');
					self.parentView.render();
					self.parentView.hideConfirmationMessage();
				}); 
			}
			else
			{
				self.parentView.render();
			}
		}
	});

	// ControlNewItem
	// Sub View that shows the create new list form
	Views.ControlNewItem = Backbone.View.extend({

		tagName: 'div'

	,	template: 'product_list_control_new_pl'

	,	events: {
			'click [data-action="create-and-move"]': 'saveForm'
		,	'click [data-type="show-add-new-list-form"]' : 'showNewListForm'
		}

	,	initialize : function (options)
		{
			this.application = options.application;
			this.model = options.model;
			this.parentView = options.parentView;
		}

		// Handle save new product list form postback 
	,	saveForm: function ()
		{
			if (!this.parentView.validateGiftCertificate(this.parentView.product))
			{
				return;
			}
			var self = this;

			Backbone.View.prototype.saveForm.apply(this, arguments).done(function ()
			{
				var new_product_list = self.model
				,	parent_view = self.parentView;

				new_product_list.set('items', new ProductListItemCollection(new_product_list.get('items')));
				
				// add the product list item
				if (parent_view.mode === 'move')
				{
					// create new list
					parent_view.moveProductHandler(new_product_list);
					parent_view.collection.add(self.model, {merge: true});
				}
				else
				{
					parent_view.collection.add(new_product_list);
					parent_view.addNewProductToList(new_product_list);
				}
			});
		}

		// Shows the create new list form
	,	showNewListForm: function (e)
		{
			e && e.stopPropagation();
			var $el = jQuery(this.el);
			var new_list_form = $el.find('form[data-type="add-new-list-form"]');
			
			if (new_list_form)
			{
				new_list_form.show();
				this.$('[data-type="new-product-list-name"]').focus();
				$el.find(e.target).hide();
			}
		}

	});

	// ControlSingle
	// Control view for single list mode. @extends Views.Control. 
	Views.ControlSingle = Backbone.View.extend({
		
		template: 'product_list_control_single'
		
	,	attributes: {'class': 'product-lists-single'}

	,	events: {
			'click [data-type="add-product-to-single-list"]': 'addItemToSingleList'
		}

	,	addItemToList: Views.Control.prototype.addItemToList

	,	doAddItemToList: Views.Control.prototype.doAddItemToList

	,	saveAndShowConfirmationMessage: Views.Control.prototype.saveAndShowConfirmationMessage

	,	isReadyForList: Views.Control.prototype.isReadyForList

	,	validateGiftCertificate: Views.Control.prototype.validateGiftCertificate

	,	getItemOptions: Views.Control.prototype.getItemOptions
	
	,	validateLogin: Views.Control.prototype.validateLogin

	,	getProductId: Views.Control.prototype.getProductId

	,	initialize: function (options)
		{
			this.product = options.product;
			this.collection = options.collection;
			this.application = options.application;

			// single list
			this.single_list = this.collection.at(0);
		}

	,	render: function ()
		{
			Backbone.View.prototype.render.apply(this);

			// for guest user we want to enable the button and send the user to the login page
			// for non guest users we want to disable the button if the product is not yet ready for list
			if (!this.isReadyForList())
			{
				this.$('[data-type="add-product-to-single-list"]').attr('disabled', 'true');
			}
		}

		// Get list internal ids
	,	getProductsInternalid: function()
		{
			return _(this.single_list.get('items').models).map(function (item)
			{
				return item.get('item').internalid;
			});
		}

		// Before adding item to the list, checks for not created predefined list
	,	addItemToSingleList: function(e)
		{			
			if (!this.validateLogin())
			{
				return;
			}

			var self = this;

			e.preventDefault();

			// Check if predefined list was not created yet
			if (!self.single_list.get('internalid'))
			{
				self.single_list.save().done(function () {
					self.single_list.set('items', new ProductListItemCollection([])); 
					self.renderAfterAdded(self);
				});
			}
			else
			{
				self.renderAfterAdded(self);
			}
		}

		// Adds the item to the list
	,	renderAfterAdded: function (self)
		{
			if (!this.validateGiftCertificate(self.product))
			{
				return; 
			}

			self.addItemToList(self.product, self.single_list);
			self.render();

			self.saveAndShowConfirmationMessage(
				_('Good! You added this item to your product list').translate()
			);

			this.$('[data-type="add-product-to-single-list"]').attr('disabled', 'true');
		}

	});
	
	return Views;
});