var app = require('most-web');

function TestHandler()
{

}

TestHandler.prototype.validateRequest = function(context) {
    //
};


if (typeof module !== 'undefined'  && typeof module.exports !== 'undefined') module.exports = {
    /**
     * @returns {TestHandler}
     */
    createInstance: function() {
        return new TestHandler();
    }
}
