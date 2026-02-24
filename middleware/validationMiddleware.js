const { ZodError } = require("zod");
const AppError = require("../utils/appError");

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 * 
 * @param {ZodSchema} schema - The Zod schema to validate against
 * @param {string} source - Where to validate: 'body', 'query', or 'params'
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.post('/products', validateRequest(createProductSchema, 'body'), createProduct);
 */
const validateRequest = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      // Get data from the specified source
      const dataToValidate = req[source];

      // Validate the data against the schema
      const validatedData = await schema.parseAsync(dataToValidate);

      // Attach validated data to request for use in controllers
      req.validated = validatedData;

      // If validating body, also replace req.body with sanitized version
      if (source === "body") {
        req.body = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into user-friendly message
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return next(
          new AppError(
            "Validation Error",
            422,
            "VALIDATION_ERROR",
            errors
          )
        );
      }

      next(error);
    }
  };
};

/**
 * Validate query parameters
 * Convenience function for query validation
 * 
 * @param {ZodSchema} schema - Zod schema for query parameters
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => validateRequest(schema, "query");

/**
 * Validate request body
 * Convenience function for body validation
 * 
 * @param {ZodSchema} schema - Zod schema for request body
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => validateRequest(schema, "body");

/**
 * Validate URL parameters
 * Convenience function for params validation
 * 
 * @param {ZodSchema} schema - Zod schema for URL parameters
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => validateRequest(schema, "params");

module.exports = {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
};
