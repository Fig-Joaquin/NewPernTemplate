import { Router } from "express";
import authRoutes from "./routes/auth.routes";
import SimpleRegistry from "../../shared/core/simple-registry";

/**
 * Módulo de autenticación
 * 
 * Este módulo encapsula toda la funcionalidad relacionada con autenticación:
 * - Login y logout
 * - Registro de usuarios
 * - Gestión de tokens JWT
 * - Cambio de contraseñas
 * - Validaciones de seguridad
 */
export class AuthModule {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
    
    // 🎯 AUTO-REGISTRO - El módulo se registra automáticamente
    SimpleRegistry.register({
      name: "AuthModule",
      path: "/api/auth",
      router: this.router,
      version: "1.0.0",
      description: "Comprehensive authentication and authorization system",
      info: AuthModule.getModuleInfo()
    });
  }

  /**
   * Inicializar rutas del módulo
   */
  private initializeRoutes(): void {
    // Como el path "/api/auth" ya está en el registro, aquí usamos "/"
    this.router.use("/", authRoutes);
  }

  /**
   * Obtener información del módulo
   */
  static getModuleInfo() {
    return {
      name: "Authentication Module",
      version: "1.0.0",
      description: "Comprehensive authentication and authorization system",
      endpoints: {
        public: [
          "POST /auth/login - User authentication with JWT",
          "POST /auth/register - User registration with auto-login",
          "POST /auth/validate-password - Password strength validation"
        ],
        private: [
          "POST /auth/logout - Logout user (invalidate token)",
          "POST /auth/refresh-token - Refresh JWT token",
          "PUT /auth/change-password - Change user password",
          "GET /auth/me - Get current authenticated user info",
          "GET /auth/token-info - Get token information and validity"
        ]
      },
      features: [
        "JWT token-based authentication",
        "Secure password hashing with bcrypt",
        "Token refresh mechanism",
        "Password strength validation",
        "User registration with validation",
        "Secure logout functionality",
        "Token expiration handling",
        "Type-safe DTOs with Zod validation",
        "Comprehensive error handling",
        "Authentication middleware for route protection"
      ],
      security: [
        "JWT tokens with configurable expiration",
        "Secure token validation and verification",
        "Password strength requirements",
        "Protection against common attacks",
        "Comprehensive input validation",
        "Secure headers and CORS configuration"
      ],
      middleware: [
        "authenticateToken - Validate JWT for protected routes",
        "optionalAuth - Optional authentication for flexible endpoints",
        "requireRoles - Role-based access control (future)",
        "requireOwnership - Resource ownership validation"
      ]
    };
  }
}

// Auto-instanciar para registrar el módulo
export const authModuleInstance = new AuthModule();
