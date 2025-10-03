import { UserService, IUserService } from "../../users/services/user.service";
import { LoginDto, LoginResponseDto, RegisterDto, ChangePasswordDto, TokenInfoDto } from "../dto/auth.dto";
import { generateToken, decodeTokenInfo } from "../../../shared/middlewares/auth.middleware";

export interface IAuthService {
  login(loginData: LoginDto): Promise<LoginResponseDto>;
  register(registerData: RegisterDto): Promise<LoginResponseDto>;
  changePassword(userId: string, passwordData: ChangePasswordDto): Promise<void>;
  getTokenInfo(token: string): TokenInfoDto;
  refreshToken(token: string): Promise<{ token: string; expiresIn: string }>;
  logout(token: string): Promise<void>;
  validatePasswordStrength(password: string): { isValid: boolean; score: number; suggestions: string[] };
}

export class AuthService implements IAuthService {
  private readonly userService: IUserService;

  constructor(userService?: IUserService) {
    this.userService = userService || new UserService();
  }

  /**
   * Autenticar usuario y generar token JWT
   */
  async login(loginData: LoginDto): Promise<LoginResponseDto> {
    try {
      const authResult = await this.userService.authenticateUser(
        loginData.email,
        loginData.password
      );

      return {
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          firstName: authResult.user.firstName,
          lastName: authResult.user.lastName,
          fullName: authResult.user.fullName,
          isActive: authResult.user.isActive,
          isEmailVerified: authResult.user.isEmailVerified,
          lastLoginAt: authResult.user.lastLoginAt,
          createdAt: authResult.user.createdAt,
        },
        token: authResult.token,
        expiresIn: "24h",
        tokenType: "Bearer"
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Authentication failed");
    }
  }

  /**
   * Registrar nuevo usuario y auto-login con token
   */
  async register(registerData: RegisterDto): Promise<LoginResponseDto> {
    try {
      // Crear usuario usando el UserService
      const user = await this.userService.createUser({
        email: registerData.email,
        password: registerData.password,
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        phoneNumber: null
      });

      // Generar token para auto-login
      const token = generateToken({
        userId: user.id,
        email: user.email
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        },
        token,
        expiresIn: "24h",
        tokenType: "Bearer"
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Registration failed");
    }
  }

  /**
   * Cambiar contraseña de usuario autenticado
   */
  async changePassword(userId: string, passwordData: ChangePasswordDto): Promise<void> {
    try {
      await this.userService.changePassword(userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Failed to change password");
    }
  }

  /**
   * Obtener información del token sin verificación completa
   */
  getTokenInfo(token: string): TokenInfoDto {
    const decoded = decodeTokenInfo(token);
    
    if (!decoded) {
      return {
        userId: "",
        email: "",
        isValid: false,
        isExpired: true,
        expiresAt: null
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp ? decoded.exp < now : false;
    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;

    return {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
      isValid: !isExpired && Boolean(decoded.userId && decoded.email),
      isExpired,
      expiresAt
    };
  }

  /**
   * Refrescar token JWT (generar uno nuevo)
   */
  async refreshToken(token: string): Promise<{ token: string; expiresIn: string }> {
    const tokenInfo = this.getTokenInfo(token);
    
    if (!tokenInfo.isValid || tokenInfo.isExpired) {
      throw new Error("Invalid or expired token");
    }

    // Verificar que el usuario aún existe y está activo
    try {
      const user = await this.userService.getUserById(tokenInfo.userId);
      
      if (!user.isActive) {
        throw new Error("User account is deactivated");
      }

      // Generar nuevo token
      const newToken = generateToken({
        userId: user.id,
        email: user.email
      });

      return {
        token: newToken,
        expiresIn: "24h"
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Unable to refresh token: ${error.message}`);
      }
      throw new Error("Unable to refresh token");
    }
  }

  /**
   * Logout (invalidar token)
   * Nota: Para implementación completa, necesitaríamos una blacklist de tokens
   */
  async logout(token: string): Promise<void> {
    // Por ahora, el logout es simple ya que los JWT son stateless
    // En producción, deberías:
    // 1. Agregar el token a una blacklist en Redis
    // 2. O usar refresh tokens con revocación
    // 3. O reducir el tiempo de expiración de tokens
    
    const tokenInfo = this.getTokenInfo(token);
    
    if (!tokenInfo.isValid) {
      throw new Error("Invalid token");
    }

    // Log del logout para auditoría
    console.log(`🔓 User ${tokenInfo.email} (${tokenInfo.userId}) logged out at ${new Date().toISOString()}`);
    
    // Nota: En producción implementar blacklist de tokens en Redis
    // para logout real con revocación inmediata de tokens
  }

  /**
   * Verificar si un usuario puede acceder a un recurso
   */
  async canAccessResource(userId: string, resourceUserId: string): Promise<boolean> {
    // Verificar que el usuario esté activo
    try {
      const user = await this.userService.getUserById(userId);
      
      if (!user.isActive) {
        return false;
      }

      // El usuario puede acceder a sus propios recursos
      return userId === resourceUserId;
    } catch {
      return false;
    }
  }

  /**
   * Validar password strength (utlidad adicional)
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    // Longitud
    if (password.length >= 8) {
      score += 1;
    } else {
      suggestions.push("Use at least 8 characters");
    }

    // Mayúsculas
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Include uppercase letters");
    }

    // Minúsculas
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Include lowercase letters");
    }

    // Números
    if (/\d/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Include numbers");
    }

    // Símbolos
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
      suggestions.push("Great! You're using special characters");
    } else {
      suggestions.push("Consider adding special characters");
    }

    // Patrones comunes (débiles)
    const commonPatterns = [
      /123456/, /password/, /qwerty/, /abc123/, /admin/
    ];

    const hasCommonPattern = commonPatterns.some(pattern => 
      pattern.test(password.toLowerCase())
    );

    if (hasCommonPattern) {
      score -= 2;
      suggestions.push("Avoid common patterns like '123456' or 'password'");
    }

    return {
      isValid: score >= 3 && !hasCommonPattern,
      score: Math.max(0, Math.min(5, score)),
      suggestions: suggestions.slice(0, 3) // Máximo 3 sugerencias
    };
  }
}