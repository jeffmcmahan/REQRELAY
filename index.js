'use strict'

let pws = [], onError = (e, rs) => {
  rs.statusCode = e.status || 500
  rs.end(e.stack)
}

function relay(rq, rs) {
  let pw = null
  const wrap = f => Promise.resolve().then(_=> f(rq, rs))
  const then = _=> f => pw = pw ? pw.then(_=> rs.headersSent ? wrap(_=>{}) : wrap(f)) : wrap(f)
  return pws.map(then()).pop().catch(e => onError(e, rs))
}

relay.onError = f => onError = f

module.exports = (...funcs) => {
  pws = funcs
  return relay
}
