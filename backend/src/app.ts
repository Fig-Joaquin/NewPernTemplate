import express, { Application } from "express";
import SimpleRegistry from "./shared/core/simple-registry";
import { errorHandler, notFoundHandler, requestLogger } from "./shared/middlewares/error-handler";
import { ApiResponse } from "./shared/utils/api-response";
import { env, isDevelopment } from "./config/env";

// AUTO-IMPORTS - Esto dispara el auto-registro de módulos
import "./modules/users/users.module";
import "./modules/auth/auth.module";

const app: Application = express();

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (only in development)
if (isDevelopment()) {
  app.use(requestLogger);
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS (basic - you might want to use cors package for production)
if (isDevelopment()) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check route with dynamic module information
app.get("/health", (req, res) => {
  const moduleStats = SimpleRegistry.getStats();
  
  res.json(
    ApiResponse.success({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: "1.0.0",
      uptime: process.uptime(),
      modules: moduleStats,
      registry: SimpleRegistry.getSummary()
    }, "Server is healthy")
  );
});

// Root route with dynamic module information
app.get("/", (req, res) => {
  const endpoints = SimpleRegistry.getEndpoints();
  const moduleDetails = SimpleRegistry.getDetailedInfo();

  res.json(
    ApiResponse.success({
      message: "🚀 PERN API Server with Auto-Registry",
      version: "1.0.0",
      environment: env.NODE_ENV,
      architecture: "Modular with Auto-Discovery",
      endpoints: {
        health: "/health",
        ...endpoints
      },
      modules: moduleDetails,
      documentation: "Visit /health for server status and module information"
    }, "Welcome to Auto-Registry PERN API")
  );
});

// =============================================================================
// MODULE AUTO-LOADING
// =============================================================================

// 🎯 UNA SOLA LÍNEA - Carga automáticamente todos los módulos registrados
SimpleRegistry.applyAll(app);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 Handler (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
