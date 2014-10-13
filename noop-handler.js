/**
 * @class NoopHandler
 * @constructor
 * @augments HttpHandler
 */
function NoopHandler() {
    //
}

/**
 * @returns HttpHandler
 * */
NoopHandler.prototype.createInstance = function () {
    return new NoopHandler();
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') module.exports = NoopHandler.prototype.createInstance();