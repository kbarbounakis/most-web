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
var Q = require('q');
var _ = require('lodash');
var HttpResult = require('./http-mvc').HttpResult;
var ODataModelConventionBuilder = require('most-data/odata').ODataConventionModelBuilder;
var ODataModelBuilder = require('most-data/odata').ODataModelBuilder;
var DataConfiguration = require('most-data/data-configuration').DataConfiguration;

/**
 * @class
 * @constructor
 * @param {*=} data
 * @augments {HttpResult}
 * @extends {HttpResult}
 * @property {EntitySetConfiguration} entitySet
 */
function ODataJsonResult(data) {
    ODataJsonResult.super_.bind(this)();
    this.data = data;
    this.contentType = 'application/json;charset=utf-8';
    this.contentEncoding = 'utf8';
}
util.inherits(ODataJsonResult,HttpResult);

ODataJsonResult.prototype.execute = function(context, callback) {
    var res = context.response;
    if (_.isNil(this.data)) {
        res.writeHead(204);
        return callback();
    }
};

function ODataModelBuilderConfiguration() {
    //
}

/**
 *
 * @param {HttpApplication} app
 * @returns Promise<ODataModelBuilder>
 */
ODataModelBuilderConfiguration.config = function(app) {
    if (typeof app === 'undefined' || app === null) {
        return Q.reject(new TypeError('Application may not be null'))
    }
    //create by default a new model convention builder
    var builder = new ODataModelConventionBuilder(new DataConfiguration(app.getConfigurationPath()));
    //initialize builder
    return builder.initialize().then(function() {
        //register service
        app.service(ODataModelBuilder, function() {
            return builder;
        });
        //return newly created builder for further processing
        return Q.resolve(builder);
    });
};


if (typeof module !== 'undefined') {
    module.exports.ODataModelBuilderConfiguration = ODataModelBuilderConfiguration;
    module.exports.ODataJsonResult = ODataJsonResult;
}