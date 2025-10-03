import { Application, Router } from "express";

/**
 * Información de un módulo registrado
 */
export interface ModuleInfo {
  name: string;
  path: string;
  router: Router;
  info?: any;
  version?: string;
  description?: string;
}

/**
 * SimpleRegistry - Patrón Registry para auto-registro de módulos
 * 
 * Este registry permite que los módulos se registren automáticamente
 * sin necesidad de modificar app.ts cada vez que se agrega un nuevo módulo.
 * 
 * Características:
 * - Auto-registro de módulos en constructor
 * - Aplicación automática de rutas a Express
 * - Información dinámica de endpoints
 * - Estadísticas de módulos cargados
 * - Health checks automáticos
 */
export class SimpleRegistry {
  private static readonly modules: Map<string, ModuleInfo> = new Map();
  private static isInitialized = false;

  /**
   * Registrar un módulo automáticamente
   * Este método es llamado por cada módulo en su constructor
   */
  static register(moduleInfo: ModuleInfo): void {
    if (this.modules.has(moduleInfo.name)) {
      console.warn(`⚠️  Module ${moduleInfo.name} is already registered. Skipping...`);
      return;
    }

    console.log(`📦 Auto-registering: ${moduleInfo.name} at ${moduleInfo.path}`);
    this.modules.set(moduleInfo.name, moduleInfo);
  }

  /**
   * Aplicar todos los módulos registrados a Express app
   * Reemplaza la necesidad de app.use() manual para cada módulo
   */
  static applyAll(app: Application): void {
    if (this.isInitialized) {
      console.warn("⚠️  SimpleRegistry already initialized. Skipping...");
      return;
    }

    const moduleCount = this.modules.size;
    console.log(`🚀 Auto-loading ${moduleCount} modules...`);

    if (moduleCount === 0) {
      console.warn("⚠️  No modules registered. Make sure modules are imported before calling applyAll()");
      return;
    }

    // Aplicar cada módulo a Express
    let successCount = 0;
    this.modules.forEach((module, name) => {
      try {
        app.use(module.path, module.router);
        console.log(`✅ ${name} → ${module.path}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to load module ${name}:`, error);
      }
    });

    this.isInitialized = true;
    console.log(`🎉 Successfully loaded ${successCount}/${moduleCount} modules`);
  }

  /**
   * Obtener todos los módulos registrados
   */
  static getModules(): ModuleInfo[] {
    return Array.from(this.modules.values());
  }

  /**
   * Obtener endpoints dinámicamente (para documentación automática)
   */
  static getEndpoints(): Record<string, string> {
    const endpoints: Record<string, string> = {};
    
    this.modules.forEach((module, name) => {
      // Usar nombre más amigable para el endpoint
      const endpointName = name.replace('Module', '').toLowerCase();
      endpoints[endpointName] = module.path;
    });

    return endpoints;
  }

  /**
   * Obtener información detallada de módulos (para debugging)
   */
  static getDetailedInfo(): Array<{
    name: string;
    path: string;
    version: string;
    description: string;
    info: any;
  }> {
    return Array.from(this.modules.values()).map(module => ({
      name: module.name,
      path: module.path,
      version: module.version || "1.0.0",
      description: module.description || "No description provided",
      info: module.info || {}
    }));
  }

  /**
   * Estadísticas del registro (para health checks)
   */
  static getStats(): {
    totalModules: number;
    isInitialized: boolean;
    endpoints: string[];
    registrationOrder: string[];
    moduleNames: string[];
  } {
    const moduleArray = Array.from(this.modules.values());
    
    return {
      totalModules: this.modules.size,
      isInitialized: this.isInitialized,
      endpoints: moduleArray.map(m => m.path),
      registrationOrder: Array.from(this.modules.keys()),
      moduleNames: moduleArray.map(m => m.name)
    };
  }

  /**
   * Buscar un módulo específico por nombre
   */
  static findModule(name: string): ModuleInfo | undefined {
    return this.modules.get(name);
  }

  /**
   * Verificar si un módulo está registrado
   */
  static isModuleRegistered(name: string): boolean {
    return this.modules.has(name);
  }

  /**
   * Obtener información resumida para logs
   */
  static getSummary(): string {
    const stats = this.getStats();
    return `Registry: ${stats.totalModules} modules, ${stats.isInitialized ? 'initialized' : 'pending'}, paths: [${stats.endpoints.join(', ')}]`;
  }

  /**
   * Resetear registry (útil para testing)
   */
  static reset(): void {
    console.log("🔄 Resetting SimpleRegistry...");
    this.modules.clear();
    this.isInitialized = false;
  }

  /**
   * Validar que todos los módulos tengan configuración válida
   */
  static validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const paths = new Set<string>();

    this.modules.forEach((module, name) => {
      // Validar nombre
      if (!module.name || module.name.trim() === '') {
        errors.push(`Module ${name} has invalid name`);
      }

      // Validar path
      if (!module.path || module.path.trim() === '') {
        errors.push(`Module ${name} has invalid path`);
      } else if (paths.has(module.path)) {
        errors.push(`Duplicate path ${module.path} found in module ${name}`);
      } else {
        paths.add(module.path);
      }

      // Validar router
      if (!module.router) {
        errors.push(`Module ${name} has no router`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default SimpleRegistry;