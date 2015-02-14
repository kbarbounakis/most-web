/**
 * MOST Web Framework
 * A JavaScript Web Framework
 * http://themost.io
 *
 * Copyright (c) 2014, Kyriakos Barbounakis k.barbounakis@gmail.com, Anthi Oikonomou anthioikonomou@gmail.com
 *
 * Released under the BSD3-Clause license
 * Date: 2015-01-05
 */
var util = require('util'),
    path=require('path'),
    fs = require('fs'),
    Db = require('tingodb')().Db,
    common = require('./common');
/**
 * @class FileStorage
 * @constructor
 */
function FileStorage() {
    /**
     * @type {string}
     */
    this.root = null;
    /**
     * @type {string}
     */
    this.virtualPath = null;
}

/**
 * @param {HttpContext} context
 * @param {string} src
 * @param {*} attrs
 * @param {function(Error=)} callback
 */
FileStorage.prototype.copyFrom = function(context, src, attrs, callback) {
    callback  = callback || function() {};
    callback();
};


/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {string} dest
 * @param {function(Error=,*=)} callback
 */
FileStorage.prototype.copyTo = function(context, item, dest, callback) {
    callback  = callback || function() {};
    callback();
};

/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,*=)} callback
 */
FileStorage.prototype.resolvePhysicalPath = function(context, item, callback) {
    callback  = callback || function() {};
    callback();
};
/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,*=)} callback
 */
FileStorage.prototype.resolveUrl = function(context, item, callback) {
    callback  = callback || function() {};
    callback();
}

/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error|common.FileNotFoundException=,ReadStream=)} callback
 */
FileStorage.prototype.createReadStream = function(context, item, callback) {
    callback  = callback || function() {};
    callback();
}


/**
 * @param {function(Error=)} callback
 */
FileStorage.prototype.init = function(callback) {
    callback  = callback || function() {};
    callback();
};

/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Error=,*=)} callback
 */
FileStorage.prototype.find = function(context, query, callback) {
    callback  = callback || function() {};
    callback();
};

/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Error=,*=)} callback
 */
FileStorage.prototype.findOne = function(context, query, callback) {
    callback  = callback || function() {};
    callback();
};

/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,*=)} callback
 */
FileStorage.prototype.remove = function(context, item, callback) {
    callback  = callback || function() {};
    callback();
};

/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Boolean)} callback
 */
FileStorage.prototype.exists = function(context, item, callback) {
    callback  = callback || function() {};
    callback(false);
};


/**
 * @class FileSystemStorage
 * @constructor
 * @augments FileStorage
 * @param {string} physicalPath The root directory of this storage
 */
function FileSystemStorage(physicalPath) {
    this.root = physicalPath;
    this.virtualPath = null;
    this.ensure = function(callback) {
        var self = this;
        callback = callback || function() {};
        if (self._initialized) {
            callback();
            return;
        }
        if (typeof self.root === 'undefined' || self.root==null) {
            callback(new Error('The file system storage root directory cannot be empty at this context.'));
        }
        else {
            //check directory existence
            fs.exists(self.root, function(exists) {
               if (exists) {
                   self._initialized = true;
                   callback();
               }
                else {
                   fs.mkdir(self.root,function(err) {
                      if (err) {
                          console.log(err);
                          callback(new Error('An error occured while trying to initialize file system storage.'));
                      }
                       else {
                          //create db collection if does not exist
                          var db = new Db(self.root, {nativeObjectID:true});
                          //Fetch a collection to insert document into
                          var collection = db.collection("fs");
                          db.close(function() {
                              //initialization was completed, so exit with no error
                              self._initialized = true;
                              callback();
                          });
                      }
                   });
               }
            });
        }
    };

    /**
     *
     * @param {function(Db, function(Error=,*=))} fn
     */
    this.execute = function(fn, callback) {
        fn = fn || function() {};
        try {
            var db = new Db(physicalPath, { nativeObjectID:true });
            fn(db, function(err, result) {
                db.close(function() {
                   callback(err, result);
                });
            });
        }
        catch (e) {
            callback(e);
        }
    }

}
util.inherits(FileSystemStorage, FileStorage);
/**
 *
 * @param {HttpContext} context
 * @param {*} item
 * @param {function} callback
 */
FileSystemStorage.prototype.save = function(context, item, callback) {
    var self = this;
    if (common.isNullOrUndefined(item)) {
        callback();
        return;
    }
    self.execute(function(db, cb) {
        //file default version
        item.version = item.version || 1;
        //file status (0) temporary
        item.status = item.status || 0;
        //file date created (on storage)
        item.dateCreated = new Date();
        //file date modified (on storage)
        item.dateModified = new Date();
        //get collection
        var collection = db.collection('fs');
        //save
        var state = 2;
        if (common.isNullOrUndefined(item._id)) {
            state=1;
            item.oid = common.randomChars(12);
        }
        collection.save(item, function(err) {
            cb(err);
        });
    }, function(err) {
        callback(err);
    });
};

/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Error=,*=)} callback
 */
FileSystemStorage.prototype.findOne = function(context, query, callback) {
    var self = this;
    if (common.isNullOrUndefined(query)) {
        callback();
        return;
    }
    self.ensure(function() {
        self.execute(function(db, cb) {
            //get collection
            var collection = db.collection('fs');
            if (query._id) {
                collection.findOne({_id:query._id}, function(err, result) {
                    cb(err, result);
                });
            }
            else {
                collection.findOne(query, function(err, result) {
                    cb(err, result);
                });
            }
        }, function(err, result) {
            callback(err, result);
        });
    });
};
/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,*=)} callback
 */
FileSystemStorage.prototype.resolvePhysicalPath = function(context, item, callback) {
    var _id = item._id, self = this, file_id;
    if (_id) {
        file_id = common.convertToBase26(_id)
        callback(null, path.join(self.root, file_id.substr(0,1), file_id));
    }
    else {
        self.findOne(context, item, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                if (common.isNullOrUndefined(result)) {
                    callback(new Error('Item cannot be found'));
                }
                else {
                    file_id = common.convertToBase26(result._id);
                    callback(null, path.join(self.root, file_id.substr(0,1), file_id));
                }
            }
        });
    }
};
/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,*=)} callback
 */
FileSystemStorage.prototype.resolveUrl = function(context, item, callback) {
    var oid = item.oid, self = this;
    if (oid) {
        callback(null, util.format(self.virtualPath, oid));
    }
    else {
        self.findOne(context, item, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                if (common.isNullOrUndefined(result)) {
                    callback(new Error('Item cannot be found'));
                }
                else {
                    callback(null, util.format(self.virtualPath, result.oid));
                }
            }
        });
    }
};

/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error|common.FileNotFoundException=,ReadStream=)} callback
 */
FileSystemStorage.prototype.createReadStream = function(context, item, callback) {
    var self = this, filePath;
    self.findOne(context, item, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            if (common.isNullOrUndefined(result)) {
                callback(new Error('Item cannot be found'));
            }
            else {
                //get file id
                var file_id = common.convertToBase26(result._id);
                //create file path
                filePath = path.join(self.root, file_id.substr(0,1), file_id);
                //check file
                fs.exists(filePath, function(exists) {
                    if (!exists) {
                        callback(new common.FileNotFoundException());
                    }
                    else {
                        callback(null, fs.createReadStream(filePath));
                    }
                });
            }
        }
    });

};

/***
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Boolean)} callback
 */
FileSystemStorage.prototype.exists = function(context, item, callback) {
    callback  = callback || function() {};
    this.findOne(context, item, function(err, result) {
        if (err) {
            common.log(err);
            callback(false);
        }
        else {
            callback(!common.isNullOrUndefined(result));
        }
    });
};
/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Error=,*=)} callback
 */
FileSystemStorage.prototype.find = function(context, query, callback) {
    var self = this;
    if (common.isNullOrUndefined(query)) {
        callback();
        return;
    }
    self.ensure(function() {
        self.execute(function(db, cb) {
            //get collection
            var collection = db.collection('fs');
            collection.find(query, function(err, result) {
                cb(err, result);
            });
        }, function(err, result) {
            callback(err, result);
        });
    });
};


/**
 * @param {function(Error=)} callback
 */
FileSystemStorage.prototype.init = function(callback) {
    this.ensure(function(err) {
        callback(err);
    });
};

/**
 * @param {HttpContext} context
 * @param {string} src
 * @param {*} attrs
 * @param {function(Error=,*=)} callback
 */
FileSystemStorage.prototype.copyFrom = function(context, src, attrs, callback) {
    var self = this;
    callback = callback || function() {};
    self.ensure(function(err) {
        if (err) {
            callback(err);
        }
        else {
            var filename = path.basename(src);
            attrs = attrs || {};
            //set file composition name
            attrs.filename = attrs.filename || filename;
            //check source file
            fs.exists(src, function(exists) {
               if (!exists) {
                   callback(new Error('The source file cannot be found'));
               }
                else {
                   //save attributes
                   //insert item attributes
                   self.save(context, attrs, function(err) {
                       if (err) {
                           callback(err);
                       }
                       else {
                           //file operation (save to folder)
                           var file = common.convertToBase26(attrs._id);
                           fs.exists(path.join(self.root, file.substr(0,1)), function(exists) {
                               if (exists) {
                                   copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                      callback(err);
                                   });
                               }
                               else {
                                   fs.mkdir(path.join(self.root, file.substr(0,1)), function(err) {
                                      if (err) {
                                          callback(err);
                                      }
                                       else {
                                          copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                              callback(err);
                                          });
                                      }
                                   });
                               }
                           });
                       }
                   });
               }
            });

        }
    });
};


/**
 * @param {HttpContext} context
 * @param {string|*} item
 * @param {string} dest
 * @param {function(Error=,*=)} callback
 */
FileSystemStorage.prototype.copyTo = function(context, item, dest, callback) {
    var self = this;
    callback  = callback || function() {};
    if (common.isNullOrUndefined(item)) {
        callback(new Error('The source item cannot be empty at this context'));
        self.findOne(context, item, function(err, result) {
           if (err) {
                callback(err);
           }
            else {
               if (common.isNullOrUndefined(result)) {
                   callback(new Error('The source item cannot be found.'));
               }
               else {
                   var file = common.convertToBase26(result._id), src = path.join(self.root, file.substr(0,1), file);
                   fs.exists(src, function(exists) {
                      if (!exists) {
                          callback(new Error('The source file cannot be found.'));
                      }
                       else {
                          var destFile = path.join(dest, result.filename);
                          copyFile(src, destFile, function(err) {
                              callback(err, destFile);
                          });
                      }
                   });
               }
           }
        });
    }
};



/**
 * @class AttachmentFileSystemStorage
 * @constructor
 * @augments FileStorage
 * @param {string} physicalPath The root directory of this storage
 */
function AttachmentFileSystemStorage(physicalPath) {
    this.root = physicalPath;
    this.virtualPath = null;
    this.ensure = function(callback) {
        var self = this;
        callback = callback || function() {};
        if (self._initialized) {
            callback();
            return;
        }
        if (common.isNullOrUndefined(self.root)) {
            callback(new Error('The file system storage root directory cannot be empty at this context.'));
        }
        else {
            //check directory existence
            fs.exists(self.root, function(exists) {
                if (exists) {
                    self._initialized = true;
                    callback();
                }
                else {
                    fs.mkdir(self.root,function(err) {
                        if (err) {
                            console.log(err);
                            callback(new Error('An error occured while trying to initialize file system storage.'));
                        }
                        else {
                            self._initialized = true;
                            callback();
                        }
                    });
                }
            });
        }
    };
}

util.inherits(AttachmentFileSystemStorage, FileStorage);
/**
 *
 * @param {HttpContext} context
 * @param {*} item
 * @param {function} callback
 */
AttachmentFileSystemStorage.prototype.save = function(context, item, callback) {
    var self = this;
    self.ensure(function(err) {
        if (err) {
            callback(err);
        }
        else {
            if (common.isNullOrUndefined(item)) {
                callback();
                return;
            }
            var attachments = context.model('Attachment');
            if (common.isNullOrUndefined(attachments)) {
                callback(new Error('Attachment model cannot be found.'));
            }
            //file default version
            item.version = item.version || 1;
            //file status (false) not published
            item.published = item.published || false;

            attachments.save(item, function(err) {
                callback(err);
            });
        }
    });

};
/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Error=,*=)} callback
 */
AttachmentFileSystemStorage.prototype.findOne = function(context, query, callback) {
    var self = this;
    self.ensure(function(err) {
        if (err) {
            callback(err);
        }
        else {
            if (common.isNullOrUndefined(query)) {
                callback();
                return;
            }
            var attachments = context.model('Attachment');
            if (common.isNullOrUndefined(attachments)) {
                callback(new Error('Attachment model cannot be found.'));
            }
            attachments.find(query).first(callback);
        }
    });

};
/**
 *
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,string=)} callback
 */
AttachmentFileSystemStorage.prototype.resolvePhysicalPath = function(context, item, callback) {
    var id = item.id, self = this, file_id;
    if (id) {
        file_id = common.convertToBase26(id)
        callback(null, path.join(self.root, file_id.substr(0,1), file_id));
    }
    else {
        self.findOne(context, item, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                if (common.isNullOrUndefined(result)) {
                    callback(new Error('Item cannot be found'));
                }
                else {
                    file_id = common.convertToBase26(result.id);
                    callback(null, path.join(self.root, file_id.substr(0,1), file_id));
                }
            }
        });
    }
};
/**
 *
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error=,string=)} callback
 */
AttachmentFileSystemStorage.prototype.resolveUrl = function(context, item, callback) {
    var oid = item.oid, self = this, file_id;
    if (oid) {
        callback(null, util.format(self.virtualPath, oid));
    }
    else {
        self.findOne(context, item, function(err, result) {
            if (err) {
                callback(err);
            }
            else {
                if (common.isNullOrUndefined(result)) {
                    callback(new Error('Item cannot be found'));
                }
                else {
                    callback(null, util.format(self.virtualPath, item.oid));
                }
            }
        });
    }
};

/**
 * @param {HttpContext} context
 * @param {*} item
 * @param {function(Error|common.FileNotFoundException=,ReadStream=)} callback
 */
AttachmentFileSystemStorage.prototype.createReadStream = function(context, item, callback) {
    var self = this, filePath;
    self.findOne(context, item, function(err, result) {
        if (err) {
            callback(err);
        }
        else {
            if (common.isNullOrUndefined(result)) {
                callback(new Error('Item cannot be found'));
            }
            else {
                //get file id
                var file_id = common.convertToBase26(result.id);
                //create file path
                filePath = path.join(self.root, file_id.substr(0,1), file_id);
                //check file
                fs.exists(filePath, function(exists) {
                    if (!exists) {
                        callback(new common.FileNotFoundException());
                    }
                    else {
                        callback(null, fs.createReadStream(filePath));
                    }
                });
            }
        }
    });

};

/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Boolean)} callback
 */
AttachmentFileSystemStorage.prototype.exists = function(context, query, callback) {
    callback  = callback || function() {};
    this.findOne(context, query, function(err, result) {
        if (err) {
            common.log(err);
            callback(false);
        }
        else {
            callback(!common.isNullOrUndefined(result));
        }
    });
};
/**
 * @param {HttpContext} context
 * @param {*} query
 * @param {function(Error=,*=)} callback
 */
AttachmentFileSystemStorage.prototype.find = function(context, query, callback) {
    var self = this;
    self.ensure(function(err) {
        if (err) {
            callback(err);
        }
        else {
            if (common.isNullOrUndefined(query)) {
                callback();
            }
            else {
                var attachments = context.model('Attachment');
                if (common.isNullOrUndefined(attachments)) {
                    callback(new Error('Attachment model cannot be found.'));
                }
                attachments.find(query).all(callback)
            }
        }
    });
};


/**
 * @param {function(Error=)} callback
 */
AttachmentFileSystemStorage.prototype.init = function(callback) {
    this.ensure(callback);
};

/**
 * @param {HttpContext} context
 * @param {string} src
 * @param {*} attrs
 * @param {function(Error=,*=)} callback
 */
AttachmentFileSystemStorage.prototype.copyFrom = function(context, src, attrs, callback) {
    var self = this;
    callback = callback || function() {};
    self.ensure(function(err) {
        if (err) {
            callback(err);
        }
        else {
            var filename = path.basename(src);
            attrs = attrs || {};
            //set file composition name
            attrs.filename = attrs.filename || filename;
            //check source file
            fs.exists(src, function(exists) {
                if (!exists) {
                    callback(new Error('The source file cannot be found'));
                }
                else {
                    //save attributes
                    //insert item attributes
                    self.save(context, attrs, function(err) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            //file operation (save to folder)
                            var file = common.convertToBase26(attrs.id);
                            fs.exists(path.join(self.root, file.substr(0,1)), function(exists) {
                                if (exists) {
                                    copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                        callback(err);
                                    });
                                }
                                else {
                                    fs.mkdir(path.join(self.root, file.substr(0,1)), function(err) {
                                        if (err) {
                                            callback(err);
                                        }
                                        else {
                                            copyFile(src,path.join(self.root, file.substr(0,1), file), function(err) {
                                                callback(err);
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });

        }
    });
};


/**
 * @param {HttpContext} context
 * @param {string|*} item
 * @param {string} dest
 * @param {function(Error=,*=)} callback
 */
AttachmentFileSystemStorage.prototype.copyTo = function(context, item, dest, callback) {
    var self = this;
    callback  = callback || function() {};
    self.ensure(function(err) {
        if (err) {
            callback(err);
        }
        else {
            if (common.isNullOrUndefined(item)) {
                callback(new Error('The source item cannot be empty at this context'));
                self.findOne(context, item, function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        if (common.isNullOrUndefined(result)) {
                            callback(new Error('The source item cannot be found.'));
                        }
                        else {
                            var file = common.convertToBase26(result.id), src = path.join(self.root, file.substr(0,1), file);
                            fs.exists(src, function(exists) {
                                if (!exists) {
                                    callback(new Error('The source file cannot be found.'));
                                }
                                else {
                                    var destFile = path.join(dest, result.filename);
                                    copyFile(src, destFile, function(err) {
                                        callback(err, destFile);
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    });

};


function copyFile(src, dest, callback) {
    //create read stream
    var source = fs.createReadStream(src);
    //create write stream
    var dest = fs.createWriteStream(dest);
    //copy file
    source.pipe(dest);
    source.on('end', function() {
            callback();
    });
    source.on('error', function(err) {
        callback(err);
    });
}

var files = {
    /**
     * @class FileSystemStorage
     */
    FileSystemStorage:FileSystemStorage,
    /**
     * @class AttachmentFileSystemStorage
     */
    AttachmentFileSystemStorage:AttachmentFileSystemStorage,
    /**
     * @param {string} physicalPath
     * @return {FileStorage}
     */
    createFileSystemStorage:function(physicalPath) {
        return new FileSystemStorage(physicalPath);
    },
    /**
     * @class FileStorage
     */
    FileStorage:FileStorage
};

if (typeof exports !== 'undefined') {
    module.exports = files;
}
