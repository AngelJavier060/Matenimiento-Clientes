#!/bin/sh
set -e
mkdir -p /app/uploads/avatars /app/uploads/vehicles
# El volumen Docker suele llegar como root; spring no puede escribir sin este ajuste.
chown -R spring:spring /app/uploads || true
exec su-exec spring:spring java -jar /app/app.jar
