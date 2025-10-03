import { z } from "zod";

// Validaciones personalizadas
const emailSchema = z.string()
  z.email({ message: "Please provide a valid email address" })
  .max(255, "Email must be less than 255 characters")
  .transform(val => val.toLowerCase().trim());

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one number"
  );

const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters long")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Name can only contain letters and spaces")
  .transform(val => val.trim());

const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-()]+$/, "Please provide a valid phone number")
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number must be less than 20 characters")
  .optional()
  .or(z.literal(""));

const genderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"])
  .optional();

const dateOfBirthSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    const maxAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
    
    return date >= minAge && date <= maxAge;
  }, "You must be between 13 and 120 years old")
  .transform(dateString => new Date(dateString))
  .optional();

// Schema para crear usuario
export const CreateUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: genderSchema,
  phoneNumber: phoneSchema.transform(val => val === "" ? null : val),
}).strict();

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// Schema para actualizar usuario (todos los campos opcionales excepto validaciones)
export const UpdateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  dateOfBirth: dateOfBirthSchema,
  gender: genderSchema,
  phoneNumber: phoneSchema.transform(val => val === "" ? null : val),
}).strict();

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// Schema para cambiar contraseña
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirmation do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

// Schema para login
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
}).strict();

export type LoginDto = z.infer<typeof LoginSchema>;

// Schema para respuesta de usuario (sin datos sensibles)
export const UserResponseSchema = z.object({
  id: z.uuid({ message: "Invalid UUID format" }),
  email: z.email({ message: "Invalid email format" }),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  dateOfBirth: z.date().nullable(),
  gender: genderSchema.nullable(),
  phoneNumber: z.string().nullable(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponseDto = z.infer<typeof UserResponseSchema>;

// Schema para búsqueda/filtros
export const UserQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(() => 10),
  search: z.string().max(255).optional(),
  isActive: z.string().transform(val => val === "true").optional(),
  gender: genderSchema,
  sortBy: z.enum(["createdAt", "firstName", "lastName", "email"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
}).strict();

export type UserQueryDto = z.infer<typeof UserQuerySchema>;
