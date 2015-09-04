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

var when = require('when');
var _ = require('underscore');
var WSocket = require('@saio/wsocket-component');

var Service = function(container, options) {
  this.ws = container.use('ws', WSocket, {
    url: 'ws://crossbar:8080/',
    realm: 'test',
    authId: 'service',
    password: options['ws-password']
  });
};

Service.prototype.start = function() {
  console.log('starting service...');
  var that = this;
  var procedures = {
    'service.admin.add': {
      procedure: function(args, kwargs, details) {
        return that.addAdmin(args, kwargs, details);
      }
    },
    'service.admin.remove': {
      procedure: function(args, kwargs, details) {
        return that.rmAdmin(args, kwargs, details);
      }
    },
    'service.company..customers.add': {
      procedure: function(args, kwargs, details) {
        return that.addCustomer(args, kwargs, details);
      },
      wildcard: true
    },
    'service.company..customers.remove': {
      procedure: function(args, kwargs, details) {
        return that.rmCustomer(args, kwargs, details);
      },
      wildcard: true
    },
    'service.company..buy': {
      procedure: function(args, kwargs, details) {
        return that.buy(args, kwargs, details);
      },
      wildcard: true
    },
    'service.me..password.set': {
      procedure: function(args, kwargs, details) {
        return that.setPassword(args, kwargs, details);
      },
      wildcard: true
    },
    'service.companies.get': {
      procedure: function(args, kwargs, details) {
        return that.getCompanies(args, kwargs, details);
      }
    },
    'service.company..stats.customers.count': {
      procedure: function(args, kwargs, details) {
        return that.countCustomers(args, kwargs, details);
      },
      wildcard: true
    }
  };

  var pendingRegistrations = _.map(procedures, function(reg, url) {
    if (reg.wildcard) {
      return that.ws.register(url, reg.procedure, { match: 'wildcard'});
    }
    that.ws.register(url, reg.procedure, { match: 'wildcard'});
  });

  return when.all(pendingRegistrations);
};

/*
  service.admin.add
  kwargs.authId
  kwargs.companyId
*/
Service.prototype.addAdmin = function(args, kwargs) {
  return this.ws.call('service.authorizer.roles.add', [], {
    authId: kwargs.authId,
    role: {
      name: 'admin',
      params: {
        companyId: kwargs.companyId
      }
    }
  });
};

/*
  service.admin.rm
  kwargs.authId
  kwargs.companyId
*/
Service.prototype.rmAdmin = function(args, kwargs) {
  return this.ws.call('service.authorizer.roles.remove', [], {
    authId: kwargs.authId,
    role: {
      name: 'admin',
      params: {
        companyId: kwargs.companyId
      }
    }
  });
};

/*
  service.company..customers.add
  kwargs.authId
*/
Service.prototype.addCustomer = function(args, kwargs, details) {
  var companyId = details.wildcards[0];
  return this.ws.call('service.authorizer.roles.add', [], {
    authId: kwargs.authId,
    role: {
      name: 'customer',
      params: {
        companyId: companyId
      }
    }
  });
};

/*
  service.company..customers.remove
  kwargs.authId
*/
Service.prototype.rmCustomer = function(args, kwargs, details) {
  var companyId = details.wildcards[0];
  return this.ws.call('service.authorizer.roles.remove', [], {
    authId: kwargs.authId,
    role: {
      name: 'customer',
      params: {
        companyId: companyId
      }
    }
  });
};

/*
  service.company..buy
  return true if saucissonmarket
  return false if cornichonfactory, ya plus de cornichon :(
*/
Service.prototype.buy = function(args, kwargs, details) {
  return details.wildcards[0] === 'saucissonmarket';
};

/*
  service.me..password.set
*/
Service.prototype.setPassword = function() {
  return '********';
};

/*
  service.companies.get
  return [<companyId>]
*/
Service.prototype.getCompanies = function() {
  return ['saucissonmarket', 'cornichonfactory'];
};

// service.company..stats.customers.count
Service.prototype.countCustomers = function() {
  return 2;
};

Service.prototype.stop = function() {
  console.log('stopping service...');
  return this.ws.unregister()
    .then(function() {
      console.log('service stopped');
      return when.resolve();
    });
};

module.exports = Service;
