/**
 * Wraps an asynchronous middleware or route handler to catch rejected promises
 * and pass them to the next error handling middleware.
 * 
 * @param {Function} fn - The asynchronous function to wrap
 * @returns {import('express').RequestHandler}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
