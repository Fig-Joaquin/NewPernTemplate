import "reflect-metadata";
import { DataSource } from "typeorm";
import { env, isProduction, isDevelopment } from "./env";

// Importar entidades
import { User } from "../modules/users/entities/user.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  
  // Configuración basada en el entorno
  synchronize: !isProduction(), // Solo en desarrollo
  logging: isDevelopment(), // Solo en desarrollo
  
  // Entidades
  entities: [User],
  
  // Migraciones
  migrations: ["src/database/migrations/**/*.ts"],
  
  // Configuración de conexión
  extra: {
    connectionLimit: 10,
  },
  
  // SSL en producción
  ssl: isProduction() ? { rejectUnauthorized: false } : false,
});
