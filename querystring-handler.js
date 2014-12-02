/**
 * Created by Kyriakos Barbounakis<k.barbounakis@gmail.com> on 2/12/2014.
 */
var util = require('util'),
    querystring = require('querystring');
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

function QuerystringHandler() {
    //
}

QuerystringHandler.prototype.beginRequest = function(context, callback) {
    context = context || {};
    callback = callback || function() {};
    var request = context.request;
    if (typeof request === 'undefined') {
        callback();
        return;
    }
    try {
        context.params = context.params || {};
        //apply case insensitivity search in params object
        context.params.attr = caseInsensitiveAttribute;
        //add query string params
        if (request.url.indexOf('?') > 0)
            util._extend(context.params, querystring.parse(request.url.substring(request.url.indexOf('?') + 1)));
        callback();
    }
    catch(e) {
        callback(e);
    }
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new QuerystringHandler();  };
}