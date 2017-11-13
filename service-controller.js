/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-11-10
 */
var util = require('util');
var HttpNotFoundException = require('./common').HttpNotFoundException;
var HttpForbiddenException = require('./common').HttpForbiddenException;
var HttpMethodNotAllowed = require('./common').HttpMethodNotAllowed;
var parseBoolean = require('./common').parseBoolean;
var pluralize = require('pluralize');
var Q = require('q');
var _ = require('lodash');
var httpGet = require('./decorators').httpGet;
var httpPost = require('./decorators').httpPost;
var httpPut = require('./decorators').httpPut;
var httpPatch = require('./decorators').httpPatch;
var httpDelete = require('./decorators').httpDelete;
var httpAction = require('./decorators').httpAction;
var httpController = require('./decorators').httpController;
var defineDecorator = require('./decorators').defineDecorator;
var HttpBaseController = require('./base-controller');
var ODataModelBuilder = require('most-data/odata').ODataModelBuilder;
/**
 * @classdesc HttpBaseController class describes a base controller.
 * @class
 * @param {HttpContext} context
 * @constructor
 */
function HttpServiceController(context) {
    HttpServiceController.super_.bind(this)(context);
}
util.inherits(HttpServiceController, HttpBaseController);
defineDecorator(HttpServiceController, 'constructor', httpController());

HttpServiceController.prototype.getMetadata = function() {
    var self = this;
    return this.getBuilder().getEdmDocument().then(function (result) {
        return Q.resolve(self.xml(result.outerXML()));
    });
};
defineDecorator(HttpServiceController.prototype, 'getMetadata', httpGet());
defineDecorator(HttpServiceController.prototype, 'getMetadata', httpAction("metadata"));

HttpServiceController.prototype.getIndex = function() {
    var self = this;
    return this.getBuilder().getEdm().then(function (result) {
        return Q.resolve(self.json({
            "@odata.context": self.getBuilder().getContextLink(self.context),
            value:result.entityContainer.entitySet
        }));
    });
};
//apply descriptors
defineDecorator(HttpServiceController.prototype, 'getIndex', httpGet());
defineDecorator(HttpServiceController.prototype, 'getIndex', httpAction("index"));

/**
 *
 * @param {string} entitySet
 */
HttpServiceController.prototype.getItems = function(entitySet) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundException("EntitySet not found"));
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundException("Entity not found"));
        }
        //parse query filter and return a DataQueryable
        return Q.nbind(model.filter,model)(context.params).then(function(query) {
            var count = parseBoolean(self.context.params['$count']);
            if (count) {
                //get items with count
                return query.getList().then(function(result) {
                    //and finally return json result
                    return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,result)));
                });
            }
            else {
                //get items
                return query.getItems().then(function(result) {
                    //and finally return json result
                    return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,result)));
                });
            }
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};
defineDecorator(HttpServiceController.prototype, 'getItems', httpGet());
defineDecorator(HttpServiceController.prototype, 'getItems', httpAction("items"));


/**
 * @param {*} id
 * @param {string} entitySet
 */
HttpServiceController.prototype.getItem = function(entitySet, id) {
    var self = this;
    var context = self.context;
    var model;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundException("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundException());
                            }
                            return self.getItem(entitySet, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenException());
            }
        }
        /**
         * @type {DataModel}
         */
        model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundException("Entity not found"));
        }
        return Q.nbind(model.filter,model)({
            "$select":context.params["$select"],
            "$expand":context.params["$expand"]
        }).then(function(query) {
            return query.where(model.primaryKey).equal(id).getItem().then(function (result) {
                if (_.isNil(result)) {
                    return Q.reject(new HttpNotFoundException());
                }
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,result)));
            });
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'getItem', httpGet());
defineDecorator(HttpServiceController.prototype, 'getItem', httpAction("item"));


/**
 *
 * @param {string} entitySet
 * @param {*} id
 */
HttpServiceController.prototype.patchItem = function(entitySet, id) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundException("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundException());
                            }
                            return self.patchItem(entitySet, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenException());
            }
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundException("Entity not found"));
        }
        return model.where(model.primaryKey).equal(id).select("id").getItem().then(function (result) {
            if (_.isNil(result)) {
                return Q.reject(new HttpNotFoundException());
            }
            var body = _.assign(context.request.body, result);
            return model.save(body).then(function () {
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,body)));
            });
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};
defineDecorator(HttpServiceController.prototype, 'patchItem', httpPatch());
defineDecorator(HttpServiceController.prototype, 'patchItem', httpAction("item"));


/**
 *
 * @param {string} entitySet
 * @param {*} id
 */
HttpServiceController.prototype.deleteItem = function(entitySet, id) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundException("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundException());
                            }
                            return self.deleteItem(entitySet, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenException());
            }
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundException("Entity not found"));
        }
        return model.where(model.primaryKey).equal(id).count().then(function (exists) {
            if (!exists) {
                return Q.reject(new HttpNotFoundException());
            }
            var obj = {};
            obj[model.primaryKey] = id;
            return model.remove(obj).then(function () {
                return Q.resolve(self.json());
            });
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'deleteItem', httpDelete());
defineDecorator(HttpServiceController.prototype, 'deleteItem', httpAction("item"));

/**
 *
 * @param {string} entitySet
 */
HttpServiceController.prototype.postItem = function(entitySet) {
    var self = this;
    var context = self.context;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundException("EntitySet not found"));
        }
        /**
         * @type {DataModel}
         */
        var model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundException("Entity not found"));
        }
        var body = context.request.body;
        return model.save(body).then(function () {
            if (_.isArray(body)) {
                return Q.resolve(self.json(thisEntitySet.mapInstanceSet(context,body)));
            }
            else {
                return Q.resolve(self.json(thisEntitySet.mapInstance(context,body)));
            }
        });
    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'postItem', httpPost());
defineDecorator(HttpServiceController.prototype, 'postItem', httpPut());
defineDecorator(HttpServiceController.prototype, 'postItem', httpAction("items"));


/**
 *
 * @param {string} entitySet
 * @param {string} property
 * @param {*} id
 */
HttpServiceController.prototype.getProperty = function(entitySet, property, id) {
    var self = this;
    var context = self.context;
    var model;
    try {
        //get entity set
        var thisEntitySet = this.getBuilder().getEntitySet(entitySet);
        if (_.isNil(thisEntitySet)) {
            return Q.reject(new HttpNotFoundException("EntitySet not found"));
        }
        else {
            if (typeof id === 'undefined') {
                if (context.request.route && context.request.route.params && context.request.route.params.$filter) {
                    model = context.model(thisEntitySet.entityType.name);
                    return Q.nbind(model.filter,model)({
                        "$filter":context.request.route.params.$filter
                    }).then(function(query) {
                        return query.select(model.primaryKey).value().then(function (value) {
                            if (_.isNil(value)) {
                                return Q.reject(new HttpNotFoundException());
                            }
                            return self.getProperty(entitySet, property, value);
                        });
                    });
                }
                return Q.reject(new HttpForbiddenException());
            }
        }
        /**
         * @type {DataModel}
         */
        model = context.model(thisEntitySet.entityType.name);
        if (_.isNil(model)) {
            return Q.reject(new HttpNotFoundException("Entity not found"));
        }
        return model.where(model.primaryKey).equal(id).select(model.primaryKey).getTypedItem()
            .then(function(obj) {
                if (_.isNil(obj)) {
                    return Q.reject(new HttpNotFoundException());
                }
                //get primary key
                var key = obj[model.primaryKey];
                //get mapping
                var mapping = model.inferMapping(property);
                //get count parameter
                var count = parseBoolean(self.context.params.$inlinecount);
                if (_.isNil(mapping)) {
                    //try to find associated model
                    //get singular model name
                    var otherModelName = pluralize.singular(property);
                    //search for model with this name
                    var otherModel = self.context.model(otherModelName);
                    if (otherModel) {
                        var otherFields = _.filter(otherModel.attributes, function(x) {
                            return x.type === model.name;
                        });
                        if (otherFields.length>1) {
                            return Q.reject(new HttpMethodNotAllowed("Multiple associations found"));
                        }
                        else if (otherFields.length === 1) {
                            var otherField = otherFields[0];
                            mapping = otherModel.inferMapping(otherField.name);
                            if (mapping && mapping.associationType === 'junction') {
                                var attr;
                                //search model for attribute that has an association of type junction with child model
                                if (mapping.parentModel === otherModel.name) {
                                    attr = _.find(otherModel.attributes, function(x) {
                                        return x.name === otherField.name;
                                    });
                                }
                                else {
                                    attr = _.find(model.attributes, function(x) {
                                        return x.type === otherModel.name;
                                    });
                                }
                                if (_.isNil(attr)) {
                                    return Q.reject(new HttpNotFoundException("Association not found"));
                                }
                                if (attr) {
                                    model = attr.name;
                                    mapping = model.inferMapping(attr.name);
                                }
                            }
                        }
                    }
                    if (_.isNil(mapping)) {
                        return Q.reject(new HttpNotFoundException("Association not found"));
                    }
                }
                if (mapping.associationType === 'junction') {
                    /**
                     * @type {DataQueryable}
                     */
                    var junction = obj.property(property);
                    return junction.model.filter(self.context.params, function (err, q) {
                        if (err) {
                            return Q.reject(err);
                        }
                        else {
                            //merge properties
                            if (q.query.$select) {
                                junction.query.$select = q.query.$select;
                            }
                            if (q.$expand) {
                                junction.$expand = q.$expand;
                            }
                            if (q.query.$group) {
                                junction.query.$group = q.query.$group;
                            }
                            if (q.query.$order) {
                                junction.query.$order = q.query.$order;
                            }
                            if (q.query.$prepared) {
                                junction.query.$where = q.query.$prepared;
                            }
                            if (q.query.$skip) {
                                junction.query.$skip = q.query.$skip;
                            }
                            if (q.query.$take) {
                                junction.query.$take = q.query.$take;
                            }
                            var otherEntitySet = self.getBuilder().getEntityTypeEntitySet(junction.model.name);
                            if (count) {
                                return junction.getList().then(function (result) {
                                    return Q.resolve(self.json(otherEntitySet.mapInstanceSet(context,result)));
                                });
                            }
                            else {
                                return junction.getItems().then(function (result) {
                                    return Q.resolve(self.json(otherEntitySet.mapInstanceSet(context,result)));
                                });
                            }

                        }
                    });
                }
                else if (mapping.parentModel === model.name && mapping.associationType === 'association') {
                    //get associated model
                    var associatedModel = self.context.model(mapping.childModel);
                    if (_.isNil(associatedModel)) {
                        return Q.reject(new HttpNotFoundException("Associated model not found"));
                    }
                    var associatedEntitySet = self.getBuilder().getEntityTypeEntitySet(associatedModel.name);
                    return Q.nbind(associatedModel.filter, associatedModel)(self.context.params).then(function(q) {
                        if (count) {
                            q.where(mapping.childField).equal(key).list(function (err, result) {
                                if (err) {
                                    return Q.reject(err);
                                }
                                return Q.resolve(self.json(associatedEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                        else {
                            return q.where(mapping.childField).equal(key).getItems().then(function (result) {
                                return Q.resolve(self.json(associatedEntitySet.mapInstanceSet(context,result)));
                            });
                        }
                    });
                }
                else if (mapping.childModel === model.name && mapping.associationType === 'association') {
                    //get associated model
                    var parentModel = self.context.model(mapping.parentModel);
                    if (_.isNil(parentModel)) {
                        return Q.reject(new HttpNotFoundException("Parent associated model not found"));
                    }
                    return model.where(model.primaryKey).equal(obj.id).select(model.primaryKey,property).expand(property).getItem().then(function(result) {
                        var parentEntitySet = self.getBuilder().getEntityTypeEntitySet(parentModel.name);
                        return Q.resolve(self.json(parentEntitySet.mapInstance(context,result[property])));
                    });

                }
                else {
                    return Q.reject(new HttpNotFoundException());
                }
            });

    }
    catch (err) {
        return Q.reject(err);
    }
};

defineDecorator(HttpServiceController.prototype, 'getProperty', httpGet());
defineDecorator(HttpServiceController.prototype, 'getProperty', httpAction("property"));


/**
 *
 * @returns {ODataModelBuilder}
 */
HttpServiceController.prototype.getBuilder = function() {
    return this.context.getApplication().service(ODataModelBuilder)();
};

if (typeof module !== 'undefined') {
    module.exports = HttpServiceController;
}