import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { Role } from "../constants/roles";

// Extend Request interface to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify access token in HTTP header
 */
export function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError("Authentication token is required");
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Token expired"));
    }
    next(new UnauthorizedError("Unauthorized access"));
  }
}

/**
 * Middleware to restrict access to ADMIN only
 */
export function verifyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (req.user.role !== Role.ADMIN) {
    return next(new ForbiddenError("Administrator privileges required"));
  }

  next();
}

/**
 * Middleware to verify user has one of the required roles
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Access denied: insufficient permissions"));
    }

    next();
  };
}
