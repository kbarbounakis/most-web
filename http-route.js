/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-10
 */
/**
 * HttpRoute class provides routing functionality to HTTP requests
 * @class HttpRoute
 * @constructor
 * @param {String} url - A formatted string that represents the HTTP route request url (e.g. /pages/:name, /user/:id/edit etc).
 * @param {String} route - A formatted string that represents the HTTP route response url (e.g. /pages/:name.html, /user/edit.html).
 * @returns {HttpRoute}
 * */
function HttpRoute(url, route) {
    this.routeData = [];
    this.url = url;
    this.route = route;
}

/**
 * Gets a route data value based on the given key. If key does not exist returns null.
 *  @param {String} key
 * */
HttpRoute.prototype.data = function(key) {
    try {
        if (key==null) return null;
        if (key.length==0) return null;
        var item = null;
        for (var i = 0; i < this.routeData.length; i++) {
            var x = this.routeData[i];
            if (x.name==(key.indexOf(':')==0 ? key : ':' + key)) {
                item = x;
                break;
            }
        }
        if (item!=null)
            return item.value;
        return null;
    }
    catch (e) {
        throw e;
    }
}
/**
 * @param {String} url
 * */
HttpRoute.prototype.parse = function(url) {
    var result = [];
    if ((url==null) || (this.url==null))
        return result;
    if ((url.length==0) || (this.url.length==0))
        return result;
    //get array of parameters e.g. ["name","view"] etc.
    var params = getRouteParams(this.url) ;
    //test url and get parameter values
    var str = this.url.replace(/(:\b(\w+)\b)/ig, "([\\w-]+)");
    var matcher = new RegExp("^" + str + "$");
    //get matches
    var matches = matcher.exec(url);
    //initialize route data array
    this.routeData = []
    for(var i=0;i<params.length;i++)
    {
        this.routeData.push({ name:params[i], value:matches[i+1] });
    }
}
/**
 * @returns {String}
 */
HttpRoute.prototype.format = function()
{
    if (this.route==null)
        throw 'Route cannot be empty.';
    var path = this.route;
    for (var i = 0; i < this.routeData.length; i++) {
        var item = this.routeData[i];
        path = path.replace(item.name, item.value);
    }
    return path;
}
/**
 * @param {String} url
 * @returns Boolean
 * */
HttpRoute.prototype.isMatch = function (url) {
    if ((url == null) || (this.url == null))
        return false;
    if ((url.length == 0) || (this.url.length == 0))
        return false;
    var url1 = url;
    var k = url.indexOf('?');
    if (k >= 0)
        url1 = url.substr(0, k);
    var str = this.url.replace(/(:\b(\w+)\b)/ig, "([\\w-]+)");
    var matcher = new RegExp("^" + str + "$");
    return matcher.test(url1);
};

/* *
 * Gets an array that represents route parameters.
 * @param {String} url
 * @returns Array
 * */
function getRouteParams(url) {
    if (url==null)
        return [];
    if (url.length==0)
        return [];
    var re = /(:\b(\w+)\b)/ig;
    var result = [];
    var arr = [];
    while ((arr = re.exec(url)) !== null) {
        result.push(arr[0]);
    }
    return result;
}


HttpRoute.query = function(url) {
    var result = { };
    if (typeof url !== 'string')
        return result
    if (typeof window === 'undefined')
        return result;
    if (typeof window['routes'] === 'undefined')
        return result;
    //get uri
    var uri = url;
    /* other expression /^(?:((?:https?|s?ftp):)\/\/)([^:\/\s]+)(?::(\d*))?(?:\/([^\s?#]+)?([?][^?#]*)?(#.*)?)?/
    1=protocol, 2=domain, 3=port, 4=path, 5=query, 6=fragment
     */
    var r = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/ig;
    var matches = r.exec(url);
    //matches 1=protocol, 2=domain and port, 3=path, 4=query, 5=fragment
    if (matches)
        uri = matches[3]; //get only path

    /**
     * @type {Array}
     */
    var routes = window['routes'], httpRoute = null;
    for (var i = 0; i < routes.length; i++) {
        var item = routes[i];
        httpRoute = route.createInstance(item.url, item.route);
        //if uri path is matched
        if (httpRoute.isMatch(uri)) {
            //parse route
            httpRoute.parse(uri);
            //get or set controller
            var param = httpRoute.routeData.filter(function(x) { return x.name == ":controller"; })[0];
            if (typeof param === 'undefined') {
                var controller = item.controller;
                if (typeof controller === 'undefined') {
                    var segments = uri.split('/');
                    if (segments.length == 2)
                        controller = 'root';
                    else
                        controller = segments[1];
                }
                httpRoute.routeData.push({name: ":controller", value: controller })
            }
            //get or set action
            param = httpRoute.routeData.filter(function(x) { return x.name == ":action"; })[0];
            if (typeof param === 'undefined') httpRoute.routeData.push({name: ":action", value: item.action});
            //exit loop
            break;
        }
    }
    for (var i = 0; i < httpRoute.routeData.length; i++) {
        var item = httpRoute.routeData[i], name = item.name.substr(1);
        result[name] = item.value;
    }
    return result;
};

var route = {
    /**
     * Creates a new instance of HttpRoute class
     * @param {string} url
     * @param route
     * @returns {HttpRoute}
     */
    createInstance: function (url, route) {
        return new HttpRoute(url, route);
    },
    /**
     * Queries the given url and returns the route data.
     * @param {string} url
     * @returns {Object}
     */
    query: HttpRoute.query
}
// browser support
if (typeof window !== 'undefined') window.route = route.query(window.location.href);
// node.js support
if (typeof exports !== 'undefined') module.exports = route;