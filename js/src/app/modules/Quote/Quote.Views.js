// Quote.Views.js
// -----------------------
define('Quote.Views', ['ListHeader'], function (ListHeader)
{
	'use strict';

	var Views = {};

	Views.List = Backbone.View.extend({

		template: 'quote_list'

	,	className: 'QuoteList'

	,	title: _('Quotes').translate()

	,	page_header: _('Quotes').translate()

	,	attributes: { 'class': 'QuoteList' }

	,	initialize: function (options)
		{
			this.application = options.application;

			var today = new Date()
			,	isoDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

			this.rangeFilterOptions = {
				fromMin: '1800-01-02'
			,	fromMax: isoDate
			,	toMin: '1800-01-02'
			,	toMax: isoDate
			};

			this.listenCollection();
			this.setupListHeader();
		}

	,	setupListHeader: function ()
		{
			// manges sorting and filtering of the collection
			this.listHeader = new ListHeader({
				view: this
			,	application: this.application
			,	collection: this.collection
			,	filters: this.filterOptions
			,	sorts: this.sortOptions
			});
		}

	,	listenCollection: function ()
		{
			this.setLoading(true);
			this.collection.on({
				request: jQuery.proxy(this, 'setLoading', true)
			,	reset: jQuery.proxy(this, 'setLoading', false)
			});
		}

	,	setLoading: function (bool)
		{
			this.isLoading = bool;
		}

	,	filterOptions: [
			{
				value: '0'
			,	name: _('Show all statuses').translate()
			,	selected: true
			}
		,	{
				value: '14'
			,	name: _('Closed Lost').translate()
			}
		,	{
				value: '7'
			,	name: _('Qualified').translate()
			}
		,	{
				value: '8'
			,	name: _('In Discussion').translate()
			}
		,	{
				value: '9'
			,	name: _('Identified Decision Makers').translate()
			}
		,	{
				value: '10'
			,	name: _('Proposal').translate()
			}
		,	{
				value: '11'
			,	name: _('In Negotiation').translate()
			}
		,	{
				value: '12'
			,	name: _('Purchasing').translate()
			}
		]

	,	sortOptions: [
			{
				value: 'tranid'
			,	name: _('by Number').translate()
			,	selected: true
			}
		,	{
				value: 'trandate'
			,	name: _('by Request date').translate()
			}
		,	{
				value: 'duedate'
			,	name: _('by Expiration date').translate()
			}
		,	{
				value: 'total'
			,	name: _('by Amount').translate()
			}
		]

	,	showContent: function ()
		{
			this.application.getLayout().showContent(this, 'quotes', [
				{
					text: this.title
				,	href: '/quotes'
				}
			]);
		}
	});

	Views.Details = Backbone.View.extend({
		template: 'quote_details'

	,	title: _('Quote Details').translate()

	,	attributes: { 'class': 'QuoteDetails' }

	,	initialize: function (options)
		{
			this.application = options.application;
		}

	,	showContent: function ()
		{
			var tranid = this.model.get('tranid') || ''
			,	page_header = _('Quote <span class="strong-text quote-id">#$(0)</span>').translate(tranid);

			this.page_title = this.title;
			this.page_header = page_header;

			this.application.getLayout().showContent(this, 'quotes', [
				{
					text: _('Quotes').translate()
				,	href: '/quotes'
				}
			,	{
					text: _('Quote').translate() + ' #' + tranid
				,	href: '/quotes'
				}
			]);
		}
	});

	return Views;
});