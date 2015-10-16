import express = require('express');
import http = require('http');
import https = require('https');
import Q = require('q');
import pem = require('pem');

class ExpressWrapper {

	// Attributes
	private app: any;
	private configData: Object;
	private router: express.Router;
	private databases: Object;
	private global: Object;
	private methods: Object;
	private server: any;

	// Constructor
	public constructor (options?: any) {
		var self: any = this;
		options = options || {};
		this.configData = this._getDefaultConfig();
		this.router = express.Router();
		this.app = options.app || express();
		this.global = {};
		this.methods = {};
		this.databases = {};
		this.httpServer = options.httpServer || http.Server(this.app);
		pem.createCertificate(options.httpsOptions || { days:36500, selfSigned:true }, function(err, keys){
			if (err) {
				console.warn('Error creating certificates', err);
				return;
			}
			self.httpsServer = options.httpsServer || https.Server( options.httpsKeys || {
				key: keys.serviceKey,
				cert: keys.certificate
			}, self.app);
		});
	}

	// Methods
	private _getDefaultConfig (): Object {
		return {
			env: 'dev',
			publicDir: 'public/',
			httpServer: {
				host: 'localhost',
				port: 80
			},
			httpServer: {
				host: 'localhost',
				port: 443
			},
			databases: {}
		}
	}

	private _dependencies (): Object {
		return {
			'$app': this.app,
			'$config': this.configData,
			'$database': this.databases,
			'$databases': this.databases,
			'$global': this.global,
			'$server': this.server,
			'$router': this.router,
			'$express': express,
			'$methods': this.methods,
			'$q': Q
		};
	}

	private _resolveDependencies (fn: Function): Array<Object> {
		var self: any = this;
		var strFn: string = fn.toString();
		var dependencies: Array<string> = strFn.substring(
			strFn.indexOf('(')+1,
			strFn.indexOf(')')
		).split(',');
		var linkedDependencies: Array<any> = [];
		dependencies.forEach(function (d) {
			d = d.replace(/ /g, '');
			linkedDependencies.push(self._dependencies()[d]);
		});
		return linkedDependencies;
	}

	public _resolveFunction (fn: Function): any {
		var solvedDependencies: Array<any> = this._resolveDependencies(fn);
		var fParams:any = [];
		var r: any;
		solvedDependencies.forEach(function (d, index) {
			fParams.push( 'solvedDependencies['+index+']' );
		});
		eval('r = fn(' + fParams.join(',') + ');');
		return r;
	}

	public init (fn: Function): void {
		this.app.use( this.router );
		this._resolveFunction( fn );
	}

	public config (conf: Object): void {
		var self: any = this;
		Object.keys(conf).forEach(function (k: any) {
			self.configData[k] = conf[k];
		});
	}

	public addRoute (fn: Function): void {
		var routeData = this._resolveFunction( fn );
		routeData.method = routeData.method.toLowerCase();
		if (routeData.middle) {
			this.router[ routeData.method ](
				routeData.url,
				routeData.middle,
				routeData.callback
			)	
		} else {
			this.router[ routeData.method ](
				routeData.url,
				routeData.callback
			)
		}
	}

	public addDatabase (dbKey:string, fn: Function) {
		this.databases[dbKey] = this._resolveFunction( fn );
	}

	public run (fn: Function) {
		this._resolveFunction( fn );
	}

	public up (): void {
		var configData = this.configData;
		// HTTP server
		this.httpServer.listen(
			configData.httpServer.port,
			configData.httpServer.host,
			function () {
				console.log(
					'Server at http://'+configData.httpServer.host+':'+configData.httpServer.port
				);
			}
		);
		// HTTPS Server
		this.httpsServer.listen(
			configData.httpsServer.port,
			configData.httpsServer.host,
			function () {
				console.log(
					'Server at https://'+configData.httpsServer.host+':'+configData.httpsServer.port
				);
			}
		);
	}

}

export = ExpressWrapper;
