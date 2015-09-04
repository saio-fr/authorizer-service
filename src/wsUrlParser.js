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

var WsUrlParser = function() {

  /* tree-like structure with:
    Node: {
      name: string, unit uri component with reserved keys: <WILDCARD>
      ressource: Ressource // optional
      childs: {
        <node.name>: Node
      }
    }

    that._treeMap <=> (root) Node.childs
  */

  this._ressources = [];
  this._treeMap = {};
};

WsUrlParser.prototype.get = function(wsUrl) {
  var units;
  var nUnits;
  var callStack;
  var instance;
  var match;
  var matchParams;

  if (!_.isString(wsUrl)) {
    return;
  }

  units = wsUrl.split('.');
  if (_.contains(units, '')) {
    return;
  }

  nUnits = units.length;
  matchParams = [];
  callStack = [];

  // recursive, explore the uri tree (dfs) to find ressources that match wsUrl
  // we only keep the longest match
  function findMatchingRessources(args) {
    var depth = args.depth;
    var treeMap;
    var params;
    var newParams;
    var node;
    var unit;

    if (depth >= nUnits) {
      return;
    }

    treeMap = args.treeMap;
    params = args.params;
    unit = units[depth];
    if (_.has(treeMap, unit)) {
      node = treeMap[unit];
      callStack.push({
        depth: (depth + 1),
        treeMap: node.childs,
        params: params
      });
      if (depth === nUnits - 1 && _.has(node, 'ressource') &&
          params.length === node.ressource.params.length) {
        match = node.ressource;
        matchParams = params;
      }
    }

    if (_.has(treeMap, '<WILDCARD>')) {
      // copy of the params only needed here
      newParams = params.slice();
      newParams.push(unit);
      node = treeMap['<WILDCARD>'];
      callStack.push({
        depth: (depth + 1),
        treeMap: node.childs,
        params: newParams
      });
      if (depth === nUnits - 1 && _.has(node, 'ressource') &&
          newParams.length === node.ressource.params.length) {
        match = node.ressource;
        matchParams = newParams;
      }
    }
  }

  callStack.push({
    depth: 0,
    treeMap: this._treeMap,
    params: []
  });
  while (!_.isEmpty(callStack)) {
    findMatchingRessources(callStack.pop());
  }

  if (_.isUndefined(match)) {
    return;
  }

  instance = { name: match.name };
  if (!_.isEmpty(matchParams)) {
    instance.params = {};
    _.each(match.params, function(name, i) {
      instance.params[name] = matchParams[i];
    });
  }

  return instance;
};

WsUrlParser.prototype.add = function(ressource) {
  var r = this._validate(ressource);
  var units = r.wsUrl.split('.');
  var nUnits = units.length;
  var currentTreeMap = this._treeMap;

  this._ressources.push(ressource);
  _.each(units, function(unit, i) {
    var currentNode;
    if (_.isEmpty(unit)) {
      unit = '<WILDCARD>';
    }

    if (!_.has(currentTreeMap, unit)) {
      currentTreeMap[unit] = {
        name: unit,
        childs: {}
      };
    }

    currentNode = currentTreeMap[unit];
    if (i === nUnits - 1) {
      currentNode.ressource = r;
      return;
    }

    currentTreeMap = currentNode.childs;
  });
};

// validate the resssource & return it with "defaulted" values (passed to _.defaults())
// or throw:)
WsUrlParser.prototype._validate = function(ressource) {
  var r;
  var validAttr;
  var units;
  var nWildcards;

  validAttr = _.isObject(ressource) &&
              _.isString(ressource.name) && !_.isEmpty(ressource.name) &&
              _.isString(ressource.wsUrl) && !_.isEmpty(ressource.wsUrl) &&
              (_.isUndefined(ressource.params) || _.isArray(ressource.params));

  if (!validAttr) {
    throw new Error('invalid ressource');
  }

  r = _.defaults(ressource, { params: [] });
  units = r.wsUrl.split('.');
  nWildcards = 0;
  _.each(units, function(unit) {
    if (_.isEmpty(unit)) {
      ++nWildcards;
    }
  });

  if (nWildcards !== r.params.length) {
    throw new Error('invalid ressource');
  }

  if (this._contains(r)) {
    throw new Error('ressource already registered');
  }

  return r;
};

// we suppose that ressource has valid attributes & param defined
// return true if contains same ressource or if contains a ressource with a matching url
WsUrlParser.prototype._contains = function(ressource) {
  var ressources = this._ressources;
  var rName = ressource.name;
  var rUrl = ressource.wsUrl;
  var rUnits = rUrl.split('.');
  var exact = _.isEmpty(ressource.params);
  var rUnitLength = rUnits.length;

  return _.some(ressources, function(testRessource) {
    var testName = testRessource.name;
    var testUrl;
    var testUnits;
    var testExact;
    var testUnitLength;

    if (rName === testName) {
      return true;
    }

    testExact = _.isEmpty(testRessource.params);
    testUrl = testRessource.wsUrl;
    if (exact && testExact) {
      return rUrl === testUrl;
    }

    testUnits = testUrl.split('.');
    testUnitLength = testUnits.length;
    if (rUnitLength !== testUnitLength) {
      return false;
    }

    return _.every(testUnits, function(tUnit, i) {
      var rUnit = rUnits[i];
      return _.isEmpty(tUnit) || _.isEmpty(rUnit) || rUnit === tUnit;
    });
  });
};

module.exports = WsUrlParser;
