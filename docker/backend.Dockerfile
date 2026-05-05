FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copiar configuración de Maven
COPY backend/pom.xml ./
COPY backend/.mvn .mvn

# Descargar dependencias
RUN apk add --no-cache maven && mvn dependency:go-offline -B

# Copiar código fuente
COPY backend/src src

# Compilar y empaquetar
RUN mvn package -DskipTests -B

# Imagen final slim
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache su-exec \
    && addgroup -S spring && adduser -S spring -G spring

COPY docker/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
