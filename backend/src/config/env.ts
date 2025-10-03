import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

// Se cargan las variables de entorno
dotenv.config({ path: path.resolve(__dirname, "../..", ".env") });

// Schema de validación
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000").transform((val) => parseInt(val, 10)),
  
  // Database configuration
  POSTGRES_HOST: z.string().min(1, "POSTGRES_HOST is required"),
  POSTGRES_PORT: z.string().default("5432").transform((val) => parseInt(val, 10)),
  POSTGRES_USER: z.string().min(1, "POSTGRES_USER is required"),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD is required"),
  POSTGRES_DB: z.string().min(1, "POSTGRES_DB is required"),
  
  // Opcional
  DATABASE_URL: z.string().optional(),
  
  // JWT Secret
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
});

// validación y parseo de las variables de entorno
export const env = envSchema.parse(process.env);

// variables de entorno con tipado seguro
export type Env = z.infer<typeof envSchema>;

// Verifica si estamos en producción, testing o desarrollo
export const isProduction = () => env.NODE_ENV === "production";
export const isDevelopment = () => env.NODE_ENV === "development";
export const isTest = () => env.NODE_ENV === "test";

// Crea la URL de conexión a la base de datos
export const getDatabaseUrl = () => {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  
  return `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
};
