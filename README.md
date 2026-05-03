# 🚗 Vehicle Maintenance System

Sistema de gestión de mantenimiento vehicular con Spring Boot + PostgreSQL.

## 📋 Estructura del Proyecto

```
vehicle-maintenance/
├── backend/               # API REST (Spring Boot + Java 21)
├── frontend/              # Interfaz web (TBD)
├── app_mantenimiento/     # App móvil Flutter (TBD)
└── docker-compose.yml     # Infraestructura
```

## 🚀 Inicio Rápido

### Prerrequisitos
- **Java 21** (JDK)
- **Maven 3.9+**
- **Docker Desktop** (para PostgreSQL)

### 1. Levantar Base de Datos
```bash
docker compose up -d postgres
```

### 2. Ejecutar Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Acceder a la API
- **API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Docs**: http://localhost:8080/api-docs

## 📚 API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Inicio de sesión (JWT) |
| POST | `/api/auth/refresh` | Refrescar token |

### Vehículos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/vehicles` | Listar vehículos |
| POST | `/api/vehicles` | Registrar vehículo |
| GET | `/api/vehicles/{id}` | Detalle del vehículo |
| PUT | `/api/vehicles/{id}` | Actualizar vehículo |
| DELETE | `/api/vehicles/{id}` | Eliminar vehículo |

### Mantenimiento
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/maintenance/vehicle/{id}` | Mantenimientos por vehículo |
| POST | `/api/maintenance` | Registrar servicio |
| GET | `/api/maintenance/{id}` | Detalle del servicio |
| PUT | `/api/maintenance/{id}` | Actualizar servicio |
| DELETE | `/api/maintenance/{id}` | Eliminar servicio |

### Recordatorios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reminders` | Listar recordatorios |
| GET | `/api/reminders/due` | Recordatorios vencidos |
| POST | `/api/reminders` | Crear recordatorio |
| PUT | `/api/reminders/{id}` | Actualizar |
| DELETE | `/api/reminders/{id}` | Eliminar |
| PATCH | `/api/reminders/{id}/toggle` | Activar/Desactivar |

## 🗄️ Base de Datos

### Tablas Principales
1. **users** - Usuarios del sistema
2. **vehicles** - Vehículos registrados
3. **maintenance** - Servicios de mantenimiento
4. **reminders** - Recordatorios

## 🏗️ Stack Tecnológico

- **Backend**: Spring Boot 3.3.5 + Java 21
- **Base de Datos**: PostgreSQL 16
- **Seguridad**: JWT + Spring Security
- **Migraciones**: Flyway
- **Documentación**: SpringDoc OpenAPI (Swagger)
- **Containerización**: Docker + Docker Compose
