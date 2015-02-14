/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2014-12-02
 */
var formidable = require('formidable'), util = require('util');
function MultipartHandler() {

}

MultipartHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request;
    request.headers = request.headers || {};
    var contentType = request.headers['content-type'];
    if (/^multipart\/form-data/i.test(contentType)) {
        //use formidable to parse request data
        var f = new formidable.IncomingForm(), web = require('./index');
        f.parse(request, function (err, form, files) {
            if (err) {
                callback(err);
                return;
            }
            try {
                //add form
                if (form) {
                    util._extend(context.params, web.common.parseForm(form));
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
};

if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new MultipartHandler();  };
}