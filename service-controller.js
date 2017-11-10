/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-09-06
 */
var util = require('util');
var Q = require('q');
var httpGet = require('./decorators').httpGet;
var httpAction = require('./decorators').httpAction;
var applyMethodDecorator = require('./decorators').applyMethodDecorator;
var HttpBaseController = require('./base-controller');
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

HttpServiceController.prototype.getMetadata = function() {
    return Q.resolve(this.empty());
};
//apply descriptors
applyMethodDecorator(httpGet, HttpServiceController.prototype, 'getMetadata');
applyMethodDecorator(httpAction("metadata"), HttpServiceController.prototype, 'getMetadata');

HttpServiceController.prototype.getIndex = function() {
    return Q.resolve(this.empty());
};
//apply descriptors
applyMethodDecorator(httpGet, HttpServiceController.prototype, 'getIndex');
applyMethodDecorator(httpAction("index"), HttpServiceController.prototype, 'getIndex');


if (typeof module !== 'undefined') {
    module.exports = HttpServiceController;
}