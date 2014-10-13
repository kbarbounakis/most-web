/**
 * Created by kbarbounakis on 2/7/2014.
 */
var app = require('./index'),
    formidable = require('formidable'),
    util = require('util'),
    querystring = require('querystring'),
    xml = require('most-xml');

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
}



/**
 * @class PostHandler
 * @constructor
 * @augments HttpHandler
 */
function PostHandler() {

}

/**
 *
 * @param {*} origin
 * @param {string} expr
 * @param {string} value
 * @param {*=} options
 * @returns {*}
 */
function extend(origin, expr, value, options) {

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
            extend(origin, expr1, value);
        }
        else {
            //set property value (unknown)
            origin[name] = origin[name] || new UnknownValue();
            descriptor = new UnknownPropertyDescriptor(origin, name);
            // get new expression
            expr1 = expr.substr(match.index + match[1].length);
            extend(descriptor, expr1, value);
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
                };
                origin.value[name] = origin.value[name] || new UnknownValue();
                descriptor = new UnknownPropertyDescriptor(origin.value, name);
                extend(descriptor, expr1, value);
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
}

/**
 * Parses a form object and returns form parameters as object e.g. user[name]=user&user1[password]=1234 returns user: { name: 'user1', password:'1234'}
 * @param form
 */
function parseForm(form) {
    var result = {};
    if (typeof form === 'undefined' || form==null)
        return result;
    var keys = Object.keys(form);
    keys.forEach(function(key) {
        if (form.hasOwnProperty(key))
        {
            extend(result, key, form[key])
        }
    });
    return result;
}
/**
 * Provides a case insensitive attribute getter
 * @param name
 * @returns {*}
 */
function caseInsensitiveAttribute(name) {
    if (typeof name === 'string') {
        if (this[name])
            return this[name];
        //otherwise make a case insensitive search
        var re = new RegExp('^' + name + '$','i');
        var p = Object.keys(this).filter(function(x) { return re.test(x); })[0];
        if (p)
            return this[p];
    }
    return null;
}

var X_WWW_FORM_URLENCODED =  'application/x-www-form-urlencoded';

PostHandler.prototype.beginRequest = function(context, callback) {
    try {
        var f = new formidable.IncomingForm(), request = context.request;
        //add query string
        if (request.url.indexOf('?') > 0)
            util._extend(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));

        //apply case insensitivity search in params object
        context.params.attr = caseInsensitiveAttribute;

        //extend params object (parse form data)
        if (typeof request.socket === 'undefined') {
            callback();
            return;
        }
        else {
            f.parse(request, function (err, form, files) {
                if (err) {
                    callback(err);
                    return;
                }
                try {
                    //add form
                    if (form) {
                        util._extend(context.params, parseForm(form));
                    }
                    //add files
                    if (files)
                        util._extend(context.params, files);
                    callback();
                }
                catch (e) {
                    callback(e);
                }
            });
            return;
        }
    }
    catch  (e) {
        console.log(e)
        callback(new Error("An internal server error occured while parsing request data."));
    }

};

if (typeof exports !== 'undefined') {
    /**
     * @returns {HttpHandler}
     */
    exports.createInstance = function() {
        return new PostHandler();
    };
}