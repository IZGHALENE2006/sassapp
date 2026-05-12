const ApiError = require("../utils/ApiError");

const validateRequest = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    throw new ApiError(
      400,
      "Invalid request payload",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    );
  }

  req.validated = result.data;
  next();
};

module.exports = validateRequest;
