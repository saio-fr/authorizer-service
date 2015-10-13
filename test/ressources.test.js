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
var Ressources = require('../src/ressources.js');

tape('Ressources constructor', function(t) {
  var params = new Params(['p0', 'p1', 'p2']);
  var res;

  function testHelper() {
    return new Ressources(params, res);
  }

  t.doesNotThrow(testHelper, 'undefined ressources');

  res = [{
    name: 'r0',
    params: ['p0', 'p1']
  }, {
    name: 'r1',
    wsUrl: 'a.b.c'
  }, {
    name: 'r2',
    params: ['p2'],
    wsUrl: 'a.p2..c'
  }];
  t.doesNotThrow(testHelper, 'valid sample of ressources');

  t.end();
});

tape('Ressources.add', function(t) {
  var params = new Params(['p0', 'p1', 'p2']);
  var ressources = new Ressources(params);
  var r;

  function testHelper() {
    return ressources.add(r);
  }

  r = {
    name: 'r0'
  };
  t.doesNotThrow(testHelper, 'ressource only with name');

  r = {
    name: 'r1',
    params: ['p0', 'p1']
  };
  t.doesNotThrow(testHelper, 'valid ressource with name & params');

  r = {
    name: 'r2',
    wsUrl: 'a.b.c'
  };
  t.doesNotThrow(testHelper, 'valid ressource with name & wsUrl');

  r = {
    name: 'r3',
    params: ['p0', 'p1'],
    wsUrl: 'a.p0..p1.'
  };
  t.doesNotThrow(testHelper, 'valid ressource with name, wsUrl & params');

  r = undefined;
  t.throws(testHelper, 'undefined ressource');

  r = {
    params: ['p0'],
    wsUrl: 'a.b.d.'
  };
  t.throws(testHelper, 'ressource without name');

  r = {
    name: 'r2',
    params: ['p0'],
    wsUrl: 'a.b.d.'
  };
  t.throws(testHelper, 'ressource with same name');

  r = {
    name: 'r4',
    wsUrl: 'a.b.c'
  };
  t.throws(testHelper, 'ressource with same url');

  r = {
    name: 'r5',
    params: ['p0', 'p3']
  };
  t.throws(testHelper, 'ressource with invalid params');

  r = {
    name: 'r6',
    params: ['p0', 'p3'],
    wsUrl: 'a.p0..d'
  };
  t.throws(testHelper, 'ressource with invalid url');

  t.end();
});

tape('Ressources.has/get', function(t) {
  var params = new Params(['p0', 'p1', 'p2']);
  var res = [{
    name: 'r0',
    params: ['p0', 'p1']
  }, {
    name: 'r1',
    wsUrl: 'a.b.c'
  }, {
    name: 'r2',
    params: ['p2'],
    wsUrl: 'a.p2..c'
  }];
  var ressources = new Ressources(params, res);
  var rName;
  var expected;

  function hasHelper() {
    return ressources.has(rName);
  }

  function getHelper() {
    var result = ressources.get(rName);
    return _.isObject(result) ? _.pick(result, 'name', 'params', 'wsUrl') : result;
  }

  rName = undefined;
  expected = undefined;
  t.throws(hasHelper, 'undefined ressource');
  t.throws(getHelper, 'undefined ressource');

  rName = 'r2';
  expected = res[2];
  t.ok(hasHelper(), 'added ressource');
  t.deepEqual(getHelper(), expected, 'added ressource');

  rName = 'r3';
  expected = undefined;
  t.notOk(hasHelper(), 'not added ressource');
  t.deepEqual(getHelper(), expected, 'not added ressource');

  t.end();
});

tape('Ressource.validate', function(t) {
  var params = new Params(['p0', 'p1', 'p2']);
  var res = [{
    name: 'r0',
    params: ['p0', 'p1']
  }, {
    name: 'r1',
    wsUrl: 'a.b.c'
  }, {
    name: 'r2',
    params: ['p2'],
    wsUrl: 'a.p2..c'
  }];
  var ressources = new Ressources(params, res);
  var r;
  var expected;
  var msg;

  msg = 'undefined ressource';
  r = undefined;
  t.notOk(ressources.validate(r), msg);

  msg = 'not added ressource';
  r = {
    name: 'r3'
  };
  t.notOk(ressources.validate(r), msg);

  msg = 'ressource with not enough params';
  r = {
    name: 'r0',
    params: {
      p0: 'test'
    }
  };
  t.notOk(ressources.validate(r), msg);

  msg = 'ressource with too much params';
  r = {
    name: 'r2',
    params: {
      p0: 'test',
      p2: 'test'
    }
  };
  t.notOk(ressources.validate(r), msg);

  msg = 'ressource with invalid params';
  r = {
    name: 'r0',
    params: {
      p0: 'test',
      p1: 42
    }
  };
  t.notOk(ressources.validate(r), msg);

  msg = 'valid ressource without params';
  r = {
    name: 'r1'
  };
  expected = r;
  t.ok(ressources.validate(r), msg);
  t.deepEqual(r, expected, msg);

  msg = 'valid ressource with params';
  r = {
    name: 'r0',
    params: {
      p0: 'test',
      p1: 'test'
    }
  };
  expected = r;
  t.ok(ressources.validate(r), msg);
  t.deepEqual(r, expected, msg);

  msg = 'ressource with unknown url';
  r = {
    wsUrl: 'a.b.d'
  };
  t.notOk(ressources.validate(r), msg);

  msg = 'ressource with wildcard in url';
  r = {
    wsUrl: 'a.p2..c'
  };
  t.throws(ressources.validate.bind(ressources, r), msg);

  msg = 'ressource with known & exact url';
  r = {
    wsUrl: 'a.b.c'
  };
  expected = {
    name: 'r1',
    wsUrl: 'a.b.c'
  };
  t.ok(ressources.validate(r), msg);
  t.deepEqual(r, expected, msg);

  msg = 'ressource with known & wildcard url';
  r = {
    wsUrl: 'a.p2.42.c'
  };
  expected = {
    name: 'r2',
    wsUrl: 'a.p2.42.c',
    params: {
      p2: '42'
    }
  };
  t.ok(ressources.validate(r), msg);
  t.deepEqual(r, expected, msg);

  t.end();
});
