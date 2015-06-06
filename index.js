'use strict';

var lodash = require('lodash');
var Catalog = require('gettext-catalog');
var gutil = require('gulp-util');
var File = gutil.File;
var through = require('through2');

var path = require('path');

module.exports = function poConcat (options) {
  options = options || {};

  var catalog = new Catalog();

  var firstFile = null;

  var finish = function (cb) {
    var pos = catalog.toPOs();
    pos.forEach(function (po) {
      this.push(new File({
        // if you don't want to use the first file for the base directory, you can use gulp-rename to change it
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, po.domain + '.pot'),
        contents: new Buffer(po.toString())
      }));
    }.bind(this));

    cb();
  };

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      return cb('gulp-po-concat', 'Streaming not supported');
    }

    if (!firstFile) {
      firstFile = file;
    }

    var domain = path.basename(file.path, '.pot');

    if (lodash.isFunction(options.domain)) {
      domain = options.domain(file);
    } else if (lodash.isString(options.domain)) {
      domain = options.domain;
    }

    var messages = catalog.poToMessages(file.contents.toString(), {domain: domain});

    catalog.addMessages(messages);

    return cb();
  }, finish);
};
