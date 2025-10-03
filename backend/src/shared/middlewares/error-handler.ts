import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { isDevelopment } from "../../config/env";
import { ApiResponse } from "../utils/api-response";

/**
 * Middleware global para manejo de errores
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("❌ Error:", {
    message: error.message,
    stack: isDevelopment() ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json(
      ApiResponse.error(
        "Validation error",
        error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code
        }))
      )
    );
    return;
  }

  // Custom application errors
  if (error.message.includes("not found")) {
    res.status(404).json(
      ApiResponse.error(error.message)
    );
    return;
  }

  if (error.message.includes("already exists") || 
      error.message.includes("already in use") ||
      error.message.includes("duplicate")) {
    res.status(409).json(
      ApiResponse.error(error.message)
    );
    return;
  }

  if (error.message.includes("Invalid") || 
      error.message.includes("required") ||
      error.message.includes("must be")) {
    res.status(400).json(
      ApiResponse.error(error.message)
    );
    return;
  }

  if (error.message.includes("Unauthorized") || 
      error.message.includes("Invalid email or password")) {
    res.status(401).json(
      ApiResponse.error(error.message)
    );
    return;
  }

  if (error.message.includes("Forbidden") || 
      error.message.includes("Access denied")) {
    res.status(403).json(
      ApiResponse.error(error.message)
    );
    return;
  }

  // Database connection errors
  if (error.message.includes("connection") || 
      error.message.includes("ECONNREFUSED")) {
    res.status(503).json(
      ApiResponse.error("Service temporarily unavailable")
    );
    return;
  }

  // Default server error
  res.status(500).json(
    ApiResponse.error(
      isDevelopment() ? error.message : "Internal server error"
    )
  );
};

/**
 * Middleware para rutas no encontradas
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json(
    ApiResponse.error(
      `Route ${req.method} ${req.originalUrl} not found`,
      {
        availableRoutes: [
          "GET /health - Health check",
          "POST /api/users - Create user",
          "POST /api/users/login - User login",
          "GET /api/users - List users",
          "GET /api/users/:id - Get user by ID"
        ]
      }
    )
  );
};

/**
 * Middleware para logging de requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isDevelopment()) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
      );
    });
  }
  
  next();
};
