
/**
 * html to simple-virtual-dom
 * @date 2016-01-09 14:04:21
 * @author vfasky <vfasky@gmail.com>
 * @link http://vfasky.com
 */
'use strict';

var h2v, loaderUtils;
require('coffee-script/register');
loaderUtils = require('loader-utils');
h2v = require('./h2v');

module.exports = function(html) {
  var callback, query;
  query = loaderUtils.parseQuery(this.query);
  if (this.cacheable) {
    this.cacheable();
  }
  callback = this.async();
  return callback(null, h2v(html, query));
};
