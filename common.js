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

/**
 * Abstract Method Exception class
 * @class AbstractMethodException
 * @augments Error
 * */
function AbstractMethodException(message) {
    AbstractMethodException.super_.call(this, message || 'Cannot call an abstract method.', this.constructor);

}
util.inherits(AbstractMethodException, Error);

/**
 * @class FileNotFoundException
 * @param {number=} status
 * @constructor
 * @augments Error
 */
function FileNotFoundException(message) {

    this.message = message || 'File not found';
}
util.inherits(FileNotFoundException, Error);
/**
 * @class HttpException
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
 * @class HttpBadRequest
 * @param {string=} message
 * @augments HttpException
 * */
function HttpBadRequest(message) {
    HttpNotFoundException.super_.call(this, 400, message || 'Bad Request', this.constructor);

}
util.inherits(HttpBadRequest, HttpException);
/**
 * HTTP 404 Not Found Exception class
 * @class HttpNotFoundException
 * @param {string=} message
 * @augments HttpException
 * */
 function HttpNotFoundException(message) {
    HttpNotFoundException.super_.call(this, 404, message || 'Not Found', this.constructor);

}
util.inherits(HttpNotFoundException, HttpException);
/**
 * HTTP 405 Method Not Allowed exception class
 * @class HttpMethodNotAllowed
 * @param {string=} message
 * @augments HttpException
 * */
function HttpMethodNotAllowed(message) {
    HttpNotFoundException.super_.call(this, 405, message || 'Method Not Allowed', this.constructor);

}
util.inherits(HttpMethodNotAllowed, HttpException);
/**
 * HTTP 401 Unauthorized Exception class
 * @class HttpUnauthorizedException
 * @param {string=} message
 * @augments HttpException
 * */
function HttpUnauthorizedException(message) {
    HttpUnauthorizedException.super_.call(this, 401, message || 'Unauthorized', this.constructor);
}
util.inherits(HttpUnauthorizedException, HttpException);
/**
 * HTTP 403 Forbidden Exception class
 * @class HttpForbiddenException
 * @param {string=} message
 * @augments HttpException
 * */
function HttpForbiddenException(message) {
    HttpForbiddenException.super_.call(this, 403, message || 'Forbidden', this.constructor);
}
util.inherits(HttpForbiddenException, HttpException);

/**
 * HTTP 500 Internal Server Error Exception class
 * @class HttpServerError
 * @param {string=} message
 * @augments HttpException
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

/**
 * @class UnknownValue
 * @constructor
 */
function UnknownValue() {
    //
}

UnknownValue.prototype.valueOf = function() { return null; }

UnknownValue.prototype.toJSON = function() { return null; }

UnknownValue.DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/g;
UnknownValue.BooleanTrueRegex = /^true$/ig;
UnknownValue.BooleanFalseRegex = /^false$/ig;
UnknownValue.NullRegex = /^null$/ig;
UnknownValue.UndefinedRegex = /^undefined$/ig;
UnknownValue.IntegerRegex =/^[-+]?\d+$/g;
UnknownValue.FloatRegex =/^[+-]?\d+(\.\d+)?$/g;
/**
 * @class UnknownPropertyDescriptor
 * @constructor
 */
function UnknownPropertyDescriptor(obj, name) {
    Object.defineProperty(this, 'value', { configurable:false, enumerable:true, get: function() { return obj[name]; }, set: function(value) { obj[name]=value; } });
    Object.defineProperty(this, 'name', { configurable:false, enumerable:true, get: function() { return name; } });
}
/**
 * @param {string} value
 */
UnknownValue.convert = function(value) {
    var result;
    if ((typeof value === 'string'))
    {
        if (value.length==0) {
            result = value
        }
        if (value.match(UnknownValue.BooleanTrueRegex)) {
            result = true;
        }
        else if (value.match(UnknownValue.BooleanFalseRegex)) {
            result = false;
        }
        else if (value.match(UnknownValue.NullRegex) || value.match(UnknownValue.UndefinedRegex)) {
            result = null;
        }
        else if (value.match(UnknownValue.IntegerRegex)) {
            result = parseInt(value);
        }
        else if (value.match(UnknownValue.FloatRegex)) {
            result = parseFloat(value);
        }
        else if (value.match(UnknownValue.DateTimeRegex)) {
            result = new Date(Date.parse(value));
        }
        else {
            result = value;
        }
    }
    else {
        result = value;
    }
    return result;
};

/**
 *
 * @param {*} origin
 * @param {string} expr
 * @param {string} value
 * @param {*=} options
 * @returns {*}
 */
UnknownValue.extend = function(origin, expr, value, options) {

    options = options || { convertValues:false };
    //find base notation
    var match = /(^\w+)\[/.exec(expr), name, descriptor, expr1;
    if (match) {
        //get property name
        name = match[1];
        //validate array property
        if (/^\d+$/g.test(name)) {
            //property is an array
            if (!util.isArray(origin.value))
                origin.value = [];
            // get new expression
            expr1 = expr.substr(match.index + match[1].length);
            UnknownValue.extend(origin, expr1, value);
        }
        else {
            //set property value (unknown)
            origin[name] = origin[name] || new UnknownValue();
            descriptor = new UnknownPropertyDescriptor(origin, name);
            // get new expression
            expr1 = expr.substr(match.index + match[1].length);
            UnknownValue.extend(descriptor, expr1, value);
        }
    }
    else if (expr.indexOf('[')==0) {
        //get property
        var re = /\[(.*?)\]/g;
        match = re.exec(expr);
        if (match) {
            name = match[1];
            // get new expression
            expr1 = expr.substr(match.index + match[0].length);
            if (/^\d+$/g.test(name)) {
                //property is an array
                if (!util.isArray(origin.value))
                    origin.value = [];
            }
            if (expr1.length==0) {
                if (origin.value instanceof UnknownValue) {
                    origin.value = {};
                }
                var typedValue;
                //convert string value
                if ((typeof value === 'string') && options.convertValues) {
                    typedValue = UnknownValue.convert(value);
                }
                else {
                    typedValue = value;
                }
                if (util.isArray(origin.value))
                    origin.value.push(typedValue);
                else
                    origin.value[name] = typedValue;
            }
            else {
                if (origin.value instanceof UnknownValue) {
                    origin.value = { };
                }
                origin.value[name] = origin.value[name] || new UnknownValue();
                descriptor = new UnknownPropertyDescriptor(origin.value, name);
                UnknownValue.extend(descriptor, expr1, value);
            }
        }
        else {
            throw new Error('Invalid object property notation. Expected [name]');
        }
    }
    else if (/^\w+$/.test(expr)) {
        if (options.convertValues)
            origin[expr] = UnknownValue.convert(value);
        else
            origin[expr] = value;
    }
    else {
        throw new Error('Invalid object property notation. Expected property[name] or [name]');
    }
    return origin;
};

var UUID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

/**
 * @namespace common
 */
var common = {
    /**
     * @constructs AbstractMethodException
     * */
    AbstractMethodException : AbstractMethodException,
    /**
     * @constructs FileNotFoundException
     * */
    FileNotFoundException : FileNotFoundException,
    /**
     * @constructs HttpException
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
     * @constructs HttpNotFoundException
     * */
    HttpNotFoundException : HttpNotFoundException,
    /**
     * @constructs HttpMethodNotAllowed
     * */
    HttpMethodNotAllowed : HttpMethodNotAllowed,
    /**
     * @constructs HttpBadRequest
     * */
    HttpBadRequest: HttpBadRequest,
    /**
     * @constructs HttpUnauthorizedException
     * */
    HttpUnauthorizedException: HttpUnauthorizedException,
    /**
     * @constructs HttpForbiddenException
     * */
    HttpForbiddenException: HttpForbiddenException,
    /**
     * @constructs HttpServerError
     * */
    HttpServerError:HttpServerError,
    /**
     * @returns {Array}
     * */
    getFunctionParams:getFunctionParams,
    /**
     * @param {function|*} fn
     * @returns {Boolean}
     * */
    isFunction:function(fn) {
        return isFunction(fn);
    },
    /**
     * Checks if the specified string argument is empty, undefined or null.
     * @param {string} s
     * @returns {boolean}
     */
    isEmptyString: function(s) {
        if (typeof s === 'undefined' || s===null)
            return true;
        if (typeof s === 'string') {
            return (s.replace(/^\s|\s$/ig,'').length === 0);
        }
        return true;
    },
    /**
     * Checks if the specified object argument is undefined or null.
     * @param {*} obj
     * @returns {boolean}
     */
    isNullOrUndefined: function(obj) {
        return (typeof obj === 'undefined' || obj === null);
    },
    /**
     * Checks if the specified object is an HttpException instance or inherits HttpException class.
     * @param {*} obj
     * @returns {boolean}
     */
    isHttpException: function(obj) {
        return (obj instanceof HttpException);
    },
    /**
     * Checks if the specified object argument is object.
     * @param {*} obj
     * @returns {boolean}
     */
    isObject: function(obj) {
        return !!(typeof obj === 'object' && obj !== null);
    },
    /**
     * Checks if the specified object argument is numeric or not.
     * @param {*} n
     * @returns {boolean}
     */
    isNumber: function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
    },
    /**
     * Returns a random integer between a minimum and a maximum value
     * @param {number} min
     * @param {number} max
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random()*max) + min;
    },
    /**
     * Returns a random string based on the length specified
     * @param {Number} length
     */
    randomChars: function(length) {
        length = length || 8;
        var chars = "abcdefghkmnopqursuvwxz2456789ABCDEFHJKLMNPQURSTUVWXYZ";
        var str = "";
        for(var i = 0; i < length; i++) {
            str += chars.substr(this.randomInt(0, chars.length-1),1);
        }
        return str;
    },
    /**
     * Converts a base-26 formatted string to the equivalent integer
     * @param {string} s A base-26 formatted string e.g. aaaaaaaa for 0, baaaaaaa for 1 etc
     * @return {number} The equivalent integer value
     */
    convertFromBase26 : function(s) {
        var num = 0;
        if (!/[a-z]{8}/.test(s)) {
            throw new Error('Invalid base-26 format.');
        }
        var a = 'a'.charCodeAt(0);
        for (var i = 7; i >=0; i--) {
            num = (num * 26) + (s[i].charCodeAt(0) - a);
        }
        return num;
    },
    /**
     * Converts an integer to the equivalent base-26 formatted string
     * @param {number} x The integer to be converted
     * @return {string} The equivalent string value
     */
    convertToBase26: function(x) {
        var num = parseInt(x);
        if (num<0) {
            throw new Error('A non-positive integer cannot be converted to base-26 format.');
        }
        if (num>208827064575) {
            throw new Error('A positive integer bigger than 208827064575 cannot be converted to base-26 format.');
        }
        var out = "", length= 1, a = 'a'.charCodeAt(0);
        while(length<=8)
        {
            out += String.fromCharCode(a + (num % 26))
            num = Math.floor(num / 26);
            length += 1;
        }
        return out;
    },
    /**
     * Returns a random string based on the length specified
     * @param {number} length
     */
    randomHex: function(length) {
        length = (length || 8)*2;
        var chars = "abcdef1234567890";
        var str = "";
        for(var i = 0; i < length; i++) {
            str += chars.substr(this.randomInt(0, chars.length-1),1);
        }
        return str;
    },
    /**
     * Returns a random GUID/UUID string
     */
    newGuid: function() {
        var chars = UUID_CHARS, uuid = [], i;
        // rfc4122, version 4 form
        var r;
        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random()*16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    },
    /**
     * @param {IncomingMessage|ClientRequest} request
     * @returns {*}
     */
    parseCookies : function(request) {
        var list = {},
            rc = request.headers.cookie;
        rc && rc.split(';').forEach(function (cookie) {
            var parts = cookie.split('=');
            list[parts.shift().trim()] = unescape(parts.join('='));
        });
        return list;
    },
    /**
     *
     * @param {*} form
     * @returns {*}
     */
    parseForm : function(form) {
        var result = {};
        if (typeof form === 'undefined' || form==null)
            return result;
        var keys = Object.keys(form);
        keys.forEach(function(key) {
            if (form.hasOwnProperty(key))
            {
                UnknownValue.extend(result, key, form[key])
            }
        });
        return result;
    },
    /**
     * Parses any value or string and returns the resulted object.
     * @param {*} any
     * @returns {*}
     */
    parseValue: function(any) {
            return UnknownValue.convert(any);

    },
    /**
     * Parses any value and returns the equivalent integer.
     * @param {*} any
     * @returns {*}
     */
    parseInt: function(any) {
        return parseInt(any) || 0;
    },
    /**
     * Parses any value and returns the equivalent float number.
     * @param {*} any
     * @returns {*}
     */
    parseFloat: function(any) {
        return parseFloat(any) || 0;
    },
    /**
     *
     * @param {Error|string|{message:string,stack:string}|*} data
     */
    log:function(data) {
        if (data) {
            util.log(data);
            if (data.stack) {
                util.log(data.stack);
            }
        }
    },
    /**
     *
     * @param {Error|string|{message:string,stack:string}|*} data
     */
    debug:function(data) {
        if (process.env.NODE_ENV==='development')
            util.log(data);
    },
    /**
     * Validates the given parameter and returns true if this represents a relative url. Otherwise returns false.
     * @param {string} virtualPath
     * @return {boolean}
     */
    isRelativeUrl: function(virtualPath) {
        if (this.isNullOrUndefined(virtualPath))
            return false;
        if (typeof virtualPath !== 'string')
            throw new Error('Invalid virtualPath argument. Must be a string');
        if (/^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(virtualPath))
            return false;
        if (virtualPath.indexOf('/')!=0)
            return !(virtualPath[0]=='\\');
        return true;
    },
    getBasicAuthHeader: function(username, password) {
        return "Basic " + (new Buffer(username +':'+password)).toString('base64');
    }
};

if (typeof exports !== 'undefined') {
    /**
     * @module most-web/common
     * @see common
     */
    module.exports = common;
}


