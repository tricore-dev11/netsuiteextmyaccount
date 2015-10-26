// Testing ProductList models
define(['TestHelper','ProductListDetails.View', 'Application',  'jasmineTypeCheck'], function (TestHelper)
{
	'use strict';

	var helper = new TestHelper({
			applicationName: 'ProductListDetails.module'
		,	loadTemplates: true
	});

	describe('ProductList module', function ()
	{
		var is_started = false;
	
		beforeEach(function ()
		{
			is_started = false;
			SC.templates.layout_tmpl = '<div id="content"></div></div>';
			jQuery('body').append('<div id="main"></div>'); 

			// This is the configuration needed by the modules in order to run
			helper.application.Configuration = {
				modules: ['ProductList']
			,	product_lists: {
					itemsDisplayOptions: []
				}
			};
			// Starts the application and wait until it is started
			jQuery(helper.application.start(function () 
			{ 
				//now that the app started, configure a custom control placeholder. 
				helper.application.ProductListModule.placeholder.control = '#mycontrol1'; 
				helper.application.ProductListModule.renderControl = spyOn(helper.application.ProductListModule, 'renderControl').andCallThrough();
				helper.application.getLayout().appendToDom();
				is_started = true; 
			}));

			waitsFor(function() 
			{
				return is_started; 
			});

		});

		it('should install accessible API', function()
		{
			expect(helper.application.getProductLists).toBeA(Function);
		});

		it('control should attach to an existing placeholder on afterAppendView', function ()
		{
			//append a view with the custom placeholder placeholder
			var view = new Backbone.View({
				application: helper.application
			});
			SC.templates.view1_tmpl = '<div id="mycontrol1"></div>';
			view.template = 'view1';
			view.showContent();
			// jQuery('body').append(view.$el); 
			expect(jQuery(helper.application.ProductListModule.placeholder.control).size() > 0).toBe(true);
			//expect(application.ProductListModule.renderControl).toHaveBeenCalled(); 
		});

	});
});