/**
 * Created by Kyriakos Barbounakis on 7/11/2014.
 */

exports.extend = function($) {

    $.fn.outerHTML = $.fn.outer = function () {
        return $(this).clone().wrap('<div></div>').parent().html();
    }

    $.extend($.expr[':'],{
        required: function(a) {
            return $(a).attr('required') === 'required';
        }
    });

};