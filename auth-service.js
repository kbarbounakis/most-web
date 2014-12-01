/**
 * Created by Kyriakos on 15/11/2014.
 */
var web = web = require('./index');

if (typeof exports !== 'undefined') {
    /**
     * @param {HttpContext} context
     * @returns {{login: function(string,string, function(Error)), logout: function(function(Error))}}
     */
    module.exports.createInstance = function(context) {
        return {
            login:function(userName, userPassword, callback) {
                callback = callback || function() {};
                try {
                    var model = context.model('User');
                    if (model==null) {
                        callback(new Error('Login failed due to server error. User model cannot be found on target application.'));
                        return;
                    }
                    model.where('name').equal(userName).and('userPassword').equal('{clear}' + userPassword).silent().count(function(err, count) {
                        if (err) {
                            console.log(err);
                            callback(new Error('Login failed due to server error. Please try again or contact to system administrator.'));
                        }
                        else {
                            if (count==0) {
                                callback(new web.common.HttpException(401, 'Unknown username or bad password. Please try again.'));
                                return;
                            }
                            else {
                                //set cookie
                                web.current.setAuthCookie(context, userName);
                                    context.user = model.convert({ name: userName, authenticationType:'Basic' });
                                callback(null);
                            }
                        }
                    });
                }
                catch (e) {
                    console.log(e);
                    callback(new Error('Login failed due to internal server error.'));
                }

            },
            logout:function(callback) {
                callback = callback || function() {};
                var anonymousIdentity = { name: 'anonymous', authenticationType:'None' };
                try {
                    //get user model, if any
                    var model = context.model('User');
                    //set auth cookie to anonymous
                    web.current.setAuthCookie(context, 'anonymous');
                    //check user model and set HttpContext.user property
                    if (model)
                        context.user = model.convert(anonymousIdentity);
                    else
                        context.user = anonymousIdentity;
                    callback(null);
                }
                catch(e) {
                    console.log(e);
                    if (context)
                        context.user = anonymousIdentity;
                }

            }
        }
    }
}

