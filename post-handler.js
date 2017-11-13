/**
 * @private
 */
var formidable = require('formidable');
var util = require('util');
var common = require('./common');

/**
 * @class UnknownValue
 * @constructor
 */
function UnknownValue() {
    //
}

UnknownValue.prototype.valueOf = function() { return null; };

UnknownValue.prototype.toJSON = function() { return null; };

UnknownValue.DateTimeRegex = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?([+-](\d+):(\d+))?$/g;
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
        if (value.length===0) {
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
 * @private
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
            extend(origin, expr1, value, options);
        }
        else {
            //set property value (unknown)
            origin[name] = origin[name] || new UnknownValue();
            descriptor = new UnknownPropertyDescriptor(origin, name);
            // get new expression
            expr1 = expr.substr(match.index + match[1].length);
            extend(descriptor, expr1, value, options);
        }
    }
    else if (expr.indexOf('[')===0) {
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
            if (expr1.length===0) {
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
                extend(descriptor, expr1, value, options);
            }
        }
        else {
            throw new Error('Invalid object property notation. Expected [name]');
        }
    }
    else if (/^[\w-]*$/.test(expr)) {
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
 * @private
 */
function parseForm(form) {
    var result = {};
    if (typeof form === 'undefined' || form===null)
        return result;
    var keys = Object.keys(form);
    keys.forEach(function(key) {
        if (form.hasOwnProperty(key))
        {
            extend(result, key, form[key]);
        }
    });
    return result;
}

PostHandler.prototype.beginRequest = function(context, callback) {
    try {
        var request = context.request;
        //extend params object (parse form data)
        if (typeof request.socket === 'undefined') {
            callback();
        }
        else {
            request.headers = request.headers || {};
            if (/^application\/x-www-form-urlencoded/i.test(request.headers['content-type'])) {
                //use formidable to parse request data
                var f = new formidable.IncomingForm();
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
            }
            else {
                callback();
            }

        }
    }
    catch  (e) {
        common.log(e);
        callback(new Error("An internal server error occured while parsing request data."));
    }

};

if (typeof exports !== 'undefined') {
    exports.createInstance = function() {
        return new PostHandler();
    };
}