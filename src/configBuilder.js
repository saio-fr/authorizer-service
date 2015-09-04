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

/**
 * config: static, parsed from a config file
 * options: runtime arguments that complete the config
 */
module.exports.build = function(config, options) {
  if (_.isUndefined(options)) {
    options = {};
  }

  // default config: merge options in config for authURI, crossbarAuthURI, ws/db/logger
  config = _.defaults(config, {
    ws: {},
    db: {},
    logger: {},
    auth: {}
  });

  config.ws = _.defaults(config.ws, {
    domain: options['ws-domain'],
    url: options['ws-url'],
    realm: options['ws-realm'],
    authId: options['ws-authId'],
    password: options['ws-password']
  });

  config.db = _.defaults(config.db, {
    dialect: options['db-dialect'],
    user: options['db-user'],
    password: options['db-password'],
    host: options['db-host'],
    port: options['db-port'],
    dbname: options['db-name']
  });
  config.db.model = './model/role.js';

  config.logger = _.defaults(config.logger, {
    // TODO
  });

  config.auth = _.defaults(config.auth, {
    params: [],
    roles: [],
    actions: [],
    ressources: [],
    permissions: []
  });

  // check reserved params ('authId' & 'name')
  _.each(config.auth.params, function(param) {
    if (param === 'authId' || param === 'name') {
      throw new Error('invalid param config');
    }
  });

  // check reserved roles ('<ANONYMOUS>', '<SELF>' & '<REGISTERED>')
  _.each(config.auth.roles, function(role) {
    var name = role.name;
    if (name === '<ANONYMOUS>' || name === '<SELF>' || name === '<REGISTERED>') {
      throw new Error('invalid role config');
    }
  });

  // add reserved roles & params
  config.auth.params.push('authId');
  config.auth.roles.push({
    name: '<ANONYMOUS>'
  });
  config.auth.roles.push({
    name: '<SELF>',
    params: ['authId']
  });
  config.auth.roles.push({
    name: '<REGISTERED>',
    params: ['authId']
  });

  return config;
};
