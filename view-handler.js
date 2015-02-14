/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-05-07
 */
/**
 * Routing HTTP Handler
 */
var app = require('./index'),
    array = require('most-array'),
    url = require('url'),
    util = require('util'),
    fs = require('fs'),
    route = require('./http-route.js'),
    xml = require('most-xml'),
    path=require('path'),
    S = require('string');
    ;
/**
 * @class ViewHandler
 * @constructor
 * @augments HttpHandler
 */
function ViewHandler() {
    //
}
/**
 *
 * @param ctor
 * @param superCtor
 */
Object.inherits = function (ctor, superCtor) {
    if (!ctor.super_) {
        ctor.super_ = superCtor;
        while (superCtor) {
            var superProto = superCtor.prototype;
            var keys = Object.keys(superProto);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (typeof ctor.prototype[key] === 'undefined')
                    ctor.prototype[key] = superProto[key];
            }
            superCtor = superCtor.super_;
        }
    }
}
ViewHandler.STR_CONTROLLERS_FOLDER = 'controllers';
ViewHandler.STR_CONTROLLER_FILE = './%s-controller.js'
ViewHandler.STR_CONTROLLER_RELPATH = '/controllers/%s-controller.js'

ViewHandler.queryControllerClass = function(controllerName, context, callback) {

    if (typeof controllerName === 'undefined' || controllerName==null) {
        callback();
    }
    else {
        //get controller class path and model (if any)
        var controllerPath = app.current.mapPath(util.format(ViewHandler.STR_CONTROLLER_RELPATH, S(controllerName).dasherize().chompLeft('-').toString())),
            controllerModel = context.model(controllerName);
        //if controller does not exists
        fs.exists(controllerPath, function(exists){
            try {
                //if controller class file does not exist in /controllers/ folder
                if (!exists) {
                    //try to find if current controller has a model defined
                    if (controllerModel) {
                        var controllerType = controllerModel.type || 'data';
                        //try to find controller based on the model's type in controllers folder (e.g. /library-controller.js)
                        controllerPath = app.current.mapPath(util.format(ViewHandler.STR_CONTROLLER_RELPATH, controllerType));

                        fs.exists(controllerPath, function(exists) {
                           if (!exists) {
                               //get controller path according to related model's type (e.g ./data-controller)
                               controllerPath = util.format(ViewHandler.STR_CONTROLLER_FILE, controllerType);
                               //if controller does not exist
                               controllerPath = path.join(__dirname, controllerPath);
                               fs.exists(controllerPath, function(exists) {
                                   if (!exists)
                                       callback(null, './base-controller');
                                   else
                                       callback(null, controllerPath);
                               });
                           }
                           else {
                               callback(null, controllerPath);
                           }
                        });
                    }
                    else {
                        //get base controller path (
                        callback(null, './base-controller');
                    }
                }
                else {
                    //return controller class
                    callback(null, controllerPath);
                }
            }
            catch (e) {
                callback(e);
            }
        });
    }
};

ViewHandler.prototype.beginRequest = function (context, callback) {
    //angularjs compatibility headers
    if (context.response) {
        context.response.setHeader("Access-Control-Allow-Origin", "*");
        context.response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        context.response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    callback();
};

ViewHandler.RestrictedLocations = [
    { "path":"^/controllers/", "description":"Most web framework server controllers" },
    { "path":"^/models/", "description":"Most web framework server models" },
    { "path":"^/extensions/", "description":"Most web framework server extensions" },
    { "path":"^/handlers/", "description":"Most web framework server handlers" },
    { "path":"^/views/", "description":"Most web framework server views" }
];

ViewHandler.prototype.authorizeRequest = function (context, callback) {
    try {
        var uri = url.parse(context.request.url);
        for (var i = 0; i < ViewHandler.RestrictedLocations.length; i++) {
            /**
             * @type {*|LocationSetting}
             */
            var location = ViewHandler.RestrictedLocations[i], re = new RegExp(location.path,'ig');
            if (re.test(uri.pathname)) {
                callback(new app.common.HttpException(403, 'Forbidden'))
                return;
            }
        }
        callback();
    }
    catch(e) {
        callback(e);
    }
};

/**
 * @param {HttpContext} context
 */
ViewHandler.prototype.mapRequest = function (context, callback) {
    callback = callback || function () {
    };

    //try to map request
    try {

        //first of all check if a request handler is already defined
        if (typeof context.request.currentHandler !== 'undefined') {
            //do nothing (exit mapping)
            callback();
            return;
        }

        var requestUri = url.parse(context.request.url);

        /**
         * find route by querying application routes
         * @type {HttpRoute}
         */
        var currentRoute = queryRoute(requestUri);
        if (typeof currentRoute === 'undefined' || currentRoute == null) {
            //do nothing
            callback();
            return;
        }
        fs.stat(app.current.mapPath(context.request.url), function(err, stats) {

            if (stats && stats.isFile()) {
                //do nothing
                callback();
                return;
            }
            else {

                try {
                    //query controller
                    var arr = currentRoute.routeData.filter(function(x) { return (x.name==":controller"); });
                    var controllerName = (arr.length>0) ? arr[0].value : queryController(requestUri),
                        ControllerClass = null;
                    if (controllerName != null) {
                        //try to find controller class
                        ViewHandler.queryControllerClass(controllerName, context, function(err, controllerPath) {
                            if (err) {
                                callback(err)
                            }
                            else {
                                try {
                                    /**
                                     * @augments {HttpController}
                                     */
                                    ControllerClass = require(controllerPath);
                                    //initialize controller
                                    var controller = new ControllerClass();
                                    //set controller's name
                                    controller.name = controllerName.toLowerCase();
                                    //set controller's context
                                    controller.context = context;
                                    //set request handler
                                    var handler = new ViewHandler();
                                    handler.controller = controller;
                                    context.request.currentHandler = handler;
                                    //set route data
                                    context.request.route = currentRoute;
                                    context.request.routeData = currentRoute.routeData;
                                    //set route data as params
                                    for (var i = 0; i < currentRoute.routeData.length; i++) {
                                        var item = currentRoute.routeData[i], name = item.name.substr(1);
                                        context.params[name] = item.value;
                                    }
                                    callback.call(context);
                                }
                                catch(e) {
                                    callback(e);
                                }
                            }
                        });
                    }
                    else {
                        callback.call(context);
                    }
                }
                catch(e) {
                    callback(e);
                }
            }
        });
    }
    catch (e) {
        callback(e);
    }

};
/**
  * @param {HttpContext} context
 * @param {Function(Error=)} callback
 */
ViewHandler.prototype.postMapRequest = function (context, callback) {
    try {
        var model = null;
        if (context.params)
            if (context.params.controller)
                model = context.model(context.params.controller)
        if (context.isPost()) {
            if (context.format=='xml') {
                //get current model
                if (context.request.body) {
                    //load xml
                    try {
                        var doc = xml.loadXML(context.request.body);
                        //todo::validate current model
                        var obj = xml.deserialize(doc.documentElement);
                        context.params.data = obj;
                        callback();
                    }
                    catch (e) {
                        callback(e);
                    }
                    return;
                }
            }
            else if (context.format=='json') {
                if (context.request.body) {
                    //load json
                    //todo::validate current model
                    var obj = JSON.parse(context.request.body)
                    context.params.data = obj;
                    callback();
                    return;
                }
            }
        }
        callback();
    }
    catch(e) {

    }
};

/**
 * @param {HttpContext} context
 */
ViewHandler.prototype.processRequest = function (context, callback) {
    var self = this;
    callback = callback || function () {
    };
    try {
        //todo:execute controller
        var common = require('./common'), app = require('./index');
        //validate request controller
        var controller = self.controller;
        if (controller) {
            /**
             * try to find action
             * @type {String}
             */
            var action = context.data['action'];
            if (action) {
                //todo::throw exception (forbidden) for partial views (action name starts with _)
                /*if (action.indexOf('_')==0) {
                    throw new app.common.HttpForbiddenException();
                }*/
                //execute action
                var fn = controller[action];
                if (typeof fn !== 'function') {
                    fn = controller.action;
                }
                if (typeof fn !== 'function') {
                    throw new app.common.HttpNotFoundException();
                }
                //enumerate params
                var params = common.getFunctionParams(fn);
                params = [];
                /**
                 * @type HttpResult
                 * */
                params.push(function (err, result) {
                    if (err) {
                        //throw error
                        callback.call(context, err);
                    }
                    else {
                        //execute http result
                        result.execute(context, callback);
                    }
                });
                //invoke controller method
                fn.apply(controller, params);
                return;
            }
        }
        callback.call(context);
    }
    catch (e) {
        callback.call(context, e);
    }
}

/**
 *
 * @param {String} requestUrl
 * @returns {HttpRoute}
 */
function queryRoute(requestUri) {
    try {
        var array = require('most-array'),
            util = require('util'),
            route = require('./http-route.js'),
            app = require('./index');
        /**
         * @type Array
         * */
        var routes = app.current.config.routes;
        //enumerate registered routes
        var httpRoute = null;
        array(routes).each(function (item) {
            //initialize HttpRoute object
            /**
             * @type HttpRoute
             */
            httpRoute = route.createInstance(item.url, item.route);
            util._extend(httpRoute, item);
            //if uri path is matched
            if (httpRoute.isMatch(requestUri.pathname)) {
                //parse route
                httpRoute.parse(requestUri.pathname);
                //get or set controller
                var param = array(httpRoute.routeData).firstOrDefault(function (x) {
                    return x.name == ":controller";
                });
                if (!param) {
                    if (item.controller) {
                        httpRoute.routeData.push({name: ":controller", value: item.controller})
                    }
                    else {
                        httpRoute.routeData.push({name: ":controller", value: queryController(requestUri)})
                    }
                }
                //get or set action
                param = array(httpRoute.routeData).firstOrDefault(function (x) {
                    return x.name == ":action";
                });
                if (!param) httpRoute.routeData.push({name: ":action", value: item.action});
                if (item.mime) {
                    httpRoute.routeData.push({name: ":mime", value: item.mime });
                }
                else {
                    var mime = app.current.resolveMime(requestUri.pathname);
                    if (mime)
                        httpRoute.routeData.push({name: ":mime", value: mime.type });
                }
                //exit loop
                return false;
            }
            httpRoute = null;
        });
        return httpRoute;
    }
    catch (e) {
        throw e;
    }
}

/**
 * Gets the controller of the given url
 * @param requestUrl {Url} - A string that represents the url we want to parse.
 * */
function queryController(requestUri) {
    try {
        if (requestUri === undefined)
            return null;
        //split path
        var segments = requestUri.pathname.split('/');
        //put an exception for root controller
        //maybe this is unnecessary exception but we need to search for root controller e.g. /index.html, /about.html
        if (segments.length == 2)
            return 'root';
        else
        //e.g /pages/about where segments are ['','pages','about']
        //and the controller of course is always the second segment.
            return segments[1];
        //todo:validate workspaces (e.g. /my-workspace/pages/about) where controller segment differs based on the workspace url.

    }
    catch (e) {
        throw e;
    }
}

/**
 * Gets the action of the given url
 * @param requestUrl {Url} - A string that represents the url we want to parse.
 * */
function queryAction(requestUri) {
    try {
        if (requestUri === undefined)
            return null;
        //split path
        var segments = requestUri.pathname.split('/');
        //put an exception for root controller
        //maybe this is unnecessary exception but we need to search for root controller e.g. /index.html, /about.html
        if (segments.length == 2)
            return 'root';
        else
        //e.g /pages/about where segments are ['','pages','about']
        //and the controller of course is always the second segment.
            return segments[1];
        //todo:validate workspaces (e.g. /my-workspace/pages/about) where controller segment differs based on the workspace url.

    }
    catch (e) {
        throw e;
    }
}

/**
 * @returns ViewHandler
 * */
ViewHandler.prototype.createInstance = function () {
    return new ViewHandler();
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') module.exports = ViewHandler.prototype.createInstance();

