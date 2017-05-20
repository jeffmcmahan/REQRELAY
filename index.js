'use strict'

/**
 * Creates a series of promise-wrapped request handlers.
 * @param {function} onErr
 * @param {...function} handlers
 * @return {function} () => Promise<void>
 */
module.exports = (onErr, ...handlers) => async (rq, rs) => {
  try {
    for (let handler of handlers) {
      if (!rs.headerSent) await handler(rq, rs)
      else break
    }
  } catch (e) {
    onErr(rq, rs, e)
  }
}
