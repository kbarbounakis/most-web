/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2015-02-20
 */
/**
 * @constructs HttpDataController
 */
var HttpDataController = require('./data-controller'), util = require('util');

function HttpLookupController() {
    HttpLookupController.super_.call(this);
}

util.inherits(HttpLookupController, HttpDataController);

if (typeof module !== 'undefined') module.exports = HttpLookupController;