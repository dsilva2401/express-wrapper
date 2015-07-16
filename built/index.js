var express = require('express');
var http = require('http');
var ExpressWrapper = (function () {
    // Constructor
    function ExpressWrapper(app) {
        this.configData = this._getDefaultConfig();
        this.router = express.Router();
        this.app = app || express();
        this.global = {};
        this.server = http.Server(this.app);
        this.databases = {};
    }
    // Methods
    ExpressWrapper.prototype._getDefaultConfig = function () {
        return {
            env: 'dev',
            publicDir: 'public/',
            server: {
                host: 'localhost',
                port: 3000
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
            '$server': this.server,
            '$router': this.router,
            '$express': express
        };
    };
    ExpressWrapper.prototype._resolveDependencies = function (fn) {
        var self = this;
        var strFn = fn.toString();
        var dependencies = strFn.substring(strFn.indexOf('(') + 1, strFn.indexOf(')')).split(',');
        var linkedDependencies = [];
        dependencies.forEach(function (d) {
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
        var sConfig = this.configData.server;
        this.server.listen(sConfig.port, sConfig.host, function () {
            console.log('Server at http://' + sConfig.host + ':' + sConfig.port);
        });
    };
    return ExpressWrapper;
})();
module.exports = ExpressWrapper;
