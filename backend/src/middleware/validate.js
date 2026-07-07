import { ValidationError } from "../utils/ApiError.js";

/**
 * Validates request input against a Zod schema.
 * Supports validating 'body', 'query', and 'params'.
 * 
 * @param {object} schemas
 * @param {import('zod').ZodSchema} [schemas.body] - Schema for req.body
 * @param {import('zod').ZodSchema} [schemas.query] - Schema for req.query
 * @param {import('zod').ZodSchema} [schemas.params] - Schema for req.params
 * @returns {import('express').RequestHandler}
 */
export const validate = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.name === "ZodError" || (err.errors && Array.isArray(err.errors))) {
        const formattedErrors = err.errors.reduce((acc, current) => {
          const path = current.path.join(".");
          acc[path] = current.message;
          return acc;
        }, {});
        
        return next(new ValidationError("Request validation failed", formattedErrors));
      }
      next(err);
    }
  };
};

export default validate;
