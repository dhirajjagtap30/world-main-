/* =====================================================
   ERROR HANDLING
   ---------------------------------------------------
   BACKEND_API.md requires every error to be a non-2xx
   status with { "message": "human-readable reason" }.
   Routes throw ApiError (or call next(err)) and this
   handler turns it into that exact shape.
===================================================== */

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `No route: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message: err.message || "Internal server error." });
}

/** Wrap an async route handler so rejected promises reach errorHandler. */
export function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
