import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Middleware to ensure MongoDB is fully connected before processing database-dependent routes.
 * If disconnected, returns a clear, descriptive 503 Service Unavailable error instead of causing
 * request timeouts or raw crashes.
 */
export function verifyDbConnection(req: Request, res: Response, next: NextFunction) {
  // mongoose.connection.readyState values:
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
  const state = mongoose.connection.readyState;

  if (state !== 1) {
    console.warn(`⚠️ Database connection is offline (readyState = ${state}). Rejecting database endpoint request with 503: ${req.method} ${req.path}`);
    return res.status(503).json({
      success: false,
      message: "Database connection is currently offline or unavailable. Please verify that your MONGODB_URI is correctly configured in your environment settings and that your MongoDB Atlas cluster IP whitelist permits connections from this environment.",
      data: null,
      errors: [
        {
          field: "database",
          message: "Could not establish server selection with MongoDB Atlas cluster. Please check IP whitelists."
        }
      ],
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
