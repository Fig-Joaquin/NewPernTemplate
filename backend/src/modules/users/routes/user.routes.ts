import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateToken, requireOwnership } from "../../../shared/middlewares/auth.middleware";

const router = Router();
const userController = new UserController();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route POST /api/users/login
 * @desc Autenticar usuario
 * @access Public
 */
router.post("/login", userController.loginUser);

/**
 * @route POST /api/users
 * @desc Crear un nuevo usuario (registro)
 * @access Public
 */
router.post("/", userController.createUser);

// =============================================================================
// PROTECTED ROUTES (requieren autenticación)
// =============================================================================

/**
 * @route GET /api/users
 * @desc Obtener todos los usuarios con filtros y paginación
 * @access Private
 */
router.get("/", authenticateToken, userController.getAllUsers);

/**
 * @route GET /api/users/stats
 * @desc Obtener estadísticas de usuarios
 * @access Private (Admin)
 */
router.get("/stats", authenticateToken, userController.getUserStats);

/**
 * @route GET /api/users/:id
 * @desc Obtener usuario por ID
 * @access Private
 */
router.get("/:id", authenticateToken, userController.getUserById);

/**
 * @route GET /api/users/profile/:id
 * @desc Obtener perfil completo del usuario
 * @access Private - Solo el propietario puede acceder
 */
router.get("/profile/:id", authenticateToken, requireOwnership(), userController.getUserProfile);

/**
 * @route PUT /api/users/:id
 * @desc Actualizar usuario
 * @access Private - Solo el propietario puede actualizar
 */
router.put("/:id", authenticateToken, requireOwnership(), userController.updateUser);

/**
 * @route PUT /api/users/:id/password
 * @desc Cambiar contraseña del usuario
 * @access Private - Solo el propietario puede cambiar su contraseña
 */
router.put("/:id/password", authenticateToken, requireOwnership(), userController.changePassword);

/**
 * @route PUT /api/users/:id/verify-email
 * @desc Verificar email del usuario
 * @access Private - Solo el propietario puede verificar su email
 */
router.put("/:id/verify-email", authenticateToken, requireOwnership(), userController.verifyEmail);

/**
 * @route DELETE /api/users/:id
 * @desc Eliminar usuario (soft delete)
 * @access Private - Solo el propietario puede eliminar su cuenta
 */
router.delete("/:id", authenticateToken, requireOwnership(), userController.deleteUser);

export default router;
