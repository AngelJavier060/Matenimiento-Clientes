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

RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build /app/target/*.jar app.jar

USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
