# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Force SPA build (NO SSR)
RUN npm run build -- --configuration production

# Runtime stage
FROM nginx:alpine

# Angular SPA routing fix
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY browser output
COPY --from=build /app/dist/synapse-ui/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
