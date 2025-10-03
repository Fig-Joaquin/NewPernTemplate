import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiResponse } from "../utils/api-response";

/**
 * Interface para el payload del JWT
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number | undefined;
  exp?: number | undefined;
}

/**
 * Interface extendida de Request con usuario autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware de autenticación JWT
 * 
 * Valida el token JWT en el header Authorization y adjunta
 * la información del usuario al request para usar en endpoints protegidos.
 * 
 * @param req Request object (extendido con user)
 * @param res Response object
 * @param next Next function
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    // Verificar que existe el header Authorization
    if (!authHeader) {
      res.status(401).json(
        ApiResponse.error("Access denied. No token provided.")
      );
      return;
    }

    // Verificar formato: "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      res.status(401).json(
        ApiResponse.error("Access denied. Invalid token format. Use 'Bearer <token>'")
      );
      return;
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remover "Bearer "
    
    if (!token) {
      res.status(401).json(
        ApiResponse.error("Access denied. Token not found.")
      );
      return;
    }

    // Verificar que existe JWT_SECRET
    if (!env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      res.status(500).json(
        ApiResponse.error("Internal server configuration error")
      );
      return;
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    // Validar estructura del payload
    if (!decoded.userId || !decoded.email) {
      res.status(401).json(
        ApiResponse.error("Access denied. Invalid token payload.")
      );
      return;
    }

    // Adjuntar información del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat ?? undefined,
      exp: decoded.exp ?? undefined
    };

    // Logging en desarrollo
    if (env.NODE_ENV === "development") {
      console.log(`🔐 Authenticated user: ${decoded.email} (${decoded.userId})`);
    }

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(
        ApiResponse.error("Access denied. Token has expired.", {
          code: "TOKEN_EXPIRED",
          expiredAt: error.expiredAt
        })
      );
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(
        ApiResponse.error("Access denied. Invalid token.", {
          code: "INVALID_TOKEN",
          message: error.message
        })
      );
      return;
    }

    if (error instanceof jwt.NotBeforeError) {
      res.status(401).json(
        ApiResponse.error("Access denied. Token not active yet.", {
          code: "TOKEN_NOT_ACTIVE",
          date: error.date
        })
      );
      return;
    }

    // Error genérico
    console.error("❌ JWT Authentication error:", error);
    res.status(401).json(
      ApiResponse.error("Access denied. Token validation failed.")
    );
  }
};

/**
 * Middleware opcional de autenticación
 * 
 * Similar a authenticateToken pero no falla si no hay token,
 * útil para endpoints que pueden funcionar con o sin autenticación.
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  
  // Si no hay header, continuar sin autenticación
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  // Si hay header, usar la lógica normal de autenticación
  authenticateToken(req, res, next);
};

/**
 * Middleware para verificar roles específicos
 * Nota: Esto requeriría extender el JWT payload con roles
 * 
 * @param allowedRoles Array de roles permitidos
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Primero verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(401).json(
        ApiResponse.error("Access denied. Authentication required.")
      );
      return;
    }

    // Por ahora, asumir que todos los usuarios autenticados tienen acceso
    // En el futuro: verificar req.user.roles contra allowedRoles
    // Para implementar: agregar campo 'roles' al User entity y JWT payload
    
    next();
  };
};

/**
 * Middleware para verificar que el usuario acceda solo a sus propios recursos
 * 
 * @param userIdParam Nombre del parámetro que contiene el ID del usuario (ej: 'id', 'userId')
 */
export const requireOwnership = (userIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(
        ApiResponse.error("Access denied. Authentication required.")
      );
      return;
    }

    const resourceUserId = req.params[userIdParam];
    const currentUserId = req.user.userId;

    if (resourceUserId !== currentUserId) {
      res.status(403).json(
        ApiResponse.error("Access denied. You can only access your own resources.")
      );
      return;
    }

    next();
  };
};

/**
 * Utilidad para generar tokens JWT
 * 
 * @param payload Datos a incluir en el token
 * @param expiresIn Tiempo de expiración (default: 24h)
 */
export const generateToken = (
  payload: { userId: string; email: string },
  expiresIn: string = "24h"
): string => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email
    },
    env.JWT_SECRET,
    {
      expiresIn,
      issuer: "pern-api",
      audience: "pern-client"
    } as jwt.SignOptions
  );
};

/**
 * Utilidad para refrescar tokens
 * 
 * @param token Token actual a refrescar
 * @param expiresIn Nuevo tiempo de expiración
 */
export const refreshToken = (token: string, expiresIn: string = "24h"): string => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Decodificar sin verificar expiración
  const decoded = jwt.decode(token) as JwtPayload;
  
  if (!decoded?.userId || !decoded?.email) {
    throw new Error("Invalid token payload");
  }

  // Generar nuevo token con los mismos datos
  return generateToken(
    {
      userId: decoded.userId,
      email: decoded.email
    },
    expiresIn
  );
};

/**
 * Utilidad para extraer información del token sin verificación
 * Útil para debugging o información no crítica
 */
export const decodeTokenInfo = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};