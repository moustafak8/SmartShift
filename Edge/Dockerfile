FROM node:20-alpine AS frontend-build
WORKDIR /client

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY Client/package.json Client/package-lock.json ./
RUN npm ci

COPY Client/ ./
RUN npm run build

FROM nginx:stable-alpine

COPY Edge/nginx.conf /etc/nginx/conf.d/default.conf
COPY Server/nginx/conf.d/backend.conf /etc/nginx/snippets/backend.conf

COPY --from=frontend-build /client/dist /usr/share/nginx/html
COPY Server/public /var/www/public

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

