'use strict';
var path = require('path'),
    util = require('util'),
    fs = require('fs'),
    da = require('most-data'),
    array = require('most-array'),
    url = require('url'),
    common = require('./common');
/**
 * Creates an instance of HttpContext class.
 * @constructor
 * @augments DataContext
 * @augments EventEmitter2
 * @implements DataContext
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @returns {HttpContext}
 */
function HttpContext(httpRequest, httpResponse) {
    /**
     * @type {ClientRequest}
     */
    this.request = httpRequest;
    /**
     *
     * @type {ServerResponse}
     */
    this.response = httpResponse;
    /**
     *@type {HttpApplication}
     */
    this.application = undefined;
    var __application__ = null;
    Object.defineProperty(this, 'application', {
        get: function () {
            return __application__;
        },
        set: function (value) {
            __application__ = value;
        }, configurable: false, enumerable: false
    });
    var self = this;
    /**
     * @type {undefined}
     */
    this.mime = undefined;
    Object.defineProperty(this, 'mime', {
        get: function () {
            return self.application.resolveMime(self.request.url);
        }, configurable: false, enumerable: false
    });

    Object.defineProperty(this, 'format', {
        get: function () {
            var uri = url.parse(self.request.url);
            var result = path.extname(uri.pathname);
            if (result)
                return result.substr(1).toLowerCase();
        }, configurable: false, enumerable: false
    });

    /**
     * Gets an object that represents HTTP query string variables.
     * @type {*}
     */
    this.querystring = {};
    /**
     * Gets an object that represents route data variables
     * @type {*}
     */
    this.data = undefined;
    /**
     * Gets an object that represents HTTP context parameters
     * @type {*}
     */
    this.params = {};

    var self = this;
    var data = null;
    Object.defineProperty(this, 'data', {
        get: function () {
            if (data)
                return data;
            if (self.request == null) {
                data = {};
                return data;
            }
            else if (self.request.routeData == null) {
                data = {};
                return data;
            }
            else {
                data = {};
                array(self.request.routeData).each(function (item) {
                    data[item.name.replace(/^:/, '')] = item.value;
                });
                return data;
            }
        }, configurable: false, enumerable: false
    });
    /**
     * @property {*} cookies - Gets a collection of HTTP Request cookies
     */
    Object.defineProperty(this, 'cookies', {
        get: function () {
            var list = {},
                rc = self.request.headers.cookie;
            rc && rc.split(';').forEach(function( cookie ) {
                var parts = cookie.split('=');
                list[parts.shift().trim()] = unescape(parts.join('='));
            });
            return list;
        }, configurable: false, enumerable: false
    });

    var $jQuery = null;
    /**
     * @property {jQuery|HTMLElement|*} $ - Gets a collection of HTTP Request cookies
     */
    Object.defineProperty(this, '$', {
        get: function () {
            if ($jQuery)
                return $jQuery;
            $jQuery =  require('./index').jQuery();
            return $jQuery;
        }, configurable: false, enumerable: false
    });
    /**
     * Gets or sets the current user identity
     * @type {*}
     */
    this.user = null;
    /**
     * @type {string}
     * @private
     */
    this._culture = undefined;
    //call super class constructor
    if (HttpContext.super_)
        HttpContext.super_.call(this);

    //class extension initiators
    if (typeof this.init === 'function') {
        //call init() method
        this.init();
    }

}
//todo: set HttpContext inheritance from configuration
util.inherits(HttpContext, da.classes.DefaultDataContext);

HttpContext.prototype.init = function() {
    //
};
/**
 * Executes the specified code in unattended mode.
 * @param {function(function(Error=))} fn
 * @param {function(Error=)} callback
 */
HttpContext.prototype.unattended = function(fn, callback) {
    var self = this;
    callback = callback || function() {};
    //get unattended execution account
    self.application.config.settings.auth = self.application.config.settings.auth || {};
    var account = self.application.config.settings.auth.unattendedExecutionAccount,
        interactiveUser = { name:'anonymous',authenticationType:'None' };
    //get interactive user
    if (this.user) {
        interactiveUser.name = this.user.name;
        interactiveUser.authenticationType = this.user.authenticationType;
    }
    if (account) {
        self.user = { name:account, authenticationType:'Basic' };
    }
    try {
        fn.call(this, function(err) {
            //restore user
            self.user = util._extend({ }, interactiveUser);
            callback(err);
        });
    }
    catch(e) {
        self.user = util._extend({ }, interactiveUser);
        callback(e);
    }
};

/**
 * Gets or sets the current culture
 * @param {String=} value
 */
HttpContext.prototype.culture = function(value) {
    var self = this;
    if (typeof value === 'undefined') {
        if (this._culture)
            return this._culture;

        //get available culures and default culture
        var cultures = ['en-us'], defaultCulture = 'en-us';
        if (this.application.config.settings) {
            if (this.application.config.settings['localization']) {
                cultures = this.application.config.settings['localization']['cultures'] || cultures;
                defaultCulture = this.application.config.settings['localization']['default'] || defaultCulture;
            }
        }
        //get browser lang
        var lang = defaultCulture;
        //2. Validate request HTTP header accept-language
        if (this.request) {
            if (this.request.headers['accept-language']) {
                var langs = this.request.headers['accept-language'].split(';');
                if (langs.length>0) {
                    lang = langs[0].split(',')[0] || defaultCulture;
                }
            }
        }
        //get request parameter lang
        if (self.params) {
            lang = self.params.lang || lang;
            if (lang) {
                var arr = cultures.filter(function(x) {
                    return (x == lang.toLowerCase()) || (x.substr(0,2) == lang.toLowerCase().substr(0,2));
                });
                if (arr.length>0) {
                    this._culture=arr[0];
                    return this._culture;
                }
            }
        }

        this._culture = defaultCulture;
        return this._culture;
    }
    else {
        this._culture = value;
    }
};
/**
 * Performs cross-site request forgery validation against the specified token
 * @param {string=} csrfToken
 */
HttpContext.prototype.validateAntiForgeryToken = function(csrfToken) {
    var self = this;
    if (typeof csrfToken === 'undefined') {
        //try to get token from params
        if (typeof self.params !== 'undefined')
            csrfToken = self.params['_CSRFToken'];
    }
    if (typeof csrfToken !== 'string')
        throw new common.HttpBadRequest('Bad request. Invalid cross-site request forgery token.');
    if (csrfToken.length==0)
        throw new common.HttpBadRequest('Bad request. Empty cross-site request forgery token.');
    try {
        var cookies = self.cookies, csrfCookieToken, csrfRequestToken;
        if (cookies['.CSRF']) {
            //try to decrypt cookie token
            try {
                csrfCookieToken = JSON.parse(self.application.decrypt(cookies['.CSRF']));
            }
            catch(e) {
                throw new common.HttpBadRequest('Bad request.Invalid cross-site request forgery data.');
            }
            //then try to decrypt the token provided
            try {
                csrfRequestToken = JSON.parse(self.application.decrypt(csrfToken));
            }
            catch(e) {
                throw new common.HttpBadRequest('Bad request.Invalid cross-site request forgery data.');
            }
            if ((typeof csrfCookieToken === 'object') && (typeof csrfRequestToken === 'object')) {

                var valid = true, tokenExpiration = 60;
                //1. validate token equality
                for(var key in csrfCookieToken) {
                    if (csrfCookieToken.hasOwnProperty(key)) {
                        if (csrfCookieToken[key]!==csrfRequestToken[key]) {
                            valid = false;
                            break;
                        }
                    }
                }
                if (valid==true) {
                    //2. validate timestamp
                    var timestamp = new Date(csrfCookieToken.date);
                    var diff = Math.abs((new Date())-timestamp);
                    if (diff<0) {
                        valid=false;
                    }
                    if (valid) {
                        if (self.application.config.settings)
                            if (self.application.config.settings.auth)
                                if (self.application.config.settings.auth['csrfExpiration'])
                                     tokenExpiration = parseInt(self.application.config.settings.auth['csrfExpiration']);
                        if (diff>tokenExpiration*60*1000)
                            valid=false;
                    }
                }
                if (valid)
                    return;

            }
            throw new common.HttpBadRequest('Bad request. A cross-site request forgery was detected.');
        }
        else {
            throw new common.HttpBadRequest('Bad request.Missing cross-site request forgery data.');
        }
    }
    catch(e) {
        if (e.status)
            throw e;
        else
            throw new common.HttpServerError('Request validation failed.');
    }
};

HttpContext.prototype.writeFile = function (file) {
    try {
        var fs = require("fs");
        var path = require("path");
        var app = require('./index');
        var response = this.response;
        //check if file exists
        if (!fs.existsSync(file))
            throw new app.common.HttpNotFoundException();
        //get file extension
        var extensionName = path.extname(file);
        //and try to find this extension to MIME types

        //get MIME collection
        var contentType = null;
        var a = require('most-array');
        var mime = a(app.current.config.mimes).firstOrDefault(function (x) {
            return (x.extension == extensionName);
        });
        if (mime != null)
            contentType = mime.type;
        //throw exception (MIME not found)
        if (contentType == null)
            throw new app.common.HttpForbiddenException();

        fs.readFile(file, "binary", function (err, stream) {
            if (err) {
                //todo:raise application asynchronous error
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.write('500 Internal Server Error');
                response.end();
                return;
            }
            response.writeHead(200, {'Content-Type': contentType});
            response.write(stream, "binary");
            response.end();
        });

    } catch (e) {
        console.log(e.message);
        throw e;
    }
};
/**
 * Checks whether the HTTP method of the current request is equal or not to the given parameter.
 * @param {String|Array} method - The HTTP method (GET, POST, PUT, DELETE)
 * */
HttpContext.prototype.is = function (method) {
    var self = this;
    if (self.request == null)
        return false;
    if (util.isArray(method)) {
        return (method.filter(function(x) { return self.request.method.toUpperCase() == x.toUpperCase(); }).length>0);
    }
    else {
        if (typeof method !== 'string')
            return false;
        if (method=='*')
            return true;
        return (self.request.method.toUpperCase() == method.toUpperCase());
    }

};

HttpContext.prototype.isPost = function () {
    return this.is('POST');
};
/**
 * @param {String|Array} method
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handle = function(method, fn) {
    if (this.is(method)) {
        this.handled = true;
        fn.call(this);
    }
    return this;
}

HttpContext.prototype.unhandle = function(fn) {
    if (!this.handled) {
        fn.call(this);
    }
}

/**
 * Invokes the given function if the current HTTP method is equal to POST
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handlePost = function(fn) {
    return this.handle('POST', fn);
};

/**
 * Invokes the given function if the current HTTP method is equal to GET
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handleGet = function(fn) {
    return this.handle('GET', fn);
};


/**
 * Invokes the given function if the current HTTP method is equal to PUT
 * @param {Function()} fn
 * @returns {HttpContext}
 */
HttpContext.prototype.handlePut = function(fn) {
    return this.handle('PUT', fn);
};

/**
 * Invokes the given function if the current HTTP method is equal to PUT
 * @param {Function()} fn
 */
HttpContext.prototype.handleDelete = function(fn) {
    return this.handle('DELETE', fn);
};

/**
 * Gets or sets the current HTTP handler
 * @param {Object=} value
 * @returns {Function|Object}
 */
HttpContext.prototype.currentHandler = function (value) {
    if (value === undefined) {
        return this.request.currentHandler;
    }
    else {
        this.request.currentHandler = value;
    }
};

HttpContext.prototype.translate = function(text, lib) {
    try {
        var self = this, app = self.application;
        //todo::get current HTTP context locale
        //ensure locale
        var locale = this.culture();
        //ensure localization library
        lib = lib || 'global';
        //get cached library object if any
        app.config.locales = app.config.locales || {};
        var library = app.config.locales[lib];
        //if library has not been yet initialized
        if (!library) {
            //get library path
            var file = app.mapPath('/locales/'.concat(lib,'.',locale,'.json'));
            //if file does not exist
            if (!fs.existsSync(file))
            {
                //return the give text
                return text;
            }
            else {
                //otherwise create library
                library = app.config.locales[lib] = {};
            }
        }
        if (!library[locale]) {
            var file = app.mapPath('/locales/'.concat(lib,'.',locale,'.json'));
            if (fs.existsSync(file))
                library[locale] = JSON.parse(fs.readFileSync(file,'utf8'));
        }
        var result = text;
        if (library[locale])
                result = library[locale][text];
        return result || text;
    }
    catch (e) {
        console.log(e);
        return text;
    }
};


if (typeof exports !== 'undefined')
    module.exports = {
        /**
         * @class HttpContext
         */
        HttpContext:HttpContext,
        /**
         * Creates an instance of HttpContext class.
         * @param {ClientRequest} request
         * @param {ServerResponse} response
         * @returns {HttpContext}
         */
        createInstance: function (request, response) {

            return new HttpContext(request, response);
        }
    }
