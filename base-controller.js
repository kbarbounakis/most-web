var util = require('util'),
    mvc = require('./http-mvc');
/**
 * The base HTTP controller
 * @constructor
 */
function HttpBaseController() {
    //
}
util.inherits(HttpBaseController, mvc.HttpController);

if (typeof module !== 'undefined') module.exports = HttpBaseController;