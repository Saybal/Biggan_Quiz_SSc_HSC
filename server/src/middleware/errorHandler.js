/**
 * Global Express error handler.
 * Any next(err) call lands here.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('❌', err.stack || err.message)

  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(status).json({ error: message })
}
