Express Wrapper
=============

An easy way to organize your express code..

### Getting started

```js
// app.js
var expressWrapper = require('express-wrapper');
var app = new expressWrapper();
```

### Methods

- `.init(..)`
- `.config(..)`
- `.addDatabase(..)`
- `.addRoute(..)`

### Available dependencias

- `$app`
- `$config`
- `$database`
- `$global`


### Methods Reference

`app.init`
----------

Is used to initialize app

*Example*
```js
app.init( function ( $app, $config ) {
    $app.use(logger('dev'));
    app.use(
        express.static($config.publicDir)
    );
    $app.use(bodyParser.json());
    $app.use(bodyParser.urlencoded({
      extended: true
    }));
    $app.use(cookieParser());
    ..
});
```

`app.config`
------------
Sets app configuration

*Example*
```js
app.config({
    env: process.env.NODE_ENV || 'dev',
    server: {
        host: '123.456.12.78',
        port: 3000
    },
    publicDir: 'public/', // Relative path
    databases: {
        main: {
            dev: {
                database: 'dbName',
                username: 'username',
                password: 'pwd',
                options: {
                    host: 'localhost',
                    dialect: 'sqlite',
                    storage: 'data/database.sqlite'
                }
            },
            prod: {
                url: 'postgres://user:pass@example.com:5432/dbname'
            }
        }
    }
    ..
});
```


`app.addDatabase`
------------------

Add a database instance.

*Example*

```js
var Sequelize = require('sequelize');

app.addDatabase('main', function ( $config, $global ) {
    // Vars
        var dbConfig = $config.databases['main'][$config.env];

    // Init database
        var db = (
            dbConfig.url ?
            new Sequelize(dbConfig.url) :
            new Sequelize(
                dbConfig.database,
                dbConfig.username,
                dbConfig.password,
                dbConfig.options || {}
            )
        );

    // Set models
        var User = db.define('User', {
            name: Sequelize.STRING,
            email: {type: Sequelize.STRING, unique: true},
            age: Sequelize.INTEGER
        });

        return db;
});
```

`app.addRoute`
---------------
Creates a new route on server

*Example*
```js
app.addRoute( function ( $database, $config ) {
    var db = $database['main'];
    return {
        url: '/register',
        method: 'POST',
        callback: function (req, res, next) {
            // Request user data
            var userData = req.body;
            // Save user in database
            db.models.User.create({
                name: userData.name,
                email: userData.email,
                age: userData.age
            }).then(function (user) {
                // Success
                res.json(user);
            }).catch(function (err) {
                // Error
                if ($config.env == 'dev') console.log(err);
                res.end();
            });
        }
    };
});
```

### Dependencies Reference
`$app`
------
Instance of *`express()`*

`$config`
---------
Object that contain all configuration


`$database`
-----------
Object with databases


`$global`
---------
Object that contain global variables
