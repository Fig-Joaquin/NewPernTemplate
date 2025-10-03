import { Router } from "express";
import userRoutes from "./routes/user.routes";

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
  }

  /**
   * Inicializar rutas del módulo
   */
  private initializeRoutes(): void {
    // Todas las rutas de usuarios estarán bajo /users
    this.router.use("/users", userRoutes);
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