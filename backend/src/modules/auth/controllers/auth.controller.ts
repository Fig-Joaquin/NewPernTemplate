import { Request, Response, NextFunction } from "express";
import { AuthService, IAuthService } from "../services/auth.service";
import { 
  LoginSchema, 
  RegisterSchema, 
  ChangePasswordSchema
} from "../dto/auth.dto";
import { ApiResponse } from "../../../shared/utils/api-response";
import { AuthenticatedRequest } from "../../../shared/middlewares/auth.middleware";

export class AuthController {
  private readonly authService: IAuthService;

  constructor(authService?: IAuthService) {
    this.authService = authService || new AuthService();
  }

  /**
   * @route POST /api/auth/login
   * @desc Autenticar usuario y generar token JWT
   * @access Public
   */
  loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData = LoginSchema.parse(req.body);
      const result = await this.authService.login(loginData);
      
      res.json(
        ApiResponse.success(result, "Login successful")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/register
   * @desc Registrar nuevo usuario con auto-login
   * @access Public
   */
  registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerData = RegisterSchema.parse(req.body);
      const result = await this.authService.register(registerData);
      
      res.status(201).json(
        ApiResponse.success(result, "User registered successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/logout
   * @desc Logout usuario (invalidar token)
   * @access Private
   */
  logoutUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(400).json(
          ApiResponse.error("No token provided for logout")
        );
        return;
      }

      const token = authHeader.substring(7);
      await this.authService.logout(token);
      
      res.json(
        ApiResponse.success(null, "Logout successful")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/refresh-token
   * @desc Refrescar token JWT
   * @access Private
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(400).json(
          ApiResponse.error("No token provided for refresh")
        );
        return;
      }

      const token = authHeader.substring(7);
      const result = await this.authService.refreshToken(token);
      
      res.json(
        ApiResponse.success(result, "Token refreshed successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route PUT /api/auth/change-password
   * @desc Cambiar contraseña del usuario autenticado
   * @access Private
   */
  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json(
          ApiResponse.error("Authentication required")
        );
        return;
      }

      const passwordData = ChangePasswordSchema.parse(req.body);
      await this.authService.changePassword(req.user.userId, passwordData);
      
      res.json(
        ApiResponse.success(null, "Password changed successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/auth/me
   * @desc Obtener información del usuario autenticado
   * @access Private
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json(
          ApiResponse.error("Authentication required")
        );
        return;
      }

      // El middleware ya validó el token, retornamos la info del usuario
      res.json(
        ApiResponse.success({
          userId: req.user.userId,
          email: req.user.email,
          tokenIssuedAt: req.user.iat ? new Date(req.user.iat * 1000) : null,
          tokenExpiresAt: req.user.exp ? new Date(req.user.exp * 1000) : null
        }, "User information retrieved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route GET /api/auth/token-info
   * @desc Obtener información del token actual
   * @access Private
   */
  getTokenInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith("Bearer ")) {
        res.status(400).json(
          ApiResponse.error("No token provided")
        );
        return;
      }

      const token = authHeader.substring(7);
      const tokenInfo = this.authService.getTokenInfo(token);
      
      res.json(
        ApiResponse.success(tokenInfo, "Token information retrieved successfully")
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * @route POST /api/auth/validate-password
   * @desc Validar fortaleza de contraseña
   * @access Public
   */
  validatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body;
      
      if (!password || typeof password !== 'string') {
        res.status(400).json(
          ApiResponse.error("Password is required")
        );
        return;
      }

      const validation = this.authService.validatePasswordStrength(password);
      
      res.json(
        ApiResponse.success(validation, "Password validation completed")
      );
    } catch (error) {
      next(error);
    }
  };
}