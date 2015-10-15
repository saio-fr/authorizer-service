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

var tape = require('blue-tape');
var _ = require('underscore');
var Params = require('../src/params.js');
var Roles = require('../src/roles.js');
var Ressources = require('../src/ressources.js');
var Permissions = require('../src/permissions.js');

tape('Permissions constructor without init perms', function(t) {
  var params = new Params(['p0', 'p1', 'p2']);
  var roles = new Roles(params);
  var ressources = new Ressources(params);
  var actions = ['a0', 'a1', 'a2'];

  function helper() {
    return new Permissions(roles, actions, ressources, params);
  }

  t.doesNotThrow(helper, 'Permissions constructor without init perms');

  t.end();
});

tape('Permissions.add', function(t) {
  var permissionsToAdd;

  function helper() {
    var paramsConfig = ['p0', 'p1'];
    var actionsConfig = ['a0', 'a1'];
    var rolesConfig = [{
      name: 'role0'
    }, {
      name: 'role1',
      params: ['p0']
    }, {
      name: 'role2',
      params: ['p0', 'p1']
    }];
    var ressourcesConfig = [{
      name: 'ressource0'
    }, {
      name: 'ressource1',
      params: ['p0']
    }, {
      name: 'ressource2',
      params: ['p0', 'p1']
    }];
    var params = new Params(paramsConfig);
    var roles = new Roles(params, rolesConfig);
    var ressources = new Ressources(params, ressourcesConfig);
    var permissions = new Permissions(roles, actionsConfig, ressources, params);

    if (!_.isArray(permissionsToAdd)) {
      permissions.add(permissionsToAdd);
    } else {
      _.each(permissionsToAdd, permissions.add, permissions);
    }
  }

  permissionsToAdd = undefined;
  t.throws(helper, 'undefined permission');

  permissionsToAdd = {};
  t.throws(helper, 'empty permission');

  permissionsToAdd = {
    role: 'role42',
    action: 'a0',
    ressource: 'ressource0'
  };
  t.throws(helper, 'unknown role');

  permissionsToAdd = {
    role: 'role0',
    action: 'a42',
    ressource: 'ressource0'
  };
  t.throws(helper, 'unknown action');

  permissionsToAdd = {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource42'
  };
  t.throws(helper, 'unknown ressource');

  permissionsToAdd = {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource0'
  };
  t.doesNotThrow(helper, 'no params');

  permissionsToAdd = {
    role: 'role0',
    action: ['a0', 'a1'],
    ressource: 'ressource0'
  };
  t.doesNotThrow(helper, 'no params, 2 actions');

  permissionsToAdd = {
    role: 'role0',
    action: ['a0', 'a1', 'a42'],
    ressource: 'ressource0'
  };
  t.throws(helper, 'no params, actions array, containing unknown action');

  permissionsToAdd = {
    role: 'role0',
    action: ['a0', 'a1', 'a0'],
    ressource: 'ressource0'
  };
  t.throws(helper, 'no params, actions array, containing 2x same action');

  permissionsToAdd = [{
    role: 'role0',
    action: 'a0',
    ressource: 'ressource0'
  }, {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource0'
  }];
  t.throws(helper, 'same permission');

  permissionsToAdd = {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource1'
  };
  t.throws(helper, 'no params in role but needed');

  permissionsToAdd = {
    role: 'role1',
    action: 'a0',
    ressource: 'ressource2'
  };
  t.throws(helper, 'missing params in role');

  permissionsToAdd = {
    role: 'role1',
    action: 'a0',
    ressource: 'ressource1'
  };
  t.doesNotThrow(helper, 'matching param');

  permissionsToAdd = {
    role: 'role2',
    action: 'a0',
    ressource: 'ressource2'
  };
  t.doesNotThrow(helper, 'matching params');

  permissionsToAdd = {
    role: 'role1',
    action: 'a0',
    ressource: 'ressource2',
    bypass: ['p1']
  };
  t.doesNotThrow(helper, 'missing param & bypass');

  permissionsToAdd = {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource2',
    bypass: ['p0', 'p1']
  };
  t.doesNotThrow(helper, 'bypass all params');

  t.end();
});

tape('Permissions constructor with init perms', function(t) {
  var permissionsToAdd;

  function helper() {
    var paramsConfig = ['p0', 'p1'];
    var actionsConfig = ['a0', 'a1'];
    var rolesConfig = [{
      name: 'role0'
    }, {
      name: 'role1',
      params: ['p0']
    }, {
      name: 'role2',
      params: ['p0', 'p1']
    }];
    var ressourcesConfig = [{
      name: 'ressource0'
    }, {
      name: 'ressource1',
      params: ['p0']
    }, {
      name: 'ressource2',
      params: ['p0', 'p1']
    }];
    var params = new Params(paramsConfig);
    var roles = new Roles(params, rolesConfig);
    var ressources = new Ressources(params, ressourcesConfig);

    return new Permissions(roles, actionsConfig, ressources, params, permissionsToAdd);
  }

  permissionsToAdd = [];
  t.doesNotThrow(helper, 'empty init perms');

  permissionsToAdd = [{
    role: 'role0',
    action: 'a0',
    ressource: 'ressource0'
  }, {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource0'
  }];
  t.throws(helper, 'same permission');

  permissionsToAdd = [{
    role: 'role2',
    action: 'a0',
    ressource: 'ressource2'
  }, {
    role: 'role1',
    action: 'a0',
    ressource: 'ressource2',
    bypass: ['p1']
  }, {
    role: 'role0',
    action: 'a0',
    ressource: 'ressource2',
    bypass: ['p0', 'p1']
  }];
  t.doesNotThrow(helper, 'standard use-case');

  t.end();
});

tape('Permissions.getRoles', function(t) {
  var permissionsToAdd;
  var action;
  var ressource;
  var expected;

  // check if a & b contains the "same" values, where a & b are supposed to contains objects
  function looseArrayEqual(a, b) {
    if (!_.isArray(a) || !_.isArray(b) || a.length !== b.length) {
      return false;
    }

    return _.every(a, function(valA) {
      return _.some(b, function(valB) {
        return _.isEqual(valA, valB);
      });
    });
  }

  function helper() {
    var paramsConfig = ['p0', 'p1'];
    var actionsConfig = ['a0', 'a1'];
    var rolesConfig = [{
      name: 'role0'
    }, {
      name: 'role1',
      params: ['p0']
    }, {
      name: 'role2',
      params: ['p0', 'p1']
    }];
    var ressourcesConfig = [{
      name: 'ressource0'
    }, {
      name: 'ressource1',
      params: ['p0']
    }, {
      name: 'ressource2',
      params: ['p0', 'p1']
    }];
    var params = new Params(paramsConfig);
    var roles = new Roles(params, rolesConfig);
    var ressources = new Ressources(params, ressourcesConfig);
    var permissions = new Permissions(roles, actionsConfig, ressources, params, permissionsToAdd);
    var pRoles = permissions.getRoles(action, ressource);
    return looseArrayEqual(pRoles, expected);
  }

  permissionsToAdd = [];
  action = 'a0';
  ressource = {
    name: 'ressource0'
  };
  expected = [];
  t.ok(helper(), 'valid action/ressource but empty permissions');

  permissionsToAdd = [{
    role: 'role0',
    action: ['a0', 'a1'],
    ressource: 'ressource0'
  }, {
    role: 'role1',
    action: 'a1',
    ressource: 'ressource1'
  }, {
    role: 'role1',
    action: 'a0',
    ressource: 'ressource1',
    bypass: ['p0']
  }, {
    role: 'role1',
    action: 'a1',
    ressource: 'ressource2',
    bypass: ['p1']
  }, {
    role: 'role2',
    action: ['a0', 'a1'],
    ressource: 'ressource2'
  }];
  action = 'a2';
  ressource = {
    name: 'ressource0'
  };
  expected = [];
  t.throws(helper, 'unknown action');

  action = 'a0';
  ressource = {
    name: 'ressource0'
  };
  expected = [{
    name: 'role0'
  }];
  t.ok(helper(), 'single perm');

  action = 'a1';
  ressource = {
    name: 'ressource1',
    params: {
      p0: '42'
    }
  };
  expected = [{
    name: 'role1',
    params: {
      p0: '42'
    }
  }];
  t.ok(helper(), 'single perm with param');

  action = 'a0';
  ressource = {
    name: 'ressource1',
    params: {
      p0: '42'
    }
  };
  expected = [{
    name: 'role1'
  }];
  t.ok(helper(), 'single perm with bypass');

  action = 'a0';
  ressource = {
    name: 'ressource2',
    params: {
      p0: '41',
      p1: '42'
    }
  };
  expected = [{
    name: 'role2',
    params: {
      p0: '41',
      p1: '42'
    }
  }];
  t.ok(helper(), 'single perm with 2 params');

  action = 'a1';
  ressource = {
    name: 'ressource2',
    params: {
      p0: '41',
      p1: '42'
    }
  };
  expected = [{
    name: 'role1',
    params: {
      p0: '41'
    }
  }, {
    name: 'role2',
    params: {
      p0: '41',
      p1: '42'
    }
  }];
  t.ok(helper(), '2 perms with params & bypass');

  // TODO test bypass a param in role & in ressource
  t.end();
});
