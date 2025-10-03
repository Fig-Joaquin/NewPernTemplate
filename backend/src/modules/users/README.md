# Users Module

## 📝 Descripción

Módulo completo de gestión de usuarios con arquitectura modular, validaciones robustas y mejores prácticas.

## 🏗️ Estructura

```
users/
├── controllers/          # Controladores HTTP
│   └── user.controller.ts
├── dto/                  # Data Transfer Objects con validaciones Zod
│   └── user.dto.ts
├── entities/             # Entidades de TypeORM
│   └── User.ts
├── repositories/         # Acceso a datos
│   └── user.repository.ts
├── routes/               # Definición de rutas
│   └── user.routes.ts
├── services/             # Lógica de negocio
│   └── user.service.ts
└── users.module.ts       # Configuración del módulo
```

## 🚀 Características

- ✅ **Validaciones completas** con Zod schemas
- ✅ **Hashing de contraseñas** con bcrypt
- ✅ **Soft delete** (eliminación lógica)
- ✅ **Paginación y filtros** avanzados
- ✅ **Type-safe** con TypeScript
- ✅ **Arquitectura limpia** (Repository pattern)
- ✅ **Error handling** robusto
- ✅ **Logging** estructurado
- ✅ **Verificación de email**
- ✅ **Estadísticas de usuarios**

## 📋 Endpoints

### Públicos

- `POST /api/users` - Registro de usuario
- `POST /api/users/login` - Autenticación

### Privados

- `GET /api/users` - Listar usuarios (con filtros)
- `GET /api/users/:id` - Obtener usuario por ID
- `GET /api/users/profile/:id` - Perfil completo
- `GET /api/users/stats` - Estadísticas
- `PUT /api/users/:id` - Actualizar usuario
- `PUT /api/users/:id/password` - Cambiar contraseña
- `PUT /api/users/:id/verify-email` - Verificar email
- `DELETE /api/users/:id` - Eliminar usuario (soft delete)

## 🎯 Ejemplos de uso

### Crear usuario

```bash
POST /api/users
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "phoneNumber": "+1234567890"
}
```

### Listar usuarios con filtros

```bash
GET /api/users?page=1&limit=10&search=john&gender=male&sortBy=createdAt&sortOrder=desc
```

### Actualizar usuario

```bash
PUT /api/users/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "firstName": "Johnny",
  "phoneNumber": "+0987654321"
}
```

## 🔧 Validaciones

### Campos de usuario

- **Email**: Formato válido, único, max 255 caracteres
- **Contraseña**: Min 8 caracteres, debe contener mayúscula, minúscula y número
- **Nombre**: Min 2 caracteres, max 100, solo letras y espacios
- **Teléfono**: Formato internacional válido, opcional
- **Fecha nacimiento**: Edad entre 13-120 años
- **Género**: Enum válido, opcional

### Respuestas estandarizadas

```typescript
// Éxito
{
  "success": true,
  "message": "User created successfully",
  "data": { ... },
  "timestamp": "2025-10-02T19:30:00.000Z"
}

// Error
{
  "success": false,
  "message": "Validation error",
  "errors": [ ... ],
  "timestamp": "2025-10-02T19:30:00.000Z"
}
```

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Validación de entrada con Zod
- Headers de seguridad
- Soft delete para auditoría
- Logging de acciones sensibles

## 🔄 Estados del usuario

- `isActive`: Usuario activo/inactivo
- `isEmailVerified`: Email verificado
- `emailVerifiedAt`: Timestamp de verificación
- `lastLoginAt`: Último acceso

## 📊 Estadísticas disponibles

- Total de usuarios activos
- Usuarios registrados en las últimas 24h
- Usuarios con email verificado
- Distribución por género
- Usuarios por período

## 🧪 Testing

El módulo está preparado para testing con:

- Inyección de dependencias
- Interfaces para mocking
- Separación de capas
- Validaciones unitarias

## 🔍 Logging

Todos los errores y acciones importantes se loguean con:

- Timestamp
- Nivel de error
- Stack trace (desarrollo)
- Información contextual

## 🚨 Manejo de errores

Errores personalizados para:

- Usuario no encontrado (404)
- Email duplicado (409)
- Validación fallida (400)
- Errores de autenticación (401)
- Errores de servidor (500)

---

**Desarrollado con las mejores prácticas de Node.js, TypeScript y PostgreSQL** 🚀
