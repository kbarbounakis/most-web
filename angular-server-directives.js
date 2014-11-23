/**
 * Created by Kyriakos on 1/10/2014.
 */
var web = require("./index");

function toBoolean(value) {
    if (typeof value === 'function') {
        value = true;
    } else if (value && value.length !== 0) {
        var v = lowercase("" + value);
        value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
    } else {
        value = false;
    }
    return value;
}
function getBlockElements(angular, nodes) {
    var startNode = nodes[0],
        endNode = nodes[nodes.length - 1];
    if (startNode === endNode) {
        return angular.element(startNode);
    }

    var element = startNode;
    var elements = [element];

    do {
        element = element.nextSibling;
        if (!element) break;
        elements.push(element);
    } while (element !== endNode);

    return angular.element(elements);
}

var directives = {
    /**
     * @param {HttpApplication} app
     */
    apply: function(app) {
        app.module.directive('ejsInclude', function($context, $angular, $qs, $sce) {
            return {
                replace:true,
                restrict:'EA',
                link: function (scope, element, attrs) {
                    /**
                     * @ngdoc attrs
                     * @property {string} ejsInclude
                     * @property {string} src
                     */
                    var src = attrs.ejsInclude || attrs.src;
                    if (src) {
                        var deferred = $qs.defer();
                        web.current.executeRequest( { url: src, cookie: $context.request.headers.cookie }, function(err, result) {
                            if (err) {
                                element.replaceWith(null);
                                deferred.reject(err.message);
                            }
                            else {
                                element.removeAttr('data-src');
                                element.replaceWith($angular.element(result.body));
                                deferred.resolve();
                            }
                        });
                    }
                }
            };
        }).directive('ejsInit', function() {
            return {
                priority:400,
                restrict:'A',
                link: function (scope, element, attrs) {
                    scope.$eval(attrs['ejsInit']);
                }
            };
        }).directive('ejsIf', function($animate, $document) {
            return {
                transclude: 'element',
                priority: 600,
                terminal: true,
                restrict: 'A',
                $$tlb: true,
                link: function ($scope, $element, $attr, ctrl, $transclude) {
                    var block, childScope, previousElements;
                    var ejsIf = $attr['ejsIf'], parentDocument = $document.get(0);
                    $scope.$watch(ejsIf, function ngIfWatchAction(value) {
                        if (toBoolean(value)) {
                            if (!childScope) {
                                childScope = $scope.$new();
                                $transclude(childScope, function (clone) {
                                    clone[clone.length++] = parentDocument.createComment('');
                                    block = {
                                        clone: clone
                                    };
                                    $animate.enter(clone, $element.parent(), $element);
                                });
                            }
                        } else {
                            if (previousElements) {
                                previousElements.remove();
                                previousElements = null;
                            }
                            if (childScope) {
                                childScope.$destroy();
                                childScope = null;
                            }
                            if (block) {
                                previousElements = getBlockElements(angular, block.clone);
                                $animate.leave(previousElements, function () {
                                    previousElements = null;
                                });
                                block = null;
                            }
                        }
                    });
                }
            };
        }).directive('ejsIfPermission', ['$context','$compile', '$qs', function($context, $compile, $qs) {
            return {
                restrict:'E',
                replace: true,
                scope: { model:'@',mask:'@' },
                compile:function() {
                    return {
                        pre: function preLink(scope, element) {
                            var DataPermissionEventListener = require('most-data').classes.DataPermissionEventListener;
                            var deferred = $qs.defer();
                            try {
                                var targetModel = $context.model(scope.model);
                                var p = new DataPermissionEventListener(), e = { model: targetModel, state: scope.mask, throwError:false };
                                p.validate(e, function(err) {
                                    if (e.result) {
                                        var result = $compile(element.contents())(scope);
                                        element.replaceWith(result);
                                        deferred.resolve();
                                    }
                                    else {
                                        element.replaceWith(null);
                                        deferred.resolve();
                                    }
                                });
                            }
                            catch(err) {
                                deferred.reject(err.message);
                            }


                        },
                        post: angular.noop
                    }
                }
            };
        }]);
    }
};

if (typeof exports !== 'undefined') module.exports.apply = directives.apply;