import { Router } from "express";
import userRoutes from "./routes/user.routes";
import SimpleRegistry from "../../shared/core/simple-registry";

/**
 * Módulo de usuarios
 * 
 * Este módulo encapsula toda la funcionalidad relacionada con usuarios:
 * - Registro y autenticación
 * - Gestión de perfiles
 * - Operaciones CRUD
 * - Estadísticas
 */
export class UsersModule {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
    
    // 🎯 AUTO-REGISTRO - El módulo se registra automáticamente
    SimpleRegistry.register({
      name: "UsersModule",
      path: "/api/users",
      router: this.router,
      version: "1.0.0",
      description: "Comprehensive user management system",
      info: UsersModule.getModuleInfo()
    });
  }

  /**
   * Inicializar rutas del módulo
   */
  private initializeRoutes(): void {
    // Como el path "/api/users" ya está en el registro, aquí usamos "/"
    this.router.use("/", userRoutes);
  }

  /**
   * Obtener información del módulo
   */
  static getModuleInfo() {
    return {
      name: "Users Module",
      version: "1.0.0",
      description: "Comprehensive user management system",
      endpoints: {
        public: [
          "POST /users - Register new user",
          "POST /users/login - User authentication"
        ],
        private: [
          "GET /users - List all users",
          "GET /users/:id - Get user by ID",
          "GET /users/profile/:id - Get user profile",
          "GET /users/stats - Get user statistics",
          "PUT /users/:id - Update user",
          "PUT /users/:id/password - Change password",
          "PUT /users/:id/verify-email - Verify email",
          "DELETE /users/:id - Delete user"
        ]
      },
      features: [
        "User registration with validation",
        "Secure password hashing",
        "Email verification",
        "Profile management",
        "Soft delete functionality",
        "Advanced search and filtering",
        "Pagination support",
        "User statistics",
        "Type-safe DTOs with Zod validation"
      ]
    };
  }
}

// Auto-instanciar para registrar el módulo
export const usersModuleInstance = new UsersModule();