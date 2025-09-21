const logger = require('./logger');

function errorHandler(err, req, res, next) {
  logger.error({ message: err.message, stack: err.stack, route: req.originalUrl });
  const status = err.status || 500;
  res.status(status).json({ error: true, message: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
