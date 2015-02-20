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
'use strict';

var common = require('./common'),
    files = require('./files'),
    mvc = require('./http-mvc'),
    html = require('./html'), util = require('util'), array = require('most-array'),
    async = require('async'), path = require("path"), fs = require("fs"),
    url = require('url'),
    http = require('http'),
    da = require('most-data'),
    formidable = require('formidable'),
    querystring = require('querystring'),
    /**
     * @constructs HttpBaseController
     */
    HttpBaseController= require('./base-controller'),
    /**
     * @constructs HttpDataController
     */
    HttpDataController= require('./data-controller'),
    /**
     * @constructs HttpLookupController
     */
    HttpLookupController= require('./lookup-controller'),
    /**
     * @constructs HttpContext
     */
    HttpContext= require('./http-context').HttpContext,
    crypto = require('crypto');
/**
 * Represents a configuration file that is applicable to an application or service.
 * @constructor
 */
function ApplicationConfig() {
    /**
     * Gets an array of data adapters.
     * @type {Array}
     */
    this.adapters = [];
    /**
     * Gets an array of HTTP view engines configuration
     * @type {Array}
     */
    this.engines = [];
    /**
     *  Gets an array of all registered MIME types
     * @type {Array}
     */
    this.mimes = [];
    /**
     * Gets an array of all registered HTTP handlers.
     * @type {Array}
     */
    this.handlers = [];
    /**
     * Gets an array of all registered HTTP routes.
     * @type {Array}
     */
    this.routes = [];
    /**
     * Gets or sets a collection of data adapter types that are going to be use in data operation
     * @type {Array}
     */
    this.adapterTypes = null;
    /**
     * Gets or sets a collection of data types that are going to be use in data operation
     * @type {Array}
     */
    this.dataTypes = null;
    /**
     * Gets or sets an object that holds application settings
     * @type {Array}
     */
    this.settings = { };
    /**
     * Gets or sets an object that holds application locales
     * @type {*}
     */
    this.locales = { };

}
/**
 *
 * @param {String} file The configuration file path
 * @param {Boolean=} throwOnMissing Raise exception if file is missing. If this parameter is false and the file is missing
 * then the operation will return null.
 * @returns {*}
 */
ApplicationConfig.loadSync = function (file, throwOnMissing) {
    try {
        var throwError = throwOnMissing === undefined ? true : throwOnMissing == true;
        if (!fs.existsSync(path.join(process.cwd(), 'config', file))) {
            if (throwError)
                throw new Error('The specified configuration file is missing.');
            else
                return null;
        }
        //load JSON formatted configuration file
        var data = fs.readFileSync(path.join(process.cwd(), 'config', file), 'utf8');
        //return JSON object
        return JSON.parse(data);
    } catch (e) {
        throw e;
    }
};

/**
 * Abstract class that represents a data context
 * @constructor
 */
function HttpDataContext() {
    //
}
/**
 * @returns {AbstractAdapter}
 */
HttpDataContext.prototype.db = function () {
    return null;
}

/**
 * @param name {string}
 * @returns {DataModel}
 */
HttpDataContext.prototype.model = function (name) {
    return null;
}

/**
 * @param name {string}
 * @returns {*}
 */
HttpDataContext.prototype.dataTypes = function (type) {
    return null;
}

/**
 * Abstract class that represents an HTTP Handler
 * @class HttpHandler
 * @abstract
 * @constructor
 */
function HttpHandler() {
    //
}

HttpHandler.Events = ['beginRequest', 'validateRequest', 'authenticateRequest',
    'authorizeRequest', 'mapRequest', 'postMapRequest', 'preExecuteResult', 'postExecuteResult', 'endRequest'];

/**
 * Occurs as the first event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.beginRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when a handler is going to validate current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.validateRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when a handler is going to set current user identity.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.authenticateRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when a handler has established the identity of the current user.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.postAuthenticateRequest = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/


/**
 * Occurs when a handler has verified user authorization.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.authorizeRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when the handler is selected to respond to the request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.mapRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when application has mapped the current request to the appropriate handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.postMapRequest = function(context, callback) {
    callback = callback || function() {};
    callback.call(context);
};

/**
 * Occurs just before application starts executing a handler.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.preRequestHandlerExecute = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/

/**
 * Occurs when application starts processing current HTTP request.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.processRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when application starts executing an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.preExecuteResult = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when application was succesfully executes an HTTP Result.
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.postExecuteResult = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * Occurs when the handler finishes execution.
 * @param {HttpContext} context
 * @param {Function} callback
 */
/*HttpHandler.prototype.postRequestHandlerExecute = function(context, callback) {
 callback = callback || function() {};
 callback.call(context);
 };*/

/**
 * Occurs as the last event in the HTTP execution
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpHandler.prototype.endRequest = function (context, callback) {
    callback = callback || function () {
    };
    callback.call(context);
};

/**
 * @class HttpApplication
 * @constructor
 * @augments EventEmitter
 */
function HttpApplication() {
    this.executionPath = path.join(process.cwd(), 'app');
    /**
     * Gets the current application configuration path
     * @type {*}
     */
    this.configPath = path.join(process.cwd(), 'app');
    /**
     * Gets or sets application configuration settings
     * @type {ApplicationConfig}
     */
    this.config = null;
    /**
     * Gets or sets a collection of application handlers
     * @type {Array}
     */
    this.handlers = [];

    //initialize angular server module
    var ng = require('./angular-server-module');
    /**
     * @type {AngularServerModule}
     */
    this.module = null;
    //init module
    ng.init(this);
    //register auth service
    var self = this;
    self.module.service('$auth', function($context) {
        try {
            //ensure settings
            self.config.settings.auth = self.config.settings.auth || { };
            var providerPath = self.config.settings.auth.provider || './auth-service';
            //get auth provider
            if (providerPath.indexOf('/')==0)
                providerPath = self.mapPath(providerPath);
            var svc = require(providerPath);
            if (typeof svc.createInstance !== 'function')
                throw new Error('Invalid authentication provider module.');
            return svc.createInstance($context);
        }
        catch (e) {
            throw e;
        }
    });
    var $cache;
    self.module.service('$cache', function() {
        try {
            if (!web.common.isNullOrUndefined($cache))
                return $cache;
            var NodeCache = require( "node-cache" );
            $cache = new NodeCache();
            return $cache;
        }
        catch (e) {
            throw e;
        }
    });

}
util.inherits(HttpApplication, da.types.EventEmitter2);

/**
 * Initializes application configuration.
 * @return {HttpApplication}
 */
HttpApplication.prototype.init = function () {

    /* process.on('uncaughtException', function(err) {
     // handle the error safely
     console.log(err);
     if (err.stack)
     console.log(err.stack);
     });*/

    /**
     * Gets or sets application configuration settings
     * @type {ApplicationConfig}
     */
    this.config = ApplicationConfig.loadSync('app.json');
    //load routes (if empty)
    if (this.config.routes == null)
        this.config.routes = ApplicationConfig.loadSync('routes.json');
    //load data types (if empty)
    if (this.config.dataTypes == null)
        this.config.dataTypes = ApplicationConfig.loadSync('dataTypes.json');

    //set settings default
    this.config.settings = this.config.settings || {};

    //initialize handlers list
    //important note: Applications handlers are static classes (they will be initialized once),
    //so they should not hold information about http context and execution lifecycle.
    var self = this;

    var handlers = self.config.handlers || [];
    //default handlers
    var defaultHandlers = [
        { name:'query',type:'./querystring-handler' },
        { name:'auth',type:'./auth-handler' },
        { name:'basic-auth',type:'./basic-auth-handler' },
        { name:'static',type:'./static-handler' },
        { name:'mvc',type:'./view-handler' },
        { name:'multipart',type:'./multipart-handler' },
        { name:'json',type:'./json-handler' },
        { name:'post',type:'./post-handler' },
        { name:'directive',type:'./directive-handler' }
    ];
    for (var i = 0; i < defaultHandlers.length; i++) {
        (function(item) {
            if (typeof handlers.filter(function(x) { return x.name === item.name; })[0] === 'undefined') {
                handlers.push(item);
            }
        })(defaultHandlers[i]);
    }
    array(handlers).each(function (h) {
        try {
            var handlerPath = h.type;
            if (handlerPath.indexOf('/')==0)
                handlerPath = self.mapPath(handlerPath);
            var handlerModule = require(handlerPath), handler = null;
            if (handlerModule) {
                if (typeof handlerModule.createInstance != 'function') {
                    console.log(util.format('The specified handler (%s) cannot be instantiated. The module does not export createInstance() function.', h.name));
                    return;
                }
                handler = handlerModule.createInstance();
                if (handler)
                    self.handlers.push(handler);
            }
        }
        catch (e) {
            throw new Error(util.format('The specified handler (%s) cannot be loaded. %s', h.name, e.message));
        }
    });
    //initialize basic directives collection
    var directives = require("./angular-server-directives");
    directives.apply(this);
    return this;
};

/**
 * Returns the path of a physical file based on a given URL.
 */
HttpApplication.prototype.mapPath = function (s) {
    var uri = url.parse(s).pathname;
    return path.join(this.executionPath, uri);
};
/**
 * Resolves ETag header for the given file. If the specifed does not exist or is invalid returns null.
 * @param {string=} file - A string that represents the file we want to query
 * @param {function(Error,string=)} callback
 */
HttpApplication.prototype.resolveETag = function(file, callback) {
    fs.exists(file, function(exists) {
        try {
            if (exists) {
                fs.stat(file, function(err, stats) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (!stats.isFile()) {
                            callback(null);
                        }
                        else {
                            //validate if-none-match
                            var md5 = crypto.createHash('md5');
                            md5.update(stats.mtime.toString());
                            var result = md5.digest('base64');
                            callback(null, result);
                            return;
                        }
                    }
                });
            }
            else {
                callback(null);
            }
        }
        catch (e) {
            callback(null);
        }
    });
};
/**
 * @param {HttpContext} context
 * @param {string} executionPath
 * @param {function(Error, Boolean)} callback
 */
HttpApplication.prototype.unmodifiedRequest = function(context, executionPath, callback) {
    try {
        var requestETag = context.request.headers['if-none-match'];
        if (typeof requestETag === 'undefined' || requestETag == null) {
            callback(null, false);
            return;
        }
        HttpApplication.prototype.resolveETag(executionPath, function(err, result) {
            callback(null, (requestETag==result));
        });
    }
    catch (e) {
        console.log(e);
        callback(null, false);
    }
};

/**
 * @param request {String|IncomingMessage}
 * */
HttpApplication.prototype.resolveMime = function (request) {
    if (typeof request=== 'string') {
        //get file extension
        var extensionName = path.extname(request);
        var arr = this.config.mimes.filter(function(x) {
            return (x.extension == extensionName);
        });
        if (arr.length>0)
            return arr[0];
        return null;
    }
    else if (typeof request=== 'object') {
        //get file extension
        var extensionName = path.extname(request.url);
        var arr = this.config.mimes.filter(function(x) {
            return (x.extension == extensionName);
        });
        if (arr.length>0)
            return arr[0];
        return null;
    }
};

/**
 * Encrypts the given data
 * */
HttpApplication.prototype.encypt = function (data)
{
    if (typeof data === 'undefined' || data==null)
        return null;
    //validate settings
    if (!this.config.settings.crypto)
        throw new Error('Data encryption configuration section is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.algorithm)
        throw new Error('Data encryption algorithm is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.key)
        throw new Error('Data encryption key is missing. The operation cannot be completed');
    //encrypt
    var cipher = crypto.createCipher(this.config.settings.crypto.algorithm, this.config.settings.crypto.key);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

/**
 * Decrypts the given data.
 * */
HttpApplication.prototype.decrypt = function (data)
{
    if (typeof data === 'undefined' || data==null)
        return null;
    //validate settings
    if (!this.config.settings.crypto)
        throw new Error('Data encryption configuration section is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.algorithm)
        throw new Error('Data encryption algorithm is missing. The operation cannot be completed');
    if (!this.config.settings.crypto.key)
        throw new Error('Data encryption key is missing. The operation cannot be completed');
    //decrypt
    var decipher = crypto.createDecipher(this.config.settings.crypto.algorithm, this.config.settings.crypto.key);
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
};
/**
 * Sets the authentication cookie that is associated with the given user.
 * @param {HttpContext} context
 * @param {String} username
 * @param {*=} options
 */
HttpApplication.prototype.setAuthCookie = function (context, username, options)
{
    var defaultOptions = { user:username, dateCreated:new Date()}, value;
    if (typeof options === 'object') {
        value = JSON.stringify(util._extend(options, defaultOptions));
    }
    else {
        value = JSON.stringify(defaultOptions);
    }
    var settings = this.config.settings ? (this.config.settings.auth || { }) : { } ;
    settings.name = settings.name || '.MAUTH';
    context.response.setHeader('Set-Cookie',settings.name.concat('=', this.encypt(value)));
};

/**
 * Sets the authentication cookie that is associated with the given user.
 * @param {HttpContext} context
 * @param {String} username
 */
HttpApplication.prototype.getAuthCookie = function (context)
{
    try {
        var settings = this.config.settings ? (this.config.settings.auth || { }) : { } ;
        settings.name = settings.name || '.MAUTH';
        var cookie = context.cookie(settings.name);
        if (cookie) {
            return this.decrypt(cookie);
        }
        return null;
    }
    catch(e) {
        console.log('GetAuthCookie failed.');
        console.log(e.message);
        return null;
    }
};


/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpApplication.prototype.processRequest = function (context, callback) {
    var self = this;
    if (typeof context === 'undefined' || context == null) {
        callback.call(self);
    }
    else {
        //1. beginRequest
        context.emit('beginRequest', context, function (err) {
            if (err) {
                callback.call(context, err);
            }
            else {
                //2. validateRequest
                context.emit('validateRequest', context, function (err) {
                    if (err) {
                        callback.call(context, err);
                    }
                    else {
                        //3. authenticateRequest
                        context.emit('authenticateRequest', context, function (err) {
                            if (err) {
                                callback.call(context, err);
                            }
                            else {
                                //4. authorizeRequest
                                context.emit('authorizeRequest', context, function (err) {
                                    if (err) {
                                        callback.call(context, err);
                                    }
                                    else {
                                        //5. mapRequest
                                        context.emit('mapRequest', context, function (err) {
                                            if (err) {
                                                callback.call(context, err);
                                            }
                                            else {
                                                //5b. postMapRequest
                                                context.emit('postMapRequest', context, function(err) {
                                                    if (err) {
                                                        callback.call(context, err);
                                                    }
                                                    else {
                                                        //process HEAD request
                                                        if (context.request.method==='HEAD') {
                                                            //7. endRequest
                                                            context.emit('endRequest', context, function (err) {
                                                                callback.call(context, err);
                                                            });
                                                        }
                                                        else {
                                                            //6. processRequest
                                                            if (context.request.currentHandler != null)
                                                                context.request.currentHandler.processRequest(context, function (err) {
                                                                    if (err) {
                                                                        callback.call(context, err);
                                                                    }
                                                                    else {
                                                                        //7. endRequest
                                                                        context.emit('endRequest', context, function (err) {
                                                                            callback.call(context, err);
                                                                        });
                                                                    }
                                                                });
                                                            else {
                                                                callback.call(context, new common.HttpNotFoundException());
                                                            }
                                                        }

                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

/**
 * Gets the default data context based on the current configuration
 * @returns {AbstractAdapter}
 */
HttpApplication.prototype.db = function () {
    if ((this.config.adapters == null) || (this.config.adapters.length == 0))
        throw new Error('Data adapters configuration settings are missing or cannot be accessed.');
    var adapter = null;
    if (this.config.adapters.length == 1) {
        //there is only one adapter so try to instantiate it
        adapter = this.config.adapters[0];
    }
    else {
        adapter = array(this.config.adapters).firstOrDefault(function (x) {
            return x.default;
        });
    }
    if (adapter == null)
        throw new Error('There is no default data adapter or the configuration is incorrect.');
    //try to instantiate adapter
    if (!adapter.invariantName)
        throw new Error('The default data adapter has no invariant name.');
    var adapterType = this.config.adapterTypes[adapter.invariantName];
    if (adapterType == null)
        throw new Error('The default data adapter type cannot be found.');
    if (typeof adapterType.createInstance === 'function') {
        return adapterType.createInstance(adapter.options);
    }
    else if (adapterType.require) {
        var m = require(adapterType.require);
        if (typeof m.createInstance === 'function') {
            return m.createInstance(adapter.options);
        }
        throw new Error('The default data adapter cannot be instantiated. The module provided does not export a function called createInstance().')
    }
}

/**
 * Creates an instance of HttpContext class.
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @returns {HttpContext}
 */
HttpApplication.prototype.createContext = function (request, response) {
    var httpContext = require('./http-context'),
        context = httpContext.createInstance(request, response);
    //set context application
    context.application = this;
    //set handler events
    for (var i = 0; i < HttpHandler.Events.length; i++) {
        var ev = HttpHandler.Events[i];
        for (var j = 0; j < this.handlers.length; j++) {
            var handler = this.handlers[j];
            if (typeof handler[ev] === 'function') {
                context.on(ev, handler[ev]);
            }

        }
    }
    return context;
};
/**
 * @param {*} options The request options
 * @param {Function} callback
 */
HttpApplication.prototype.executeExternalRequest = function(options,data, callback) {
    //make request
    var https = require('https'),
        opts = (typeof options==='string') ? url.parse(options) : options,
        httpModule = (opts.protocol === 'https:') ? https : http;
    var req = httpModule.request(opts, function(res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function(){
            var result = {
                statusCode: res.statusCode,
                headers: res.headers,
                body:data,
                encoding:'utf8'
            }
            callback(null, result);
        })
    });
    req.on('error', function(e) {
        //return error
        callback(e);
    });

    if(data)
    {
        if (typeof data ==="object" )
            req.write(JSON.stringify(data));
        else
            req.write(data.toString());
    }
    req.end();
};

/**
 * Executes an internal process
 * @param {function(HttpContext)} fn
 */
HttpApplication.prototype.execute = function (fn) {
    var request = this.__createRequest();
    fn.call(this, this.createContext(request, this.__createResponse(request)));
};

/**
 * Executes an unattended internal process
 * @param {function(HttpContext)} fn
 */
HttpApplication.prototype.unattended = function (fn) {
    //create context
    var request = this.__createRequest(), context =  this.createContext(request, this.__createResponse(request));
    //get unattended account
    /**
     * @type {{unattendedExecutionAccount:string}|*}
     */
    this.config.settings.auth = this.config.settings.auth || {};
    var account = this.config.settings.auth.unattendedExecutionAccount;
    //set unattended execution account
    if (typeof account !== 'undefined' || account!==null) {
        context.user = { name: account, authenticationType: 'Basic'};
    }
    //execute internal process
    fn.call(this, context);
};

/**
 * Load application extension
 */
HttpApplication.prototype.extend = function (extension) {
    if (typeof extension === 'undefined')
    {
        //register all application extensions
        var extensionFolder = this.mapPath('/extensions');
        if (fs.existsSync(extensionFolder)) {
            var arr = fs.readdirSync(extensionFolder);
            for (var i = 0; i < arr.length; i++) {
                if (path.extname(arr[i])=='.js')
                    require(path.join(extensionFolder, arr[i]));
            }
        }
    }
    else {
        //register the specified extension
        if (typeof extension === 'string') {
            var extensionPath = this.mapPath(util.format('/extensions/%s.js', extension));
            if (fs.existsSync(extensionPath)) {
                //load extension
                require(extensionPath);
            }
        }
    }
    return this;
};

/**
 *
 * @param {*|string} options
 * @param {Function} callback
 */
HttpApplication.prototype.executeRequest = function (options, callback) {
    var opts = { };
    if (typeof options === 'string') {
        util._extend(opts, { url:options });
    }
    else {
        util._extend(opts, options);
    }
    var request = this.__createRequest(opts),
        response = this.__createResponse(request);
    if (!opts.url) {
        callback(new Error('Internal request url cannot be empty at this context.'));
        return;
    }
    if (opts.url.indexOf('/')!=0)
    {
        var uri = url.parse(opts.url);
        opts.host = uri.host;
        opts.hostname = uri.hostname;
        opts.path = uri.path;
        opts.port = uri.port;
        //execute external request
        this.executeExternalRequest(opts,null, callback);
    }
    else {
        //set cookie header (for internal requests)
        this.__handleRequest(request, response, function(err) {
            if (err) {
                callback(err);
            }
            else {
                try {
                    //get statusCode
                    var statusCode = response.statusCode;
                    //get headers
                    var headers = {};
                    if (response._header) {
                        var arr = response._header.split('\r\n');
                        for (var i = 0; i < arr.length; i++) {
                            var header = arr[i];
                            if (header) {
                                var k = header.indexOf(':');
                                if (k>0) {
                                    headers[header.substr(0,k)] = header.substr(k+1);
                                }
                            }
                        }
                    }
                    //get body
                    var body = null;
                    var encoding = null;
                    if (util.isArray(response.output)) {
                        if (response.output.length>0) {
                            var start = response.output[0].indexOf('\r\n', response._header.length) + 2;
                            body = response.output[0].substr(start);
                            encoding = response.outputEncodings[0];
                        }
                    }
                    //build result (something like ServerResponse)
                    var result = {
                        statusCode: statusCode,
                        headers: headers,
                        body:body,
                        encoding:encoding
                    }
                    callback(null, result);
                }
                catch (e) {
                    callback(e);
                }
            }
        });
    }
};



/**
 * @private
 * @param {ClientRequest} request
 * @param {ServerResponse} response
 * @param callback
 */
HttpApplication.prototype.__handleRequest = function (request, response, callback)
{
    var self = this, context = self.createContext(request, response);
    //add query string
    if (request.url.indexOf('?') > 0)
        util._extend(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
    //add form
    if (request.form)
        util._extend(context.params, request.form);
    //add files
    if (request.files)
        util._extend(context.params, request.files);

    self.processRequest(context, function (err) {
        if (err) {
            if (self.listeners('error').length == 0) {
                self.onError(response, err, function () {
                    response.end();
                    callback(err);
                });
            }
            else {
                //raise application error event
                self.emit('error', function (err) {
                    response.end();
                    callback(err);
                });
            }
        }
        else {
            context.finalize(function() {
                response.end();
                callback(null);
            });
        }
    });
}

/**
 * Creates a mock-up client request
 * @private
 */
HttpApplication.prototype.__createRequest = function (options) {
    var opt = options ? options : {};
    var request = new http.IncomingMessage();
    request.method = (opt.method) ? opt.method : 'GET';
    request.url = (opt.url) ? opt.url : '/';
    request.httpVersion = '1.1';
    request.headers = (opt.headers) ? opt.headers : {
        host: 'localhost',
        'user-agent': 'Mozilla/5.0 (X11; Linux i686; rv:10.0) Gecko/20100101 Firefox/22.0',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'accept-encoding': 'gzip, deflate',
        connection: 'keep-alive',
        'cache-control': 'max-age=0' };
    if (opt.cookie)
        request.headers.cookie = opt.cookie;
    request.cookies = (opt.cookies) ? opt.cookies : {};
    request.session = (opt.session) ? opt.session : {};
    request.params = (opt.params) ? opt.params : {};
    request.query = (opt.query) ? opt.query : {};
    request.form = (opt.form) ? opt.form : {};
    request.body = (opt.body) ? opt.body : {};
    request.files = (opt.files) ? opt.files : {};
    return request;
}
/**
 * Creates a mock-up server response
 * @param req {ClientRequest}
 * @returns {ServerResponse|*}
 * @private
 */
HttpApplication.prototype.__createResponse = function (req) {
    var response = new http.ServerResponse(req);
    return response;
}
/**
 *
 * @param {ServerResponse} response
 * @param {Error|HttpException} err
 */
HttpApplication.prototype.onError = function (response, err, callback) {
    if (err.stack)
        console.log(err.stack);
    callback = callback || function () {
    };
    if (!response._headerSent) {
        if (err instanceof common.HttpException) {
            response.writeHead(err.status, {"Content-Type": "text/plain"});
            response.write(err.status + ' ' + err.message + "\n");
        }
        else {
            response.writeHead(500, {"Content-Type": "text/plain"});
            if (typeof err !== 'undefined')
                response.write(500 + ' ' + err.message + "\n");
            else
                response.write(500 + ' Internal Server Error\n');
        }
    }
    callback.call(this);
}

/**
 * Starts an HTTP Application instance.
 */
HttpApplication.prototype.start = function (options) {
    try {
        //validate options

        if (this.config == null)
            this.init();

        http.createServer(function (request, response) {
            var app = web, context = app.current.createContext(request, response);
            //begin request processing
            app.current.processRequest(context, function (err) {
                if (err) {
                    if (app.current.listeners('error').length == 0) {
                        app.current.onError(response, err, function () {
                            response.end();
                        });
                    }
                    else {
                        //raise application error event
                        app.current.emit('error', function (err) {
                            response.end();
                        });
                    }
                }
                else
                    response.end();
            });
        }).listen(options.port ? options.port : 80, options.bind ? options.bind : '127.0.0.1');

    } catch (e) {
        console.log(e);
    }
};

var web = {
    /**
     * @class HttpApplication
     * */
    HttpApplication: HttpApplication,
    /**
     * @class HttpContext
     * */
    HttpContext: HttpContext,
    /**
     * @type HttpApplication
     * */
    current: undefined,
    /**
     * Most Web Framework Express Parser
     * @param {Object=} options
     */
    runtime: function(options) {
        var self = this;
        return function runtimeParser(req, res, next) {
            //create context
            var ctx = self.current.createContext(req,res);
            //process request
            self.current.processRequest(ctx, function(err) {
                if (err) {
                    ctx.finalize(function() {
                        if (err.status==404) {
                            //escape not found HTTP error (node.js express compatibility)
                            next();
                            return;
                        }
                        next(err);
                    });
                }
                else {
                    ctx.finalize(function() {
                        ctx.response.end();
                    });
                }
            });
        };
    },
    /**
     * Expression handler for Access Denied HTTP errors (401).
     * @param {Object=} options
     */
    unauthorized: function(options) {
        return function(err, req, res, next)
        {
            try {
                if (err.status==401)  {
                    if (/text\/html/g.test(req.get('accept'))) {
                        if (web.current.config.settings) {
                            if (web.current.config.settings.auth) {
                                var page = web.current.config.settings.auth.loginPage || '/login.html';
                                res.set('Location', page.concat('?returnUrl=', encodeURIComponent(req.url)));
                                res.status(302).end();
                                return;
                            }
                        }
                    }
                }
                next(err);
            }
            catch(e) {
                console.log(e);
                next(err);
            }
        };
    },
    /**
     * @namespace
     */
    controllers: {
        /**
         * @constructs HttpController
         */
        HttpController: mvc.HttpController,
        /**
         * @constructs HttpBaseController
         */
        HttpBaseController: HttpBaseController,
        /**
         * @constructs HttpDataController
         */
        HttpDataController: HttpDataController,
        /**
         * @constructs HttpDataController
         */
        HttpLookupController: HttpLookupController
    },
    views: {
        /**
         * Creates an empty HTTP response.
         * @returns {mvc.HttpEmptyResult}
         */
        createEmptyResult: function () {
            return new mvc.HttpEmptyResult();
        },
        /**
         * Creates a basic HTTP response with the data provided
         * @param s {string}
         * @returns {mvc.HttpContentResult}
         */
        createContentResult: function (s) {
            return new mvc.HttpContentResult(s);
        },
        /**
         * Creates a new HTTP view context that is going to be used in view controllers
         * @param context {HttpContext=} - The current HTTP context
         * @returns {mvc.HttpViewContext} - The newly create HTTP view context
         */
        createViewContext: function (context) {
            return new mvc.HttpViewContext(context);
        },
        /**
         * Creates a JSON response with the given data
         * @param data
         * @returns {mvc.HttpJsonResult}
         */
        createJsonResult: function (data) {
            return new mvc.HttpJsonResult(data);
        },
        /**
         * Creates a HTTP redirect to given url.
         * @param url
         * @returns {mvc.HttpRedirectResult}
         */
        createRedirectResult: function (url) {
            return new mvc.HttpRedirectResult(url);
        },
        /**
         * Creates an XML response with the data provided.
         * @param data
         * @returns {mvc.HttpXmlResult}
         */
        createXmlResult: function (data) {
            return new mvc.HttpXmlResult(data);
        },
        /**
         * Creates an HTML response with the data provided.
         * @param data
         * @returns {mvc.HttpViewResult}
         */
        createViewResult: function (name, data) {
            return new mvc.HttpViewResult(name, data);
        },
        /**
         * Inherit the prototype methods from HttpController into the given class
         * @param {function} ctor Constructor function which needs to inherit the HttpController
         */
        inheritsController: function (ctor) {
            util.inherits(ctor, mvc.HttpController);
        },
        /**
         * @class HttpController
         * */
        HttpController: mvc.HttpController,
        /**
         * @class HttpViewContext
         * @constructor
         */
        HttpViewContext:mvc.HttpViewContext
    },
    html: {
        /**
         * Creates an HTML writer object.
         * @returns {HtmlWriter}
         */
        createHtmlWriter: function () {
            return new HtmlWriter();
        }
    },
    /**
     * @type {common|*}
     */
    common: common,
    /**
     * @type {files|*}
     */
    files: files
};

/**
 * @type HttpApplication
 */
var __current__ = null;

Object.defineProperty(web, 'current', {
    get: function () {
        if (__current__ != null)
            return __current__;
        //instantiate HTTP application
        __current__ = new HttpApplication();
        //initialize current application
        if (__current__.config == null)
            __current__.init();
        //extend current application
        __current__.extend();
        //and finally return it
        return __current__;
    },
    configurable: false,
    enumerable: false
});

if (typeof exports !== 'undefined') {
    module.exports = web;
}
