/**
 * Middleware to make Socket.IO instance available in Express routes
 */
const socketMiddleware = (io) => {
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = socketMiddleware;