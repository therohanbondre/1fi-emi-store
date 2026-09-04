// Catches any request that did not match a registered route.
// Registered AFTER all routes, BEFORE errorHandler.

export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code:    'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} does not exist`,
    },
  })
}
