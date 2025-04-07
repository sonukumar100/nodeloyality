class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // If a stack trace is provided, use it; otherwise, capture the current stack trace
    if (stack) {
      this.stack = stack;
    } else {
      // Use Error.captureStackTrace to capture the stack trace
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;

// Example usage:
// const apiError = new ApiError(404, "Resource not found", ["Invalid ID"])
// console.error(apiError)
