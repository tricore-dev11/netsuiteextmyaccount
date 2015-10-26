define('Invoice.Details.View', ['ReturnAuthorization.GetReturnableLines'], function (ReturnLinesCalculator)
{
	'use strict';

	return Backbone.View.extend({
		template: 'invoice_details'

	,	events: {
			'click [data-type="make-a-payment"]' : 'makeAPayment'
		}

	,   initialize: function(options)
		{
			this.application = options.application;
			this.navSource = options.referer === 'paidinvoices' ? '/paid-invoices' : '/invoices';
		}

	,	showContent: function()
		{
			var order_number = this.model.get('order_number')
			,	self = this;

			this.page_header =  _('Invoice <span class="strong-text">#$(0)</span>').translate(order_number);
			this.title =_('Invoice Details').translate();
			this.page_title = _('Invoice <span class="strong-text">#$(0)</span>').translate(order_number);

			this.options.application.getLayout().showContent(this, 'invoices', [{
					text: _('Invoices').translate(),
					href: self.navSource
				}, {
						text: _('Invoice #$(0)').translate(order_number)
					,	href: '/invoices/view/' + self.model.get('internalid')
				}]);
		}

		//Mark the current invoice as selected (check) and start the payment wizard
	,	makeAPayment: function ()
		{
			this.application.getLivePayment().selectInvoice(this.model.id);

			//Event used to notify the payment wizard to recalculate total amount ot pay based on the current selected invoices
			this.application.getUser().get('invoices').trigger('userInvocesChange');
		}

		//Calculate based on the fulfillments and returns made, if the invoice accepts returns
	,	isReturnable: function ()
		{
			var returnable_calculator = new ReturnLinesCalculator(this.model, {notConsiderFulfillments: true});
			return returnable_calculator.calculateLines().validLines.length;
		}
	});
});
