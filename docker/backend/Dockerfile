# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /app

# Copy Maven wrapper
COPY synapse/mvnw .
COPY synapse/.mvn .mvn

# Copy pom.xml and source code
COPY synapse/pom.xml .
COPY synapse/src ./src

# Make mvnw executable and build
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jdk-jammy

ARG PROFILE=local
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=${PROFILE}

CMD ["java","-jar","app.jar"]
