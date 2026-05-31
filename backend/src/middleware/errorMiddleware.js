export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  // Honor an explicit status set on the error (e.g. by multer's fileFilter)
  // even when the response status hasn't been touched yet.
  let statusCode = res.statusCode === 200 ? err.statusCode || err.status || 500 : res.statusCode;
  let message = err.message;

  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Multer upload failures (size/type/count) — surface a clean 400.
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") message = "File is too large. Please choose a smaller file.";
    else if (err.code === "LIMIT_UNEXPECTED_FILE") message = "Too many files or an unexpected upload field.";
    else message = `Upload error: ${err.message}`;
  }

  // Errors thrown by our file-type filters.
  if (/files are allowed$/.test(message || "") || /^Unsupported file type/.test(message || "")) {
    statusCode = 400;
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate field value entered";
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
