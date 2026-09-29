# Build the React app, then serve it with nginx. /api is proxied to the FastAPI container.
FROM node:22-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY shared /app/shared
COPY frontend /app/frontend
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
# nginx runs as its own user: make every file readable, whatever permissions it had on the host.
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
