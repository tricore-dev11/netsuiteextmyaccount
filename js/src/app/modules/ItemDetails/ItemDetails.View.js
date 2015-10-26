// ItemDetails.View.js
// -------------------
// Handles the pdp and quick view
define('ItemDetails.View', ['Facets.Translator', 'ItemDetails.Collection'], function (FacetsTranslator)
{
	'use strict';

	var colapsibles_states = {};

	return Backbone.View.extend({

		title: ''
	,	page_header: ''
	,	template: 'product_details'
	,	attributes: {
			'id': 'product-detail'
		,	'class': 'view product-detail'
		}

	,	events: {
			'blur [data-toggle="text-option"]': 'setOption'
		,	'click [data-toggle="set-option"]': 'setOption'
		,	'change [data-toggle="select-option"]': 'setOption'

		,	'keydown [data-toggle="text-option"]': 'tabNavigationFix'
		,	'focus [data-toggle="text-option"]': 'tabNavigationFix'

		,	'change [name="quantity"]': 'updateQuantity'
		,	'keypress [name="quantity"]': 'submitOnEnter'

		,	'click [data-type="add-to-cart"]': 'addToCart'

		,	'shown .collapse': 'storeColapsiblesState'
		,	'hidden .collapse': 'storeColapsiblesState'

		,	'mouseup': 'contentMouseUp'
		,	'click': 'contentClick'
		}

	,	initialize: function (options)
		{
			this.application = options.application;
			this.counted_clicks = {};

			if (!this.model)
			{
				throw new Error('A model is needed');
			}
		}

		// view.getBreadcrumb:
		// It will generate an array suitable to pass it to the breadcrumb macro
		// It looks in the productDetailsBreadcrumbFacets config object
		// This will be enhaced to use the categories once thats ready
	,	getBreadcrumb: function ()
		{
			var self = this
			,	breadcrumb = []
			,	translator = new FacetsTranslator(null, null, this.application.translatorConfig);

			_.each(this.application.getConfig('productDetailsBreadcrumbFacets'), function (product_details_breadcrumb_facet)
			{
				var value = self.model.get(product_details_breadcrumb_facet.facetId);

				if (value)
				{
					translator = translator.cloneForFacetId(product_details_breadcrumb_facet.facetId, value);
					breadcrumb.push({
						href: translator.getUrl()
					,	text: product_details_breadcrumb_facet.translator ? _(product_details_breadcrumb_facet.translator).translate(value) : value
					});
				}
			});

			return breadcrumb;
		}

		// view.storeColapsiblesState:
		// Since this view is re-rendered every time you make a selection
		// we need to keep the state of the collapsable for the next render
	,	storeColapsiblesState: function ()
		{
			this.storeColapsiblesStateCalled = true;

			this.$('.collapse').each(function (index, element)
			{
				colapsibles_states[SC.Utils.getFullPathForElement(element)] = jQuery(element).hasClass('in');
			});
		}

		// view.resetColapsiblesState:
		// as we keep track of the state, we need to reset the 1st time we show a new item
	,	resetColapsiblesState: function ()
		{
			var self = this;
			_.each(colapsibles_states, function (is_in, element_selector)
			{
				self.$(element_selector)[is_in ? 'addClass' : 'removeClass']('in').css('height', is_in ? 'auto' : '0');
			});
		}

		// view.updateQuantity:
		// Updates the quantity of the model
	,	updateQuantity: function (e)
		{
			var new_quantity = parseInt(jQuery(e.target).val(),10)
			,	current_quantity = this.model.get('quantity')
			,	isOptimistic = this.application.getConfig('addToCartBehavior') === 'showCartConfirmationModal';


			new_quantity = (new_quantity > 0) ? new_quantity : current_quantity;

			jQuery(e.target).val(new_quantity);

			if (new_quantity !== current_quantity)
			{
				this.model.setOption('quantity', new_quantity);

				if (!this.$containerModal || !isOptimistic)
				{
					this.refreshInterface(e);
				}
			}

			if (this.$containerModal)
			{
				// need to trigger an afterAppendView event here because, like in the PDP, we are really appending a new view for the new selected matrix child
				this.application.getLayout().trigger('afterAppendView', this);
			}
		}

		// submit the form when user presses enter in the quantity input text
	,	submitOnEnter: function (e)
		{
			if (e.keyCode === 13)
			{
				e.preventDefault();
				e.stopPropagation();
				this.addToCart(e);
			}
		}

		// view.contentClick:
		// Keeps track of the clicks you have made onto the view, so the contentMouseUp
		// knows if it needs to trigger the click event once again
	,	contentClick: function (e)
		{
			this.counted_clicks[e.pageX + '|' + e.pageY] = true;

			if (this.$containerModal)
			{
				e.stopPropagation();
			}
		}

		// view.contentMouseUp:
		// this is used just to register a delayed function to check if the click went through
		// if it didn't we fire the click once again on the top most element
	,	contentMouseUp: function (e)
		{
			if (e.which !== 2 && e.which !== 3)
			{
				var self = this;
				_.delay(function ()
				{
					if (!self.counted_clicks[e.pageX + '|' + e.pageY])
					{
						jQuery(document.elementFromPoint(e.clientX, e.clientY)).click();
					}

					delete self.counted_clicks[e.pageX + '|' + e.pageY];

				}, 100);
			}
		}

		// view.addToCart:
		// Updates the Cart to include the current model
		// also takes care of updateing the cart if the current model is a cart item
	,	addToCart: function (e)
		{
			e.preventDefault();

			// Updates the quantity of the model
			var quantity = this.$('[name="quantity"]').val();
			this.model.setOption('quantity', quantity);

			if (this.model.isValid(true) && this.model.isReadyForCart())
			{
				var self = this
				,	cart = this.application.getCart()
				,	layout = this.application.getLayout()
				,	cart_promise
				,	error_message = _('Sorry, there is a problem with this Item and can not be purchased at this time. Please check back later.').translate()
				,	isOptimistic = this.application.getConfig('addToCartBehavior') === 'showCartConfirmationModal';

				if (this.model.itemOptions && this.model.itemOptions.GIFTCERTRECIPIENTEMAIL)
				{
					if (!Backbone.Validation.patterns.email.test(this.model.itemOptions.GIFTCERTRECIPIENTEMAIL.label))
					{
						self.showError(_('Recipient email is invalid').translate());
						return;
					}
				}

				if (isOptimistic)
				{

					cart.optimistic = {
						item: this.model
					,	quantity: quantity
					};
				}

				if (this.model.cartItemId)
				{
					cart_promise = cart.updateItem(this.model.cartItemId, this.model).done(function ()
					{
						if (cart.getLatestAddition())
						{
							if (self.$containerModal)
							{
								self.$containerModal.modal('hide');
							}

							if (layout.currentView instanceof require('Cart').Views.Detailed)
							{
								layout.currentView.showContent();
							}
						}
						else
						{
							self.showError(error_message);
						}
					});
				}
				else
				{
					cart_promise = cart.addItem(this.model).done(function ()
					{
						if (cart.getLatestAddition())
						{
							if (!isOptimistic)
							{
								layout.showCartConfirmation();
							}
						}
						else
						{
							self.showError(error_message);
						}
					});
					
					if (isOptimistic)
					{
						cart.optimistic.promise = cart_promise;
						layout.showCartConfirmation();
					}
				}

				// Checks for rollback items.
				cart_promise.fail(function (jqXhr)
				{
					var error_details = null;
					try 
					{
						var response = JSON.parse(jqXhr.responseText);
						error_details = response.errorDetails;
					} 
					finally 
					{
						if (error_details && error_details.status === 'LINE_ROLLBACK')
						{
							var new_line_id = error_details.newLineId;
							self.model.cartItemId = new_line_id;
						}

						self.showError(_('We couldn\'t process your item').translate());

						if (isOptimistic)
						{
							self.showErrorInModal(_('We couldn\'t process your item').translate());
						}
					}
				});

				// disalbes the btn while it's being saved then enables it back again
				if (e && e.target)
				{
					var $target = jQuery(e.target).attr('disabled', true);

					cart_promise.always(function ()
					{
						$target.attr('disabled', false);
					});
				}
			}
		}

		// view.refreshInterface
		// Computes and store the current state of the item and refresh the whole view, re-rendering the view at the end
		// This also updates the url, but it does not generates a hisrory point
	,	refreshInterface: function ()
		{
			var focused_element = this.$(':focus').get(0);

			this.focusedElement = focused_element ? SC.Utils.getFullPathForElement(focused_element) : null;

			if (!this.inModal)
			{
				Backbone.history.navigate(this.options.baseUrl + this.model.getQueryString(), {replace: true});
			}

			// When there are dropdown options that overlapse with the "Add to cart" button
			// when those options are clicked, the "Add to cart" button is also clicked.
			setTimeout(jQuery.proxy(this, 'showContent', {dontScroll: true}), 1);
		}

		// view.computeDetailsArea
		// this process what you have configured in itemDetails
		// executes the macro or reads the properties of the item
	,	computeDetailsArea: function ()
		{
			var self = this
			,	details = [];

			_.each(this.application.getConfig('itemDetails', []), function (item_details)
			{
				var content = '';

				if (item_details.macro)
				{
					content = SC.macros[item_details.macro](self);
				}
				else if (item_details.contentFromKey)
				{
					content = self.model.get(item_details.contentFromKey);
				}

				if (jQuery.trim(content))
				{
					details.push({
						name: item_details.name
					,	opened: item_details.opened
					,	content: content
					,	itemprop: item_details.itemprop
					});
				}
			});

			this.details = details;
		}

		// view.showInModal:
		// Takes care of showing the pdp in a modal, and changes the template, doesn't trigger the
		// after events because those are triggered by showContent
	,	showInModal: function (options)
		{
			this.template = 'quick_view';

			return this.application.getLayout().showInModal(this, options);
		}

		// Prepears the model and other internal properties before view.showContent
	,	prepView: function ()
		{
			this.title = this.model.get('_pageTitle');
			this.page_header = this.model.get('_pageHeader');

			this.computeDetailsArea();
		}

	,	getMetaKeywords: function ()
		{
			// searchkeywords is for alternative search keywords that customers might use to find this item using your Web store’s internal search
			// they are not for the meta keywords
			// return this.model.get('_keywords');
			return this.getMetaTags().filter('[name="keywords"]').attr('content') || '';
		}

	,	getMetaTags: function ()
		{
			return jQuery('<head/>').html(
				jQuery.trim(
					this.model.get('_metaTags')
				)
			).children('meta');
		}

	,	getMetaDescription: function ()
		{
			return this.getMetaTags().filter('[name="description"]').attr('content') || '';
		}
		// view.renderOptions:
		// looks for options placeholders and inject the rendered options in them
	,	renderOptions: function ()
		{
			var model = this.model
			,	posible_options = model.getPosibleOptions();

			// this allow you to render 1 particular option in a diferent placeholder than the data-type=all-options
			this.$('div[data-type="option"]').each(function (index, container)
			{
				var $container = jQuery(container).empty()
				,	option_id = $container.data('cart-option-id')
				,	macro = $container.data('macro') || '';

				$container.append(model.renderOptionSelector(option_id, macro));
			});

			// Will render all options with the macros they were configured
			this.$('div[data-type="all-options"]').each(function (index, container)
			{
				var $container = jQuery(container).empty()
				,	exclude = ($container.data('exclude-options') || '').split(',')
				,	result_html = '';

				exclude = _.map(exclude, function (result)
				{
					return jQuery.trim(result);
				});

				_.each(posible_options, function (posible_option, index)
				{
					if (!_.contains(exclude, posible_option.cartOptionId))
					{
						result_html += model.renderOptionSelector(posible_option, null, index);
					}
				});

				$container.append(result_html);
			});
		}

		// view.tabNavigationFix:
		// When you blur on an input field the whole page gets rendered,
		// so the function of hitting tab to navigate to the next input stops working
		// This solves that problem by storing a a ref to the current input
	,	tabNavigationFix: function (e)
		{
			var self = this;
			this.hideError();

			// We need this timeout because sometimes a view is rendered several times and we don't want to loose the tabNavigation
			if (!this.tabNavigationTimeout)
			{
				// If the user is hitting tab we set tabNavigation to true, for any other event we turn ir off
				this.tabNavigation = e.type === 'keydown' && e.which === 9;
				this.tabNavigationUpsidedown = e.shiftKey;
				this.tabNavigationCurrent = SC.Utils.getFullPathForElement(e.target);
				if (this.tabNavigation)
				{
					this.tabNavigationTimeout = setTimeout(function ()
					{
						self.tabNavigationTimeout = null;
						this.tabNavigation = false;
					},5);
				}
			}
		}

	,	showContent: function (options)
		{
			var self = this;

			// Once the showContent has been called, this make sure that the state is preserved
			// REVIEW: the following code might change, showContent should recieve an options parameter
			this.application.getLayout().showContent(this, options && options.dontScroll).done(function (view)
			{
				self.afterAppend();

				// related items
				var related_items_placeholder = view.$('[data-type="related-items-placeholder"]');
				// check if there is a related items placeholders
				if(related_items_placeholder.size() > 0)
				{
					this.application.showRelatedItems && this.application.showRelatedItems(view.model.get('internalid'), related_items_placeholder);
				}

				// correlated items
				var correlated_items_placeholder = view.$('[data-type="correlated-items-placeholder"]');
				// check if there is a related items placeholders
				if(correlated_items_placeholder.size() > 0)
				{
					this.application.showCorrelatedItems && this.application.showCorrelatedItems(view.model.get('internalid'), correlated_items_placeholder);
				}

				// product list place holder.
				var product_lists_placeholder = view.$('[data-type="product-lists-control"]');

				if (product_lists_placeholder.size() > 0)
				{
					this.application.ProductListModule.renderProductLists(view);
				}
                
                // product reviews placeholder
                var product_reviews_placeholder = view.$('[data-type="review-list-placeholder"]');
                var reviews_enabled = SC.ENVIRONMENT.REVIEWS_CONFIG && SC.ENVIRONMENT.REVIEWS_CONFIG.enabled;
                
                if (reviews_enabled && product_reviews_placeholder.size() > 0)
                {
                    this.application.showProductReviews(view.model, options, product_reviews_placeholder);
                }
                
			});
		}

	,	afterAppend: function ()
		{
			this.renderOptions();
			this.focusedElement && this.$(this.focusedElement).focus();

			if (this.tabNavigation)
			{
				var current_index = this.$(':input').index(this.$(this.tabNavigationCurrent).get(0))
				,	next_index = this.tabNavigationUpsidedown ? current_index - 1 : current_index + 1;

				this.$(':input:eq('+ next_index +')').focus();
			}

			this.storeColapsiblesStateCalled ? this.resetColapsiblesState() : this.storeColapsiblesState();
			this.application.getUser().addHistoryItem && this.application.getUser().addHistoryItem(this.model);

			if (this.inModal)
			{
				var $link_to_fix = this.$el.find('[data-name="view-full-details"]');
				$link_to_fix.mousedown();
				$link_to_fix.attr('href', $link_to_fix.attr('href') + this.model.getQueryString());
			}
		}

		// view.setOption:
		// When a selection is change, this computes the state of the item to then refresh the interface.
	,	setOption: function (e)
		{
			var self = this
			,	$target = jQuery(e.target)
			,	value = $target.val() || $target.data('value') || null
			,	cart_option_id = $target.closest('[data-type="option"]').data('cart-option-id');

			// prevent from going away
			e.preventDefault();

			// if option is selected, remove the value
			if ($target.data('active'))
			{
				value = null;
			}

			// it will fail if the option is invalid
			try
			{
				this.model.setOption(cart_option_id, value);
			}
			catch (error)
			{
				// Clears all matrix options
				_.each(this.model.getPosibleOptions(), function (option)
				{
					option.isMatrixDimension && self.model.setOption(option.cartOptionId, null);
				});

				// Sets the value once again
				this.model.setOption(cart_option_id, value);
			}

			this.refreshInterface(e);

			// need to trigger an afterAppendView event here because, like in the PDP, we are really appending a new view for the new selected matrix child
			if (this.$containerModal)
			{
				this.application.getLayout().trigger('afterAppendView', this);
			}
		}
	});
});
