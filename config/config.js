
var path = require('path'),
	rootPath = path.normalize(__dirname + '/..'), //sets root path
	config,
	sharedConfig;

var sharedConfig = {
	root: rootPath,
	db : {
		path: {}
	}
};

config = {
	local: {
		mode:	'local',
		port:	3004,
		app: {
			name: 'TMWired - local'
		},
		url:	'',
		global:	sharedConfig
	},

	dev: {
		mode:	'dev',
		port:	3004,
		app: {
			name: 'TMWired - Dev'
		},
		global:	sharedConfig
	},

	prod: {
		mode:	'prod',
		port:	3004,
		app: {
			name: 'TMWired - Prod'
		},
		global:	sharedConfig
	},

	hosts: [
		{
			domain: 'twitter-wall.local',
			target: ['localhost:3003']
		}
	]
};


// Export config
module.exports = config;