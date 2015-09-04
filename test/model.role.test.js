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
var tape = require('blue-tape');
var rewire = require('rewire');
var roleModel = rewire('../model/role.js');

function mockPath(t, configPath) {
  var pathMock = {};
  pathMock.join = function(abs, rel) {
    var calledPath = path.join(abs, rel);
    var expected = path.join(process.env.PWD, 'config/config.json');
    t.equal(calledPath, expected, 'right config path called');
    return path.join(process.env.PWD, configPath);
  };
  roleModel.__set__('path', pathMock);
}

tape('role model def without params', function(t) {
  var dataTypesMock = {
    STRING: 'stringMock'
  };
  var sequelizeMock = {
    define: function(modelName, model) {
      var expectedModelName = 'Role';
      var expectedModel = {
        authId: {
          type: 'stringMock',
          allowNull: false
        },
        name: {
          type: 'stringMock',
          allowNull: false
        }
      };
      t.equal(modelName, expectedModelName, 'right model name');
      t.deepEqual(model, expectedModel, 'right model');
    }
  };

  function helper() {
    return roleModel.call(null, sequelizeMock, dataTypesMock);
  }

  mockPath(t, 'test/config/roleModel0.json');

  t.plan(4);

  t.doesNotThrow(helper, 'no error in model def');

  t.end();
});

tape('role model def with some non-string params', function(t) {
  var dataTypesMock = {
    STRING: 'stringMock'
  };
  var sequelizeMock = {
    define: function() {}
  };

  function helper() {
    return roleModel.call(null, sequelizeMock, dataTypesMock);
  }

  mockPath(t, 'test/config/roleModel1.json');

  t.plan(2);

  t.throws(helper, 'error in model def');

  t.end();
});

tape('role model def with some reserved params', function(t) {
  var dataTypesMock = {
    STRING: 'stringMock'
  };
  var sequelizeMock = {
    define: function() {}
  };

  function helper() {
    return roleModel.call(null, sequelizeMock, dataTypesMock);
  }

  mockPath(t, 'test/config/roleModel2.json');

  t.plan(2);

  t.throws(helper, 'error in model def');

  t.end();
});

tape('role model def with valid params', function(t) {
  var dataTypesMock = {
    STRING: 'stringMock'
  };
  var sequelizeMock = {
    define: function(modelName, model) {
      var expectedModelName = 'Role';
      var expectedModel = {
        authId: {
          type: 'stringMock',
          allowNull: false
        },
        name: {
          type: 'stringMock',
          allowNull: false
        },
        p0: {
          type: 'stringMock',
          allowNull: true
        },
        p1: {
          type: 'stringMock',
          allowNull: true
        },
        p2: {
          type: 'stringMock',
          allowNull: true
        },
        p3: {
          type: 'stringMock',
          allowNull: true
        },
        p4: {
          type: 'stringMock',
          allowNull: true
        }
      };
      t.equal(modelName, expectedModelName, 'right model name');
      t.deepEqual(model, expectedModel, 'right model');
    }
  };

  function helper() {
    return roleModel.call(null, sequelizeMock, dataTypesMock);
  }

  mockPath(t, 'test/config/roleModel3.json');

  t.plan(4);

  t.doesNotThrow(helper, 'no error in model def');

  t.end();
});
