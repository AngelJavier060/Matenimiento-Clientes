# Docker - Vehicle Maintenance

## Estructura

```
docker/
├── backend.Dockerfile    # Build del backend Spring Boot
├── frontend.Dockerfile   # Build del frontend Angular
├── nginx.conf            # Configuración de nginx (proxy reverso)
└── README.md             # Este archivo

.dockerignore             # Archivos excluidos del build Docker
docker-compose.yml        # Orquestación de servicios
```

## Servicios

| Servicio   | Puerto | Descripción                     |
|------------|--------|---------------------------------|
| postgres   | 5432   | Base de datos PostgreSQL 16     |
| backend    | 8080   | API REST Spring Boot            |
| frontend   | 80     | Frontend Angular (nginx)        |

## Comandos

```bash
# Construir y arrancar todos los servicios
docker compose up -d --build

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (borra datos)
docker compose down -v

# Acceder a la app
# http://localhost (frontend)
# http://localhost:8080/api (backend)
```

## Notas

- `app_mantenimiento/` (Flutter) NO se incluye en Docker
- El frontend en Docker usa nginx con proxy reverso a backend
- Desarrollo local: `ng serve` en puerto 4200 con backend en 8080
