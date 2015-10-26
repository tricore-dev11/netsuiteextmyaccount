// Utils.js
// --------
// A collection of utility methods
// This are added to both SC.Utils, and Underscore.js
// eg: you could use SC.Utils.formatPhone() or _.formatPhone()
(function ()
{
	'use strict';

	// _.formatPhone:
	// Will try to reformat a phone number for a given phone Format,
	// If no format is given, it will try to use the one in site settings.
	function formatPhone (phone, format)
	{
		// fyi: the tilde (~) its used as !== -1
		var extentionSearch = phone.search(/[A-Za-z#]/)
		,	extention = ~extentionSearch ? ' '+ phone.substring(extentionSearch) : ''
		,	phoneNumber = ~extentionSearch ? ' '+ phone.substring(0, extentionSearch) : phone;

		format = format || SC.ENVIRONMENT.siteSettings.phoneformat;

		if (/^[0-9()-.\s]+$/.test(phoneNumber) && format)
		{
			var format_tokens = {}
			,	phoneDigits = phoneNumber.replace(/[()-.\s]/g, '');

			switch (format)
			{
			// c: country, ab: area_before, aa: area_after, d: digits
			case '(123) 456-7890':
				format_tokens = {c: ' ', ab: '(', aa: ') ', d: '-'};
				break;
			case '123 456 7890':
				format_tokens = {c: ' ', ab: '', aa: ' ', d: ' '};
				break;
			case '123-456-7890':
				format_tokens = {c: ' ', ab: '', aa: '-', d: '-'};
				break;
			case '123.456.7890':
				format_tokens = {c: ' ', ab: '', aa: '.', d: '.'};
				break;
			default:
				return phone;
			}

			switch (phoneDigits.length)
			{
			case 7:
				return phoneDigits.substring(0, 3) + format_tokens.d + phoneDigits.substring(3) + extention;
			case 10:
				return format_tokens.ab + phoneDigits.substring(0, 3) + format_tokens.aa + phoneDigits.substring(3, 6) + format_tokens.d + phoneDigits.substring(6) + extention;
			case 11:
				return phoneDigits.substring(0, 1) + format_tokens.c + format_tokens.ab + phoneDigits.substring(1, 4) + format_tokens.aa + phoneDigits.substring(4, 7) + format_tokens.d + phoneDigits.substring(7) + extention;
			default:
				return phone;
			}
		}

		return phone;
	}

	// Convert a date object to string using international format YYYY-MM-dd
	// Useful for inputs of type="date"
	function dateToString (date)
	{
		var month = ''+(date.getMonth()+1)
		,	day = ''+ date.getDate();

		if (month.length === 1)
		{
			month = '0' + month;
		}

		if (day.length === 1)
		{
			day = '0'+day;
		}

		return date.getFullYear() + '-' + month + '-' + day;
	}

	//This method parse a string date into a date object.
	// str_date: String date.
	// options.format: String format that specify the format of the input string. By Default YYYY-MM-dd.
	// options.plusMonth: Number that indicate how many month offset should be applied whne creating the date object.
	function stringToDate (str_date, options)
	{
		options = _.extend({
			format: 'YYYY-MM-dd'
		,	plusMonth: -1
		,	dateSplitCharacter: '-'
		}, options || {});

		//plumbing
		var date_parts = str_date ? str_date.split(options.dateSplitCharacter) : []
		,	format_parts = options.format ? options.format.split('-') : []
		,	year_index = _.indexOf(format_parts, 'YYYY') >= 0 ? _.indexOf(format_parts, 'YYYY') : 2
		,	month_index = _.indexOf(format_parts, 'MM') >= 0 ? _.indexOf(format_parts, 'MM') : 1
		,	day_index = _.indexOf(format_parts, 'dd') >= 0 ? _.indexOf(format_parts, 'dd') : 0
		//Date parts
		,	year = parseInt(date_parts[year_index], 10)
		,	month = parseInt(date_parts[month_index], 10) + (options.plusMonth || 0)
		,	day = parseInt(date_parts[day_index], 10)
		,	result = new Date(year, month, day);

		if (!(result.getMonth() !== month || day !== result.getDate() || result.getFullYear() !== year))
		{
			return result;
		}
	}

	function isDateValid (date)
	{
		if (Object.prototype.toString.call(date) === '[object Date]')
		{
			// it is a date
			if (isNaN(date.getTime()))
			{
				// d.valueOf() could also work
				// date is not valid
				return false;
			}
			else
			{
				// date is valid
				// now validate the values of day, month and year
				var dtDay = date.getDate()
				,   dtMonth= date.getMonth() + 1
				,   dtYear = date.getFullYear()
				,   pattern = /^\d{4}$/;

				if (!pattern.test(dtYear))
				{
					return false;
				}
				else if (dtMonth < 1 || dtMonth > 12)
				{
					return false;
				}
				else if (dtDay < 1 || dtDay > 31)
				{
					return false;
				}
				else if ((dtMonth === 4 || dtMonth ===6 || dtMonth === 9 || dtMonth === 11) && dtDay  === 31)
				{
					return false;
				}
				else if (dtMonth === 2)
				{
					var isleap = (dtYear % 4 === 0 && (dtYear % 100 !== 0 || dtYear % 400 === 0));
					if (dtDay> 29 || (dtDay === 29 && !isleap))
					{
						return false;
					}
				}

				return true;
			}
		}
		else
		{
			// not a date
			return false;
		}
	}

	function paymenthodIdCreditCart (cc_number)
	{
		// regex for credit card issuer validation
		var cards_reg_ex = {
			'VISA': /^4[0-9]{12}(?:[0-9]{3})?$/
		,	'Master Card': /^5[1-5][0-9]{14}$/
		,	'American Express': /^3[47][0-9]{13}$/
		,	'Discover': /^6(?:011|5[0-9]{2})[0-9]{12}$/
		,	'Maestro': /^(?:5[0678]\d\d|6304|6390|67\d\d)\d{8,15}$/
		}

		// get the credit card name
		,	paymenthod_name;

		// validate that the number and issuer
		_.each(cards_reg_ex, function (reg_ex, name)
		{
			if (reg_ex.test(cc_number))
			{
				paymenthod_name = name;
			}
		});

		var paymentmethod = paymenthod_name && _.findWhere(SC.ENVIRONMENT.siteSettings.paymentmethods, {name: paymenthod_name.toString()});

		return paymentmethod && paymentmethod.internalid;
	}


	function validateSecurityCode (value)
	{
		var ccsn = jQuery.trim(value);

		if (!ccsn)
		{
			return _('Security Number is required').translate();
		}

		if (!(Backbone.Validation.patterns.number.test(ccsn) && (ccsn.length === 3 || ccsn.length === 4)))
		{
			return _('Security Number is invalid').translate();
		}
	}

	function validatePhone (phone)
	{
		var minLength = 7;


		if (_.isNumber(phone))
		{
			// phone is a number so we can't ask for .length
			// we elevate 10 to (minLength - 1)
			// if the number is lower, then its invalid
			// eg: phone = 1234567890 is greater than 1000000, so its valid
			//     phone = 123456 is lower than 1000000, so its invalid
			if (phone < Math.pow(10, minLength - 1))
			{
				return _('Phone Number is invalid').translate();
			}
		}
		else if (phone)
		{
			// if its a string, we remove all the useless characters
			var value = phone.replace(/[()-.\s]/g, '');
			// we then turn the value into an integer and back to string
			// to make sure all of the characters are numeric

			//first remove leading zeros for number comparison
			while(value.length && value.substring(0,1) === '0')
			{
				value = value.substring(1, value.length);
			}
			if (parseInt(value, 10).toString() !== value || value.length < minLength)
			{
				return _('Phone Number is invalid').translate();
			}
		}
		else
		{
			return _('Phone is required').translate();
		}

	}

	function validateState (value, valName, form)
	{
		var countries = SC.ENVIRONMENT.siteSettings.countries || {};
		if (countries[form.country] && countries[form.country].states && value === '')
		{
			return _('State is required').translate();
		}
	}

	function validateZipCode (value, valName, form)
	{
		var countries = SC.ENVIRONMENT.siteSettings.countries || {};
		if (!value && (!form.country || countries[form.country] && countries[form.country].isziprequired === 'T'))
		{
			return _('Zip Code is required').translate();
		}
	}

	// translate:
	// used on all of the harcoded texts in the templates
	// gets the translated value from SC.Translations object literal
	function translate (text)
	{
		if (!text)
		{
			return '';
		}

		text = text.toString();
		// Turns the arguments object into an array
		var args = Array.prototype.slice.call(arguments)

		// Checks the translation table
		,	result = SC.Translations && SC.Translations[text] ? SC.Translations[text] : text;

		if (args.length && result)
		{
			// Mixes in inline variables
			result = result.format.apply(result, args.slice(1));
		}

		return result;
	}

	// getFullPathForElement:
	// returns a string containing the path
	// in the DOM tree of the element
	function getFullPathForElement (el)
	{
		var names = [], c, e;

		while (el.parentNode)
		{
			if (el.id)
			{
				// if a parent element has an id, that is enough for our path
				names.unshift('#'+ el.id);
				break;
			}
			else if(el === document.body)
			{
				names.unshift('HTML > BODY');
				break;
			}
			else if(el === (document.head || document.getElementsByTagName('head')[0]))
			{
				names.unshift('HTML > HEAD');
				break;
			}
			else if (el === el.ownerDocument.documentElement)
			{
				names.unshift(el.tagName);
				break;
			}
			else
			{
				e = el;
				for (c = 1; e.previousElementSibling; c++)
				{
					e = e.previousElementSibling;
				}
				names.unshift(el.tagName +':nth-child('+ c +')');
				el = el.parentNode;
			}
		}

		return names.join(' > ');
	}

	function formatCurrency (value, symbol)
	{
		var value_float = parseFloat(value);

		if (isNaN(value_float))
		{
			return value;
		}

		var negative = value_float < 0;
		value_float = Math.abs(value_float);
		value_float = parseInt((value_float + 0.005) * 100, 10) / 100;

		var value_string = value_float.toString()

		,	groupseparator = ','
		,	decimalseparator = '.'
		,	negativeprefix = '('
		,	negativesuffix = ')'
		,	settings = SC && SC.ENVIRONMENT && SC.ENVIRONMENT.siteSettings ? SC.ENVIRONMENT.siteSettings : {};

		if (Object.prototype.hasOwnProperty.call(window,'groupseparator'))
		{
			groupseparator = window.groupseparator;
		}
		else if (Object.prototype.hasOwnProperty.call(settings,'groupseparator'))
		{
			groupseparator = settings.groupseparator;
		}

		if (Object.prototype.hasOwnProperty.call(window,'decimalseparator'))
		{
			decimalseparator = window.decimalseparator;
		}
		else if (Object.prototype.hasOwnProperty.call(settings, 'decimalseparator'))
		{
			decimalseparator = settings.decimalseparator;
		}

		if (Object.prototype.hasOwnProperty.call(window,'negativeprefix'))
		{
			negativeprefix = window.negativeprefix;
		}
		else if (Object.prototype.hasOwnProperty.call(settings,'negativeprefix'))
		{
			negativeprefix = settings.negativeprefix;
		}

		if (Object.prototype.hasOwnProperty.call(window,'negativesuffix'))
		{
			negativesuffix = window.negativesuffix;
		}
		else if (Object.prototype.hasOwnProperty.call(settings,'negativesuffix'))
		{
			negativesuffix = settings.negativesuffix;
		}

		value_string = value_string.replace('.',decimalseparator);
		var decimal_position = value_string.indexOf(decimalseparator);

		// if the string doesn't contains a .
		if (!~decimal_position)
		{
			value_string += decimalseparator+'00';
			decimal_position = value_string.indexOf(decimalseparator);
		}
		// if it only contains one number after the .
		else if (value_string.indexOf(decimalseparator) === (value_string.length - 2))
		{
			value_string += '0';
		}

		var thousand_string = '';
		for (var i=value_string.length-1; i>=0; i--)
		{
								//If the distance to the left of the decimal separator is a multiple of 3 you need to add the group separator
			thousand_string =	(i > 0 && i < decimal_position && (((decimal_position-i) % 3) === 0) ? groupseparator : '') +
								value_string[i] + thousand_string;
		}

		if (!symbol)
		{
			if (typeof session !== 'undefined' && session.getShopperCurrency)
			{
				symbol = session.getShopperCurrency().symbol;
			}
			else if (settings.shopperCurrency)
			{
				symbol = settings.shopperCurrency.symbol;
			}
			else if (SC.getSessionInfo('currentCurrency'))
			{
				symbol = SC.getSessionInfo('currentCurrency').symbol;
			}

			if (!symbol)
			{
				symbol = '$';
			}
		}

		value_string  = symbol + thousand_string;

		return negative ? (negativeprefix + value_string + negativesuffix) : value_string;
	}

	// Formats a non-negative number with commas as thousand separator (e.g. for displaying quantities)
	function formatQuantity (number)
	{
		var result = []
		,	parts = ('' + number).split('.')
		,	integerPart = parts[0].split('').reverse();

		for (var i = 0; i < integerPart.length; i++)
		{
			if (i > 0 && (i % 3 === 0))
			{
				result.unshift(',');
			}

			result.unshift(integerPart[i]);
		}

		if (parts.length > 1)
		{
			result.push('.');
			result.push(parts[1]);
		}

		return result.join('');
	}

	function highlightKeyword (text, keyword)
	{
		text = text || '';
		if(!keyword)
		{
			return text;
		}

		keyword = jQuery.trim(keyword).replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');

		return text.replace(new RegExp('('+ keyword +')', 'ig'), function ($1, match)
		{
			return '<strong>' + match + '</strong>';
		});
	}

	function substitute (text, object)
	{
		text = text || '';

		return text.replace(/\{(\w+)\}/g, function (match, key)
		{
			return typeof object[key] !== 'undefined' ? object[key] : match;
		});
	}

	// iterates a collection of objects, runs a custom function getValue on each item and then joins them
	// returns a string.
	function collectionToString (options)
	{
		var temp = [];
		_.each(options.collection, function (item)
		{
			temp.push(options.getValue(item));
		});

		return temp.join(options.joinWith);
	}

	// params map
	function addParamsToUrl (baseUrl, params)
	{
		// We get the search options from the config file
		if (params && _.keys(params).length)
		{
			var paramString = jQuery.param(params)
			,	join_string = ~baseUrl.indexOf('?') ? '&' : '?';

			return baseUrl + join_string + paramString;
		}
		else
		{
			return baseUrl;
		}
	}

	// parseUrlOptions:
	// Takes a url with options (or just the options part of the url) and returns an object. You can do the reverse operation (object to url string) using jQuery.param()
	function parseUrlOptions (options_string)
	{
		options_string = options_string || '';

		if (~options_string.indexOf('?'))
		{
			options_string = _.last(options_string.split('?'));
		}

		if (~options_string.indexOf('#'))
		{
			options_string = _.first(options_string.split('#'));
		}

		var options = {};

		if (options_string.length > 0)
		{
			var tokens = options_string.split(/\&/g)
			,	current_token;

			while (tokens.length > 0)
			{
				current_token = tokens.shift().split(/\=/g);

				if (current_token[0].length === 0)
				{
					continue;
				}

				options[current_token[0]] = decodeURIComponent(current_token[1]);
			}
		}

		return options;
	}

	function objectToStyles (obj)
	{
		return _.reduce(obj, function (memo, value, index)
		{
			return memo += index + ':' + value + ';';
		}, '');
	}

	// simple hyphenation of a string, replaces non-alphanumerical characters with hyphens
	function hyphenate (string)
	{
		return string.replace(/[\W]/g, '-');
	}

	function objectToAtrributes (obj, prefix)
	{
		prefix = prefix ? prefix + '-' : '';

		return _.reduce(obj, function (memo, value, index)
		{
			if (index !== 'text' && index !== 'categories')
			{
				memo += ' ' + prefix;

				if (index.toLowerCase() === 'css' || index.toLowerCase() === 'style')
				{
					index = 'style';
					// styles value has to be an obj
					value = objectToStyles(value);
				}

				if (_.isObject(value))
				{
					return memo += objectToAtrributes(value, index);
				}

				memo += index;

				if (value)
				{
					memo += '="' + value + '"';
				}
			}

			return memo;
		}, '');
	}

	function resizeImage (sizes, url, size)
	{
		var resize = _.where(sizes, {name: size})[0];

		if (!!resize)
		{
			return url + (~url.indexOf('?') ? '&' : '?') + resize.urlsuffix;
		}

		return url;
	}

	function getAbsoluteUrl (file)
	{
		var base_url = SC.ENVIRONMENT.baseUrl
		,	fileReplace = file ? file : '';
		return base_url ? base_url.replace('{{file}}', fileReplace) : file;
	}

	function getDownloadPdfUrl (params)
	{
		params = params || {};
		params.n = SC.ENVIRONMENT.siteSettings.siteid;

		var origin = window.location.origin ? window.location.origin :
				(window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : ''));
		return  _.addParamsToUrl(origin + _.getAbsoluteUrl('download.ssp'), params);
	}

	//Fixes anchor elements, preventing default behavior so that
	//they do not change the views (ie: checkout steps)
	function preventAnchorNavigation (selector)
	{
		jQuery(selector).on('click', function (e)
		{
			e.preventDefault();
		});
	}

	// The reason for this method is be able to test logic regarding window.location - so tests can mock the window object
	function getWindow()
	{
		return window;
	}

	// Performs a POST operation to a specific url
	function doPost (url)
	{
		var form = jQuery('<form id="do-post" method="POST" action="' + url + '"></form>').hide();

		// we have to append it to the dom  for browser compatibility
		// check if the form already exists (user could cancel the operation before it gets to the submit)
		var do_post = jQuery('#do-post');
		if(do_post && do_post[0])
		{
			do_post[0].action = url;
			do_post[0].method = 'POST';
		}
		else
		{
			jQuery('html').append(form);
			do_post = jQuery('#do-post');
		}

		do_post[0].submit();
	}

	function getPathFromObject (object, path, default_value)
	{
		if (!path)
		{
			return object;
		}
		else if (object)
		{
			var tokens = path.split('.')
			,	prev = object
			,	n = 0;

			while (!_.isUndefined(prev) && n < tokens.length)
			{
				prev = prev[tokens[n++]];
			}

			if (!_.isUndefined(prev))
			{
				return prev;
			}
		}

		return default_value;
	}

	function setPathFromObject(object, path, value)
	{
		if (!path)
		{
			return;
		}
		else if (!object)
		{
			return;
		}

		var tokens = path.split('.')
		,	prev = object;

		for(var token_idx = 0; token_idx < tokens.length-1; ++token_idx)
		{
			var current_token = tokens[token_idx];

			if( _.isUndefined(prev[current_token]))
			{
				prev[current_token] = {};
			}
			prev = prev[current_token];
		}
		
		prev[_.last(tokens)] = value;
	}

	function getItemLinkAttributes (item)
	{
		var url = _(item.get('_url') + item.getQueryStringWithQuantity(1)).fixUrl()
		,	link_attributes = '';

		if (url)
		{
			link_attributes = {
				href: url
			};

			if (SC.ENVIRONMENT.siteType === 'ADVANCED')
			{
				_.extend(link_attributes, {
					data: {
						touchpoint: 'home'
					,	hashtag: '#' + url
					}
				});
			}
		}

		return _.objectToAtrributes(link_attributes);
	}

	function ellipsis (selector)
	{
		if (!jQuery(selector).data('ellipsis'))
		{
			var values = ['', '.', '..', '...', '..', '.']
			// var values = ['┏(°.°)┛', '┗(°.°)┛', '┗(°.°)┓', '┏(°.°)┓']
			,	count = 0
			,	timer = null
			,	element = jQuery(selector);

			element.data('ellipsis', true);
			element.css('visibility', 'hidden');
			element.html('...');
			// element.html('┏(°.°)┛');
			element.css('width', element.css('width'));
			element.css('display', 'inline-block');
			element.html('');
			element.css('visibility', 'visible');

			timer = setInterval(function ()
			{
				if (jQuery(selector).length)
				{
					element.html(values[count % values.length]);
					count++;
				}
				else
				{
					clearInterval(timer);
					element = null;
				}
			}, 250);
		}
	}

	function reorderUrlParams (url)
	{
		var params = []
		,	url_array = url.split('?');

		if (url_array.length > 1)
		{
			params = url_array[1].split('&');
			return url_array[0] + '?' + params.sort().join('&');
		}

		return url_array[0];
	}

	// search within a given url the values of the shopper session 
	function getSessionParams (url)
	{
		// add session parameters to target host
		var params = {}
		,	ck = _.getParameterByName(url, 'ck')
		,	cktime = _.getParameterByName(url, 'cktime');

		if (ck && cktime)
		{
			params.ck = ck;
			params.cktime = cktime;
		}

		return params;
	}

	function getParameterByName(url, param_name) {
		param_name = param_name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
		var regex = new RegExp('[\\?&]' + param_name + '=([^&#]*)')
		,	results = regex.exec(url);
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	}

	// Algorithm to search an item in the cart
	// We can't use internalid only because for matrix items, the internalid change when is added to the cart
	function findItemInCart(findItem, cart)
	{
		return cart.get('lines').find(function(item) 
		{
			var internalid = findItem.get('internalid')
			,	childs = findItem.getSelectedMatrixChilds();
			
			item = item.get('item');

			if (childs && childs.length === 1)
			{
				internalid = childs[0].get('internalid');
			}

			if ((findItem.get('internalid') === item.get('internalid') || internalid === item.get('internalid')) && _.size(findItem.itemOptions) === _.size(item.itemOptions))
			{
				var keys = _.keys(item.itemOptions);
				for (var i = 0; i < keys.length; i++) 
				{
					if (!findItem.itemOptions[keys[i]] || findItem.itemOptions[keys[i]].internalid !== item.itemOptions[keys[i]].internalid)
					{
						return;
					}
				}

				return item;
			}
		});
	}

	SC.Utils = {
		translate: translate
	,	substitute: substitute
	,	paymenthodIdCreditCart: paymenthodIdCreditCart
	,	formatPhone: formatPhone
	,	dateToString: dateToString
	,	isDateValid: isDateValid
	,	stringToDate: stringToDate
	,	validatePhone: validatePhone
	,	validateState: validateState
	,	validateZipCode: validateZipCode
	,	validateSecurityCode: validateSecurityCode
	,	formatCurrency: formatCurrency
	,	formatQuantity: formatQuantity
	,	highlightKeyword: highlightKeyword
	,	getFullPathForElement: getFullPathForElement
	,	collectionToString: collectionToString
	,	addParamsToUrl: addParamsToUrl
	,	parseUrlOptions: parseUrlOptions
	,	objectToAtrributes: objectToAtrributes
	,	resizeImage: resizeImage
	,	hyphenate: hyphenate
	,	getAbsoluteUrl: getAbsoluteUrl
	,	preventAnchorNavigation: preventAnchorNavigation
	,	getWindow: getWindow
	,	getDownloadPdfUrl: getDownloadPdfUrl
	,	doPost: doPost
	,	getPathFromObject: getPathFromObject
	,	setPathFromObject: setPathFromObject
	,	getItemLinkAttributes: getItemLinkAttributes
	,	ellipsis: ellipsis
	,	reorderUrlParams: reorderUrlParams
	,	getSessionParams: getSessionParams
	,	findItemInCart: findItemInCart
	,	getParameterByName: getParameterByName
	};

	// We extend underscore with our utility methods
	// see http://underscorejs.org/#mixin
	_.mixin(SC.Utils);

})();
