function postInstallCombiner ()
{
	'use strict';

	try
	{
		var loaded_file = null
		,	cloned_file = null
		,	searched_folders = {}

		,	context = nlapiGetContext()
			// path to the ssp aplication containing folder
		,	reference_container_path = '/Web Site Hosting Files/Live Hosting Files/SSP Applications/NetSuite Inc. - My Account Premium 1.05/Reference My Account Premium'
		,	custom_container_path = reference_container_path.replace('Reference', 'Custom');

		// the paths to the folders that need to have the config file triggered
		context.getSetting('SCRIPT', 'custscript_ignite_folders_2').split(';').forEach(function (path, index)
		{
			// we use a trycatch here so we can trigger all of the combiners even if there's an error with one
			try
			{
				var custom_folder = getFolder(custom_container_path + path, searched_folders)
				,	reference_folder = getFolder(reference_container_path + path, searched_folders)

				,	custom_config_file = getFile(custom_folder)
				,	reference_config_file = getFile(reference_folder)

				,	cloned_file = nlapiCreateFile(reference_config_file.getName(), reference_config_file.getType(), reference_config_file.getValue());

				if (custom_config_file)
				{
					nlapiDeleteFile(custom_config_file.getId());
				}

				cloned_file.setFolder(custom_folder);
				nlapiSubmitFile(cloned_file);
			}
			catch (e)
			{
				nlapiLogExecution('ERROR', 'Error triggering combiner', 'folder: ' + path);

				if ('getCode' in e)
				{
					nlapiLogExecution('ERROR', 'NetSuite Error details', e.getCode() + ': ' + e.getDetails());
				}
				else
				{
					nlapiLogExecution('ERROR', 'JavaScript Error details', e.message);
				}
			}
		});
	}
	catch (e)
	{
		if ('getCode' in e)
		{
			nlapiLogExecution('ERROR', 'NetSuite Error details', e.getCode() + ': ' + e.getDetails());
		}
		else
		{
			nlapiLogExecution('ERROR', 'JavaScript Error details', e.message);
		}
	}
}

function getFile (folder)
{
	'use strict';

	var result = null

	,	loaded_file = null

	,	filters = [
			new nlobjSearchFilter('folder', null, 'is', folder)
		,	new nlobjSearchFilter('name', null, 'contains', '.config')
		]

	,	config_files = nlapiSearchRecord('file', null, filters);

	if (config_files && config_files.length)
	{
		for (var i = 0; i < config_files.length; i++)
		{
			loaded_file = nlapiLoadFile(config_files[i].getId());

			if (loaded_file.getFolder() == folder)
			{
				result = loaded_file;
				break;
			}
		}
	}

	return result;
}

function getFolder (path, searched_folders)
{
	'use strict';

	var parent_path = path.substring(0, path.lastIndexOf('/'))
	,	root_folder = null
	,	result = null
	,	filters = []
	,	folder = '';

	// if no parent then is root
	if (!parent_path)
	{
		filters = [
			new nlobjSearchFilter('name', null, 'is', path.substring(1))
		,	new nlobjSearchFilter('istoplevel', null, 'is', 'T')
		];

		root_folder = nlapiSearchRecord('folder', null, filters)[0];

		return searched_folders[path] = parseFloat(root_folder.getId());
	}
	else if (!(parent_path in searched_folders))
	{
		getFolder(parent_path, searched_folders);
	}

	folder = path.split('/').pop();

	filters = [
		new nlobjSearchFilter('parent', null, 'is', searched_folders[parent_path])
	,	new nlobjSearchFilter('name', null, 'is', folder)
	];

	result = nlapiSearchRecord('folder', null, filters)[0];
	// we add the folder found to the hash table to cache future searches
	return searched_folders[parent_path + '/' + folder] = parseFloat(result.getId());
}