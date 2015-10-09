// CreditCard.Router.js
// -----------------------
// Router for handling credit cards (CRUD)
define('CreditCard.Router', ['CreditCard.Views','CreditCard.Model'], function (Views,Model)
{
	'use strict';
	
	return Backbone.Router.extend({

		routes: {
			'creditcards': 'creditCards'
		,	'creditcards/new': 'newCreditCard'
		,	'creditcards/:id': 'creditCardDetailed'
		}
		
	,	initialize: function (application)
		{
			this.application = application;
		}
	
		// creditcards list	
	,	creditCards: function ()
		{
			if (this.application.getUser().get('isLoggedIn') !== 'T')
			{
				return this.application.getLayout().notFound();
			}
			
			var collection = this.application.getUser().get('creditcards');

			if (collection.length)
			{
				var view = new Views.List({
					application: this.application
				,	collection: collection
				});

				collection.once('reset destroy change add', function ()
				{
					// Only render this view again if it is the 'creditcards', otherwise it will render it but it will not change the url hash
					if (Backbone.history.fragment === 'creditcards')
					{
						this.creditCards();
					}
				}, this);

				view.showContent('creditcards');
			}
			else
			{
				Backbone.history.navigate('#creditcards/new', { trigger: true });
			}
		}

		// view credit card details	
	,	creditCardDetailed: function (id)
		{
			if (this.application.getUser().get('isLoggedIn') !== 'T')
			{
				return this.application.getLayout().notFound();
			}

			var collection = this.application.getUser().get('creditcards')
			,	model = collection.get(id)
			,	view = new Views.Details({
					application: this.application
				,	collection: collection
				,	model: model
				});
			
			model.on('reset destroy change add', function ()
			{
				if (view.inModal && view.$containerModal)
				{
					view.$containerModal.modal('hide');
					view.destroy();
				}
				else
				{
					Backbone.history.navigate('#creditcards', {trigger: true});
				}
			}, view);
			
			view.showContent('creditcards');
		}

		// add new credit card 
	,	newCreditCard: function ()
		{
			if (this.application.getUser().get('isLoggedIn') !== 'T')
			{
				return this.application.getLayout().notFound();
			}

			var collection = this.application.getUser().get('creditcards')
			,	view = new Views.Details({
					application: this.application
				,	collection: collection
				,	model: new Model()
				});
			
			collection
				.on('add', function ()
				{
					if (view.inModal && view.$containerModal)
					{
						view.$containerModal.modal('hide');
						view.destroy();
					}
					else
					{
						Backbone.history.navigate('#creditcards', { trigger: true });
					}

				}, view);

			view.model.on('change', function  (model)
			{
				collection.add(model, {merge: true});
			}, this);
			
			view.showContent('creditcards');
		}
	});
});
