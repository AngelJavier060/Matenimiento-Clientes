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

| Servicio   | Puerto | Descripción                          |
|------------|--------|--------------------------------------|
| postgres   | (interno `5432`) | PostgreSQL 16; sin mapear al host por defecto (evita choque con otros Postgres del servidor). |
| backend    | 8080   | API REST Spring Boot                 |
| frontend   | 80     | Frontend Angular (nginx)             |

Puerto Postgres en tu máquina (opcional):

```bash
docker compose -f docker-compose.yml -f docker-compose.expose-postgres.yml up -d postgres
```

(Host `localhost:5433` → contenedor `5432`. Ajustá usuario/clave como en `docker-compose.yml`.)

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
