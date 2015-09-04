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
var WsUrlParser = require('./wsUrlParser.js');

var Ressources = function(params, ressources) {
  this._ressources = {};
  this._params = params;
  this._wsUrlParser = new WsUrlParser();

  if (_.isArray(ressources)) {
    _.each(ressources, this.add, this);
  }
};

Ressources.prototype.has = function(name) {
  return _.isString(name) && _.has(this._ressources, name);
};

Ressources.prototype.get = function(name) {
  if (_.isString(name)) {
    return this._ressources[name];
  }
};

Ressources.prototype.add = function(ressource) {
  if (_.isUndefined(ressource) || !_.has(ressource, 'name') || !_.isString(ressource.name)) {
    throw new Error('invalid ressource');
  }

  if (this.has(ressource.name)) {
    throw new Error('already have ressource');
  }

  // param validation
  if (_.has(ressource, 'params')) {
    if (!_.isArray(ressource.params) || !this._params.isValid(ressource.params)) {
      throw new Error('invalid ressource');
    }
  }

  // wamp validation & add
  if (_.has(ressource, 'wsUrl')) {
    if (!_.isString(ressource.wsUrl)) {
      throw new Error('invalid ressource');
    }

    try {
      this._wsUrlParser.add(ressource);
    } catch (e) {
      throw new Error('invalid ressource');
    }
  }

  this._ressources[ressource.name] = ressource;
};

// if instance has no name but a wampURI, update name and params if any
// check name & params vs corresponding ressource schema and return true if valid
Ressources.prototype.validate = function(instance) {
  var foundInstance;
  var ressource;
  if (_.isUndefined(instance) || !_.isObject(instance)) {
    return false;
  }

  if (!_.has(instance, 'name')) {
    if (!_.has(instance, 'wsUrl')) {
      return false;
    }

    foundInstance = this._wsUrlParser.get(instance.wsUrl);
    if (_.isUndefined(foundInstance)) {
      return false;
    }

    instance.name = foundInstance.name;
    if (_.has(foundInstance, 'params')) {
      instance.params = foundInstance.params;
    }
  }

  ressource = this.get(instance.name);
  if (_.isUndefined(ressource)) {
    return false;
  }

  if (!_.has(ressource, 'params') || _.isEmpty(ressource.params)) {
    return !_.has(instance, 'params') || _.isEmpty(instance.params);
  }

  return this._params.strictMatch(instance.params, ressource.params);
};

module.exports = Ressources;
