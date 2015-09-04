#!/bin/env bash
node test/params.test.js | node_modules/.bin/tap-spec &&
node test/wsUrlParser.test.js | node_modules/.bin/tap-spec &&
node test/ressources.test.js | node_modules/.bin/tap-spec &&
node test/roles.test.js | node_modules/.bin/tap-spec &&
node test/permissions.test.js | node_modules/.bin/tap-spec &&
node test/permissions.test.js | node_modules/.bin/tap-spec &&
node test/model.role.test.js | node_modules/.bin/tap-spec
