'use strict';

// # S3 storage module for Ghost blog http://ghost.org/
var fs = require('fs');
var path = require('path');
var nodefn = require('when/node/function');
var when = require('when');
var readFile = nodefn.lift(fs.readFile);
var unlink = nodefn.lift(fs.unlink);
var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick: true });
var AWS = require('aws-sdk');
var options = {};

function S3Store(config) {
  options = config || {};
}

S3Store.prototype.save = function(image) {
  var self = this;
  if (!options) return when.reject('ghost-s3 is not configured');

  var targetDir = self.getTargetDir();
  var targetFilename = self.getTargetName(image, targetDir);
  var awsPath = options.assetHost ? options.assetHost : 'https://' + options.bucket + '.s3.amazonaws.com/';

  imageMagick(image.path)
  .autoOrient()
  .stream(function (err, stdout, stderror) {
    if (err) console.log("Error in creating an image from a Buffer: ", stderror);
    var buf = new Buffer(0);
    stdout.on("data", function(d) {
      buf = Buffer.concat([buf, d]);
    });
    stdout.on("end", function() {
      var s3 = new AWS.S3({
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
        S3Store.prototype.save = function(image) {
        ContentType: image.type,
        CacheControl: 'max-age=' + (30 * 24 * 60 * 60) // 30 days
      });

      return nodefn.call(s3.putObject.bind(s3), {
        ACL: 'public-read',
        Bucket: options.bucket,
        Key: targetFilename,
        Body: buffer,
        ContentType: image.type,
        CacheControl: 'max-age=' + (30 * 24 * 60 * 60) // 30 days
      });
    })
  })
};

// middleware for serving the files
S3Store.prototype.serve = function() {
  // a no-op, these are absolute URLs
  return function (req, res, next) {
    next();
  };
};

S3Store.prototype.getTargetDir = function() {
  var MONTHS = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  var now = new Date();
  return now.getFullYear() + '/' + MONTHS[now.getMonth()] + '/';
};

S3Store.prototype.getTargetName = function(image, targetDir) {
  var ext = path.extname(image.name),
    name = path.basename(image.name, ext).replace(/\W/g, '_');

  return targetDir + name + '-' + Date.now() + ext;
};

S3Store.prototype.logError = function(error) {
  console.log('error in ghost-s3', error);
};

S3Store.prototype.logInfo = function(info) {
  console.log('info in ghost-s3', info);
};

module.exports = S3Store;
