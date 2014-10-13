var web=require('most-web');
exports.testApplication = function(test) {
    //web.current.init();
    test.done();
}

exports.testRoutes = function(test) {
    //test urls
    var r = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/ig;
    var url = "http://localhost/orders/index.html";
    var matches = r.exec(url);
    test.done();
}