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

var Permissions = function(roles, actions, ressources, params, permissions) {
  // <ressourceName>.<action>.<roleName>: permission.bypass || []
  this.permissions = {};
  this.roles = roles;
  this.actions = actions;
  this.ressources = ressources;
  this.params = params;

  if (_.isArray(permissions)) {
    _.each(permissions, this.add, this);
  }
};

Permissions.prototype.add = function(permission) {
  var roleName;
  var role;
  var roleParams;
  var inActions;
  var actions;
  var ressourceName;
  var ressource;
  var ressourceParams;
  var bypass;
  var ressourcePerms;

  if (!_.isObject(permission) || !_.has(permission, 'role') ||
      !_.has(permission, 'action') || !_.has(permission, 'ressource')) {
    throw new Error('invalid permission');
  }

  roleName = permission.role;
  role = this.roles.get(roleName);
  if (_.isUndefined(role)) {
    throw new Error('invalid permission');
  }

  inActions = permission.action;
  actions = this.actions;
  if (_.isString(inActions)) {
    inActions = [inActions];
  }

  _.each(inActions, function(action) {
    if (!_.isString(action) || !_.contains(actions, action)) {
      throw new Error('invalid permission');
    }
  });

  ressourceName = permission.ressource;
  ressource = this.ressources.get(ressourceName);
  if (_.isUndefined(ressource)) {
    throw new Error('invalid permission');
  }

  bypass = permission.bypass;
  if (!_.isUndefined(bypass) && !_.isArray(bypass)) {
    throw new Error('invalid permission');
  }

  if (_.isUndefined(bypass)) {
    bypass = [];
  }

  ressourceParams = _.isArray(ressource.params) ? ressource.params : [];
  roleParams = _.isArray(role.params) ? role.params : [];

  if (!this.params.isValid(bypass) ||
      !this.params.match(ressourceParams, bypass) ||
      !this.params.match(roleParams, ressourceParams, bypass)) {
    throw new Error('invalid permission');
  }

  if (!_.has(this.permissions, ressourceName)) {
    this.permissions[ressourceName] = {};
  }

  ressourcePerms = this.permissions[ressourceName];
  _.each(inActions, function(action) {
    var actionPerms;
    if (!_.has(ressourcePerms, action)) {
      ressourcePerms[action] = {};
    }

    actionPerms = ressourcePerms[action];
    if (_.has(actionPerms, roleName)) {
      throw new Error('invalid permission');
    }

    actionPerms[roleName] = bypass;
  });
};

// return role instances allowed to perform action over ressource
// we suppose that ressource has already been validated
// only not bypassed params are instanciated in each returned role
Permissions.prototype.getRoles = function(action, ressource) {
  var permissions = this.permissions;
  var actions = this.actions;
  var params = this.params;
  var ressourceName;
  if (!_.isString(action) || !_.contains(actions, action)) {
    throw new Error('invalid action');
  }

  if (!_.isObject(ressource) || !_.has(ressource, 'name')) {
    throw new Error('invalid ressource');
  }

  ressourceName = ressource.name;
  if (!_.has(permissions, ressourceName) || !_.has(permissions[ressourceName], action)) {
    return [];
  }

  // create a role instance for each allowed permission
  return _.map(permissions[ressourceName][action], function(bypass, roleName) {
    var role = { name: roleName };
    var roleParams;
    if (!_.has(ressource, 'params')) {
      return role;
    }

    roleParams = params.bypass(ressource.params, bypass);
    if (_.isObject(roleParams) && !_.isEmpty(roleParams)) {
      role.params = roleParams;
    }

    return role;
  });
};

module.exports = Permissions;
