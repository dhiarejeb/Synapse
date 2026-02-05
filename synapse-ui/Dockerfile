# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install deps
RUN npm ci

# Copy the rest of the app
COPY . .

# Build Angular app
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Copy Angular dist output
COPY --from=build /app/dist/synapse-ui /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
