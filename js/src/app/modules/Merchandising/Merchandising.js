// Merchandising.js
// ----------------
// Module to handle MerchandisingZones
// (ex: Featured Items section)
define('Merchandising'
,	['Merchandising.ItemCollection', 'Merchandising.Rule', 'Merchandising.Zone', 'Merchandising.Context', 'Merchandising.jQueryPlugin']
,	function (ItemCollection, Rule, Zone, Context)
{
	'use strict';

	return {
		ItemCollection: ItemCollection
	,	Context: Context
	,	Rule: Rule
	,	Zone: Zone
	,	mountToApp: function (application)
		{
			// we add the default options to be added when fetching the items
			// this includes language and shoper's currency
			ItemCollection.prototype.searchApiMasterOptions = application.getConfig('searchApiMasterOptions.merchandisingZone');

			// afterAppendView is triggered whenever a view or modal is appended
			application.getLayout()
				.on('afterAppendView', function ()
				{
					// we dont want to discover unwanted merch zones, specifically
					// those in a the main screen (layout) behind the current modal.
					// give preference to modalCurrentView if available
					// otherwise inspect layout since merch zones can live outside of the currentview.
					var currentView = this.modalCurrentView || this; // "this" is current layout!

					currentView.$('[data-type="merchandising-zone"]').merchandisingZone({
						application: application
					});
				})
				// content service triggers this event when rendering a new enhanced page
				.on('renderEnhancedPageContent', function (view, content_zone)
				{
					// if the type of the content zone is merchandising
					if (content_zone.contenttype === 'merchandising')
					{
						// target = selector
						// $view_target = jQuery.find(selector, view), view is the context
						var target = content_zone.target
						,	$view_target = view.$(target)
						,	merchandising_zone_options = {
								application: application
							,	id: content_zone.content
							};

						// if the target is in the current view
						// we add the merchandising zone there
						if ($view_target.length)
						{
							$view_target.merchandisingZone(merchandising_zone_options);
						}
						else
						{
							// else, we search for the target in the layout
							this.$(target)
								.filter(':empty')
								.merchandisingZone(merchandising_zone_options);
						}
					}
				});

			application.getMerchandisingRules = function getMerchandisingRules ()
			{
				return Rule.Collection.getInstance();
			};
		}
	};
});
