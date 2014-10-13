/**
 * Created by Kyriakos on 1/10/2014.
 */
var web = require('.././index'), util = require('util');

function ab(x, y1, z) {
    return x;
}

function bc() {
    return 1;
}

Function.prototype.argumentNames = function() {
    //var matches = /\((.*?)\)/.exec(this.toString());
    var matches = /\((.*\w.*)\)/.exec(this.toString());
    if (matches) {
        var s = matches[1].replace(/\s/g,'');
        if (s.length>0) { return s.split(',') }
    }
    return [];
};

exports.testGetFunctionArgs = function(test) {
    util.log(ab.argumentNames());
    util.log(bc.argumentNames());
    test.done();
};