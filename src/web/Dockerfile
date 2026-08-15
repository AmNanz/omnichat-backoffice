FROM node:22-alpine AS build
ARG ENVIRONMENT

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:${ENVIRONMENT}

FROM nginx:1.27-alpine
ARG ENVIRONMENT

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/web/browser /usr/share/nginx/html
COPY ./nginx/default-${ENVIRONMENT}.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
