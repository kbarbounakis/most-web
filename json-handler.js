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
/**
 * @ignore
 */
var bodyParser = require('body-parser'), jsonParser = bodyParser.json();
function JsonHandler() {

}

JsonHandler.prototype.beginRequest = function(context, callback) {
    var request = context.request, response = context.response;
    request.headers = request.headers || {};
    var contentType = request.headers['content-type'];
    if (/^application\/json/i.test(contentType)) {
        //parse request data
        jsonParser(request, response , function(err) {
            if (err) {
                callback(err);
            }
            else {
                try {
                    if (request.body) {
                       //try parse
                        if (request.body instanceof Buffer) {
                            var result = JSON.parse(request.body);
                            context.params.data = result;
                        }
                        else if (typeof request.body === 'object') {
                            context.params.data = request.body;
                        }
                       callback();
                    }
                }
                catch(e) {
                    callback(e);
                }

            }
        });
    }
    else {
        callback();
    }
};
if (typeof exports !== 'undefined') {
    module.exports.createInstance = function() { return  new JsonHandler();  };
}