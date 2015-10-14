authorizer-service
==================
Role-oriented authorization service with inheritance & parametrization handling.

Procedures :
------------
The service registers procedures in a crossbar router at URLs starting with a domain defined in the options or in the **config/config.json** file.

**_domain_.can** :
* `kwargs.authId : String`  
* `kwargs.authRole : String 'anonymous' || 'registered'` *optional*, 'anonymous' by default  
* `kwargs.action : String`  
* `kwargs.ressource : Ressource`

* `return : Boolean` true if *authId* can make *action* over *ressource*.

**_domain_.crossbar.can** : does the same job as .can() but wrapped for crossbar authorization.
* `args[0] : String` crossbar session (contains 'authid' & 'authrole' keys)  
* `args[1] : String` wamp url  
* `args[2] : String` wamp action

* `return : Boolean` true if authorized

**_domain_.roles.get** :
* `kwargs.authId : String`

* `return : [Role]` array of roles affected to *authId*,  
  does not return `<ANONYMOUS>`, `<SELF>` & `<REGISTERED>` instances (see the config.auth.roles part of the doc).

**_domain_.roles.add** :
* `kwargs.authId : String`  
* `kwargs.role : Role or [Role]`

**_domain_.roles.set** : (overwrites current roles)
* `kwargs.authId : String`  
* `kwargs.role : Role or [Role]`

**_domain_.roles.remove** :
* `kwargs.authId : String`  
* `kwargs.role : undefined, Role or [Role]`  
    if undefined, removes all roles of authId

* `return : Boolean` true if role successfully removed.

Errors :
--------
Procedures calls can reject an Error if they fail. Those errors have the attribute `wamp : true` if they are emitted by the authorizer (see the @saio/wsocket doc).

Error messages can be :
* 'internal server error' or 'internal server error : *detail*',
* 'invalid row', implicates an integrity error in the database
* 'invalid authId'
* 'invalid ressource' or 'invalid ressource url'
* 'invalid role'
* 'invalid action'

Objects :
---------
**Role** :
* `name : String`  
* `params : Object { paramName : String paramValue }` *optional*

**Ressource** :
* `name : String`  
* `params : Object { paramName : String paramValue }` *optional*  

  *OR*

* `wsUrl : String` full wamp URL (ie no wildcards)

Config :
--------
The configuration of the service is mainly done in a file called **config.json** (the db & ws part can also be done in the service options). The config file must be located at **./config/config.json** when you start the service (see *Install & run the service*). You can find a config file example at example/authorizer/config.json.

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
   * See the Procedures part of the doc & the wsocket-component doc.
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
     * params must NOT contain "authId" or "name".
     * "authId" is a default parameter, it can be used in roles & ressources like other parameters.
     * It will also define the column names in the "Roles" table in the database, which will have
     * these columns : "authId" | "name" (of the role) | params[0] | ...
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
     * There are 3 default schemas in the authorizer : (they must not be overwritten)
     * { "name": "<ANONYMOUS>" }
     * and
     * {
     *   "name": "<SELF>",
     *   "params": ["authId"]
     * }
     * and
     * {
     * 	"name": "<REGISTERED>",
     * 	"params": ["authId"]
     * }
     *
     * Those 3 roles are not stored in the database, they are instanciated dynamically at .can() calls.
     * These schema can be used in permissions and extended, like any other role schema.
     * But extending them is pretty much useless, and believe me, you should avoid it (anti-pattern)
     *
     * authId in <SELF> & <REGISTERED> is instanciated with kwargs.authId in the .can() procedure
     * or with args[0] (aka authid of wamp) in the .crossbar.can() procedure.
     * <SELF> can be used to handle personal stuff like password or preferences...
     *
     * Every user has an instance of <ANONYMOUS> & <SELF>.  
     * Every user which has authRole == 'registered' has an instance of the <REGISTERED> role.
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
$ cd path/to/authorizer/package.json
$ npm install
# config parsed from path/to/authorizer/config/config.json
$ npm start -- [--options]
```

Test :
------
The test files are in test/. src/main.js and src/configBuilder.js are not unit tested. The whole service is tested in a "real" environment ie with a database, a crossbar middleware, services and test clients (see test/integration & tasks/integration).  
```bash
$ npm install

# unit tests :
$ npm test

# integration tests :
# you need to have Docker installed
$ npm run test.integration
```
