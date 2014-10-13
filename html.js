var HTML_START_CHAR='<';
var HTML_END_CHAR='>';
var HTML_FULL_END_STRING = ' />';
var HTML_SPACE_CHAR = ' ';
var HTML_ATTR_STRING = '%0="%1"';
var HTML_START_TAG_STRING = '<%0';
var HTML_END_TAG_STRING = '</%0>';
/**
 * @class HtmlWriter
 * Processing HTML and writes data to a buffer that may be used for server response.
 * @constructor
 */
function HtmlWriter() {
    /**
     * @private
     * @type {Array}
     */
    this.bufferedAttributes=[];
    /**
     * @private
     * @type {Array}
     */
    this.bufferedTags = [];
    /**
     * @private
     * @type {String}
     */
    this.buffer = '';
    /**
     * @private
     * @type {Integer}
     */
    this.indent = true;
};
/**
 * Writes an attribute to an array of attributes that is going to be used in writeBeginTag function
 * @param {String} name - The name of the HTML attribute
 * @param {String} value - The value of the HTML attribute
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.writeAttribute = function(name, value)
{
    this.bufferedAttributes.push({name:name, value:value});
    return this;
};
/**
 * Writes an array of attributes to the output buffer. This attributes are going to be rendered after writeBeginTag or WriteFullBeginTag function call.
 * @param {Array|Object} obj - An array of attributes or an object that represents an array of attributes
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.writeAttributes = function(obj)
{
    if (obj==null)
        return this;
    if (typeof obj === 'array') {
        for (var i = 0; i < obj.length; i++) {
            this.bufferedAttributes.push( { name:obj[i].name, value:obj[i].value } );
        }
    }
    else {
        for (var prop in obj)
        {
            if (obj.hasOwnProperty(prop)) {
                if (obj[prop]!=null) {
                    this.bufferedAttributes.push( { name:prop, value:obj[prop] } );
                }
            }
        }
    }
    return this;
};
/**
 * @param {String} tag
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.writeBeginTag = function(tag) {
    var string = require('string');
    var array = require('array');
    //write <TAG
    if (this.indent)
    {
        //this.buffer += '\n';
        this.buffer +=string('\t').repeat(this.bufferedTags.length).s;
    }
    this.buffer += HTML_START_TAG_STRING.replace(/%0/, tag);
    this.bufferedTags.push(tag);
    if (this.bufferedAttributes.length>0)
    {
        var s = '';
        array(this.bufferedAttributes).each(function(attr) {
            //write attribute='value'
            s += HTML_SPACE_CHAR;
            s += HTML_ATTR_STRING.replace(/%0/,attr.name).replace(/%1/, string(attr.value).escapeHTML());
        });
        this.buffer += s;
    }
    this.bufferedAttributes.splice(0,this.bufferedAttributes.length);
    this.buffer += HTML_END_CHAR;
    return this;
};
/**
 * Writes a full begin HTML tag (e.g <div/>).
 * @param {String} tag
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.writeFullBeginTag = function(tag) {
    var string = require('string');
    //write <TAG
    if (this.indent)
    {
        this.buffer += '\n';
        this.buffer +=string('\t').repeat(this.bufferedTags.length).s;
    }
    this.buffer += HTML_START_TAG_STRING.replace(/%0/, tag);
    if (this.bufferedAttributes.length>0)
    {
        var array = require('array');
        var string = require('string');
        var s = '';
        array(this.bufferedAttributes).each(function(attr) {
            //write attribute='value'
            s += HTML_SPACE_CHAR;
            s += HTML_ATTR_STRING.replace(/%0/,attr.name).replace(/%1/, string(attr.value).escapeHTML());
        });
        this.buffer += s;
    }
    this.bufferedAttributes.splice(0,this.bufferedAttributes.length);
    this.buffer += HTML_FULL_END_STRING;
    return this;
};
/**
 * Writes an end HTML tag (e.g </div>) based on the current buffered tags.
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.writeEndTag = function()
{
    var string = require('string');
    var tagsLength = this.bufferedTags ? this.bufferedTags.length : 0;
    if (tagsLength==0)
        return this;
    if (this.indent)
    {
        this.buffer += '\n';
        this.buffer +=string('\t').repeat(tagsLength-1).s;
    }
    this.buffer += HTML_END_TAG_STRING.replace(/%0/,this.bufferedTags[tagsLength-1]);
    this.bufferedTags.splice(tagsLength-1,1);
    return this;
}
/**
 *
 * @param {String} s
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.writeText = function(s) {
    if (!s)
        return this;
    var string = require('string');
    if (this.indent)
    {
        this.buffer += '\n';
        this.buffer +=string('\t').repeat(this.bufferedTags.length).s;
    }
    this.buffer += string(s).escapeHTML();
    return this;
};
/**
 *
 * @param {String} s
 * @returns {HtmlWriter}
 */
HtmlWriter.prototype.write = function(s) {
    this.buffer += s;
    return this;
};
/**
 * @returns {String}
 */
HtmlWriter.prototype.toString = function() {
    return this.buffer;
};

/**
 * @param {function} f
 */
HtmlWriter.prototype.writeTo = function(fn)
{
    if (typeof fn === 'function') {
        //call function
        fn(this.buffer);
        //and clear buffer
        this.buffer='';
        //and clear buffered tags
        this.bufferedTags.splice(0,this.bufferedTags.length);
    }
}

if (typeof exports !== 'undefined')
{
    module.exports = {
        /**
         * @constructor HtmlWriter
         */
        HtmlWriter:HtmlWriter,
        /**
         * Creates an HTML writer object.
         * @returns {HtmlWriter}
         */
        createInstance: function() {
            return new HtmlWriter();
        }
    }
}