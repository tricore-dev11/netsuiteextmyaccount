// Merchandising.Context
// ---------------------
define('Merchandising.Context', function ()
{
	'use strict';

	var MerchandisingContext = function MerchandisingContext (view)
	{
		if (view.MerchandisingContext)
		{
			return view.MerchandisingContext;
		}
		this.view = view;
		view.MerchandisingContext = this;
	};

	_.extend(MerchandisingContext, {

		// list of registered handlers
		handlers: []

		// registerHandlers
		// pushes a new handler for a specific view to the handler list
	,	registerHandlers: function (view_constructor, methods)
		{
			if (view_constructor)
			{
				// if there was already a handler for that view
				// we remove it from the list, and extend the new
				// handler with any events that the previous one had
				var new_handler = _.extend(
					MerchandisingContext.removeHandler(view_constructor)
				,	methods
				);

				new_handler.viewConstructor = view_constructor;
				// then we add it first on the list
				MerchandisingContext.handlers.unshift(new_handler);
			}

			return MerchandisingContext;
		}

		// based on the constructor passed as a parameter
		// it removes any handler that matches the constructor
		// from the handlers list.
		// returns the removed handler
	,	removeHandler: function (view_constructor)
		{
			var removed = {};

			MerchandisingContext.handlers = _.reject(MerchandisingContext.handlers, function (handler)
			{
				if (handler.viewConstructor === view_constructor)
				{
					removed = handler;
					return true;
				}
			});

			return removed;
		}

		// retuns a handler based on the view
	,	getHandlerForView: function (view)
		{
			return _.find(MerchandisingContext.handlers, function (handler)
			{
				return view instanceof handler.viewConstructor;
			});
		}

	,	escapeValue: function (value)
		{
			return value ? value.toString().replace(/\s/g, '-') : '';
		}

		// callHandler
		// calls 'callback_key' from the handler for that view passing all of the arguments
	,	callHandler: function (callback_key, context, parameters)
		{
			var handler = MerchandisingContext.getHandlerForView(context.view);
			return handler && _.isFunction(handler[callback_key]) && handler[callback_key].apply(context, parameters);
		}

	,	appendFilterValue: function (filters, key, value)
		{
			if (_.isObject(value) && ('to' in value) && ('from' in value)) 
			{
				delete filters[key];

				filters[key + '.to'] = value.to;
				filters[key + '.from'] = value.from;
			} 
			else 
			{
				if (_.isUndefined(filters[key]))
				{
					filters[key] = '';
				}
				
				var comma = '';

				if (filters[key])
				{
					comma = ',';
				}

				filters[key] += comma + value;
			}
		}
	});

	_.extend(MerchandisingContext.prototype, {

		callHandler: function (callback_key)
		{
			return MerchandisingContext.callHandler(callback_key, this, _.toArray(arguments).slice(1));
		}

	,	getFilters: function (filters, isWithin)
		{
			var parsed_filters = this.callHandler('getFilters', filters, isWithin);
			
			if (!parsed_filters)
			{
				parsed_filters = {};

				_.each(filters, function (values, key)
				{
					values = _.without(values, '$current');
					
					if (values.length)
					{
						_.each(values, function (value)
						{
							MerchandisingContext.appendFilterValue(parsed_filters, key, value);	
						});
					}
				});
			}

			return parsed_filters;
		}	

	,	getIdItemsToExclude: function ()
		{
			return this.callHandler('getIdItemsToExclude') || [];
		}
	});

	return MerchandisingContext;
});
