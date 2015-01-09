'use strict';
var common = require('./common'),
    util = require('util'),
    htmlWriter = require('./html'),
    xml = require('most-xml'),
    path = require('path'),
    da = require("most-data"),
    fs = require('fs'),
    crypto = require('crypto');
/**
 * @class HttpResult
 * @constructor
 */
function HttpResult() {
    this.contentType = 'text/html';
    this.contentEncoding = 'utf8';
}
/**
 *
 * @param {Number=} status
 */
HttpResult.prototype.status = function(status) {
    this.responseStatus = status;
    return this;
};

/**
 * Executes an HttpResult instance against an existing HttpContext.
 * @param {HttpContext} context
 * @param {Function} callback
 * */
HttpResult.prototype.execute = function(context, callback) {
    callback = callback || function() {};
    try {
        var response = context.response;
        response.writeHead(this.responseStatus || 200, {"Content-Type": this.contentType});
       if (this.data)
            response.write(this.data, this.contentEncoding);
        callback.call(context);
    }
    catch(e) {
        callback.call(context, e);
    }
};
/**
 * Represents a user-defined content type that is a result of an action.
 * @param content {String}
 * @param contentType {String}
 * @param contentEncoding {String}
 * @class HttpContentResult
 * */
function HttpContentResult(content) {

    /**
     * Gets or sets the content.
     * @type {String}
     * */
    this.data = content;
    this.contentType = 'text/html';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpContentResult,HttpResult);

/**
 * Represents a content that does nothing.
 * @class HttpEmptyResult
 * @constructor
 */
function HttpEmptyResult() {
    //
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpEmptyResult,HttpResult);

HttpEmptyResult.prototype.execute = function(context, callback)
{
    //do nothing
    callback = callback || function() {};
    callback.call(context);
};

function _json_ignore_null_replacer(key, value) {
    if (value==null)
        return undefined;
    return value;
}

/**
 * Represents an action that is used to send JSON-formatted content.
 */
function HttpJsonResult(data)
{
    if (data instanceof String)
        this.data = data;
    else {
        this.data = JSON.stringify(data, _json_ignore_null_replacer);
    }

    this.contentType = 'application/json;charset=utf-8';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpJsonResult,HttpResult);

/**
 * Represents an action that is used to send Javascript-formatted content.
 * @class HttpJavascriptResult
 * @constructor
 * @augments HttpResult
 */
function HttpJavascriptResult(data)
{
    if (typeof data === 'string')
        this.data = data;
    this.contentType = 'text/javascript;charset=utf-8';
    this.contentEncoding = 'utf8';
}
/**
 * Inherits HttpAction
 * */
util.inherits(HttpJavascriptResult,HttpResult);


/**
 * Represents an action that is used to send XML-formatted content.
 */
function HttpXmlResult(data)
{

    this.contentType = 'text/xml';
    this.contentEncoding = 'utf8';
    if (typeof data === 'undefined' || data == null)
        return;
    if (typeof data === 'object')
        this.data= xml.serialize(data, { item:'Item' }).outerXML();
    else
        this.data=data;
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpXmlResult,HttpResult);

/**
 * Represents a redirect action to a specified URI.
 */
function HttpRedirectResult(url) {
    this.url = url;
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpRedirectResult,HttpResult);
/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpRedirectResult.prototype.execute = function(context, callback)
{
    /**
     * @type ServerResponse
     * */
    var response = context.response;
    response.writeHead(302, { 'Location': this.url });
    //response.end();
    callback.call(context);
};

/**
 * Represents a static file result
 * @param {string} physicalPath
 * @param {string=} fileName
 * @constructor
 */
function HttpFileResult(physicalPath, fileName) {
    //
    this.physicalPath = physicalPath;
    this.fileName = fileName;
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpFileResult,HttpResult);
/**
 *
 * @param {HttpContext} context
 * @param {Function} callback
 */
HttpFileResult.prototype.execute = function(context, callback)
{
    callback = callback || function() {};
    var physicalPath = this.physicalPath, fileName = this.fileName,  app = require('./index');
    fs.exists(physicalPath, function(exists) {
        if (!exists) {
            callback(new app.common.HttpNotFoundException());
        }
        else {
            try {
                fs.stat(physicalPath, function (err, stats) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (!stats.isFile()) {
                            callback(new app.common.HttpNotFoundException());
                        }
                        else {
                            //get if-none-match header
                            var requestETag = context.request.headers['if-none-match'];
                            //generate responseETag
                            var md5 = crypto.createHash('md5');
                            md5.update(stats.mtime.toString());
                            var responseETag = md5.digest('base64');
                            if (requestETag) {
                                if (requestETag == responseETag) {
                                    context.response.writeHead(304);
                                    context.response.end();
                                    callback();
                                    return;
                                }
                            }
                            var contentType = null;
                            //get file extension
                            var extensionName = path.extname(fileName || physicalPath);
                            //get MIME collection
                            var web = require('./index')
                            var mimes = app.current.config.mimes;
                            var contentEncoding = null;
                            //find MIME type by extension
                            var mime = mimes.filter(function (x) {
                                return x.extension == extensionName;
                            })[0];
                            if (mime) {
                                contentType = mime.type;
                                if (mime.encoding)
                                    contentEncoding = mime.encoding;
                            }

                            //throw exception (MIME not found or access denied)
                            if (web.common.isNullOrUndefined(contentType)) {
                                callback(new app.common.HttpForbiddenException())
                            }
                            else {
                                /*//finally process request
                                fs.readFile(physicalPath, 'binary', function (err, data) {
                                    if (err) {
                                        callback(e);
                                    }
                                    else {
                                        //add Content-Disposition: attachment; filename="<file name.ext>"
                                        context.response.writeHead(200, {
                                            'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''),
                                            'ETag': responseETag
                                        });
                                        context.response.write(data, "binary");
                                        callback();
                                    }
                                });*/
                                //create read stream
                                var source = fs.createReadStream(physicalPath);
                                //add Content-Disposition: attachment; filename="<file name.ext>"
                                context.response.writeHead(200, {
                                    'Content-Type': contentType + (contentEncoding ? ';charset=' + contentEncoding : ''),
                                    'ETag': responseETag
                                });
                                //copy file
                                source.pipe(context.response);
                                source.on('end', function() {
                                    callback();
                                });
                                source.on('error', function(err) {
                                    callback(err);
                                });
                            }
                        }
                    }
                });
            }
            catch (e) {
                callback(e);
            }
        }
    });

};

/**
 * Represents a class that is used to render a view.
 * @param {String=} name - The name of the view.
 * @param {Array=} data - The data that are going to be used to render the view.
 */
function HttpViewResult(name, data)
{
    this.name = name;
    this.data = data==undefined? []: data;
    this.contentType = 'text/html';
    this.contentEncoding = 'utf8';
}

/**
 * Inherits HttpAction
 * */
util.inherits(HttpViewResult,HttpResult);
/**
 * @param {HttpContext} context - The HTTP context
 * */
HttpViewResult.prototype.execute = function(context, callback)
{
    var self = this;
    callback = callback || function() {};
    var app = require('./index'),
        array = require('most-array'),
        util = require('util'),
        fs = require('fs');
    /**
     * @type ServerResponse
     * */
    var response = context.response;
    //if the name is not defined get the action name of the current controller
    if (!this.name)
        //get action name
        this.name = context.data['action'];
    //validate [path] route param in order to load a view that is located in a views' sub-directory
    if (context.request.route) {
        var routePath =  context.request.route.path || context.request.route.data("path");
        if (routePath) {
            this.name = path.join(routePath, this.name);
        }
    }
    //get view name
    var viewName = this.name;
    //and of course controller's name
    var controllerName = context.data['controller'];
    //enumerate existing view engines e.g /views/controller/index.[html].ejs or /views/controller/index.[html].xform etc.
    /**
     * {HttpViewEngineReference|*}
     */
    var viewPath = null;
    var viewEngine = array(app.current.config.engines).firstOrDefault(function(x) {
        //resolve view path
        var p = app.current.mapPath(util.format('/views/%s/%s.html.%s',controllerName,viewName, x.extension));
        if (!fs.existsSync(p)) {
            p = app.current.mapPath(util.format('/views/shared/%s.html.%s',viewName, x.extension));
            var res = fs.existsSync(p);
            if (res==true) {
                viewPath = p;
                return true;
            }
        }
        else {
            viewPath = p;
            return true;
        }
        return false;

    });
    if (viewEngine) {
        //get path again
        //var path = app.current.mapPath(util.format('/views/%s/%s.html.%s',controllerName, viewName, viewEngine.extension));
         var engine = require(viewEngine.type);
        /**
         * @type {HttpViewEngine|*}
         */
        var engineInstance = engine.createInstance(context);
        //render
        var e = { context:context, target:self };
        context.emit('preExecuteResult', e, function(err) {
           if (err) {
               callback(err);
           }
            else {
               engineInstance.render(viewPath, self.data, function(err, result) {
                   if (err) {
                       callback.call(context, err);
                   }
                   else {
                       //HttpViewResult.result or data (?)
                       self.result = result;
                       context.emit('postExecuteResult', e, function(err) {
                           if (err) {
                               callback.call(context, err);
                           }
                           else {
                               response.writeHead(200, {"Content-Type": self.contentType});
                               response.write(self.result, self.contentEncoding);
                               callback.call(context);
                           }
                       });
                   }
               });
           }
        });

    }
    else {
        callback.call(context, new common.HttpNotFoundException('View Not Found'));
    }
};


/**
 * Provides methods that respond to HTTP requests that are made to a web application
 * @param {HttpContext} context - The executing HTTP context.
 * @returns {HttpController}
 * */
function HttpController(context) {
    /**
     * Gets or sets the HTTP context associated with this controller
     * @type {HttpContext}
     * */
    this.context = context;
    /**
     * Gets or sets the internal name of this controller
     * @type {string}
     */
    this.name=null;
}

/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.view = function(data)
{
    return new HttpViewResult(null, data);
}

/**
 * Creates a view result based on the context content type
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.result = function(data)
{
    if (this.context) {
         var fn = this[this.context.format];
        if (typeof fn !== 'function')
            throw new common.HttpException(400,'Not implemented.');
        return fn.call(this, data);
    }
    else
        throw new Error('Http context cannot be empty at this context.');
};

HttpController.prototype.forbidden = function (callback) {
    callback(new common.HttpForbiddenException());
};

/**
 * Creates a view result object for the given request.
 * @param {*=} data
 * @returns HttpViewResult
 * */
HttpController.prototype.html = function(data)
{
    return new HttpViewResult(null, data);
};

/**
 * Creates a view result object for the given request.
 * @param {String=} data
 * @returns HttpJavascriptResult
 * */
HttpController.prototype.js = function(data)
{
    return new HttpJavascriptResult(data);
}

/**
 * Creates a view result object that represents a client javascript object.
 * This result may be used for sharing specific objects stored in memory or server filesystem
 * e.g. serve a *.json file as a client variable with name window.myVar1 or
 * serve user settings object ({ culture: 'en-US', notifyMe: false}) as a variable with name window.settings
 * @param {String} name
 * @param {String|*} obj
 * @returns HttpResult
 * */
HttpController.prototype.jsvar = function(name, obj)
{
    if (typeof name !== 'string')
        return new HttpEmptyResult();
    if (name.length==0)
        return new HttpEmptyResult();
    if (typeof obj === 'undefined' || obj == null)
        return new HttpJavascriptResult(name.concat(' = null;'));
    else if (obj instanceof Date)
        return new HttpJavascriptResult(name.concat(' = new Date(', obj.valueOf(), ');'));
    else if (typeof obj === 'string')
        return new HttpJavascriptResult(name.concat(' = ', obj, ';'));
    else
        return new HttpJavascriptResult(name.concat(' = ', JSON.stringify(obj), ';'));
};

/**
 * Invokes a default action and returns an HttpViewResult instance
 * @param {String} action
 * @param {Function} callback
 */
HttpController.prototype.action = function(callback)
{
    callback(null, this.view());
}

/**
 * Creates a content result object by using a string.
 * @returns HttpContentResult
 * */
HttpController.prototype.content = function(content)
{
     return new HttpContentResult(content);
}
/**
 * Creates a JSON result object by using the specified data.
 * @returns HttpJsonResult
 * */
HttpController.prototype.json = function(data)
{
    return new HttpJsonResult(data);
}

/**
 * Creates a XML result object by using the specified data.
 * @returns HttpXmlResult
 * */
HttpController.prototype.xml = function(data)
{
    return new HttpXmlResult(data);
}

/**
 * Creates a binary file result object by using the specified path.
 * @param {string}  physicalPath
 * @param {string=}  fileName
 * @returns {HttpFileResult|HttpResult}
 * */
HttpController.prototype.file = function(physicalPath, fileName)
{
    return new HttpFileResult(physicalPath, fileName);
}

/**
 * Creates a redirect result object that redirects to the specified URL.
 * @returns HttpRedirectResult
 * */
HttpController.prototype.redirect = function(url)
{
    return new HttpRedirectResult(url);
}

/**
 * Creates an empty result object.
 * @returns HttpEmptyResult
 * */
HttpController.prototype.empty = function()
{
    return new HttpEmptyResult();
}
/**
 * Abstract view engine class
 * @param {HttpContext} context
 * @constructor
 * @augments {EventEmitter}
 */
function HttpViewEngine(context) {
    //
}
util.inherits(HttpViewEngine, da.types.EventEmitter2);

/**
 * Renders the specified view with the options provided
 * @param url
 * @param options
 */
HttpViewEngine.prototype.render = function(url, options, callback) {
    //
}


/**
 * Defines an HTTP view engine in application configuration
 * @constructor
 */
function HttpViewEngineReference()
{
    /**
     * Gets or sets the class associated with an HTTP view engine
     * @type {String}
     */
    this.type = null;
    /**
     * Gets or sets the name of an HTTP view engine
     * @type {String}
     */
    this.name = null;
    /**
     * Gets or sets the layout extension associated with an HTTP view engine
     * @type {null}
     */
    this.extension = null;
}

/**
 * Encapsulates information that is related to rendering a view.
 * @param {HttpContext} context
 * @property {DataModel} model
 * @constructor
 * @augments {EventEmitter}
 */
function HttpViewContext(context) {
    /**
     * Gets or sets the body of the current view
     * @type {String}
     */
    this.body='';
    /**
     * Gets or sets the title of the page if the view will be fully rendered
     * @type {String}
     */
    this.title='';
    /**
     * Gets or sets the view layout page if the view will be fully rendered
     * @type {String}
     */
    this.layout = null;
    /**
     * Gets or sets the view data
     * @type {String}
     */
    this.data = null;
    /**
     * Represents the current HTTP context
     * @type {HttpContext}
     */
    this.context = context;

    /**
     * @type {HtmlWriter}
     */
    this.writer = undefined;

    var writer = null;
    Object.defineProperty(this, 'writer', {
        get:function() {
            if (writer)
                return writer;
            writer = htmlWriter.createInstance();
            writer.indent = false;
            return writer;
        }, configurable:false, enumerable:false
    });

    var self = this;
    Object.defineProperty(this, 'model', {
        get:function() {
            if (self.context.params)
                if (self.context.params.controller)
                    return self.context.model(self.context.params.controller);
            return null;
        }, configurable:false, enumerable:false
    });

    this.html = HttpViewContext.HtmlViewHelper(this);
    //class extension initiators
    if (typeof this.init === 'function') {
        //call init() method
        this.init();
    }
}
util.inherits(HttpViewContext, da.types.EventEmitter2);
/**
 * @param {String} url
 * @returns {string}
 */
HttpViewContext.prototype.render = function(url, callback) {
    callback = callback || function() {};
    var app = require('./index');
    app.current.executeRequest( { url: url, cookie: this.context.request.headers.cookie }, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, result.body);
        }
    });
};

HttpViewContext.prototype.init = function() {
    //
};

/**
 *
 * @param {String} s
 * @param {String=} lib
 * @returns {String}
 */
HttpViewContext.prototype.translate = function(s, lib) {
    return this.context.translate(s, lib);
};
/**
 *
 * @param {String} s
 * @param {String=} lib
 * @returns {String}
 */
HttpViewContext.prototype.$T = function(s, lib) {
    return this.translate(s, lib);
};

/**
 * @param {HttpViewContext} $view
 * @returns {*}
 */
HttpViewContext.HtmlViewHelper = function($view)
{
    var doc;
    return {
    /**
     * Gets a cross-site anti-forgery token included in an input hidden tag.
     * @returns {String}
     */
    antiforgery: function() {
        //create token
        var context = $view.context,  value = context.application.encypt(JSON.stringify({ id: Math.floor(Math.random() * 1000000), url:context.request.url, date:new Date() }));
        //try to set cookie
        context.response.setHeader('Set-Cookie','.CSRF='.concat(value));
        return $view.writer.writeAttribute('type', 'hidden')
            .writeAttribute('id', '_CSRFToken')
            .writeAttribute('name', '_CSRFToken')
            .writeAttribute('value', value)
            .writeFullBeginTag('input')
            .toString();
    },
        /**
         *
         * @param {*} obj
         * @returns {jQuery|*}
         */
    element: function(obj) {
        if (typeof doc === 'undefined') { doc = $view.context.application.document(); }
        return doc.parentWindow.angular.element(obj);
    },
        lang: function() {
            var context = $view.context, c= context.culture();
            if (typeof c === 'string') {
                if (c.length>=2) {
                    return c.toLowerCase().substring(0,2);
                }
            }
            //in all cases return default culture
            return 'en';
        }
};
}

var mvc = {
    /**
     * @class HttpResult
     * */
    HttpResult : HttpResult,
    /**
     * @class HttpContentResult
     * */
    HttpContentResult : HttpContentResult,
    /**
     * @class HttpJsonResult
     * */
    HttpJsonResult:HttpJsonResult,
    /**
     * @class HttpEmptyResult
     * */
    HttpEmptyResult:HttpEmptyResult,
    /**
     * @class HttpXmlResult
     * */
    HttpXmlResult:HttpXmlResult,
    /**
     * @class HttpRedirectResult
     * */
    HttpRedirectResult:HttpRedirectResult,
    /**
     * @class HttpFileResult
     * */
    HttpFileResult:HttpFileResult,
    /**
     * @class HttpViewResult
     * */
    HttpViewResult:HttpViewResult,
    /**
     * @class HttpViewContext
     * */
    HttpViewContext:HttpViewContext,
    /**
     * @class HttpController
     * */
    HttpController:HttpController,
    /**
     * @class HttpViewEngine
     * */
    HttpViewEngine: HttpViewEngine,
    /**
     * @class HttpViewEngineReference
     * */
    HttpViewEngineReference: HttpViewEngineReference
}

if (typeof exports !== 'undefined')
{
    module.exports = mvc;
}



