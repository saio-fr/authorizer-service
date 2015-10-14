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
var tape = require('blue-tape');
var Client = require('./client.js');

var clients = {
  // service
  internal: new Client('service', 'servicepassword'),

  // superAdmin
  marcel: new Client('marcel', 'password'),

  // cornichonfactory admin
  francois: new Client('francois', 'password'),

  // cornichonfactory customer
  roger: new Client('roger', 'password'),

  // cornichonfactory & saucissonmarket customer
  rene: new Client('rene', 'password'),

  // saucissonmarket customer
  claude: new Client('claude', 'password'),

  // unknown guy
  johndoe: new Client('johndoe', 'password')
};

function start() {
  return when.all(_.map(clients,
    function(client) {
      return client.start();
    })
  );
}

function stop() {
  return when.all(
    _.map(clients, function(client) {
      return client.stop();
    })
  );
}

// return true if arrays a1 & a2 are equals (unordered) (values can be objects)
function unorderedEqual(a1, a2) {
  if (!_.isArray(a1) || !_.isArray(a2) || a1.length !== a2.length) {
    return false;
  }
  var _a2 = _.clone(a2);
  return _.every(a1, function(val1) {
    for (var i = 0; i < _a2.length; ++i) {
      if (_.isEqual(val1, _a2[i])) {
        _a2.splice(i, 1);
        return true;
      }
    }
    return false;
  });
}

tape('authorizer integration test', { timeout: 5000 }, function(t) {

  t.test('start clients', function(st) {
    return start()
    .tap(function() {
      st.pass('clients started');
    });
  });

  t.test('add role superAdmin to marcel', function(st) {
    return clients.internal.service.call('service.authorizer.roles.add', {
      authId: 'marcel',
      role: { name: 'superAdmin' }
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('marcel get roles of marcel', function(st) {
    return clients.marcel.service.call('service.authorizer.roles.get', { authId: 'marcel' })
    .tap(function(roles) {
      var expected = [{ name: 'superAdmin'}];
      st.deepEqual(roles, expected, 'get expected roles');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('marcel get roles of rene', function(st) {
    return clients.marcel.service.call('service.authorizer.roles.get', { authId: 'rene' })
    .tap(function(roles) {
      var expected = [];
      st.deepEqual(roles, expected, 'get expected roles');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('marcel add role admin(cornichonfactory) francois', function(st) {
    return clients.marcel.service.call('service.admin.add', {
      authId: 'francois',
      companyId: 'cornichonfactory'
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('marcel get roles francois', function(st) {
    return clients.marcel.service.call('service.authorizer.roles.get', { authId: 'francois' })
    .tap(function(roles) {
      var expected = [{
        name: 'admin',
        params: { companyId: 'cornichonfactory' }
      }];
      st.deepEqual(roles, expected, 'get expected roles');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('francois add role customer(cornichonfactory) roger', function(st) {
    return clients.francois.service.call('service.company.cornichonfactory.customers.add', {
      authId: 'roger'
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('roger buy at cornichonfactory', function(st) {
    return clients.roger.service.call('service.company.cornichonfactory.buy')
    .tap(function() {
      st.pass('buy success');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('francois remove customer(cornichonfactory) roger', function(st) {
    return clients.francois.service.call('service.company.cornichonfactory.customers.remove', {
      authId: 'roger'
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('roger buy fail at cornichonfactory', function(st) {
    return clients.roger.service.call('service.company.cornichonfactory.buy')
    .tap(function() {
      st.fail('roger must not be allowed to buy at cornichonfactory');
    })
    .catch(function() {
      st.pass('buy fail');
      return when.resolve();
    });
  });

  t.test('marcel add role customer(cornichonfactory) to rene', function(st) {
    return clients.marcel.service.call('service.company.cornichonfactory.customers.add', {
      authId: 'rene'
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('marcel add role customer(saucissonmarket) to rene', function(st) {
    return clients.marcel.service.call('service.company.saucissonmarket.customers.add', {
      authId: 'rene'
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('rene buy at cornichonfactory', function(st) {
    return clients.rene.service.call('service.company.cornichonfactory.buy')
    .tap(function(success) {
      st.pass(success, 'buy success');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('rene buy at saucissonmarket', function(st) {
    return clients.rene.service.call('service.company.saucissonmarket.buy')
    .tap(function(success) {
      st.pass(success, 'buy success');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('remove all roles rene', function(st) {
    return clients.internal.service.call('service.authorizer.roles.remove', { authId: 'rene' })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.deepEqual(actualReneRoles, []);
      return when.resolve();
    });
  });

  t.test('add roles customer at cornichonfactory & saucissonmarket to rene', function(st) {
    var rolesToAdd = [
      {
        name: 'customer',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'customer',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    var expectedReneRoles = rolesToAdd;
    return clients.internal.service.call('service.authorizer.roles.add',
      { authId: 'rene', role: rolesToAdd })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.ok(unorderedEqual(actualReneRoles, expectedReneRoles));
      return when.resolve();
    });
  });

  t.test('add roles admin at cornichonfactory & customer saucissonmarket to rene', function(st) {
    var rolesToAdd = [
      {
        name: 'admin',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'customer',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    var expectedReneRoles = [
      {
        name: 'admin',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'customer',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    return clients.internal.service.call('service.authorizer.roles.add',
      { authId: 'rene', role: rolesToAdd })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.ok(unorderedEqual(actualReneRoles, expectedReneRoles));
      return when.resolve();
    });
  });

  t.test('add roles customer at cornichonfactory & admin saucissonmarket to rene', function(st) {
    var rolesToAdd = [
      {
        name: 'customer',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'admin',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    var expectedReneRoles = [
      {
        name: 'admin',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'admin',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    return clients.internal.service.call('service.authorizer.roles.add',
      { authId: 'rene', role: rolesToAdd })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.ok(unorderedEqual(actualReneRoles, expectedReneRoles));
      return when.resolve();
    });
  });

  t.test('add roles customer at cornichonfactory & customer saucissonmarket to rene', function(st) {
    var rolesToAdd = [
      {
        name: 'customer',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'customer',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    var expectedReneRoles = [
      {
        name: 'admin',
        params: { companyId: 'cornichonfactory' }
      },
      {
        name: 'admin',
        params: { companyId: 'saucissonmarket' }
      }
    ];
    return clients.internal.service.call('service.authorizer.roles.add',
      { authId: 'rene', role: rolesToAdd })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.ok(unorderedEqual(actualReneRoles, expectedReneRoles));
      return when.resolve();
    });
  });

  t.test('add roles superAdmin & customer at cornichonfactory to rene', function(st) {
    var rolesToAdd = [
      {
        name: 'superAdmin'
      },
      {
        name: 'customer',
        params: { companyId: 'cornichonfactory' }
      }
    ];
    var expectedReneRoles = [
      {
        name: 'superAdmin'
      }
    ];
    return clients.internal.service.call('service.authorizer.roles.add',
      { authId: 'rene', role: rolesToAdd })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.ok(unorderedEqual(actualReneRoles, expectedReneRoles));
      return when.resolve();
    });
  });

  t.test('set role customer at cornichonfactory to rene', function(st) {
    var rolesToSet = [
      {
        name: 'customer',
        params: { companyId: 'cornichonfactory' }
      }
    ];
    var expectedReneRoles = rolesToSet;
    return clients.internal.service.call('service.authorizer.roles.set',
      { authId: 'rene', role: rolesToSet })
    .then(function() {
      return clients.internal.service.call('service.authorizer.roles.get', { authId: 'rene' });
    })
    .then(function(actualReneRoles) {
      st.ok(unorderedEqual(actualReneRoles, expectedReneRoles));
      return when.resolve();
    });
  });

  t.test('marcel add role customer(saucissonmarket) claude', function(st) {
    return clients.marcel.service.call('service.company.saucissonmarket.customers.add', {
      authId: 'claude'
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('claude buy fail at cornichonfactory', function(st) {
    return clients.claude.service.call('service.company.cornichonfactory.buy')
    .tap(function() {
      st.fail('claude must not be allowed to buy at cornichonfactory');
    })
    .catch(function() {
      st.pass('buy fail');
      return when.resolve();
    });
  });

  t.test('roger set his password', function(st) {
    return clients.roger.service.call('service.me.roger.password.set', { password: '42xy66ab'})
    .tap(function(result) {
      var expected = '********';
      st.equal(result, expected, 'set password success');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('john doe set his password (fail, he\'s anonymous)', function(st) {
    return clients.johndoe.service.call('service.me.johndoe.password.set', { password: '42xy66ab'})
    .tap(function() {
      st.fail('john doe is authorized to change his password !');
    })
    .catch(function() {
      st.pass('john doe set his password fail');
      return when.resolve();
    });
  });

  t.test('claude sets password of roger (fail)', function(st) {
    return clients.claude.service.call('service.me.roger.password.set')
    .tap(function() {
      st.fail('claude must not be allowed to set password of roger');
    })
    .catch(function() {
      st.pass('claude set password of roger fail');
      return when.resolve();
    });
  });

  t.test('john doe (anonymous) gets companies', function(st) {
    return clients.johndoe.service.call('service.companies.get')
    .tap(function(companies) {
      var expected = ['saucissonmarket', 'cornichonfactory'];
      st.deepEqual(companies, expected, 'get companies success');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('marcel counts customers of saucissonmarket (perm with bypass param)', function(st) {
    return clients.marcel.service.call('service.company.saucissonmarket.stats.customers.count')
    .tap(function(nCustomers) {
      st.equal(nCustomers, 2, 'count customers success');
    })
    .catch(function(err) {
      console.log(err.message);
      return when.reject(err);
    });
  });

  t.test('roger counts customers of saucissonmarket (fail)', function(st) {
    return clients.roger.service.call('service.company.saucissonmarket.stats.customers.count')
    .tap(function() {
      st.fail('roger must not be allowed to count customers of saucissonmarket');
    })
    .catch(function() {
      st.pass('count customers fail');
      return when.resolve();
    });
  });

  t.test('stop clients', function(st) {
    return stop()
    .tap(function() {
      st.pass('clients stopped');
    });
  });

  t.end();
});
