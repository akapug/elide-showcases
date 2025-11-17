# Multi-stage build for Elide Workflow

# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy project files
COPY . .

# Build the application
RUN ./gradlew clean build -x test

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache curl bash

# Copy built application
COPY --from=builder /app/build/libs/*.jar app.jar

# Create data and logs directories
RUN mkdir -p /app/data /app/logs

# Expose port
EXPOSE 5678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5678/health || exit 1

# Set entrypoint
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+UseG1GC", \
  "-XX:+UseStringDeduplication", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", \
  "app.jar"]
