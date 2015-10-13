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

/*
  structure of role patterns & instances:
    pattern: {
      <name>: {
        name: string,
        params: [<paramName>],
        extends: {
          <parentName>: [<paramName>] array of params to bypass
        },
        extendedBy: [<childName>]
      }
    }

    instance: {
      name: string,
      params: {
        <paramName>: string
      }
    }

  params: Params
*/
var Roles = function(params, roles) {
  this.params = params;
  this.patterns = {};

  if (_.isArray(roles)) {
    _.each(roles, this.add, this);
    this.build();
  }
};

Roles.prototype.has = function(patternName) {
  if (!_.isString(patternName) || _.isEmpty(patternName)) {
    throw new Error('invalid role');
  }
  return _.has(this.patterns, patternName);
};

Roles.prototype.get = function(patternName) {
  var pattern;
  if (this.has(patternName)) {
    pattern = this.patterns[patternName];
    return _.pick(pattern, 'name', 'params');
  }
};

Roles.prototype.add = function(pattern) {
  var name;
  var params;
  var inPattern;

  if (!_.isObject(pattern) || !_.has(pattern, 'name')) {
    throw new Error('invalid role pattern');
  }

  name = pattern.name;
  if (this.has(name)) {
    throw new Error('already have pattern');
  }

  params = this.params;
  inPattern = { name: name };
  if (_.has(pattern, 'params')) {
    if (!params.isValid(pattern.params)) {
      throw new Error('invalid role pattern');
    }

    if (!_.isEmpty(pattern.params)) {
      inPattern.params = pattern.params.slice();
    }
  }

  if (_.has(pattern, 'extends')) {
    if (!_.isArray(pattern.extends) || _.isEmpty(pattern.extends)) {
      throw new Error('invalid role pattern');
    }

    inPattern.extends = {};
    _.each(pattern.extends, function(extend) {
      var bypass;
      if (!_.has(extend, 'name')) {
        throw new Error('invalid role config');
      }

      inPattern.extends[extend.name] = [];
      if (!_.has(extend, 'bypass')) {
        return;
      }

      bypass = extend.bypass;
      if (!_.isArray(bypass)) {
        throw new Error('invalid role config');
      }
      if (_.isEmpty(bypass)) {
        return;
      }

      if (!params.isValid(bypass)) {
        throw new Error('invalid role config');
      }

      inPattern.extends[extend.name] = bypass.slice();
    });
  }

  this.patterns[name] = inPattern;
};

// to be called after consistent add calls (ie when the inheritance graph is complete)
Roles.prototype.build = function() {
  this._validateExtendFormat();
  this._validateAcyclic();
  this._buildComplexExtends();
};

// return bypass array if extends, undefined if not
Roles.prototype.extends = function(childName, parentName) {
  var pattern;

  if (!this.has(childName) || !this.has(parentName)) {
    throw new Error('invalid role name');
  }

  pattern = this.patterns[childName];
  if (!_.has(pattern, 'extends') || !_.has(pattern.extends, parentName)) {
    return;
  }

  return pattern.extends[parentName];
};

// instanciates & returns a role from a sequelize Role.datavalues instance
Roles.prototype.instanciateRow = function(row) {
  var role;
  var name;
  var params;
  var paramNames;
  var pattern;
  var undefParam;
  var isRowValid;

  try {
    name = row.name;
    isRowValid = this.has(name);
  } catch (err) {
    isRowValid = false;
  }
  if (!isRowValid) {
    throw new Error('invalid row in Role database');
  }

  role = { name: name };
  pattern = this.patterns[name];
  if (!_.has(pattern, 'params')) {
    return role;
  }

  paramNames = pattern.params;
  params = {};
  undefParam = false;
  _.each(paramNames, function(paramName) {
    var paramVal = row[paramName];

    params[paramName] = paramVal;
    if (!_.isString(paramVal)) {
      undefParam = true;
    }
  });

  if (undefParam) {
    throw new Error('invalid row in Role database');
  }

  role.params = params;
  return role;
};

// flatten the possible params so a sequelize Role instance can be built from that
// we suppose that the role has been validated & authId too
Roles.prototype.export = function(authId, role) {
  var row = {
    authId: authId,
    name: role.name
  };

  if (_.has(role, 'params')) {
    if (_.has(role.params, 'authId') && authId !== role.params.authId) {
      throw new Error('invalid role');
    }
    _.extendOwn(row, role.params);
  }

  return row;
};

Roles.prototype.isValid = function(role) {
  var pattern;
  var params;

  if (!_.isObject(role) || !_.has(role, 'name') || !this.has(role.name)) {
    return false;
  }

  pattern = this.patterns[role.name];
  if (!_.has(pattern, 'params')) {
    return !_.has(role, 'params');
  }

  if (!_.has(role, 'params')) {
    return false;
  }

  params = role.params;
  if (!_.isObject(params)) {
    return false;
  }

  return this.params.strictMatch(params, pattern.params);
};

// return bool, does src grant dest ? handles != schema
// instances don't need to have all params defined,
// only the params defined in destInstance are checked
Roles.prototype.isGranted = function(srcRole, destRole) {
  var srcName;
  var destName;
  var destPattern;
  var destParams;
  var patterns;
  var bypass;

  if (!_.isObject(srcRole) || !_.isObject(destRole) ||
      !_.has(srcRole, 'name') || !_.has(destRole, 'name')) {
    throw new Error('invalid role');
  }

  srcName = srcRole.name;
  destName = destRole.name;
  if (!this.has(srcName) || !this.has(destName)) {
    throw new Error('invalid role');
  }

  patterns = this.patterns;
  destPattern = patterns[destName];
  if (srcName !== destName) {
    bypass = this.extends(srcName, destName);
    if (_.isUndefined(bypass)) {
      return false;
    }
  }

  if (!_.has(destPattern, 'params')) {
    return true;
  }

  destParams = _.pick(destRole.params, destPattern.params);
  return this.params.match(srcRole.params, destParams, bypass);
};

Roles.prototype._validateExtendFormat = function() {
  var patterns = this.patterns;
  var params = this.params;

  _.each(patterns, function(pattern) {
    if (!_.has(pattern, 'extends')) {
      return;
    }

    _.each(pattern.extends, function(bypass, parentName) {
      var parentPattern;
      var validParamExtend;

      if (!_.has(patterns, parentName)) {
        throw new Error('invalid role config');
      }

      parentPattern = patterns[parentName];
      if (!_.has(parentPattern, 'extendedBy')) {
        parentPattern.extendedBy = [];
      }
      parentPattern.extendedBy.push(pattern.name);

      if (!_.has(parentPattern, 'params')) {
        return;
      }

      validParamExtend = params.match(pattern.params, parentPattern.params, bypass);
      if (!validParamExtend) {
        throw new Error('invalid role config');
      }
    });
  });
};

Roles.prototype._validateAcyclic = function() {
  var patterns = this.patterns;
  var patternNames = _.keys(patterns);

  // dft for all roles (this is brutal but we doesn't really need high perf here)
  _.each(patternNames, function(sourceName) {
    var nVisited = {};
    var stack = [sourceName];

    function visit(name) {
      var pattern = patterns[name];
      var maxNVisit = _.has(pattern, 'extendedBy') ? pattern.extendedBy.length : 1;

      if (!_.has(nVisited, name)) {
        nVisited[name] = 0;
        if (_.has(pattern, 'extends')) {
          _.each(pattern.extends, function(extend, parentName) {
            stack.push(parentName);
          });
        }

      } else if (nVisited[name] === maxNVisit) {
        throw new Error('invalid config');
      }

      ++nVisited[name];
    }

    while (!_.isEmpty(stack)) {
      visit(stack.pop());
    }
  });
};

// build complex extends
// with bft of the graph of patterns + 'extendedBy' edges
// start bft at source patterns (ie that doesnt extend)
Roles.prototype._buildComplexExtends = function() {
  var patterns = this.patterns;
  var visited = {};
  var queue;

  function visit(pattern) {
    visited[pattern.name] = true;
    if (!_.has(pattern, 'extendedBy')) {
      return;
    }

    _.each(pattern.extendedBy, function(childName) {
      var childPattern = patterns[childName];

      if (_.has(pattern, 'extends')) {
        // forward all pattern.extends to childPattern.extends
        _.each(pattern.extends, function(bypass, parentName) {
          childPattern.extends[parentName] = _.union(bypass, childPattern.extends[patterns.name]);
        });
      }

      if (!visited[childName]) {
        queue.push(childPattern);
      }
    });
  }

  // init job: put source patterns in queue
  queue = _.filter(patterns, function(pattern) {
    return !_.has(pattern, 'extends');
  });

  // bft loop
  while (!_.isEmpty(queue)) {
    visit(queue.shift());
  }
};

module.exports = Roles;
