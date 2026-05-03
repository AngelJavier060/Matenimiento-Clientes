# ===== ETAPA 1: Compilación =====
FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias
COPY frontend/package.json frontend/package-lock.json* ./

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY frontend/ ./

# Compilar Angular para producción
RUN npm run build -- --configuration production

# ===== ETAPA 2: Servir con nginx =====
FROM nginx:1.25-alpine AS runtime

# Copiar configuración personalizada de nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados
COPY --from=build /app/dist/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
