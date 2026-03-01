# -------- Build Stage --------
FROM maven:3.9.3-eclipse-temurin-20 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

# Build jar and skip tests
RUN mvn clean package -DskipTests

# -------- Runtime Stage --------
FROM eclipse-temurin:20-jdk-jammy

WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render provides PORT environment variable
EXPOSE 8080

# Production profile
ENV SPRING_PROFILES_ACTIVE=prod

# Start application
CMD ["java", "-jar", "app.jar"]