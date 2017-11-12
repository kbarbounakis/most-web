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
var parseBoolean = require('./common').parseBoolean;
var parseInteger = require('./common').parseInt;
var Q = require('q');
var _ = require('lodash');
var httpGet = require('./decorators').httpGet;
var httpPost = require('./decorators').httpPost;
var httpPut = require('./decorators').httpPut;
var httpPatch = require('./decorators').httpPatch;
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
 *
 * @param {string} entitySet
 * @param {*} id
 */
HttpServiceController.prototype.getItem = function(entitySet, id) {
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
        return model.where(model.primaryKey).equal(id).getItem().then(function (result) {
            if (_.isNil(result)) {
                return Q.reject(new HttpNotFoundException());
            }
            return Q.resolve(self.json(thisEntitySet.mapInstance(context,result)));
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
HttpServiceController.prototype.patchItem = function(entitySet, id, item) {
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
        return model.where(model.primaryKey).equal(id).getItem().then(function (result) {
            if (_.isNil(result)) {
                return Q.reject(new HttpNotFoundException());
            }
            return Q.resolve(self.json(thisEntitySet.mapInstance(context,result)));
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
 * @returns {ODataModelBuilder}
 */
HttpServiceController.prototype.getBuilder = function() {
    return this.context.getApplication().service(ODataModelBuilder)();
};

if (typeof module !== 'undefined') {
    module.exports = HttpServiceController;
}