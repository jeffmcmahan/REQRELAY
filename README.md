# REQRELAY
```
$ npm install req.relay
```

Nodejs middleware handle requests *entirely* with side effects. Consider the following:

```js
function updateProfile(req, res, next) {
  // Check for name.
  if (!req.query.userId) next(new Error('Must define username.'))

  // Query the db.
  db.updateNickname(req.query.userId, req.query.nickname)
    .then(() => next())
    .catch(next)
}
```

REQRELAY let's you replace that with purer functions that throw or return (and never work by side effects alone):

```js
function updateProfile(req, res) {
  // Check for name.
  if (!req.query.userId) throw new Error('Must define username.')

  // Query the db.
  return db.updateNickname(req.query.userId, req.query.nickname)
}
```

## API
The API is as simple as can be:

```js
const REQRELAY = require('req.relay')

REQRELAY(
  firstHandler,
  secondHandler,
  ...,
  nthHandler,
)
```

Each handler is of the form:

```
function(req, res) {
  // do whatever to req and res
  return aPromiseOrOtherValue
}
```

If there is an uncaught error, REQRELAY will catch it and pass it to the global error handler. No more node server crashes. Customize the error handler as follows:

```js
REQRELAY.onError = function (err, res) {
  // do whatever
  res.end('....')
}
```

## Use it with plain nodejs.
```js
const http = require('http')
const myHandler1 = require('./...')
const myHandler2 = require('./...')

const relay = REQRELAY(myHandler1, myHandler2)
http.createServer(relay)
```

## Use it with ExpressJS.
You can use REQRELAY with ExpressJS to take advantage of everything the community offers, while writing your own handlers in a more rarefied way. For example:

```js
const express = require('express')
const REQRELAY = require('req.relay')
const compression = require('compression')
const myHandler1 = require('./...')
const myHandler2 = require('./...')
const app = express()

// Third party middleware:
app.use(compression)

// return-throw-friendly handlers:
const relay = REQRELAY(myHandler1, myHandler2)
app.use(relay)
```
