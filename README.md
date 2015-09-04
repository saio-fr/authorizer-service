authorizer-service
==================
Role-oriented authorization service with inheritance & parametrization handling.

Procedures :
------------
The service registers procedures in a crossbar router at URLs starting with a domain defined in the options or in the config.json file.

**_domain_.can** :
* `kwargs.userId : String`  
* `kwargs.action : String`  
* `kwargs.ressource : Ressource`

* `return : Boolean` true if *userId* can make *action* over *ressource*.

**_domain_.crossbar.can** : does the same job as .can() but wrapped for crossbar authorization.
* `args[0] : String` crossbar authid  
* `args[1] : String` wamp url  
* `args[2] : String` wamp action

* `return : Boolean` true if authorized

**_domain_.roles.get** :
* `kwargs.userId : String`

* `return : [Role]` array of roles affected to *userId*,  
  does not return <ANONYMOUS> & <SELF> instances (see the config.auth.roles part of the doc).

**_domain_.roles.add** :
* `kwargs.userId : String`  
* `kwargs.role : Role`

* `return : Boolean` true if role successfully added.

**_domain_.roles.remove** :
* `kwargs.userId : String`  
* `kwargs.role : Role`

* `return : Boolean` true if role successfully removed.

Objects :
---------
**Role** :
* `name : String`  
* `params : Object { paramName : String paramValue }`, *optional*

**Ressource** :
* `name : String`  
* `params : Object { paramName : String paramValue }` *optional*  

  *OR*

* `wsUrl : String` full wamp URL (ie no wildcards)

Config :
--------
The configuration of the service is mainly done in a file called **config.json** (the db & ws part can also be done in the service options). The config file must be in your working directory when you start the service (see *Install & run the service*). You can find a config file example at example/authorizer/config.json.

```js
{
  /* Config of the db-component for accessing the database of roles.
   * Same syntax but without the model field. See the db-component doc for more info.
   */
  "db": {
    "dialect": String,
    "host": String,
    "port": String,
    "user": String,
    "password": String,
    "dbname": String
  },

  /* config of the wsocket-component for accessing the crossbar router,
   * plus the domain field (prefix url for registering the procedures of the service).
   * See the Procedures part of the doc & the ws-component doc.
   */
  "ws": {
    "url": String,
    "realm": String,
    "authId": String,
    "password": String,
    "domain": String // wamp URL
  },

  // unused for now
  "logger": {},

  // main configuration of the service
  "auth": {

    /* Array of parameter names used in roles & ressources.
     * params must NOT contain "userId" or "name".
     * "userId" is a default parameter, it can be used in roles & ressources like other parameters.
     * It will also define the column names in the "Roles" table in the database, which will have
     * these columns : "userId" | "name" (of the role) | params[0] | ...
     */
    "params": Array(String),

    /* RoleSchema :
     * {
     *   "name": String
     *   "params": Array(String), optional
     *   "extends": Array(Extend), optional
     * }
     *
     * Extend :
     * {
     *   "name": String, name of the parent role
     *   "bypass": Array(String), array of bypassed parent parameters
     *       ie a child instance extends any parent instance
     *       where all the parameters in (parentSchema.params - bypass) have
     *       the same values in the child and the parent instances.
     *       So, (parentSchema.params - bypass) must be included in childSchema.params
     * }
     *
     * There are 2 default schemas in the authorizer : (they must not be overwritten)
     * { "name": "<ANONYMOUS>" }
     * and
     * {
     *   "name": "<SELF>",
     *   "params": ["userId"]
     * }
     * userId in <SELF> is instanciated with kwargs.userId in the .can() procedure
     * or with args[0] (aka authid of wamp) in the .crossbar.can() procedure.
     * <SELF> can be used to handle personal stuff like password or preferences...
     *
     * Every user has those 2 roles, they are not stored in the Roles db.
     * These schema can be used in permissions and extended, like any other role schema.
     * (but extending them is pretty much useless, and believe me, you should avoid it)
     */
    "roles": Array(RoleSchema),

    /* RessourceSchema :
     * {
     *   "name": String
     *   "params": Array(String), optional
     *   "wsUrl": String, optional
     * }
     *
     * If you want to use a wsUrl with wildcards, you can. But if you do,
     * you must have the same number of wildcards in the wsUrl and params.
     * And the order of the params array is important. When a ressource is
     * instanciated from an url that matches a wsUrl with wildcards, the
     * values of those wildcards are affected linearly to the keys in params.
     */
    "ressources": Array(RessourceSchema),

    /* all actions used in permissions. If you want to use the service as a crossbar authorizer,
     * crossbar will call it with actions in ["publish", "subscribe", "call", "register"].
     * If you want to handle these actions, put them here, no actions are included by default.
     */
    "actions": Array(String),

    /* PermissionSchema :
     * {
     *   "role": String, role name
     *   "action": String or Array(String)
     *   "ressource": String, ressource name
     *   "bypass": Array(String), bypassed ressource params
     *       it works the same way as in the role extending mechanism,
     *       ressource instance params values with keys in (ressourceSchema.params - bypass)
     *       must match those in role instance params.
     * }
     */
    "permissions": Array(PermissionSchema),
  }
}
```

Options :
---------
Some fields in the config file (in the ws & db parts) can also be defined as options when we run the service. If a field is defined in both the options & the config-file, the config file value will be used. Maybe the contrary would be better, anyway, just don't define in the config the fields you want to define the options. :P

* `--ws-domain : config.ws.domain`  
* `--ws-url : config.ws.url`  
* `--ws-realm : config.ws.realm`  
* `--ws-authId : config.ws.authId`  
* `--ws-password : config.ws.password`  
* `--db-dialect : config.db.dialect`  
* `--db-host : config.db.host`  
* `--db-port : config.db.port`  
* `--db-name : config.db.dbname`  
* `--db-user : config.db.user`  
* `--db-password : config.db.password`  

Install & run the service :
---------------------------
```bash
# you need to be logged in npm
# & have access to the @saio scope
$ npm install -g @saio/service-runner

# install from npm registry
$ npm install -g @saio/authorizer-service

# install from source
$ cd path/to/authorizer/package.json
$ npm install -g .

# run
$ cd path/to/config.json
$ service-runner authorizer-service [--options]
```

Test :
------
The unit test files (in spec/) are for the files in core/ and model/. The main file authorizer.js is not unit tested. It is tested in an "real" environment ie a database, a crossbar middleware, services and test clients (see example/).
```bash
$ export NODE_ENV=dev
$ npm install

# run the unit tests :
$ npm test

# run the example (aka authorizer.js test)
# you need to have Docker installed
$ npm run example
```
