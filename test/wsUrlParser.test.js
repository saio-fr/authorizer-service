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
var tape = require('blue-tape');
var WsUrlParser = require('../src/wsUrlParser.js');

tape('WsUrlParser.add', function(t) {

  t.test('invalid ressources', function(st) {
    var parser = new WsUrlParser();

    st.throws(parser.add.bind(parser), 'add undefined');

    st.throws(parser.add.bind(parser, {
      wsUrl: 'a.b.c'
    }), 'add a ressource without a name');

    st.throws(parser.add.bind(parser, {
      name: '',
      wsUrl: 'a.b.c'
    }), 'add a ressource an empty name');

    st.throws(parser.add.bind(parser, {
      name: 'ressource'
    }), 'add a ressource without a wsUrl');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      wsUrl: ''
    }), 'add a ressource an empty wsUrl');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      wsUrl: 'a..c'
    }), 'add a ressource with wildcard & no params');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      params: ['p0', 'p1'],
      wsUrl: 'a.b.c'
    }), 'add a ressource with params & no wildcards');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      params: ['p0'],
      wsUrl: 'a..c..e'
    }), 'add a ressource with wildcard & not enough params');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      params: ['p0', 'p1', 'p2'],
      wsUrl: 'a..c..e'
    }), 'add a ressource with wildcard & too much params');

    st.end();
  });

  t.test('valid ressources', function(st) {
    var parser = new WsUrlParser();

    st.doesNotThrow(parser.add.bind(parser, {
      name: 'r0',
      params: [],
      wsUrl: 'a.b.c0'
    }), 'add exact ressource');

    st.doesNotThrow(parser.add.bind(parser, {
      name: 'r1',
      params: ['p0'],
      wsUrl: '.b.c1'
    }), 'add ressource with a wildcard at the begining');

    st.doesNotThrow(parser.add.bind(parser, {
      name: 'r2',
      params: ['p0'],
      wsUrl: 'a..c2'
    }), 'add ressource with wildcard in the middle');

    st.doesNotThrow(parser.add.bind(parser, {
      name: 'r3',
      params: ['p0'],
      wsUrl: 'a.b.c.'
    }), 'add ressource with wildcard at the end');

    st.doesNotThrow(parser.add.bind(parser, {
      name: 'r4',
      params: ['p0', 'p1'],
      wsUrl: '.b2..d'
    }), 'add ressource with several wildcards begin/middle');

    st.doesNotThrow(parser.add.bind(parser, {
      name: 'r5',
      params: ['p0', 'p1'],
      wsUrl: 'a3..c3.d3.'
    }), 'add ressource with several wildcards middle/end');

    st.end();
  });

  t.test('conflicting ressources', function(st) {
    var parser = new WsUrlParser();
    parser.add({
      name: 'exact',
      wsUrl: 'a0.b0.c0'
    });

    parser.add({
      name: 'wildcard',
      params: ['p0'],
      wsUrl: 'a1..c1'
    });

    st.throws(parser.add.bind(parser, {
      name: 'exact',
      wsUrl: 'a.b.c'
    }), 'add a ressource with same name');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      wsUrl: 'a0.b0.c0'
    }), 'add a ressource with same url, exact match');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      params: ['p0'],
      wsUrl: 'a1..c1'
    }), 'add a ressource with same url, wildcard match');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      params: ['p0'],
      wsUrl: 'a0..c0'
    }), 'add a ressource with wildcard matching an exact url');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      wsUrl: 'a1.b1.c1'
    }), 'add a ressource without wildcard a wildcard url');

    st.throws(parser.add.bind(parser, {
      name: 'ressource',
      params: ['p0'],
      wsUrl: 'a1.b1.'
    }), 'add a ressource with a wildcard matching a wildcard url');

    st.end();
  });

  t.end();
});

tape('WsUrlParser.get', function(t) {

  t.test('in empty parser', function(st) {
    var parser = new WsUrlParser();

    st.throws(parser.get.bind(parser), 'undefined url');
    st.throws(parser.get.bind(parser, ''), 'empty url');
    st.throws(parser.get.bind(parser, 'a..c'), 'url with wildcard');
    st.notOk(parser.get('a.b.c'), 'defined url');

    st.end();
  });

  t.test('in example parser', function(st) {
    var parser = new WsUrlParser();
    var url;
    var expected;

    function testHelper() {
      var result = parser.get(url);
      return _.isObject(result) ? _.pick(result, 'name', 'params') : result;
    }

    parser.add({
      name: 'exact0',
      wsUrl: 'a.b.c'
    });

    parser.add({
      name: 'exact1',
      wsUrl: 'a.b.d'
    });

    parser.add({
      name: 'wildcard0',
      params: ['p0', 'p1'],
      wsUrl: 'a.p0..p1.'
    });

    parser.add({
      name: 'wildcard1',
      params: ['p0', 'p1'],
      wsUrl: 'b.p01...c'
    });

    url = 'a.b';
    expected = undefined;
    st.deepEqual(testHelper(), expected, 'not matching url, too short');

    url = 'a.b.c.d';
    expected = undefined;
    st.deepEqual(testHelper(), expected, 'not matching url, too long');

    url = 'a.b.c';
    expected = { name: 'exact0' };
    st.deepEqual(testHelper(), expected, 'exact matching');

    url = 'a.p0.41.p1.42';
    expected = {
      name: 'wildcard0',
      params: {
        p0: '41',
        p1: '42'
      }
    };
    st.deepEqual(testHelper(), expected, 'wildcard matching 1');

    url = 'b.p01.41.42.c';
    expected = {
      name: 'wildcard1',
      params: {
        p0: '41',
        p1: '42'
      }
    };
    st.deepEqual(testHelper(), expected, 'wildcard matching 2');

    st.end();
  });

  t.end();
});
