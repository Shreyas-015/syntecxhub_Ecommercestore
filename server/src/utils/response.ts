import { Response } from "express";

export interface ApiResponsePayload<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  errors: any[] | null;
  timestamp: string;
}

export class ApiResponse {
  /**
   * Send a success response
   */
  static success<T = any>(
    res: Response,
    message: string,
    data: T = null as any,
    statusCode: number = 200
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      data,
      errors: null,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    message: string,
    errors: any[] | null = null,
    statusCode: number = 500
  ): Response {
    const payload: ApiResponsePayload<null> = {
      success: false,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
