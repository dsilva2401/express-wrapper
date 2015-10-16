var express = require('express');
var http = require('http');
var https = require('https');
var Q = require('q');
var pem = require('pem');
var ExpressWrapper = (function () {
    // Constructor
    function ExpressWrapper(options) {
        var self = this;
        options = options || {};
        this.configData = this._getDefaultConfig();
        this.router = express.Router();
        this.app = options.app || express();
        this.global = {};
        this.methods = {};
        this.databases = {};
        this.httpServer = options.httpServer || http.Server(this.app);
        pem.createCertificate(options.httpsOptions || { days: 36500, selfSigned: true }, function (err, keys) {
            if (err) {
                console.warn('Error creating certificates', err);
                return;
            }
            self.httpsServer = options.httpsServer || https.Server(options.httpsKeys || {
                key: keys.serviceKey,
                cert: keys.certificate
            }, self.app);
        });
    }
    // Methods
    ExpressWrapper.prototype._getDefaultConfig = function () {
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
        };
    };
    ExpressWrapper.prototype._dependencies = function () {
        return {
            '$app': this.app,
            '$config': this.configData,
            '$database': this.databases,
            '$databases': this.databases,
            '$global': this.global,
            '$httpServer': this.httpServer,
            '$httpsServer': this.httpsServer,
            '$router': this.router,
            '$express': express,
            '$methods': this.methods,
            '$q': Q
        };
    };
    ExpressWrapper.prototype._resolveDependencies = function (fn) {
        var self = this;
        var strFn = fn.toString();
        var dependencies = strFn.substring(strFn.indexOf('(') + 1, strFn.indexOf(')')).split(',');
        var linkedDependencies = [];
        dependencies.forEach(function (d) {
            d = d.replace(/ /g, '');
            linkedDependencies.push(self._dependencies()[d]);
        });
        return linkedDependencies;
    };
    ExpressWrapper.prototype._resolveFunction = function (fn) {
        var solvedDependencies = this._resolveDependencies(fn);
        var fParams = [];
        var r;
        solvedDependencies.forEach(function (d, index) {
            fParams.push('solvedDependencies[' + index + ']');
        });
        eval('r = fn(' + fParams.join(',') + ');');
        return r;
    };
    ExpressWrapper.prototype.init = function (fn) {
        this.app.use(this.router);
        this._resolveFunction(fn);
    };
    ExpressWrapper.prototype.config = function (conf) {
        var self = this;
        Object.keys(conf).forEach(function (k) {
            self.configData[k] = conf[k];
        });
    };
    ExpressWrapper.prototype.addRoute = function (fn) {
        var routeData = this._resolveFunction(fn);
        routeData.method = routeData.method.toLowerCase();
        if (routeData.middle) {
            this.router[routeData.method](routeData.url, routeData.middle, routeData.callback);
        }
        else {
            this.router[routeData.method](routeData.url, routeData.callback);
        }
    };
    ExpressWrapper.prototype.addDatabase = function (dbKey, fn) {
        this.databases[dbKey] = this._resolveFunction(fn);
    };
    ExpressWrapper.prototype.run = function (fn) {
        this._resolveFunction(fn);
    };
    ExpressWrapper.prototype.up = function () {
        var self = this;
        var configData = this.configData;
        // HTTP server
        this.httpServer.listen(configData.httpServer.port, configData.httpServer.host, function () {
            console.log('Server at http://' + configData.httpServer.host + ':' + configData.httpServer.port);
        });
        // HTTPS Server
        var csInterval = setInterval(function () {
            if (self.httpsServer) {
                self.httpsServer.listen(configData.httpsServer.port, configData.httpsServer.host, function () {
                    console.log('Server at https://' + configData.httpsServer.host + ':' + configData.httpsServer.port);
                });
                clearInterval(csInterval);
            }
        }, 1);
    };
    return ExpressWrapper;
})();
module.exports = ExpressWrapper;
