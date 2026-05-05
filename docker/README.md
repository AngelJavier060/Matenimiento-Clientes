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
| backend    | interno `8080` | Spring Boot; público al host solo con `publish-ports.yml` u override (servidor). |
| frontend   | interno `80`   | Nginx Angular; igual que arriba. |

Puerto Postgres en tu máquina (opcional):

```bash
docker compose -f docker-compose.yml -f docker-compose.expose-postgres.yml up -d postgres
```

(Host `localhost:5433` → contenedor `5432`. Ajustá usuario/clave como en `docker-compose.yml`.)

## Comandos

```bash
# Construir y arrancar (sin mapear puertos al host — ideal para servidor detrás de NPM)
docker compose up -d --build

# En tu máquina local, si necesitás http://localhost y http://localhost:8080/api
docker compose -f docker-compose.yml -f docker-compose.publish-ports.yml up -d --build
```

Puerto opcional de Postgres al host (DBeaver):

```bash
docker compose -f docker-compose.yml -f docker-compose.expose-postgres.yml up -d postgres
```

Más comandos útiles:

```bash
docker compose logs -f
docker compose down
docker compose down -v  # borra volúmenes (datos BD)
```

Con `docker-compose.publish-ports.yml`: acceso habitual `http://localhost` (frontend) y `http://localhost:8080/api` (API directa).

## Subida de fotos en producción (Nginx Proxy Manager)

Si `/api/upload/vehicle-photo` devuelve **500** o **413**, en el **Proxy Host** de tu dominio abrí **Advanced** y añadí:

```nginx
client_max_body_size 15m;
```

(El contenedor `vehicle_frontend` ya lleva el mismo límite hacia el backend.)

## Notas

- `app_mantenimiento/` (Flutter) NO se incluye en Docker
- El frontend en Docker usa nginx con proxy reverso a backend
- Desarrollo local: `ng serve` en puerto 4200 con backend en 8080
