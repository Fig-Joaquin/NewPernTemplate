import { z } from "zod";

/**
 * Schema para login de usuario
 */
export const LoginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Please provide a valid email address")
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(1, "Password is required")
    .max(255, "Password is too long"),
}).strict();

export type LoginDto = z.infer<typeof LoginSchema>;

/**
 * Schema para refresh token
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, "Refresh token is required"),
}).strict();

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

/**
 * Schema para logout
 */
export const LogoutSchema = z.object({
  token: z.string()
    .min(1, "Token is required")
    .optional(), // Token puede venir del header también
}).strict();

export type LogoutDto = z.infer<typeof LogoutSchema>;

/**
 * Schema para respuesta de login exitoso
 */
export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string().refine((val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "Invalid UUID format"),
    email: z.string().refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format"),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    isActive: z.boolean(),
    isEmailVerified: z.boolean(),
    lastLoginAt: z.date().nullable(),
    createdAt: z.date(),
  }),
  token: z.string(),
  expiresIn: z.string().default("24h"),
  tokenType: z.string().default("Bearer"),
});

export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;

/**
 * Schema para información del token
 */
export const TokenInfoSchema = z.object({
  userId: z.string().refine((val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val), "Invalid UUID format"),
  email: z.string().refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format"),
  iat: z.number().optional(),
  exp: z.number().optional(),
  isValid: z.boolean(),
  isExpired: z.boolean(),
  expiresAt: z.date().nullable(),
});

export type TokenInfoDto = z.infer<typeof TokenInfoSchema>;

/**
 * Schema para reset de contraseña (request)
 */
export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Please provide a valid email address")
    .transform(val => val.toLowerCase().trim()),
}).strict();

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

/**
 * Schema para reset de contraseña (confirm)
 */
export const ResetPasswordSchema = z.object({
  token: z.string()
    .min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: z.string()
    .min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password and confirmation do not match",
  path: ["confirmPassword"],
}).strict();

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

/**
 * Schema pour verificación de email
 */
export const VerifyEmailSchema = z.object({
  token: z.string()
    .min(1, "Verification token is required"),
}).strict();

export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;

/**
 * Schema para cambio de contraseña autenticado
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  confirmPassword: z.string()
    .min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
}).strict();

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

/**
 * Schema para registro de usuario (referencia al users module)
 */
export const RegisterSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Please provide a valid email address")
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  firstName: z.string()
    .min(2, "First name must be at least 2 characters long")
    .max(100, "First name must be less than 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "First name can only contain letters and spaces")
    .transform(val => val.trim()),
  lastName: z.string()
    .min(2, "Last name must be at least 2 characters long")
    .max(100, "Last name must be less than 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Last name can only contain letters and spaces")
    .transform(val => val.trim()),
}).strict();

export type RegisterDto = z.infer<typeof RegisterSchema>;