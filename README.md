# MOST Web Framework

![MOST Web Framework Codename Blushift](https://www.themost.io/assets/images/most_logo_128.png)

### The new version of MOST Web Framework v2.x Codename Blueshift is available. Happy coding!

[Checkout the new exciting features like ES7 compatibility, new @themost CLI tool, 
EcmaScript decorators, OData v4 compatibility, AngularJS for Server in-parallel template engine and many more.](https://github.com/themost-framework/themost)

_<small>Note: If you want to use MOST Web Framework v.1x, continue reading.</small>_

MOST Web Framework v1.x is a full featured MVC framework for building scalable data-driven web applications under node.js.

![MOST Web Framework Logo](https://www.themost.io/assets/images/most_logo_sw_240.png)

[Documentation Home](https://docs.themost.io/most-web/)

### Installation

Install MOST Web Framework Command Line utility globally via npm:

    npm install most-web-cli -g

and generate a new application:

    most -o generate

or install most-web-cli locally:

    npm install most-web-cli

and execute:

    node_modules/.bin/most -o generate

This operation will generate an empty -or almost empty- MOST Web Framework application with the following structure:

    app
     - controllers
       root-controller.js
     - css
       ...
     + images
     + views
       - root
         index.html.ejs
         ...
       - shared
         master.html.ejs
         ...
     - config
       - models
         User.json
         Group.json
         ...
       app.json
       routes.json
     server.js

#### The app/controllers directory

 A protected directory which contains all the available server-side controllers. Each application controller should have the following naming convention:

 *[controller or model name]*-controller.js

 (e.g. user-controller.js, root-controller.js, order-detail-controller.js etc)

 A typical application controller:

    var util = require('util'),
        fs = require('fs'),
        web = require('most-web'),
        path = require('path');
    /**
     * Root HTTP Controller class
     * @constructor
     * @augments {HttpController}
     */
    function RootController() {
        //
    }
    util.inherits(RootController, web.controllers.HttpBaseController);

    RootController.prototype.index = function(callback)
    {
        callback(null, this.view());
    };

    RootController.prototype.login = function(callback)
    {
        ...
    };

    if (typeof module !== 'undefined') module.exports = RootController;

where action [index] is a method of RootController class.
RootController class will serve actions like http://127.0.0.1/index.html or http://127.0.0.1/login.html,
while a controller class which is exported by order-controller.js module will server actions
like http://127.0.0.1/Order/index.json or http://127.0.0.1/Order/50/edit.html etc.

#### The app/views directory

A protected directory which contains all the available server-side views. Each controller is represented by a directory with the same name (e.g. root) which contains
view files.These files have the following naming convention

*[view name]*.html.*[engine extension]*

(e.g. index.html.ejs, terms.html.md, login.html.ejs etc)

where the first part is the view name, the second part is always html or htm and the third part contains the extension of the view engine that is going to be used to render each view.
The default view engine for a MOST Web Framework application is the EJS View Engine which uses [ejs](https://github.com/tj/ejs) javascript templates for node.js.
The module [most-web-md](https://github.com/kbarbounakis/most-web-md) offers Markdown View Engine for rendering markdown templates.

The available view engines for each application are described in application configuration file (app.json#engines)

    ...
    "engines": [
            { "name": "EJS View Engine", "extension": "ejs", "type": "./ejs-engine" },
            { "name": "Markdown View Engine", "extension": "md", "type": "most-web-md" }
        ],
    ...

The directory app/views contains also a directory named [shared]. This directory does not belong to any controller but it contains shared views that may be rendered by any controller.
Shared views directory also contains parent layouts. The parent layouts are views that are going to be included in other views:

shared/master.html.ejs

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="">
        <meta name="author" content="">
    ...
    </head>
    <body>
        <div class="container">
            ...
            <!-- content -->
            <%- body %>
            ...
        </div>
    </body>

view/index.html.ejs

    <%# { "layout":"/views/shared/master.html.ejs", "title":"Home Page" } %>
    <div>
        <!-- jumbotron -->
        <div class="jumbotron">
            <h1>Welcome to MOST Web Framework!</h1>
            <p class="lead">Cras justo odio, dapibus ac facilisis in, egestas eget quam. Fusce dapibus, tellus ac cursus commodo,
                tortor mauris condimentum nibh, ut fermentum massa justo sit amet.</p>
            <p><a class="btn btn-lg btn-success" href="#" role="button">Get started today</a></p>
        </div>
    </div>

#### The config/app.json configuration file

The app.json contains the basic configuration settings of a MOST Web Framework application. A typical configuration is shown below:

    {
        "handlers": [
            { "name":"basic-auth","type":"./noop-handler" },
            { "name":"auth","type":"./noop-handler" }
        ],
        "engines": [
            { "name": "EJS View Engine", "extension": "ejs", "type": "./ejs-engine" },
            { "name": "Markdown View Engine", "extension": "md", "type": "most-web-md" }
        ],
        "controllers": {
            "data": "./http-data-controller.js"
        },
        "settings": {
            "crypto": {
                "algorithm": "aes256",
                "key": "4b3236524b4e48534c776d5535646e55643542423763454e354b61426d784371"
            },
            "auth": {
                "name": ".MAUTH",
                "loginPage":"/login.html"
            },
            "localization": {
                "cultures": [ "en-us" ],
                "default": "en-us",
                "localizedContent": true
            }
        },
        "adapterTypes": [
            { "name":"SQLite Data Adapter", "invariantName": "sqlite", "type":"most-data-sqlite" }
        ],
        "adapters": [
            { "name":"development", "invariantName":"sqlite", "default":true,
                "options": {
                    "database":"db/local.db"
                }
            }
        ],
        "mimes": [
            { "extension": ".css", "type": "text/css"  },
            { "extension": ".js", "type": "application/javascript" }
            ...
         ]
    }

#### The config/app.json#handlers section

This section contains the collection of registered handlers.

    ...
    "handlers": [
        { "name":"basic-auth","type":"/handlers/my-basic-handler" },
        { "name":"auth","type":"/handlers/my-auth-handler" }
    ]
    ...

These handlers are registered and executed in series with the default application handlers which are the following:

    ...
    "handlers": [
            { "name":"query","type":"./querystring-handler" },
            { "name":"auth","type":"./auth-handler" },
            { "name":"basic-auth","type":"./basic-auth-handler" },
            { "name":"static","type":"./static-handler" },
            { "name":"mvc","type":"./view-handler" },
            { "name":"multipart","type":"./multipart-handler" },
            { "name":"json","type":"./json-handler" },
            { "name":"post","type":"./post-handler" },
            { "name":"route","type":"./route-params-handler" },
            { "name":"directive","type":"./directive-handler" }
        ]
    ...

The default handlers may be overridden or may be disabled by using the internal noop-handler of most-web module:

    ...
    "handlers": [
        { "name":"basic-auth","type":"./noop-handler" },
        { "name":"auth","type":"./noop-handler" }
    ]
    ...

#### The config/app.json#engines section

This section contains the collection of registered view engines.

    ...
    "engines": [
            { "name": "EJS View Engine", "extension": "ejs", "type": "./ejs-engine" }
        ],
    ...

#### The config/app.json#controllers section

This section contains information about controller sub-classing.

    ...
    "controllers": {
        "data": "./http-data-controller.js"
    }
    ...

Each data model has a property named [type] which represents an internal type of a model. If this property is missing the default value is 'data'.
Application configuration combines data model types with a Controller class (e.g. data controller with http-data-controller).
This operation allows developers to register controller actions (such index, edit, new etc.)
to data models without creating controller classes for each model.
This can be done also by registering a controller during application initialization.

#### The config/app.json#settings section

This section contains settings like cryptography, authentication or other application specific settings.

    "settings": {
        "crypto": {
            "algorithm": "aes256",
            "key": "4b3236524b4e48534c776d5535646e55643542423763454e354b61426d784371"
        },
        "auth": {
            "name": ".MAUTH",
            "loginPage":"/login.html"
        }
    }

Cryptography settings are used when data encryption or decryption is required for an operation (like user authentication cookie).
These settings contain information about the algorithm and the key which are going to be used for encryption or decryption.
Authentication settings contain information about the name of the authentication cookie, the url of the login page etc.

#### The config/app.json#adapterTypes section

This section contains information about the registered data adapter types. [Read more information about MOST data adapters](https://docs.themost.io/most-data).

#### The config/app.json#adapters section

This section contains information about the registered data adapters. [Read more information about MOST data adapters](https://docs.themost.io/most-data).

#### The config/app.json#mimes section

This section includes all the available mime types that may be served by this application. Any mime type which is missing from this list will be ignored.
An application mime type is identified by an extension and a content type associated with this extension.

    ...
    {  "extension": ".pdf", "type": "application/pdf" },
    ...
    { "extension": ".svg", "type": "image/svg+xml" }
    ...

### The config/routes.json configuration file

The routes.json file contains application routing configuration:

    [
        { "url":"/", "controller":"root", "action":"index" },
        { "url":"/:action.html", "controller":"root" },
        { "url":"/:controller/:action.html", "mime":"text/html", "static":true },
        { "url":"/:controller/:action.json", "mime":"application/json" },
        { "url":"/:controller/:action.xml" },
        { "url":"/:controller/:id/:action.html", "mime":"text/html", "static":true },
        { "url":"/:controller/:id/:action.xml", "mime":"text/xml" },
        { "url":"/:controller/:id/:action.json", "mime":"application/json" }
    ]

A routing describes a controller's action. It may have a specific url like:

    { "url":"/My/profile.html", "controller":"my" }

 or a parameterized url:

    { "url":"/:controller/:action.html", "mime":"text/html" }

The [:controller] parameter represents the controller which is going to handle the request.
The [:action] parameter represents the controller's action. A routing may also have a mime type defined.
This mime type will be used for rendering the approriate HTTP result. The mime parameter is optional.

### Application Dependencies

Install application dependencies:

    npm install

and finally start application by executing:

    npm start

### Basic Features

**Model**

 - JSON schema based data modelling
 - Data model inheritance
 - Data constraint validation
 - Data field validation
 - Field calculators
 - One-to-many associations
 - Many-to-many associations
 - Advanced filtering
 - Data paging
 - Data grouping
 - Data triggerring
 - Data model privileges
 - Data caching
 - Data connectors (MySQL, MSSQL, PostgreSQL, Oracle etc)

 [Visit MOST Web Framework Data Module Documentation](https://docs.themost.io/most-data/)

**Controller**
 - Built-in REST services
 - OData protocol REST API
 - Data controllers
 - Static controllers
 - Request routing
 - Request caching
 - Built-in HTTP handlers
 - Built-in user authentication
 - Built-in user authorization
 - Multipart form data support etc

**View**
 - Customizable view engines
 - Master layouts
 - Customizable HTTP results
 - Angular JS for Server Applications
 - JQuery for Server Applications
 - Built-in localization etc

The MOST Web Framework Development Team
 
