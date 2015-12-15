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
/**
 * @ignore
 */
var app = require('./index'),
    async = require('async'),
    aejs = require('async-ejs'),
    fs = require('fs'),
    util = require('util');
/**
 * @class
 * @param {HttpContext} context
 * @constructor
 * @private
 */
function AsyncEjsEngine(context) {
    /**
     * @private
     */
    this._context = context;
}
/**
 *
 * @param {string} path
 * @param {*} data
 * @param {Function} callback
 */
AsyncEjsEngine.prototype.render = function(path, data, callback) {
    var self = this;
    try {

        //todo throw exception if file is missing
        fs.exists(path,function(exist){

            if (!exist) {
                callback.call(self, new common.HttpNotFoundException());
            }

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
                       var viewContext = app.views.createViewContext(self._context);
                       //extend view context with page properties
                       util._extend(viewContext, properties || {});
                       //set view context data
                       viewContext.data = data;
                       if (properties.layout) {
                           var layout = app.current.mapPath(properties.layout);
                           //render view layout
                           aejs.render(str, { locals: viewContext }, function(err, body) {
                               if (err) {
                                   callback(err);
                               }
                               else {
                                   viewContext.body = body;
                                   fs.exists(layout, function(exists) {
                                       if (!exists) {
                                           callback(new Error('Master layout cannot be found.'));
                                       }
                                       else {
                                           //render master layout
                                           fs.readFile(layout,'utf-8', function(err, master) {
                                               try {
                                                   if (err) {
                                                       callback(err);
                                                   }
                                                   else {
                                                       aejs.render(master, { locals: viewContext }, function(err, result) {
                                                           if (err) {
                                                               callback(err);
                                                           }
                                                           else {
                                                               callback(null, result);
                                                           }
                                                       });
                                                   }
                                               }
                                               catch (e) {
                                                   callback(e);
                                               }
                                           });
                                       }
                                   });

                               }
                           });
                       }
                       else {
                           aejs.render(str, { locals: viewContext }, function(err, result) {
                               if (err) {
                                   callback(err);
                               }
                               else {
                                   callback(null, result);
                               }
                           });
                       }
                   }
               }
               catch (e) {
                   callback(e);
               }
           });
        });
    }
    catch (e) {
        callback.call(self, e);
    }
}

/**
 *
 * @param  {HttpContext=} context
 * @returns {AsyncEjsEngine}
 */
AsyncEjsEngine.prototype.createInstance = function(context) {
    return new AsyncEjsEngine(context);
};

if (typeof exports !== 'undefined') module.exports.createInstance = AsyncEjsEngine.prototype.createInstance;
