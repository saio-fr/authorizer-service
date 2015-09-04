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

tape('Roles constructor (without init roles)', function(t) {

  function helper() {
    var params = new Params(['p']);
    return new Roles(params);
  }

  t.doesNotThrow(helper, 'Role constructor with only params');

  t.end();
});

tape('Roles.add/build', function(t) {
  var toAdd;

  function helper() {
    var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
    var roles = new Roles(params);

    if (!_.isArray(toAdd)) {
      roles.add(toAdd);
    } else {
      _.each(toAdd, roles.add, roles);
    }

    roles.build();
  }

  t.test('add invalid roles', function(st) {

    toAdd = undefined;
    st.throws(helper, 'add undefined role');

    toAdd = {};
    st.throws(helper, 'add empty role');

    toAdd = [{
      name: 'role'
    }, {
      name: 'role'
    }];
    st.throws(helper, 'add role with same name');

    toAdd = {
      name: 'role',
      params: ['p0', 'p42']
    };
    st.throws(helper, 'add role with invalid params');

    st.end();
  });

  t.test('add valid roles', function(st) {

    toAdd = [];
    st.doesNotThrow(helper, 'add 0 roles, just build');

    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1'
    }, {
      name: 'role2'
    }];
    st.doesNotThrow(helper, 'add name-only roles');

    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1',
      params: ['p0', 'p1']
    }, {
      name: 'role2',
      params: ['p2', 'p3', 'p4']
    }];
    st.doesNotThrow(helper, 'add roles with params');

    toAdd = {
      name: 'role',
      params: []
    };
    st.doesNotThrow(helper, 'add role with empty params');

    st.end();
  });

  t.test('add roles that cannot extend', function(st) {

    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1',
      extends: [{
        name: 'role42'
      }]
    }];
    st.throws(helper, 'add a role whose parent is missing');

    toAdd = [{
      name: 'role0',
      params: ['p0', 'p1', 'p2']
    }, {
      name: 'role1',
      params: ['p0', 'p2'],
      extends: [{
        name: 'role0'
      }]
    }];
    st.throws(helper, 'add a role which miss parent params');

    toAdd = [{
      name: 'role0',
      params: ['p0', 'p1', 'p2']
    }, {
      name: 'role1',
      params: ['p2'],
      extends: [{
        name: 'role0',
        bypass: ['p0']
      }]
    }];
    st.throws(helper, 'add a role which miss parent params but with bypass');

    toAdd = [{
      name: 'role0',
      params: ['p0', 'p1', 'p2']
    }, {
      name: 'role2',
      params: ['p2'],
      extends: [{
        name: 'role0',
        bypass: ['p0', 'p1']
      }, {
        name: 'role1',
        bypass: ['p3']
      }]
    }];
    st.throws(helper, 'add a role with 2 extends, but one parent is missing');

    st.end();
  });

  t.test('add roles that can extend', function(st) {
    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1',
      extends: [{
        name: 'role0'
      }]
    }];
    st.doesNotThrow(helper, 'simple extend');

    toAdd = [{
      name: 'role0',
      params: ['p0']
    }, {
      name: 'role1',
      params: ['p0', 'p1'],
      extends: [{
        name: 'role0'
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with params');

    toAdd = [{
      name: 'role0',
      params: ['p0']
    }, {
      name: 'role1',
      extends: [{
        name: 'role0',
        bypass: ['p0']
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with bypass');

    toAdd = [{
      name: 'role0',
      params: ['p0', 'p1']
    }, {
      name: 'role1',
      extends: [{
        name: 'role0',
        bypass: ['p0', 'p1']
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with several bypass');

    toAdd = [{
      name: 'role0',
      params: ['p0']
    }, {
      name: 'role1',
      params: ['p1'],
      extends: [{
        name: 'role0',
        bypass: ['p0']
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with params & bypass');

    toAdd = [{
      name: 'role0',
      params: ['p0']
    }, {
      name: 'role1',
      params: ['p0'],
      extends: [{
        name: 'role0',
        bypass: ['p1']
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with params & useless bypass');

    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1',
      extends: [{
        name: 'role0'
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1'
      }]
    }];
    st.doesNotThrow(helper, 'simple 2-levels extend');

    toAdd = [{
      name: 'role0',
      params: ['p0', 'p1']
    }, {
      name: 'role1',
      params: ['p1'],
      extends: [{
        name: 'role0',
        bypass: ['p0']
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1',
        bypass: ['p1']
      }]
    }];
    st.doesNotThrow(helper, '2-levels extend with params & bypass');

    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1',
      extends: [{
        name: 'role0'
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role0'
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with 2 childs');

    toAdd = [{
      name: 'role0'
    }, {
      name: 'role1'
    }, {
      name: 'role2',
      extends: [{
        name: 'role0'
      }, {
        name: 'role1'
      }]
    }];
    st.doesNotThrow(helper, 'simple extend with 2 parents');

    toAdd = [{
      name: 'role0',
      extends: [{
        name: 'role1'
      }, {
        name: 'role2'
      }]
    }, {
      name: 'role1',
      extends: [{
        name: 'role3'
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1'
      }, {
        name: 'role4'
      }]
    }, {
      name: 'role3',
      extends: [{
        name: 'role6'
      }]
    }, {
      name: 'role4',
      extends: [{
        name: 'role6'
      }, {
        name: 'role7'
      }]
    }, {
      name: 'role5',
      extends: [{
        name: 'role4'
      }]
    }, {
      name: 'role6',
      extends: [{
        name: 'role7'
      }]
    }, {
      name: 'role7'
    }];
    st.doesNotThrow(helper, 'complex role graph');

    st.end();
  });

  t.test('add roles that extend circularly', function(st) {

    toAdd = [{
      name: 'role0',
      extends: [{
        name: 'role1'
      }]
    }, {
      name: 'role1',
      extends: [{
        name: 'role0'
      }]
    }];
    st.throws(helper, '2-roles circle');

    toAdd = [{
      name: 'role0',
      extends: [{
        name: 'role2'
      }]
    }, {
      name: 'role1',
      extends: [{
        name: 'role0'
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1'
      }]
    }];
    st.throws(helper, '3-roles circle');

    toAdd = [{
      name: 'role0',
      extends: [{
        name: 'role2'
      }]
    }, {
      name: 'role1',
      extends: [{
        name: 'role0'
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1'
      }]
    }, {
      name: 'role3'
    }];
    st.throws(helper, '3-roles circle + 1 isolated role');

    toAdd = [{
      name: 'role0',
      extends: [{
        name: 'role1'
      }, {
        name: 'role2'
      }]
    }, {
      name: 'role1',
      extends: [{
        name: 'role3'
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1'
      }, {
        name: 'role4'
      }]
    }, {
      name: 'role3',
      extends: [{
        name: 'role2'
      }, {
        name: 'role6'
      }]
    }, {
      name: 'role4',
      extends: [{
        name: 'role6'
      }, {
        name: 'role7'
      }]
    }, {
      name: 'role5',
      extends: [{
        name: 'role4'
      }]
    }, {
      name: 'role6',
      extends: [{
        name: 'role7'
      }]
    }, {
      name: 'role7'
    }];
    st.throws(helper, '3-roles circle in complex role graph');

    st.end();
  });

  t.end();
});

tape('Roles constructor (with init roles)', function(t) {
  var toAdd;

  function helper() {
    var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
    return new Roles(params, toAdd);
  }

  toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1'
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    extends: [{
      name: 'role3'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role1'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role3',
    extends: [{
      name: 'role6'
    }]
  }, {
    name: 'role4',
    extends: [{
      name: 'role6'
    }, {
      name: 'role7'
    }]
  }, {
    name: 'role5',
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role6',
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }];
  t.doesNotThrow(helper, 'with complex role extends');

  toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1'
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    extends: [{
      name: 'role3'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role1'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role3',
    extends: [{
      name: 'role2'
    }, {
      name: 'role6'
    }]
  }, {
    name: 'role4',
    extends: [{
      name: 'role6'
    }, {
      name: 'role7'
    }]
  }, {
    name: 'role5',
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role6',
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }];
  t.throws(helper, 'with circular extend');

  t.end();
});

tape('Roles.has/get', function(t) {

  t.test('empty roles', function(st) {
    var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
    var toAdd;
    var roles = new Roles(params, toAdd);

    var msg = 'unknown role';
    var name = 'role';
    var expected;

    st.notOk(roles.has(name), 'has ' + msg);
    st.deepEqual(roles.get(name), expected, 'get ' + msg);

    st.end();
  });

  t.test('example roles', function(st) {
    var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
    var toAdd = [{
      name: 'role0',
      params: ['p0', 'p1']
    }, {
      name: 'role1',
      params: ['p1'],
      extends: [{
        name: 'role0',
        bypass: ['p0']
      }]
    }, {
      name: 'role2',
      extends: [{
        name: 'role1',
        bypass: ['p1']
      }]
    }];
    var roles = new Roles(params, toAdd);

    var msg = 'unknown role';
    var name = 'role';
    var expected;
    st.notOk(roles.has(name), 'has ' + msg);
    st.deepEqual(roles.get(name), expected, 'get ' + msg);

    msg = 'kown role';
    name = 'role1';
    expected = {
      name: 'role1',
      params: ['p1']
    };
    st.ok(roles.has(name), 'has ' + msg);
    st.deepEqual(roles.get(name), expected, 'get ' + msg);

    st.end();
  });

  t.end();
});

tape('Roles.extends', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
  var toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1',
      bypass: ['p0', 'p1', 'p2']
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    params: ['p0', 'p1', 'p2'],
    extends: [{
      name: 'role3'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role4',
      bypass: ['p2']
    }]
  }, {
    name: 'role3',
    params: ['p2'],
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role4',
    params: ['p2']
  }, {
    name: 'role5',
    params: ['p3'],
    extends: [{
      name: 'role6',
      bypass: ['p4']
    }]
  }, {
    name: 'role6',
    params: ['p3', 'p4'],
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }];
  var roles = new Roles(params, toAdd);
  var child;
  var parent;
  var expected;

  child = 'role3';
  parent = 'role1';
  expected = undefined;
  t.deepEqual(roles.extends(child, parent), expected, 'does not extend');

  child = 'role5';
  parent = 'role6';
  expected = ['p4'];
  t.deepEqual(roles.extends(child, parent), expected, 'simple extend with child not extended');

  child = 'role2';
  parent = 'role4';
  expected = ['p2'];
  t.deepEqual(roles.extends(child, parent), expected, 'simple extend with child extended');

  child = 'role5';
  parent = 'role7';
  expected = [];
  t.deepEqual(roles.extends(child, parent), expected, 'complex extend with single paths');

  child = 'role0';
  parent = 'role4';
  expected = ['p2'];
  t.deepEqual(roles.extends(child, parent), expected, 'complex extend with multiple paths');

  t.end();
});

tape('Roles.instanciateRow', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
  var toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1',
      bypass: ['p0', 'p1', 'p2']
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    params: ['p0', 'p1', 'p2'],
    extends: [{
      name: 'role3'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role4',
      bypass: ['p2']
    }]
  }, {
    name: 'role3',
    params: ['p2'],
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role4',
    params: ['p2']
  }, {
    name: 'role5',
    params: ['p3'],
    extends: [{
      name: 'role6',
      bypass: ['p4']
    }]
  }, {
    name: 'role6',
    params: ['p3', 'p4'],
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }];
  var roles = new Roles(params, toAdd);
  var row;
  var expected;

  row = undefined;
  expected = undefined;
  t.deepEqual(roles.instanciateRow(row), expected, 'undefined row');

  row = {};
  expected = undefined;
  t.deepEqual(roles.instanciateRow(row), expected, 'empty row');

  row = {
    authId: 'john doe',
    name: 'role42'
  };
  expected = undefined;
  t.deepEqual(roles.instanciateRow(row), expected, 'row with unknown name');

  row = {
    authId: 'john doe',
    name: 'role7'
  };
  expected = {
    name: 'role7'
  };
  t.deepEqual(roles.instanciateRow(row), expected, 'row without params');

  row = {
    authId: 'john doe',
    name: 'role1',
    p0: '0',
    p2: '2'
  };
  expected = undefined;
  t.deepEqual(roles.instanciateRow(row), expected, 'row with missing params');

  row = {
    authId: 'john doe',
    name: 'role1',
    p0: '0',
    p1: 42,
    p2: '2'
  };
  expected = undefined;
  t.deepEqual(roles.instanciateRow(row), expected, 'row with invalid params');

  row = {
    authId: 'john doe',
    name: 'role1',
    p0: '0',
    p1: '1',
    p2: '2'
  };
  expected = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  t.deepEqual(roles.instanciateRow(row), expected, 'row with params');

  t.end();
});

tape('Roles.isValid', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
  var toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1',
      bypass: ['p0', 'p1', 'p2']
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    params: ['p0', 'p1', 'p2'],
    extends: [{
      name: 'role3'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role4',
      bypass: ['p2']
    }]
  }, {
    name: 'role3',
    params: ['p2'],
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role4',
    params: ['p2']
  }, {
    name: 'role5',
    params: ['p3'],
    extends: [{
      name: 'role6',
      bypass: ['p4']
    }]
  }, {
    name: 'role6',
    params: ['p3', 'p4'],
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }];
  var roles = new Roles(params, toAdd);
  var role;

  role = undefined;
  t.notOk(roles.isValid(role), 'undefined role');

  role = {};
  t.notOk(roles.isValid(role), 'empty role');

  role = {
    name: 'role42'
  };
  t.notOk(roles.isValid(role), 'role with unknown name');

  role = {
    name: 'role7'
  };
  t.ok(roles.isValid(role), 'role without params');

  role = {
    name: 'role1',
    params: {
      p0: '0',
      p2: '2'
    }
  };
  t.notOk(roles.isValid(role), 'role with missing params');

  role = {
    name: 'role1',
    params: {
      p0: '0',
      p1: 42,
      p2: '2'
    }
  };
  t.notOk(roles.isValid(role), 'role with invalid params');

  role = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  t.ok(roles.isValid(role), 'role with params');

  t.end();
});

tape('Roles.export', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4', 'authId']);
  var toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1',
      bypass: ['p0', 'p1', 'p2']
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    params: ['p0', 'p1', 'p2'],
    extends: [{
      name: 'role3'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role4',
      bypass: ['p2']
    }]
  }, {
    name: 'role3',
    params: ['p2'],
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role4',
    params: ['p2']
  }, {
    name: 'role5',
    params: ['p3'],
    extends: [{
      name: 'role6',
      bypass: ['p4']
    }]
  }, {
    name: 'role6',
    params: ['p3', 'p4'],
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }, {
    name: 'roleUserId',
    params: ['authId']
  }];
  var roles = new Roles(params, toAdd);
  var authId = 'john doe';
  var role;
  var expected;

  role = {
    name: 'role0'
  };
  expected = {
    authId: authId,
    name: 'role0'
  };
  t.deepEqual(roles.export(authId, role), expected, 'name-only role');

  role = {
    name: 'role6',
    params: {
      p3: '3',
      p4: '4'
    }
  };
  expected = {
    authId: authId,
    name: 'role6',
    p3: '3',
    p4: '4'
  };
  t.deepEqual(roles.export(authId, role), expected, 'role with params');

  role = {
    name: 'roleUserId',
    params: {
      authId: authId
    }
  };
  expected = {
    authId: authId,
    name: 'roleUserId'
  };
  t.deepEqual(roles.export(authId, role), expected, 'role with same authId as param');

  role = {
    name: 'roleUserId',
    params: {
      authId: 'john malkovitch'
    }
  };
  expected = undefined;
  t.deepEqual(roles.export(authId, role), expected, 'role with wrong authId as param');

  t.end();
});

tape('Roles.isGranted', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
  var toAdd = [{
    name: 'role0',
    extends: [{
      name: 'role1',
      bypass: ['p0', 'p1', 'p2']
    }, {
      name: 'role2'
    }]
  }, {
    name: 'role1',
    params: ['p0', 'p1', 'p2'],
    extends: [{
      name: 'role3'
    }, {
      name: 'role4'
    }]
  }, {
    name: 'role2',
    extends: [{
      name: 'role4',
      bypass: ['p2']
    }]
  }, {
    name: 'role3',
    params: ['p2'],
    extends: [{
      name: 'role4'
    }]
  }, {
    name: 'role4',
    params: ['p2']
  }, {
    name: 'role5',
    params: ['p3'],
    extends: [{
      name: 'role6',
      bypass: ['p4']
    }]
  }, {
    name: 'role6',
    params: ['p3', 'p4'],
    extends: [{
      name: 'role7'
    }]
  }, {
    name: 'role7'
  }];
  var roles = new Roles(params, toAdd);
  var src;
  var dest;

  src = undefined;
  dest = {
    name: 'role0'
  };
  t.notOk(roles.isGranted(src, dest), 'undefined src');

  src = {
    name: 'role0'
  };
  dest = undefined;
  t.notOk(roles.isGranted(src, dest), 'undefined dest');

  src = {
    name: 'role42'
  };
  dest = {
    name: 'role0'
  };
  t.notOk(roles.isGranted(src, dest), 'unkown src');

  src = {
    name: 'role0'
  };
  dest = {
    name: 'role42'
  };
  t.notOk(roles.isGranted(src, dest), 'unknown dest');

  src = {
    name: 'role1',
    params: {
      p0: '0',
      p2: '2'
    }
  };
  dest = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'same name, missing src param');

  src = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  dest = {
    name: 'role1',
    params: {
      p0: '0',
      p2: '2'
    }
  };
  t.ok(roles.isGranted(src, dest), 'same name, missing dest param');

  src = {
    name: 'role1',
    params: {
      p0: '0',
      p1: 42,
      p2: '2'
    }
  };
  dest = {
    name: 'role1',
    params: {
      p0: '0',
      p1: 42,
      p2: '2'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'same name, invalid param');

  src = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '41',
      p2: '42'
    }
  };
  dest = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'same name, != params');

  src = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  dest = {
    name: 'role1'
  };
  t.ok(roles.isGranted(src, dest), 'same name, no dest param');

  src = {
    name: 'role1'
  };
  dest = {
    name: 'role1',
    params: {
      p0: '0',
      p1: '1',
      p2: '2'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'same name, no src param');

  src = {
    name: 'role3',
    params: {
      p2: '42'
    }
  };
  dest = {
    name: 'role6',
    params: {
      p3: '3',
      p4: '4'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'does not extend');

  src = {
    name: 'role5'
  };
  dest = {
    name: 'role7'
  };
  t.ok(roles.isGranted(src, dest), 'extend without def params');

  src = {
    name: 'role1'
  };
  dest = {
    name: 'role3'
  };
  t.ok(roles.isGranted(src, dest), 'extend without params but def');

  src = {
    name: 'role5',
    params: {
      p3: '3'
    }
  };
  dest = {
    name: 'role6'
  };
  t.ok(roles.isGranted(src, dest), 'extend without dest params');

  src = {
    name: 'role5',
    params: {
      p3: '3',
      p4: '-4'
    }
  };
  dest = {
    name: 'role6',
    params: {
      p3: '3',
      p4: '4'
    }
  };
  t.ok(roles.isGranted(src, dest), 'extend with bypassed dest params');

  src = {
    name: 'role5',
    params: {
      p0: '42'
    }
  };
  dest = {
    name: 'role6',
    params: {
      p3: '3',
      p4: '4'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'extend with missing src param');

  src = {
    name: 'role5',
    params: {
      p3: '-3'
    }
  };
  dest = {
    name: 'role6',
    params: {
      p3: '3',
      p4: '4'
    }
  };
  t.notOk(roles.isGranted(src, dest), 'extend with != param val');

  t.end();
});
