var Sequelize = require('sequelize');
var ExpressWrapper = require('../built');
var app = new ExpressWrapper();

app.config({
	env: 'dev',
	server: {
		host: 'localhost',
		port: 8000
	},
	databases: {
		main: {
			dev: {
				database: 'dbName',
				username: 'username',
				password: 'pwd',
				options: {
					host: 'localhost',
					dialect: 'sqlite',
					storage: 'data/database.sqlite'
				}
			}
		}
	}
});

app.init(function ($app, $config) {
	// console.log( $config );
});

app.addDatabase('main', function ($config) {
	var dbConfig = $config.databases['main'][$config.env];
	var db = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		dbConfig.options
	);

	var Credential = db.define('Credential', {
		password: Sequelize.STRING
	});

	db.sync();

	return db;
});

app.addRoute(function ($database) {
	return {
		url: '/',
		method: 'GET',
		callback: function (req, res) {
			res.end(':P');
		}
	}
});

app.up();