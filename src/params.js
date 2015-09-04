/*-------------------------------------------------*\
 |                                                 |
 |      /$$$$$$    /$$$$$$   /$$$$$$   /$$$$$$     |
 |     /$$__  $$  /$$__  $$ |_  $$_/  /$$__  $$    |
 |    | $$  \__/ | $$  \ $$   | $$   | $$  \ $$    |
 |    |  $$$$$$  | $$$$$$$$   | $$   | $$  | $$    |
 |     \____  $$ | $$__  $$   | $$   | $$  | $$    |
 |     /$$  \ $$ | $$  | $$   | $$   | $$  | $$    |
 |    |  $$$$$$/ | $$  | $$  /$$$$$$ |  $$$$$$/    |
 |     \______/  |__/  |__/ |______/  \______/     |
 |                                                 |
 |                                                 |
 |                                                 |
 |    *---------------------------------------*    |
 |    |   © 2015 SAIO - All Rights Reserved   |    |
 |    *---------------------------------------*    |
 |                                                 |
\*-------------------------------------------------*/

var _ = require('underscore');

var Params = function(paramNames) {
  this.names = [];

  if (_.isArray(paramNames)) {
    this.names = paramNames;
  }
};

// param: name (string) || Array of names || Object: {<name>: value (string)} instanciated params
Params.prototype.isValid = function(param) {
  var names = this.names;

  if (_.isString(param)) {
    return _.contains(names, param);
  }

  if (_.isArray(param)) {
    return _.every(param, function(name) {
      return _.contains(names, name);
    });
  }

  if (_.isObject(param)) {
    return _.every(param, function(value, name) {
      return _.isString(value) && _.contains(names, name);
    });
  }

  return false;
};

// can match array to array, object to array & object to object
// for arrays, must have uniq values
Params.prototype.match = function(srcParams, destParams, bypass) {
  var _destParams = this.bypass(destParams, bypass);

  if (!_.isObject(_destParams)) {
    return false;
  }

  // we check empty _destParams case (object or array) first so we can accept undefined src
  if (_.isEmpty(_destParams)) {
    return true;
  }

  if (!_.isObject(srcParams)) {
    return false;
  }

  if (_.isArray(_destParams)) {
    if (_.isArray(srcParams)) {
      return _.every(_destParams, function(name) {
        return _.isString(name) && _.contains(srcParams, name);
      });
    }
    return _.every(_destParams, function(name) {
      return _.isString(name) && _.has(srcParams, name) && _.isString(srcParams[name]);
    });
  }

  if (_.isArray(srcParams)) {
    return false;
  }

  return _.every(_destParams, function(value, name) {
    return _.isString(value) && srcParams[name] === value;
  });
};

Params.prototype.strictMatch = function(srcParams, destParams, bypass) {
  var _destParams = this.bypass(destParams, bypass);

  if (!_.isObject(_destParams) || !_.isObject(srcParams) ||
      _.size(_destParams) !== _.size(srcParams)) {
    return false;
  }

  if (_.isArray(_destParams)) {
    if (_.isArray(srcParams)) {
      return _.every(_destParams, function(name) {
        return _.isString(name) && _.contains(srcParams, name);
      });
    }

    return _.every(_destParams, function(name) {
      return _.isString(name) && _.has(srcParams, name) && _.isString(srcParams[name]);
    });
  }

  if (_.isArray(srcParams)) {
    return false;
  }

  return _.every(_destParams, function(value, name) {
    return _.isString(value) && srcParams[name] === value;
  });
};

// remove bypass (array of param names) from params (can be an array or an object)
Params.prototype.bypass = function(params, bypass) {
  if (!_.isArray(bypass) || !_.isObject(params)) {
    return params;
  }
  if (_.isArray(params)) {
    return _.difference(params, bypass);
  }
  return _.omit(params, bypass);
};

module.exports = Params;
