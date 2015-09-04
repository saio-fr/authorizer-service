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

module.exports = function(sequelize, Datatypes) {
  var configPath = path.join(process.env.PWD, 'config/config.json');
  var params;
  var model = {
    authId: {
      type: Datatypes.STRING,
      allowNull: false
    },
    name: {
      type: Datatypes.STRING,
      allowNull: false
    }
  };

  try {
    params = require(configPath).auth.params;
  } catch (e) {
    params = [];
  }

  _.each(params, function(param) {
    if (!_.isString(param) || param === 'name') {
      throw new Error('invalid param config');
    }
    if (param !== 'authId') {
      model[param] = {
        type: Datatypes.STRING,
        allowNull: true
      };
    }
  });

  return sequelize.define('Role', model);
};
