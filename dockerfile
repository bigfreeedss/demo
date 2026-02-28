# Use an official Java runtime
FROM openjdk:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Build the project (Gradle example)
RUN mvn clean package --no-daemon

# Run the jar
CMD ["java", "-jar", "target/demo-1.0.jar"]