SC = {};

specs = [
	'tests/specs/app/modules/Content/module'
,	'tests/specs/app/modules/Content/Content.EnhancedViews'
];

// required SC data
SC = {
	ENVIRONMENT: {
		PROFILE: {}
	,	baseUrl: '/ShopFlow/{{file}}'
	,	siteSettings: {
			registration: {}
		}
	}
};