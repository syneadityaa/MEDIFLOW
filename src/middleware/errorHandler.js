const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    error: {
      message: status === 500 ? 'Internal server error' : err.message,
    },
  });
}

module.exports = { notFound, errorHandler };