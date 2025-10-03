import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateToken } from "../../../shared/middlewares/auth.middleware";

const router = Router();
const authController = new AuthController();

// =============================================================================
// PUBLIC ROUTES (No requieren autenticación)
// =============================================================================

/**
 * @route POST /api/auth/login
 * @desc Autenticar usuario con email y contraseña
 * @access Public
 */
router.post("/login", authController.loginUser);

/**
 * @route POST /api/auth/register
 * @desc Registrar nuevo usuario con auto-login
 * @access Public
 */
router.post("/register", authController.registerUser);

/**
 * @route POST /api/auth/validate-password
 * @desc Validar fortaleza de contraseña
 * @access Public
 */
router.post("/validate-password", authController.validatePassword);

// =============================================================================
// PROTECTED ROUTES (Requieren token JWT válido)
// =============================================================================

/**
 * @route POST /api/auth/logout
 * @desc Logout usuario (invalidar token)
 * @access Private
 */
router.post("/logout", authenticateToken, authController.logoutUser);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refrescar token JWT existente
 * @access Private
 */
router.post("/refresh-token", authController.refreshToken);

/**
 * @route PUT /api/auth/change-password
 * @desc Cambiar contraseña del usuario autenticado
 * @access Private
 */
router.put("/change-password", authenticateToken, authController.changePassword);

/**
 * @route GET /api/auth/me
 * @desc Obtener información del usuario autenticado
 * @access Private
 */
router.get("/me", authenticateToken, authController.getCurrentUser);

/**
 * @route GET /api/auth/token-info
 * @desc Obtener información detallada del token
 * @access Private
 */
router.get("/token-info", authController.getTokenInfo);

export default router;
