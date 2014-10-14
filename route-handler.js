!(function() {
    /**
	 * Routing HTTP Handler
	 */

    var url = require('url'),
        array = require('most-array'),
        util = require('util'),
        fs = require('fs');

    /**
     * @class RouteHandler
     * @augments HttpHandler
     * @constructor
     */
	function RouteHandler() {
		//
	}

    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
	RouteHandler.prototype.mapRequest = function(context, callback)
	{
        callback = callback || function() {};
        try {
            var route = require('./http-route');
            //get uri parameters
            var uri = url.parse(context.request.url);
            var app = require('./index');
            /**
            * @type Array
            * */
            var routes = app.current.config.routes;
            //enumerate registered routes
            var httpRoute = null;
            array(routes).each(function(item) {
                //initialize HttpRoute object
                /**
                 * @type HttpRoute
                 */
                httpRoute = route.createInstance(item.url,item.route);

                //if uri path is matched
               if (httpRoute.isMatch(uri.pathname)) {
                   httpRoute.parse(uri.pathname);
                   //exit loop
                   return false;
               }
                httpRoute = null;
            });
            //set request routeData
            context.request.routeData = httpRoute.routeData;
            //if route data is not null, set this handler as the current execution handler
            if  (context.request.routeData!=null)
            {
                context.request.currentHandler = new RouteHandler();
                //set current execution path
                context.request.currentExecutionPath = app.current.mapPath(context.request.routeData.format());
            };
            //invoke callback
            callback.call(context);
        }
        catch (e) {
            callback.call(context, e);
        }
	};
    /**
     * @param {HttpContext} context
     * @param {Function} callback
     */
    RouteHandler.prototype.processRequest = function(context, callback) {
        callback = callback || function() {};
        try {
            var app = require('./index');
            if (!fs.existsSync(context.request.currentExecutionPath)) {
                //throw HTTP error 404 Not Found
                throw new app.common.HttpNotFoundException();
            }
            //resolve mime
            var mime = app.current.resolveMime(context.request.currentExecutionPath);
            //and get content-type
            if (mime==null) {
                 //throw HTTP error 403 Forbidden
                throw new app.common.HttpForbiddenException();
            }
            /*var stream = fs.readFileSync(context.request.currentExecutionPath, "binary");
            context.response.writeHead(200, {'Content-Type': mime.type});
            context.response.write(stream, "binary");*/
            fs.readFile(context.request.currentExecutionPath,'binary',function(err, data) {
                if (err) {
                    callback.call(context, e);
                }
                else {
                    context.response.writeHead(200, {'Content-Type': mime.type});
                    context.response.write(data, 'binary');
                }
            });

        }
        catch (e) {
            callback.call(context, e);
        }
    }

    if (typeof exports !== 'undefined') {
        /**
         * @returns {HttpHandler}
         */
        exports.createInstance = function() {
            return new RouteHandler();
        };
    }
	
}).call(this);

