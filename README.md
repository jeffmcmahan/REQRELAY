# REQRELAY
```
$ npm install req.relay
```

## Middleware have one major drawback.
Nodejs middleware handle requests via side effects, and it makes error handling a real bummer. REQRELAY let's you use pure-er functions that throw or return. Just pass a set of plaino req+res handlers to REQRELAY and it binds them into an asynchronous chain, so they do the same work as middleware, but without the baggage.

```js
function myHandler(req, res) {
  if (!condition) throw new Error('500: Bad!')
  return db.insert(value)
}
```

```js
REQRELAY(myHandler, handler2, handlerN)
```

`myHandler` simply throws when it encounters an error&#8212;there is no `next()`. REQRELAY will catch the error and pass it to its default error handler, or to an error handler you've defined. No more node server crashes means no more managing clusters.

## Simple, Flexible API
Pass handler functions to `REQRELAY` as a list:

```js
REQRELAY(handler1, handler2, handlerN)
```

Optionally specify a URI path condition:

```js
REQRELAY(handler1, handler2, handlerN)('/some-path/')
```

Each handler is of the form:

```js
function(req, res) {
  // You may:
  // - throw an error
  // - return an ordinary value
  // - return a promise
  // - implicitly return undefined
}

// OR

async function(req, res) {
  // You may:
  // - throw an error
  // - return a value
  // - implicitly return undefined
}
```
When the handler has finished work (sync or async), if `res.headersSent` is false, the next function runs, and so on until the headers are sent, or there are no handler functions left.

### Error Handling

If there is an uncaught error, REQRELAY will catch it and pass it to its error catch handler. You can customize each relay's error handler as follows:

```js
REQRELAY.onError = function (req, res, err) {
  res.end('Error!')
}
```

### Nest, mix, and compose.
```js
REQRELAY(
  REQRELAY(publicSite),
  auth,
  REQRELAY(admin1, admin2)('/admin/'),
  REQRELAY(api1, api2)('/api/'),
  notFound
)
```

### Use it with plain nodejs.
```js
const http = require('http')
const REQRELAY = require('req.relay')
const myHandler1 = require('./...')
const myHandler2 = require('./...')

const relay = REQRELAY(myHandler1, myHandler2)
http.createServer(relay).listen(3000)
```

### Use it with ExpressJS.
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
app.listen(3000)
```
