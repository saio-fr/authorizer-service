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

var WSocket = require('@saio/wsocket-component');
var TestContainer = require('@saio/service-runner').Tester;

var Client = function(container, options) {
  this.ws = container.use('ws', WSocket, {
    url: 'ws://crossbar:8080/',
    realm: 'test',
    authId: options.authId,
    password: options.password
  });
};

Client.prototype.call = function(url, kwargs) {
  return this.ws.call(url, [], kwargs);
};

module.exports = function(authId, password) {
  return new TestContainer(Client, { authId: authId, password: password });
};
