// ProductListDeletion.Views.js
// -----------------------
// View to handle Product Lists (lists and items) deletion
define('ProductListDeletion.View', function ()
{
	'use strict';

	return Backbone.View.extend({

		template: 'product_list_delete_confirm'

	,	title: _('Delete item').translate()

	,	attributes: {
			'class': 'view product-list-delete-confirm'
		}

	,	page_header: _('Delete item').translate()

	,	events: {
			'click [data-action="delete"]' : 'confirmDelete'
		}

	,	initialize: function (options)
		{
			this.application = options.application;
			this.parentView = options.parentView;
			this.target = options.target;
			this.title = options.title;
			this.page_header = options.title;
			this.body = options.body;
			this.confirm_delete_method = options.confirm_delete_method;
			this.confirmLabel = options.confirmLabel || _('Yes, Remove It').translate(); 
		}

		// Invokes parent view delete confirm callback function
	,	confirmDelete : function ()
		{
			this.parentView[this.confirm_delete_method](this.target);
		}

	,	render: function ()
		{
			Backbone.View.prototype.render.apply(this, arguments);
			var self = this;
			this.$containerModal.on('shown.bs.modal', function()
			{
				self.$('[data-action="delete"]').focus();
			});
		}

		// Sets focus con cancel button and returns the title text
	,	getTitle: function ()
		{			
			return _('Delete product list').translate();
		}
	});

});