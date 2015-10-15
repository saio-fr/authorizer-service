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

var Params = require('./params.js');
var Roles = require('./roles.js');
var Ressources = require('./ressources.js');
var Permissions = require('./permissions.js');

var Config = require('./config.js');

var Authorizer = function(container, options) {

  // complete config with options & validate (may throw)
  config = Config.build(options);

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
      var authId = kwargs.authId;
      var authRole = kwargs.authRole;
      var action = kwargs.action;
      var ressource = kwargs.ressource;
      console.log(wsDomain + '.can', authId, authRole, action, ressource);
      return that.can(authId, authRole, action, ressource);
    },
    '.roles.get': function(args, kwargs) {
      var authId = kwargs.authId;
      console.log(wsDomain + '.roles.get', authId);
      return that.getStaticRoles(authId);
    },
    '.roles.add': function(args, kwargs) {
      var authId = kwargs.authId;
      var role = kwargs.role;
      console.log(wsDomain + '.roles.add', authId, role);
      return that.addRoles(authId, role);
    },
    '.roles.remove': function(args, kwargs) {
      var authId = kwargs.authId;
      var role = kwargs.role;
      console.log(wsDomain + '.roles.remove', authId, role);
      return that.removeRoles(authId, role);
    },
    '.roles.set': function(args, kwargs) {
      var authId = kwargs.authId;
      var role = kwargs.role;
      console.log(wsDomain + '.roles.set', authId, role);
      return that.setRoles(authId, role);
    }
  };

  var pendingRegistrations = _.map(procedures, function(procedure, uri) {
    return that.ws.register(wsDomain + uri, procedure, { invoke: 'roundrobin' });
  });

  return when.all(pendingRegistrations)
    .then(function() {
      console.log('authorizer started');
      return when.resolve();
    });
};

Authorizer.prototype.stop = function() {
  return this.ws.unregister()
    .then(function() {
      console.log('authorizer stopped');
      return when.resolve();
    });
};

// authRole optional (anonymous by default)
Authorizer.prototype.can = function(authId, authRole, action, ressource) {
  var roles = this.roles;
  var dynamicRoles;
  var areDynamicRolesGranted;
  var grantedRoles;
  var staticRoles;

  if (!_.isString(authId) || _.isEmpty(authId)) {
    throw new Error('invalid authId');
  }

  if (!this.ressources.validate(ressource)) {
    throw new Error('invalid ressource');
  }

  grantedRoles = this.permissions.getRoles(action, ressource);
  if (_.isEmpty(grantedRoles)) {
    return false;
  }

  dynamicRoles = this.getDynamicRoles(authId, authRole);
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
  if (!_.isString(authId) || _.isEmpty(authId)) {
    throw new Error('invalid authId');
  }

  var roleInstances = [{
    name: '<ANONYMOUS>'
  }, {
    name: '<SELF>',
    params: {
      authId: authId
    }
  }];
  if (authRole === 'registered') {
    roleInstances.push({
      name: '<REGISTERED>',
      params: {
        authId: authId
      }
    });
  }
  return roleInstances;
};

Authorizer.prototype.getStaticRoles = function(authId, _keepRowRef) {
  if (!_.isString(authId) || _.isEmpty(authId)) {
    throw new Error('invalid authId');
  }

  var roles = this.roles;
  var Role = this.db.model.Role;
  return Role.findAll({ where: { authId: authId }})
    .then(function(rows) {
      var roleInstances = [];
      _.each(rows, function(row) {
        var role = roles.instanciateRow(row.dataValues);
        if (_keepRowRef) {
          role.row = row;
        }
        roleInstances.push(role);
      });
      return roleInstances;
    }).catch(function(err) {
      throw new Error('internal server error : ' + err.message);
    });
};

// rolesToAdd can be a role or an array of roles
Authorizer.prototype.addRoles = function(authId, rolesToAdd) {
  if (!_.isString(authId) || _.isEmpty(authId)) {
    throw new Error('invalid authId');
  }

  var roles = this.roles;
  var Role = this.db.model.Role;
  if (!_.isArray(rolesToAdd)) {
    rolesToAdd = [rolesToAdd];
  }
  _.each(rolesToAdd, function(role) {
    if (!roles.isValid(role) ||
        role.name === '<ANONYMOUS>' ||
        role.name === '<SELF>' ||
        role.name === '<REGISTERED>') {
      throw new Error('invalid role');
    }
  });

  // remove roles extended by others in the rolesToAdd array
  rolesToAdd = _.reject(rolesToAdd, function(role, i) {
    return _.some(rolesToAdd, function(otherRole, j) {
      if (i == j || !roles.isGranted(otherRole, role)) {
        return false;
      }
      if (!roles.isGranted(role, otherRole)) { // otherRole > role
        return true;
      }

      // else : otherRole <=> role, so keep the first one only
      return i > j;
    });
  });

  return this.getStaticRoles(authId, true)
    .then(function(dbRoles) {
      // do not add roles in rolesToAdd extended by roles in dbRoles
      rolesToAdd = _.reject(rolesToAdd, function(role) {
        return _.some(dbRoles, function(dbRole) {
          return roles.isGranted(dbRole, role);
        });
      });

      // remove roles in dbRoles extended by roles in rolesToAdd
      // note: pendingRemoves contains resolved promises for dbRoles to keep, it's harmless
      var pendingRemoves = _.map(dbRoles, function(dbRole) {
        var toRemove = _.some(rolesToAdd, function(role) {
          return roles.isGranted(role, dbRole);
        });

        if (toRemove) {
          return dbRole.row.destroy()
            .catch(function() {
              throw new Error('internal server error');
            });
        }
        return when.resolve();
      });

      // add roles in rolesToAdd to the db
      var pendingAdds = _.map(rolesToAdd, function(role) {
        var row;
        try {
          row = roles.export(authId, role);
        } catch (err) {
          return when.reject(err);
        }
        return Role.create(row)
          .catch(function() {
            throw new Error('internal server error');
          });
      });

      var pendingOps = _.flatten([pendingRemoves, pendingAdds], true);
      return when.all(pendingOps)
        .then(function() {
          return when.resolve();
        });
    });

};

// accepts as rolesToRemove: undefined (rm all roles of authId), a role or and array of roles
Authorizer.prototype.removeRoles = function(authId, rolesToRemove) {
  var roles = this.roles;
  var Role = this.db.model.Role;
  var whereClause;

  if (!_.isString(authId) || _.isEmpty(authId)) {
    throw new Error('invalid authId');
  }

  if (_.isUndefined(rolesToRemove)) {
    whereClause = { authId: authId };

  } else if (!_.isArray(rolesToRemove)) {
    whereClause = roles.export(authId, rolesToRemove);

  } else {
    whereClause = {};
    whereClause.$or = _.map(rolesToRemove, function(role) {
      return roles.export(authId, role);
    });
  }

  return Role.destroy({
    where: whereClause
  }).then(function() {
    return when.resolve();
  }).catch(function() {
    return when.reject(new Error('internal server error'));
  });
};

// accept as roleInstances a role or an array of roles
Authorizer.prototype.setRoles = function(authId, roleInstances) {
  var that = this;
  return this.removeRoles(authId)
    .then(function() {
      return that.addRoles(authId, roleInstances);
    });
};

module.exports = Authorizer;
