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
    .tap(function(success) {
      st.ok(success, 'add role success');
    });
  });

  t.test('marcel get roles of marcel', function(st) {
    return clients.marcel.service.call('service.authorizer.roles.get', { authId: 'marcel' })
    .tap(function(roles) {
      var expected = [{ name: 'superAdmin'}];
      st.deepEqual(roles, expected, 'get expected roles');
    });
  });

  t.test('marcel get roles of rene', function(st) {
    return clients.marcel.service.call('service.authorizer.roles.get', { authId: 'rene' })
    .tap(function(roles) {
      var expected = [];
      st.deepEqual(roles, expected, 'get expected roles');
    });
  });

  t.test('marcel add role admin(cornichonfactory) francois', function(st) {
    return clients.marcel.service.call('service.admin.add', {
      authId: 'francois',
      companyId: 'cornichonfactory'
    })
    .tap(function(success) {
      st.ok(success, 'add role success');
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
    });
  });

  t.test('francois add role customer(cornichonfactory) roger', function(st) {
    return clients.francois.service.call('service.company.cornichonfactory.customers.add', {
      authId: 'roger'
    })
    .tap(function(success) {
      st.ok(success, 'add role success');
    });
  });

  t.test('roger buy at cornichonfactory', function(st) {
    return clients.roger.service.call('service.company.cornichonfactory.buy')
    .tap(function() {
      st.pass('buy success');
    });
  });

  t.test('francois remove customer(cornichonfactory) roger', function(st) {
    return clients.francois.service.call('service.company.cornichonfactory.customers.remove', {
      authId: 'roger'
    })
    .tap(function(success) {
      st.ok(success, 'remove customer success');
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
    .tap(function(success) {
      st.ok(success, 'add role success');
    });
  });

  t.test('marcel add role customer(saucissonmarket) to rene', function(st) {
    return clients.marcel.service.call('service.company.saucissonmarket.customers.add', {
      authId: 'rene'
    })
    .tap(function(success) {
      st.ok(success, 'add role success');
    });
  });

  t.test('rene buy at cornichonfactory', function(st) {
    return clients.rene.service.call('service.company.cornichonfactory.buy')
    .tap(function(success) {
      st.pass(success, 'buy success');
    });
  });

  t.test('rene buy at saucissonmarket', function(st) {
    return clients.rene.service.call('service.company.saucissonmarket.buy')
    .tap(function(success) {
      st.pass(success, 'buy success');
    });
  });

  t.test('marcel add role customer(saucissonmarket) claude', function(st) {
    return clients.marcel.service.call('service.company.saucissonmarket.customers.add', {
      authId: 'claude'
    })
    .tap(function(success) {
      st.ok(success, 'add customer success');
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
    });
  });

  t.test('marcel counts customers of saucissonmarket (perm with bypass param)', function(st) {
    return clients.marcel.service.call('service.company.saucissonmarket.stats.customers.count')
    .tap(function(nCustomers) {
      st.equal(nCustomers, 2, 'count customers success');
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
