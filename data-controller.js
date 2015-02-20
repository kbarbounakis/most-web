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
var util = require('util');
var mvc = require('./http-mvc'),
    xml = require('most-xml'),
    string = require('string'),
    common = require('./common');
/**
 * @class HttpDataController
 * @constructor
 * @augments HttpController
 * @property {DataModel} model Gets or sets the current data model.
 */
function HttpDataController()
{
    /**
     * @type {DataModel}
     */
    this.model = undefined;
    /**
     * Gets or sets the model associated with this controller
     * @type {DataModel}
     */
    var model = null;
    var self = this;
    Object.defineProperty(this, 'model', {
        get: function() {
            if (model)
                return model;
            model = self.context.model(self.name);
            return model;
        },
        set: function(value) {
          model = value;
        }, configurable:false, enumerable:false
    });
}
util.inherits(HttpDataController, mvc.HttpController);

/**
 * Handles data object creation (e.g. /user/1/new.html, /user/1/new.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.new = function (callback) {
    try {
        var self = this,
            context = self.context;
        context.handle(['GET'],function() {
            callback(null, self.result());
        }).handle(['POST', 'PUT'],function() {
            var target = context.params[self.model.name] || context.params.data;
            self.model.save(target, function(err)
            {
                if (err) {
                    callback(common.httpError(err));
                }
                else {
                    if (context.params.attr('returnUrl'))
                        callback(null, context.params.attr('returnUrl'));
                    callback(null, self.result(target));
                }
            });
        }).unhandle(function() {
            callback(new common.HttpMethodNotAllowed());
        });
    }
    catch (e) {
        callback(common.httpError(e));
    }
};
/**
 * Handles data object edit (e.g. /user/1/edit.html, /user/1/edit.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.edit = function (callback) {
    try {
        var self = this,
            context = self.context;
        context.handle(['POST', 'PUT'], function() {
            //get context param
            var target = self.model.convert(context.params[self.model.name] || context.params.data, true);
            if (target) {
                self.model.save(target, function(err)
                {
                    if (err) {
                        console.log(err);
                        console.log(err.stack);
                        callback(common.httpError(err));
                    }
                    else {
                        if (context.params.attr('returnUrl'))
                            callback(null, context.params.attr('returnUrl'));
                        callback(null, self.result(target));
                    }
                });
            }
            else {
                callback(new common.HttpBadRequest());
            }
        }).handle('DELETE', function() {
            //get context param
            var target = context.params[self.model.name] || context.params.data;
            if (target) {
                //todo::check if object exists
                self.model.remove(target, function(err)
                {
                    if (err) {
                        callback(common.httpError(err));
                    }
                    else {
                        if (context.params.attr('returnUrl'))
                            callback(null, context.params.attr('returnUrl'));
                        callback(null, self.result(null));
                    }
                });
            }
            else {
                callback(new common.HttpBadRequest());
            }
        }).handle('GET', function() {
            if (context.request.route) {
                if (context.request.route.static) {
                    callback(null, self.result());
                    return;
                }
            }
            //get context param (id)
            var filter = null, id = context.params.attr('id');
            if (id) {
                //create the equivalent open data filter
                filter = util.format('%s eq %s',self.model.primaryKey,id);
            }
            else {
                //get the requested open data filter
                filter = context.params.attr('$filter');
            }
            if (filter) {
                self.model.filter(filter, function(err, q) {
                    if (err) {
                        callback(common.httpError(err));
                        return;
                    }
                    q.take(1, function (err, result) {
                        try {
                            if (err) {
                                callback(err);
                            }
                            else {
                                if (result.length>0)
                                    callback(null, self.result(result));
                                else
                                    callback(null, self.result(null));
                            }
                        }
                        catch (e) {
                            callback(common.httpError(e));
                        }
                    });
                });
            }
            else {
                callback(new common.HttpBadRequest());
            }

        }).unhandle(function() {
            callback(new common.HttpMethodNotAllowed());
        });

    }
    catch (e) {
        callback(common.httpError(e));
    }

}

HttpDataController.prototype.schema = function (callback) {
    var self = this, context = self.context;
    context.handle('GET', function() {
        if (self.model) {
            //prepare client model
            var clone = JSON.parse(JSON.stringify(self.model));
            var m = util._extend({}, clone);
            //delete private properties
            var keys = Object.keys(m);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
               if (key.indexOf("_")==0)
                   delete m[key];
            }
            //delete other server properties
            delete m.view;
            delete m.source;
            delete m.fields;
            delete m.privileges;
            delete m.constraints;
            delete m.eventListeners;
            //set fields equal attributes
            m.attributes = JSON.parse(JSON.stringify(self.model.attributes));
            m.attributes.forEach(function(x) {
                var mapping = self.model.inferMapping(x.name);
                if (mapping)
                    x.mapping = JSON.parse(JSON.stringify(mapping));;
                //delete private properties
                delete x.value;
                delete x.calculation;
            });
            //prepape views and view fields
            if (m.views) {
                m.views.forEach(function(view) {
                   view.fields.forEach(function(field) {
                       if (/\./.test(field.name)==false) {
                           //extend view field
                           var name = field.name;
                           var mField = m.attributes.filter(function(y) {
                               return (y.name==name);
                           })[0];
                           if (mField) {
                               for (var key in mField) {
                                   if (mField.hasOwnProperty(key) && !field.hasOwnProperty(key)) {
                                           field[key] = mField[key];
                                   }
                               }
                           }
                       }
                   });
                });
            }
            callback(null, self.result(m));
        }
        else {
            callback(new common.HttpNotFoundException());
        }

    }).unhandle(function() {
        callback(new common.HttpMethodNotAllowed());
    });
}

/**
 * Handles data object display (e.g. /user/1/show.html, /user/1/show.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.show = function (callback) {
    try {
        var self = this, context = self.context;
        context.handle('GET', function() {
            if (context.request.route) {
                if (context.request.route.static) {
                    callback(null, self.result());
                    return;
                }
            }
            var filter = null, id = context.params.attr('id');
            if (id) {
                //create the equivalent open data filter
                filter = util.format('%s eq %s',self.model.primaryKey,id);
            }
            else {
                //get the requested open data filter
                filter = context.params.attr('$filter');
            }
            self.model.filter(filter, function(err, q) {
                if (err) {
                    callback(common.httpError(err));
                    return;
                }
                q.take(1, function (err, result) {
                    try {
                        if (err) {
                            callback(common.httpError(e));
                        }
                        else {
                            if (result.length>0)
                                callback(null, self.result(result));
                            else
                                callback(new common.HttpNotFoundException('Item Not Found'));
                        }
                    }
                    catch (e) {
                        callback(common.httpError(e));
                    }
                });
            });
        }).unhandle(function() {
            callback(new common.HttpMethodNotAllowed());
        });
    }
    catch (e) {
        callback(e);
    }
}
/**
 * Handles data object deletion (e.g. /user/1/remove.html, /user/1/remove.json etc)
 * @param {Function} callback
 */
HttpDataController.prototype.remove = function (callback) {
    try {
        var self = this, context = self.context;
        context.handle(['POST','DELETE'], function() {
            var target = context.params[self.model.name] || context.params.data;
            if (target) {
                self.model.remove(target, function(err)
                {
                    if (err) {
                        callback(common.httpError(err));
                    }
                    else {
                        if (context.params.attr('returnUrl'))
                            callback(null, context.params.attr('returnUrl'));
                        callback(null, self.result(target));
                    }
                });
            }
            else {
                callback(new common.HttpBadRequest());
            }
        }).unhandle(function() {
            callback(new common.HttpMethodNotAllowed());
        });
    }
    catch (e) {
        callback(common.httpError(e))
    }
}

/**
 * @param {Function(Error,DataQueryable)} callback
 * @private
 */
HttpDataController.prototype.filter = function (callback) {

    var self = this, params = self.context.params;

    if (typeof self.model !== 'object' || self.model == null) {
        callback(new Error('Model is of the wrong type or undefined.'));
        return;
    }

    var filter = params['$filter'],
        select = params['$select'],
        skip = params['$skip'] || 0,
        orderBy = params['$orderby'] || params.attr('$order'),
        groupBy = params.attr('$group') || params.attr('$groupby'),
        expand = params.attr('$expand');

    self.model.filter(filter,
        /**
         * @param {Error} err
         * @param {DataQueryable} q
         */
         function (err, q) {
            try {
                if (err) {
                    callback(err);
                }
                else {
                    //set $groupby
                    if (groupBy) {
                        var arr = groupBy.split(',');
                        var fields = [];
                        for (var i = 0; i < arr.length; i++) {
                            var item = string(arr[i]).trim().toString();
                            var field = self.model.field(item);
                            if (field) {
                                fields.push(field.name);
                            }
                        }
                        if (fields.length>0) {
                            q.query.groupBy(fields);
                        }
                    }
                    //set $select
                    if (select) {
                        var arr = select.split(',');
                        var fields = [];
                        for (var i = 0; i < arr.length; i++) {
                            var item = string(arr[i]).trim().toString();
                            var field = self.model.field(item);
                            if (field)
                                fields.push(field.name);
                            else {
                                //validate aggregate functions
                                if (/(count|avg|sum|min|max)\((.*?)\)/i.test(item)) {
                                    fields.push(q.fieldOf(item));
                                }
                            }
                        }
                        if (fields.length>0) {
                            q.select(fields);
                        }
                        else {
                            //search for data view
                            if (arr.length==1) {
                                var view = self.model.dataviews(arr[0]);
                                if (view) {
                                    q.select(view.name);
                                }
                            }
                        }
                    }
                    //set $skip
                    q.skip(skip);
                    //set $orderby
                    if (orderBy) {
                        var arr = orderBy.split(',');
                        for (var i = 0; i < arr.length; i++) {
                            var item = string(arr[i]).trim().toString(), name = null, direction = 'asc';
                            if (/ asc$/i.test(item)) {
                                name=item.substr(0,item.length-4);
                            }
                            else if (/ desc$/i.test(item)) {
                                direction = 'desc';
                                name=item.substr(0,item.length-5);
                            }
                            else if (!/\s/.test(item)) {
                                name = item;
                            }
                            if (name) {
                                var field = self.model.field(name);
                                if (field) {
                                    if (direction=='desc')
                                        q.orderByDescending(name);
                                    else
                                        q.orderBy(name);
                                }
                                else {
                                    //validate aggregate functions
                                    if (/(count|avg|sum|min|max)\((.*?)\)/i.test(name)) {
                                        if (direction=='desc')
                                            q.orderByDescending(name);
                                        else
                                            q.orderBy(name);
                                    }
                                }

                            }
                        }
                    }
                    if (expand) {
                        if (expand.length>0) {
                            expand.split(',').map(function(x) { return x.replace(/\s/g,''); }).forEach(function(x) {
                                if (x.length)
                                    q.expand(x.replace(/\s/g,''));
                            });
                        }
                    }
                    //return
                    callback(null, q);
                }
            }
            catch (e) {
               callback(e);
            }
        });
};
/**
 *
 * @param {Function} callback
 */
HttpDataController.prototype.index = function(callback)
{

    try {
        var self = this, context = self.context, take = (parseInt(self.context.params.$top) || 0) > 0 ? (parseInt(self.context.params.$top) || 0) : 25;
        var count = /^true$/ig.test(context.params.attr('$inlinecount')) || false, expand = context.params.attr('$expand');
        var orderBy = context.params.attr('$orderby') || '',
            filter = context.params.attr('$filter') || '',
            asArray = (context.params.attr('$array') || 'false').toLowerCase()=='true';
        context.handle('GET', function() {
            if (context.request.route) {
                if (context.request.route.static) {
                    callback(null, self.result([]));
                    return;
                }
            }
            self.filter(function(err, q) {
                try {
                    if (err) {
                        callback(common.httpError(err));
                    }
                    else {

                        if (expand) {
                            if (expand.length>0) {
                                var arr = expand.split(',');
                                arr.forEach(function(x) {
                                    q.expand(x.replace(/\s/g,''));
                                });
                            }
                        }

                        var q1 = null;
                        if (count) {
                            q1 = q.clone();
                        }
                        //pass as array option
                        q.asArray(asArray);
                        if (take<0) {
                            q.all(function(err, result)
                            {
                                if (err) {
                                    callback(common.httpError(err));
                                    return;
                                }
                                if (count) {
                                    result = { records: (result || []) };
                                    result.total = result.records.length;
                                    callback(null, self.result(result));
                                }
                                else {
                                    callback(null, self.result(result || []));
                                }
                            });
                        }
                        else {
                            q.take(take, function(err, result)
                            {
                                if (err) {
                                    callback(common.httpError(err));
                                    return;
                                }
                                if (count) {
                                    q1.count(function(err, total) {
                                        if (err) {
                                            callback(common.httpError(err));
                                        }
                                        else {
                                            result = { total: total, records: (result || []) };
                                            callback(null, self.result(result));
                                        }
                                    });
                                }
                                else {
                                    callback(null, self.result(result || []));
                                }
                            });
                        }

                    }
                }
                catch (e) {
                    callback(e);
                }
            });
        }).unhandle(function() {
            callback(new common.HttpMethodNotAllowed());
        });
    }
    catch (e) {
        callback(common.httpError(e));
    }
};

HttpDataController.prototype.association = function(callback) {
    try {
        var self = this, parent = self.context.params.parent, model = self.context.params.model;
        if (common.isNullOrUndefined(parent) || common.isNullOrUndefined(model)) {
            callback(new common.HttpBadRequest());
            return;
        }
        self.model.where(self.model.primaryKey).equal(parent).select([self.model.primaryKey]).first(function(err, result) {
            if (err) {
                common.log(err);
                callback(new common.HttpServerError());
                return;
            }
            if (common.isNullOrUndefined(result)) {
                callback(new common.HttpNotFoundException());
                return;
            }
            //get parent object (DataObject)
            var obj = self.model.convert(result);
            var associatedModel = self.context.model(model);
            if (common.isNullOrUndefined(associatedModel)) {
                callback(new common.HttpNotFoundException());
                return;
            }
            var field = associatedModel.attributes.filter(function(x) { return x.type === self.model.name; })[0];
            if (common.isNullOrUndefined(field)) {
                callback(new common.HttpNotFoundException());
                return;
            }
            //get field mapping
            var mapping = associatedModel.inferMapping(field.name);
            associatedModel.filter(self.context.params, function(err, q) {
                if (err) {
                    callback(err);
                }
                else {
                    q.where(mapping.childField).equal(parent).list(function(err, result) {
                        callback(err, self.result(result));
                    });
                }
            });
        });
    }
    catch(e) {
        common.log(e);
        callback(e, new common.HttpServerError());
    }
};

if (typeof module !== 'undefined') module.exports = HttpDataController;