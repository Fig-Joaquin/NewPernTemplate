import { Request, Response, NextFunction } from "express";
import { UserService, IUserService } from "../services/user.service";
import { 
  CreateUserSchema, 
  UpdateUserSchema, 
  ChangePasswordSchema,
  LoginSchema,
  UserQuerySchema 
} from "../dto/user.dto";
import { ApiResponse } from "../../../shared/utils/api-response";

export class UserController {
  private readonly userService: IUserService;

  constructor(userService?: IUserService) {
    this.userService = userService || new UserService();
  }

  /**
   * Validar que el parámetro ID esté presente
   */
  private validateId(id: string | undefined): string {
    if (!id) {
      throw new Error("ID parameter is required");
    }
    return id;
  }

  /**
   * @route POST /api/users
   * @desc Crear un nuevo usuario
   * @access Public
   */
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = CreateUserSchema.parse(req.body);
      const user = await this.userService.createUser(userData);
      
      res.status(201).json(
        ApiResponse.success(user, "User created successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/users/:id
   * @desc Obtener usuario por ID
   * @access Private
   */
  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.validateId(req.params.id);
      const user = await this.userService.getUserById(id);
      
      res.json(
        ApiResponse.success(user, "User retrieved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/users
   * @desc Obtener todos los usuarios con paginación y filtros
   * @access Private
   */
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryData = UserQuerySchema.parse(req.query);
      const result = await this.userService.getAllUsers(queryData);
      
      res.json(
        ApiResponse.success(result, "Users retrieved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /api/users/:id
   * @desc Actualizar usuario
   * @access Private
   */
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.validateId(req.params.id);
      const userData = UpdateUserSchema.parse(req.body);
      const user = await this.userService.updateUser(id, userData);
      
      res.json(
        ApiResponse.success(user, "User updated successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route DELETE /api/users/:id
   * @desc Eliminar usuario (soft delete)
   * @access Private
   */
  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.validateId(req.params.id);
      await this.userService.deleteUser(id);
      
      res.json(
        ApiResponse.success(null, "User deleted successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /api/users/:id/password
   * @desc Cambiar contraseña
   * @access Private
   */
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.validateId(req.params.id);
      const passwordData = ChangePasswordSchema.parse(req.body);
      
      await this.userService.changePassword(id, passwordData);
      
      res.json(
        ApiResponse.success(null, "Password changed successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /api/users/:id/verify-email
   * @desc Verificar email del usuario
   * @access Private
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.validateId(req.params.id);
      await this.userService.verifyEmail(id);
      
      res.json(
        ApiResponse.success(null, "Email verified successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/users/login
   * @desc Autenticar usuario
   * @access Public
   */
  loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData = LoginSchema.parse(req.body);
      const user = await this.userService.authenticateUser(loginData.email, loginData.password);
      
      res.json(
        ApiResponse.success(user, "Login successful")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/users/stats
   * @desc Obtener estadísticas de usuarios
   * @access Private (Admin)
   */
  getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();
      
      res.json(
        ApiResponse.success(stats, "User statistics retrieved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/users/profile/:id
   * @desc Obtener perfil completo del usuario
   * @access Private
   */
  getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = this.validateId(req.params.id);
      const user = await this.userService.getUserById(id);
      
      // Aquí podrías agregar información adicional del perfil
      const profile = {
        ...user,
        profileCompletion: this.calculateProfileCompletion(user),
        memberSince: this.formatMemberSince(user.createdAt)
      };
      
      res.json(
        ApiResponse.success(profile, "User profile retrieved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calcular porcentaje de completitud del perfil
   */
  private calculateProfileCompletion(user: any): number {
    const fields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 
      'dateOfBirth', 'gender'
    ];
    
    const completedFields = fields.filter(field => {
      const value = user[field];
      return value !== null && value !== undefined && value !== '';
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  }

  /**
   * Formatear tiempo como miembro
   */
  private formatMemberSince(createdAt: Date): string {
    const now = new Date();
    const memberSince = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - memberSince.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    }
    
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }
}
