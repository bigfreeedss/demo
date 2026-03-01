# Build stage
FROM maven:3.9.3-eclipse-temurin-20 AS build

WORKDIR /app

# Copy project files
COPY pom.xml .
COPY src ./src

# Build the jar, skip tests
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:20-jdk-jammy

WORKDIR /app

# Copy the built jar
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_TOOL_OPTIONS="-Djava.security.egd=file:/dev/./urandom"

# Do not auto-run
# ENTRYPOINT ["java","-jar","app.jar"]