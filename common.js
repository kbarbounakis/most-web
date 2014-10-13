var util = require('util');
/**
 * Abstract Method Exception class
 * */
function AbstractMethodException(message) {
    AbstractMethodException.super_.call(this, message || 'Cannot call an abstract method.', this.constructor);

}
util.inherits(AbstractMethodException, Error);

/**
 *
 * @param {number=} status
 * @param {string=} message
 * @param {string=} internalMessage
 * @constructor
 */
function HttpException(status, message, internalMessage) {
    this.message = message || 'Internal Server Error';
    this.status = status===undefined ? 500 : status;
}
/**
 * @param {Error} err
 * @returns {Error}
 */
HttpException.create = function(err) {
    if (typeof err === 'undefined' || err==null)
        return new HttpException();
    else {
        if (err.status)
            return new HttpException(err.status, err.message);
        else
            return new HttpException(500, err.message);
    }
}

util.inherits(HttpException, Error);

/**
 * HTTP 400 Bad Request exception class
 * */
function HttpBadRequest(message) {
    HttpNotFoundException.super_.call(this, 400, message || 'Bad Request', this.constructor);

}
util.inherits(HttpBadRequest, HttpException);
/**
 * HTTP 404 Not Found Exception class
 * */
 function HttpNotFoundException(message) {
    HttpNotFoundException.super_.call(this, 404, message || 'Not Found', this.constructor);

}
util.inherits(HttpNotFoundException, HttpException);
/**
 * HTTP 405 Method Not Allowed exception class
 * */
function HttpMethodNotAllowed(message) {
    HttpNotFoundException.super_.call(this, 405, message || 'Method Not Allowed', this.constructor);

}
util.inherits(HttpMethodNotAllowed, HttpException);
/**
 * HTTP 403 Forbidden Exception class
 * */
function HttpForbiddenException(message) {
    HttpForbiddenException.super_.call(this, 403, message || 'Forbidden', this.constructor);
}
util.inherits(HttpForbiddenException, HttpException);

/**
 * HTTP 500 Internal Server Error Exception class
 * */
function HttpServerError(message) {
    HttpServerError.super_.call(this, 500, message || 'Internal Server Error', this.constructor);
}
util.inherits(HttpServerError, HttpException);

/* common functions */
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getFunctionParams( fn ) {
    if (!isFunction(fn))
        return [];
    var fnStr = fn.toString().replace(STRIP_COMMENTS, '')
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)
    if(result === null)
        result = []
    return result
}
/**
 * @param fn {Function}
 * @returns {Boolean}
 * */
function isFunction( fn ) {
    return typeof fn === 'function';
};


module.exports = {
    /**
     * @class AbstractMethodException
     * */
    AbstractMethodException : AbstractMethodException,
    /**
     * @class HttpException
     * */
    HttpException : HttpException,
    /**
     * @param {Error} err
     * @returns {Error|*}
     */
    httpError: function(err) {
        return HttpException.create(err);
    },
    /**
     * @class HttpNotFoundException
     * */
    HttpNotFoundException : HttpNotFoundException,
    /**
     * @class HttpMethodNotAllowed
     * */
    HttpMethodNotAllowed : HttpMethodNotAllowed,
    /**
     * @class HttpBadRequest
     * */
    HttpBadRequest: HttpBadRequest,
    /**
     * @class HttpForbiddenException
     * */
    HttpForbiddenException: HttpForbiddenException,
    /**
     * @class HttpServerError
     * */
    HttpServerError:HttpServerError,
    /**
     * @returns {Array}
     * */
    getFunctionParams:getFunctionParams,
    /**
     * @param fn {Function}
     * @returns {Boolean}
     * */
    isFunction:isFunction
 }
