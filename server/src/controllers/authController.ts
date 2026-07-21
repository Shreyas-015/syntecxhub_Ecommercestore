import { Response } from "express";
import { authService } from "../services/authService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { UnauthorizedError } from "../utils/errors";

const isProduction = process.env.NODE_ENV === "production";

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("strict" as const) : ("lax" as const),
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("strict" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: AuthenticatedRequest, res: Response) {
    const result = await authService.register(req.body);

    res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        role: result.user.role,
        user: result.user,
        token: result.accessToken,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Login user
   */
  async login(req: AuthenticatedRequest, res: Response) {
    const result = await authService.login(req.body);

    res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "User logged in successfully.",
      data: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        role: result.user.role,
        user: result.user,
        token: result.accessToken,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logout user and clear tokens
   */
  async logout(req: AuthenticatedRequest, res: Response) {
    if (req.user) {
      await authService.logout(req.user.id);
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("strict" as const) : ("lax" as const),
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("strict" as const) : ("lax" as const),
    });

    res.status(200).json({
      success: true,
      message: "Safe sign out completed successfully.",
      data: null,
      errors: null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Refresh access token
   */
  async refresh(req: AuthenticatedRequest, res: Response) {
    // Attempt to read from signed/unsigned cookies first, fallback to req.body
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      throw new UnauthorizedError("Refresh token is required");
    }

    const result = await authService.refresh(token);

    res.cookie("accessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        token: result.accessToken,
      },
      errors: null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }

    const user = await authService.updateProfile(req.user.id, {});

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: {
        user,
      },
      errors: null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update profile information
   */
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }

    const updatedUser = await authService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: "Profile information updated successfully.",
      data: {
        user: updatedUser,
      },
      errors: null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Update account password
   */
  async updatePassword(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError("Not authenticated");
    }

    await authService.updatePassword(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: "Account password updated successfully.",
      data: null,
      errors: null,
      timestamp: new Date().toISOString(),
    });
  }
}

export const authController = new AuthController();
