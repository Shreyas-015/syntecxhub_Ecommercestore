import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

/**
 * Express wrapper to eliminate try-catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Resource Not Found (404) Error Handler
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    data: null,
    errors: null,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standard Global Error Handler
 */
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected system error occurred";
  let errors = err.errors || null;

  // Handle Mongoose Duplicate Key Error (e.g. email or phone exists)
  if (err.code === 11000) {
    statusCode = 409;
    const key = Object.keys(err.keyValue)[0];
    message = `An account with that ${key} already exists.`;
    errors = [{ field: key, message: `This ${key} is already taken.` }];
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Data validation failure";
    errors = Object.values(err.errors).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // Handle Zod Schema Validation Error
  if (err.name === "ZodError" || err.issues) {
    statusCode = 400;
    message = "Request parameters failed validation checks";
    errors = err.issues ? err.issues.map((issue: any) => ({
      field: issue.path.join("."),
      message: issue.message,
    })) : err.errors;
  }

  // Handle CastError (invalid mongo ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Malformed ID format supplied";
  }

  // Log non-operational errors
  if (statusCode === 500) {
    console.error("CRITICAL BACKEND EXCEPTION:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
    timestamp: new Date().toISOString(),
    // Include stack trace only in non-production builds
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
