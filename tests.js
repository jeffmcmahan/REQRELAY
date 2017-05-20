/* =============================================================================

NOTE: Not many tests are required to achieve full coverage; we only need to 
ensure the order and timing of sync and async handler function execution, error 
handler behavior, and the nestability of relays.

============================================================================= */

'use strict'

const REQRELAY = require('.')
const assert = require('assert')

function noop(){}

/**
 * Sets the headerSent property to true, to simulate a request's having
 * been handled.
 * @param {object} req 
 * @param {object} res
 * @return {undefined}
 */
function doSomethingHandler (req, res) {
  res.headersSent = true
}

/**
 * Akin to finalhandler, which simply indicates that something should've been 
 * done with the request by now.
 * @return {never}
 */
function notFound() {
  throw new Error('404: Not Found')
}

//============================================================= BASIC ==========

// Should throw 404 when noop is applied.
void async function () {
  let pass
  const onErr = (req, res, err) => pass = err.message.includes('404')
  await REQRELAY(onErr, noop, notFound)({}, {})
  assert(pass, 'onErr should recieve a 404 error.')
}()

// Should not throw when doSomethingHandler is applied.
void async function () {
  let pass = true
  const onErr = (req, res, err) => pass = false
  await REQRELAY(onErr, doSomethingHandler, notFound)({}, {})
  assert(pass, 'onErr should not run.')
}()

// Multiple handlers should run.
void async function () {
  let ran = 0
  function handler1() {ran++}
  function handler2() {ran++; res.headerSent = true}
  await REQRELAY(noop, handler1, handler2, notFound)({}, {})
  assert.equal(ran, 2, 'Both handlers should run.')
}()

//============================================================ ADVANCED ========

// Handlers should return/resolve in the order in which they're passed, 
// whether sync or async, slow or fast.
void async function () {
  let ran = ''
  function handler1() {
    return new Promise((resolve) => {
      setTimeout(()=> {ran += '1'; resolve()}, 200)
    })
  }
  function handler2() {
    return new Promise((resolve) => {
      setTimeout(()=> {ran += '2'; resolve()}, 100)
    })
  }
  function  handler3() {ran += '3'}
  await REQRELAY(noop, handler1, handler2, handler3)({}, {})
  assert.equal(ran, '123', 'Async handlers should execute one after the other.')
}()

// Relays should be nestable, and the nested handlers should resolve/return
// in the specified order.
void async function () {
  let ran = ''
  const relay1 = REQRELAY(noop, () => {ran += '1'})
  const relay2 = REQRELAY(noop, () => {ran += '2'})
  await REQRELAY(noop, relay1, relay2)({}, {})
  assert.equal(ran, '12', 'Relays should be nestable.')
}()
