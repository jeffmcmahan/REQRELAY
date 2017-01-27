'use strict'

// Use err.status, grab from the message, or default to 500.
function getStatus(err) {
  if (!(err instanceof Error)) return 500
  if (err.status) return err.status
  const inMsg = err.message.split(':').shift() || ''
  return inMsg.match(/\d{3}/) ? parseInt(inMsg, 10) : 500
}

// Send stack only if client is localhost.
function getStack(rq, err) {
  if (!(err instanceof Error)) return 'Unknown Error'
  return rq.connection.remoteAddress === '::1' ? err.stack : err.msg
}

const handleErr = (rq, rs, err) => (rs.statusCode = getStatus(err), rs.end(getStack(rq, err)))

module.exports = function(...handlers) {
  return function (uri) {
    function REQRELAY(rq, rs, next) {
      if (typeof uri === 'string' && rq.url.indexOf(uri)) return !!next && next()
      let handler = null
      const wrap = f => Promise.resolve().then(_=> f(rq, rs))
      const then = _=> (
        f => handler = handler ? handler.then(_=> rs.headersSent ? wrap(_=>{}) : wrap(f)) : wrap(f)
      )
      return handlers.map(then()).pop().catch(err => onError(rq, rs, err))
    }

    let onError = handleErr
    REQRELAY.onError = f => onError = f
    return typeof uri === 'object' ? REQRELAY(...arguments) : REQRELAY
  }
}
