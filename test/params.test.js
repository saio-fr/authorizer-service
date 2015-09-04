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
var Params = require('../src/params.js');

tape('Params.isValid', function(t) {
  var params = new Params(['p0', 'p1', 'p2']);

  // undefined test
  t.notOk(params.isValid(), 'undefined');

  // string tests
  t.ok(params.isValid('p1'), 'valid string');
  t.notOk(params.isValid('p3'), 'invalid string');

  // array tests
  t.ok(params.isValid([]), 'empty array');
  t.ok(params.isValid(['p0', 'p1']), 'valid array');
  t.notOk(params.isValid(['p0', 'p3', 'p2']), 'invalid array, unknown param');
  t.notOk(params.isValid(['p0', 42, 'p2']), 'invalid array, !string param');

  // object tests
  t.ok(params.isValid({}), 'empty object');
  t.ok(params.isValid({
    p0: 'pouet',
    p1: 'plop'
  }), 'valid object');

  t.notOk(params.isValid({
    p0: 'pouet',
    p3: 'plop'
  }), 'invalid object, unknown param');

  t.notOk(params.isValid({
    p0: 'pouet',
    p1: 42,
    p2: 'plop'
  }), 'invalid object, !string param value');

  t.end();
});

tape('Params.bypass', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3']);
  var param;
  var bypass;
  var expected;

  t.test('undefined bypass', function(st) {
    bypass = undefined;

    param = ['p0', 'p2', 'p3'];
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param array');

    param = { p0: '0', p2: '2', p3: '3' };
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param object');

    st.end();
  });

  t.test('empty bypass', function(st) {
    bypass = [];

    param = ['p0', 'p2', 'p3'];
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param array');

    param = { p0: '0', p2: '2', p3: '3' };
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param object');

    st.end();
  });

  t.test('not array bypass', function(st) {
    bypass = {};

    param = ['p0', 'p2', 'p3'];
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param array');

    param = { p0: '0', p2: '2', p3: '3' };
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param object');

    st.end();
  });

  t.test('bypass not containing input params', function(st) {
    bypass = ['p1'];

    param = ['p0', 'p2', 'p3'];
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param array');

    param = { p0: '0', p2: '2', p3: '3' };
    expected = param;
    st.deepEqual(params.bypass(param, bypass), expected, 'param object');

    st.end();
  });

  t.test('bypass containing input params', function(st) {
    bypass = ['p0', 'p2'];

    param = ['p0', 'p2', 'p3'];
    expected = ['p3'];
    st.deepEqual(params.bypass(param, bypass), expected, 'param array');

    param = { p0: '0', p2: '2', p3: '3' };
    expected = { p3: '3' };
    st.deepEqual(params.bypass(param, bypass), expected, 'param object');

    st.end();
  });

  t.end();
});

tape('Params.match', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
  var src;
  var dest;
  var bypass;

  t.test('undefined bypass', function(st) {
    bypass = undefined;

    st.test('empty dest array', function(sst) {
      dest = [];

      src = [];
      sst.ok(params.match(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.ok(params.match(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.match(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p0', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest array', function(sst) {
      dest = ['p0', 2];

      src = ['p0', 'p2'];
      sst.notOk(params.match(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.match(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('empty dest object', function(sst) {
      dest = {};

      src = ['p0', 'p2', 'p3'];
      sst.ok(params.match(src, dest, bypass), 'src array');
      src = {};
      sst.ok(params.match(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, missing key');
      src = { p0: '0', p2: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, wrong value');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest object', function(sst) {
      dest = { p0: '0', p2: 2 };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.end();
  });

  t.test('empty bypass', function(st) {
    bypass = [];

    st.test('empty dest array', function(sst) {
      dest = [];

      src = [];
      sst.ok(params.match(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.ok(params.match(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.match(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p0', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest array', function(sst) {
      dest = ['p0', 2];

      src = ['p0', 'p2'];
      sst.notOk(params.match(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.match(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('empty dest object', function(sst) {
      dest = {};

      src = ['p0', 'p2', 'p3'];
      sst.ok(params.match(src, dest, bypass), 'src array');
      src = {};
      sst.ok(params.match(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, missing key');
      src = { p0: '0', p2: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, wrong value');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest object', function(sst) {
      dest = { p0: '0', p2: 2 };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.end();
  });

  t.test('no effect bypass', function(st) {
    bypass = ['p1', 'p4'];

    st.test('empty dest array', function(sst) {
      dest = [];

      src = [];
      sst.ok(params.match(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.ok(params.match(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.match(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p0', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest array', function(sst) {
      dest = ['p0', 2];

      src = ['p0', 'p2'];
      sst.notOk(params.match(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.match(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('empty dest object', function(sst) {
      dest = {};

      src = ['p0', 'p2', 'p3'];
      sst.ok(params.match(src, dest, bypass), 'src array');
      src = {};
      sst.ok(params.match(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, missing key');
      src = { p0: '0', p2: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, wrong value');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest object', function(sst) {
      dest = { p0: '0', p2: 2 };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.match(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.end();
  });

  t.test('effective bypass', function(st) {
    bypass = ['p0'];

    st.test('dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p1', 'p2'];
      sst.ok(params.match(src, dest, bypass), 'matching src array');
      src = ['p1', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'not matching src array');
      src = { p1: '1', p2: '2' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.match(src, dest, bypass), 'src array');
      src = { p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object');
      src = { p0: '1', p2: '2', p3: '3' };
      sst.ok(params.match(src, dest, bypass), 'matching src object, with != value @ bypassed key');
      src = { p1: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, missing key');
      src = { p2: '1', p3: '3' };
      sst.notOk(params.match(src, dest, bypass), 'not matching src object, wrong value');

      sst.end();
    });

    st.end();
  });

  t.end();
});

tape('Params.strictMatch', function(t) {
  var params = new Params(['p0', 'p1', 'p2', 'p3', 'p4']);
  var src;
  var dest;
  var bypass;

  t.test('undefined bypass', function(st) {
    bypass = undefined;

    st.test('empty dest array', function(sst) {
      dest = [];

      src = [];
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p0', 'p2'];
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest array', function(sst) {
      dest = ['p0', 2];

      src = ['p0', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('empty dest object', function(sst) {
      dest = {};

      src = [];
      sst.notOk(params.strictMatch(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, missing key');
      src = { p0: '0', p2: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, wrong value');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest object', function(sst) {
      dest = { p0: '0', p2: 2 };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.end();
  });

  t.test('empty bypass', function(st) {
    bypass = [];

    st.test('empty dest array', function(sst) {
      dest = [];

      src = [];
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p0', 'p2'];
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest array', function(sst) {
      dest = ['p0', 2];

      src = ['p0', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('empty dest object', function(sst) {
      dest = {};

      src = [];
      sst.notOk(params.strictMatch(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, missing key');
      src = { p0: '0', p2: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, wrong value');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest object', function(sst) {
      dest = { p0: '0', p2: 2 };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.end();
  });

  t.test('no effect bypass', function(st) {
    bypass = ['p1', 'p4'];

    st.test('empty dest array', function(sst) {
      dest = [];

      src = [];
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p0', 'p2'];
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest array', function(sst) {
      dest = ['p0', 2];

      src = ['p0', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p0', 'p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p0', 'p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('empty dest object', function(sst) {
      dest = {};

      src = [];
      sst.notOk(params.strictMatch(src, dest, bypass), 'empty src array');
      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src array');
      src = {};
      sst.ok(params.strictMatch(src, dest, bypass), 'empty src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not empty src object');

      sst.end();
    });

    st.test('not empty dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, missing key');
      src = { p0: '0', p2: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, wrong value');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('invalid dest object', function(sst) {
      dest = { p0: '0', p2: 2 };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p0: '0', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'strict matching src object');
      src = { p0: '0', p2: '2', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p0: '0', p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p0: '0', p2: 2, p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.end();
  });

  t.test('effective bypass', function(st) {
    bypass = ['p0'];

    st.test('dest array', function(sst) {
      dest = ['p0', 'p2'];

      src = ['p2'];
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching src array');
      src = ['p1', 'p2'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src array');
      src = ['p1', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src array');
      src = { p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching object');
      src = { p1: '1', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p1: '1', p3: '3' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object');
      src = { p2: 2 };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');

      sst.end();
    });

    st.test('dest object', function(sst) {
      dest = { p0: '0', p2: '2' };

      src = ['p0', 'p2', 'p3'];
      sst.notOk(params.strictMatch(src, dest, bypass), 'src array');
      src = { p2: '2' };
      sst.ok(params.strictMatch(src, dest, bypass), 'strict matching object');
      src = { p1: '1', p2: '2' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'matching src object');
      src = { p2: 2 };
      sst.notOk(params.strictMatch(src, dest, bypass), 'invalid src object');
      src = {};
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, missing key');
      src = { p2: '1' };
      sst.notOk(params.strictMatch(src, dest, bypass), 'not matching src object, wrong value');

      sst.end();
    });

    st.end();
  });

  t.end();
});
