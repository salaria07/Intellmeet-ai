export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers (safe logging without secrets)
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate field value entered for '${field}'. Please use another value.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentication token has expired' });
  }

  const statusCode = res.statusCode === 200 ? (err.statusCode || 500) : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Internal Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
