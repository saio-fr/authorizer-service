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

var path = require('path');
var _ = require('underscore');
var when = require('when');

//var Logger = require('@saio/logger-component');
var Db = require('@saio/db-component');
var WSocket = require('@saio/wsocket-component');

var ConfigBuilder = require('./configBuilder.js');
var Params = require('./params.js');
var Roles = require('./roles.js');
var Ressources = require('./ressources.js');
var Permissions = require('./permissions.js');

var Authorizer = function(container, options) {
  var configPath = path.resolve(process.env.PWD, 'config/config.json');
  var config;
  try {
    config = require(configPath);
  } catch (e) {
    throw new Error('config file not found !');
  }

  // complete config with options & validate (may throw)
  config = ConfigBuilder.build(config, options);

  this.params = new Params(config.auth.params);
  this.roles = new Roles(this.params, config.auth.roles);
  this.ressources = new Ressources(this.params, config.auth.ressources);
  this.permissions = new Permissions(this.roles, config.auth.actions, this.ressources,
    this.params, config.auth.permissions);

  this.wsDomain = config.ws.domain;

  //this.logger = container.use('logger', Logger, config.logger);
  this.ws = container.use('ws', WSocket, config.ws);
  this.db = container.use('db', Db, config.db);

};

Authorizer.prototype.start = function() {
  var that = this;
  var wsDomain = this.wsDomain;
  var procedures = {
    '.crossbar.can': function(args) {
      try {
        var authId = args[0].authid;
        var authRole = args[0].authrole;
        var action = args[2];
        var ressource = { wsUrl: args[1] };
        console.log(wsDomain + '.crossbar.can', authId, authRole, action, ressource);
        return that.can(authId, authRole, action, ressource);
      } catch (err) {
        console.error(err.stack);
        return false;
      }
    },
    '.can': function(args, kwargs) {
      try {
        var authId = kwargs.authId;
        var authRole = kwargs.authRole;
        var action = kwargs.action;
        var ressource = kwargs.ressource;
        console.log(wsDomain + '.can', authId, authRole, action, ressource);
        return that.can(authId, authRole, action, ressource);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    '.roles.get': function(args, kwargs) {
      var authId = kwargs.authId;
      console.log(wsDomain + '.roles.get', authId);
      try {
        return that.getStaticRoles(authId);
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    '.roles.add': function(args, kwargs) {
      var authId = kwargs.authId;
      var role = kwargs.role;
      console.log(wsDomain + '.roles.add', authId, role);
      try {
        return that.addRole(authId, role);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    '.roles.remove': function(args, kwargs) {
      var authId = kwargs.authId;
      var role = kwargs.role;
      console.log(wsDomain + '.roles.remove', authId, role);
      try {
        return that.removeRole(authId, role);
      } catch (err) {
        console.error(err);
        return false;
      }
    }
  };

  var pendingRegistrations = _.map(procedures, function(procedure, uri) {
    return that.ws.register(wsDomain + uri, procedure, { invoke: 'roundrobin' });
  });

  return when.all(pendingRegistrations)
    .then(function() {
      // TODO log start
      console.log('authorizer started');
      return when.resolve();
    });
};

Authorizer.prototype.stop = function() {
  return this.ws.unregister()
    .then(function() {
      // TODO log stop
      console.log('authorizer stopped');
      return when.resolve();
    });
};

// authRole optional (anonymous by default)
Authorizer.prototype.can = function(authId, authRole, action, ressource) {
  var roles = this.roles;
  var dynamicRoles = this.getDynamicRoles(authId, authRole);
  var areDynamicRolesGranted;
  var grantedRoles;
  var staticRoles;

  if (!this.ressources.validate(ressource)) {
    return false;
  }

  grantedRoles = this.permissions.getRoles(action, ressource);
  if (_.isEmpty(grantedRoles)) {
    return false;
  }

  areDynamicRolesGranted = _.some(grantedRoles, function(grantedRole) {
    return _.some(dynamicRoles, function(userRole) {
      return roles.isGranted(userRole, grantedRole);
    });
  });

  if (areDynamicRolesGranted) {
    return true;
  }

  // static roles defined only for registered users
  if (authRole !== 'registered') {
    return false;
  }

  return this.getStaticRoles(authId)
    .then(function(staticRoles) {
      return _.some(grantedRoles, function(grantedRole) {
        return _.some(staticRoles, function(userRole) {
          return roles.isGranted(userRole, grantedRole);
        });
      });
    });
};

// authRole optional (anonymous by default)
Authorizer.prototype.getDynamicRoles = function(authId, authRole) {
  var roles;
  if (!_.isString(authId)) {
    return [];
  }

  roles = [{
    name: '<ANONYMOUS>'
  }, {
    name: '<SELF>',
    params: {
      authId: authId
    }
  }];
  if (authRole === 'registered') {
    roles.push({
      name: '<REGISTERED>',
      params: {
        authId: authId
      }
    });
  }
  return roles;
};

Authorizer.prototype.getStaticRoles = function(authId, _keepRowRef) {
  var roles = this.roles;
  var Role = this.db.model.Role;

  if (!_.isString(authId)) {
    return [];
  }

  return Role
    .findAll({ where: { authId: authId }})
    .then(function(rows) {
      var userRoles = [];
      _.each(rows, function(row) {
        var role = roles.instanciateRow(row.dataValues);
        if (_.isUndefined(role)) {
          return;
        }
        if (_keepRowRef) {
          role.row = row;
        }
        userRoles.push(role);
      });
      return userRoles;
    }).catch(function() {
      // TODO log error
      return [];
    });
};

// authRole optional (anonymous by default)
Authorizer.prototype.getRoles = function(authId, authRole) {
  var dynamicRoles = this.getDynamicRoles(authId, authRole);
  return this.getStaticRoles(authId)
    .then(function(staticRoles) {
      return dynamicRoles.concat(staticRoles);
    });
};

Authorizer.prototype.addRole = function(authId, role) {
  var roles = this.roles;
  var Role = this.db.model.Role;
  var userRole;

  if (!_.isString(authId) ||
      !roles.isValid(role) ||
      role.name === '<ANONYMOUS>' ||
      role.name === '<SELF>' ||
      role.name === '<REGISTERED>') {
    // TODO log throw new Error('invalid role');
    console.error('invalid role');
    return false;
  }

  userRole = roles.export(authId, role);
  if (_.isUndefined(userRole)) {
    // TODO log throw new Error('invalid role');
    console.error('invalid role');
    return false;
  }

  // first remove all roles that are extended by role
  return this.getStaticRoles(authId, true)
    .then(function(dbRoles) {
      var pendingRemoves = [];
      _.each(dbRoles, function(dbRole) {
        if (roles.isGranted(role, dbRole)) {
          pendingRemoves.push(dbRole.row.destroy());
        }
      });
      return when.all(pendingRemoves);

    // create role
    }).then(function() {
      return Role.create(userRole);

    // return a clean result:)
    }).then(function() {
      return true;
    }).catch(function() {
      // TODO log error
      console.log('cannot add role');
      return false;
    });
};

Authorizer.prototype.removeRole = function(authId, role) {
  var roles = this.roles;
  var userRole;

  if (!_.isString(authId) || !roles.isValid(role)) {
    // TODO log throw new Error('invalid role');
    return false;
  }

  userRole = roles.export(authId, role);
  if (_.isUndefined(userRole)) {
    // TODO log throw new Error('invalid role');
    return false;
  }

  return this.db.model.Role.destroy({
    where: userRole
  }).then(function() {
    return true;
  }).catch(function() {
    // TODO log error
    return false;
  });
};

module.exports = Authorizer;
