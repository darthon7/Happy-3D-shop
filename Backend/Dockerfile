# Etapa 1: Compilación con Maven
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copia primero el pom.xml y descarga las dependencias (mejora la caché de Docker)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia el código fuente y compila empaquetando el .jar sin ejecutar los tests para hacerlo más rápido
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen de ejecución (ligera)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Añade un usuario no-root por seguridad
RUN addgroup --system spring && adduser --system --ingroup spring spring
USER spring:spring

# Copia el archivo .jar generado en la Etapa 1
COPY --from=build /app/target/DazeHaze-0.0.1-SNAPSHOT.jar app.jar

# Expone el puerto de Spring Boot
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
