/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-06-09
 */
var app = require('./index'),
    async = require('async'),
    util = require('util');
/**
 * @class EjsEngine
 * @param {HttpContext=} context
 * @constructor
 * @property {HttpContext} context Gets or sets an instance of HttpContext that represents the current HTTP context.
 */
function EjsEngine(context) {
    /**
     * @type {HttpContext}
     */
    var ctx = context;
    Object.defineProperty(this,'context', {
        get: function() {
            return ctx;
        },
        set: function(value) {
            ctx = value;
        },
        configurable:false,
        enumerable:false
    });
}

/**
 *
 * @param {String} path
 * @param {any} options
 */
EjsEngine.prototype.render = function(path, data, callback) {
    var self = this;
    try {
        var ejs = require('ejs'), fs = require('fs'), common = require('./common');
        //todo throw exception if file is missing
        if (fs.existsSync(path))
        {
            fs.readFile(path,'utf-8', function(err, str) {
                try {
                    if (err) {
                        callback.call(self, err);
                    }
                    else {
                        //get view header (if any)
                        var matcher = new RegExp('<%#(.*?)%>');
                        var properties = { layout:null };
                        if (matcher.test(str)) {
                            var matches = matcher.exec(str);
                            //get matches[1] because matches[0] contains the expression with tags
                            properties = JSON.parse(matches[1]);
                            //remove match
                            str = str.replace(matcher,'');
                        }
                        //create view context
                        var viewContext = app.views.createViewContext(self.context);
                        //extend view context with page properties
                        util._extend(viewContext, properties || {});
                        //set view context data
                        viewContext.data = data;
                        if (properties.layout) {
                            var layout = app.current.mapPath(properties.layout);
                            //set current view buffer (after rendering)
                            viewContext.body = ejs.render(str, viewContext);
                            //render master
                            fs.exists(layout, function(exists) {
                                if (!exists) {
                                    callback(new Error('Master layout cannot be found.'));
                                }
                                else {
                                    //render master layout
                                    fs.readFile(layout,'utf-8', function(err, layoutData) {
                                        try {
                                            if (err) {
                                                callback(err);
                                            }
                                            else {
                                                var result = ejs.render(layoutData, viewContext);
                                                callback(null, result);
                                            }
                                        }
                                        catch (e) {
                                            callback(e);
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            var result = ejs.render(str, viewContext);
                            callback(null, result);
                        }
                    }
                }
                catch (e) {
                    callback(e);
                }
            });


        }
        else {
            throw new common.HttpNotFoundException();
        }

    }
    catch (e) {
        callback.call(self, e);
    }
}

/**
 *
 * @param  {HttpContext=} context
 * @returns {EjsEngine}
 */
EjsEngine.prototype.createInstance = function(context) {
    return new EjsEngine(context);
};

if (typeof exports !== 'undefined') module.exports.createInstance = EjsEngine.prototype.createInstance;
