## Build stage
#FROM node:22-alpine AS builder
#
#WORKDIR /app
#
## Copy package files
#COPY package*.json ./
#
## Install dependencies
#RUN npm ci
#
## Copy source code
#COPY . .
#
## Build arguments
#ARG VITE_SERVER_URL=http://localhost:3000
#ARG VITE_LOCALSTACK_ACCESS_KEY_ID=xxxxxxxxx
#ARG VITE_LOCALSTACK_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
#ARG VITE_LOCALSTACK_AWS_REGION=us-east-1
#
## Set environment variables for build
#ENV VITE_SERVER_URL=$VITE_SERVER_URL
#ENV VITE_LOCALSTACK_ACCESS_KEY_ID=$VITE_LOCALSTACK_ACCESS_KEY_ID
#ENV VITE_LOCALSTACK_SECRET_ACCESS_KEY=$VITE_LOCALSTACK_SECRET_ACCESS_KEY
#ENV VITE_LOCALSTACK_AWS_REGION=$VITE_LOCALSTACK_AWS_REGION
#
## Build the application
#RUN npm run build
#
## Production stage with nginx
#FROM nginx:alpine
#
#ARG PORT=80
#EXPOSE ${PORT}
#
## Copy nginx configuration
#COPY config/app/nginx/nginx.conf /etc/nginx/nginx.conf
#COPY config/app/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
#
## Copy custom init scripts
#COPY config/app/nginx/init-scripts/ /docker-entrypoint.d/
#RUN chmod +x /docker-entrypoint.d/*.sh || true
#
## Copy built application
#WORKDIR /usr/share/nginx/html
#COPY --from=builder /app/dist ./
#
## Health check
#HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1
#
## Start nginx
#CMD ["nginx", "-g", "daemon off;"]
#

FROM node:20-alpine as builder

WORKDIR /app

COPY . .

RUN npm install

ARG VITE_SERVER_URL
ENV VITE_SERVER_URL $VITE_SERVER_URL

ARG VITE_LOCALSTACK_ACCESS_KEY_ID
ENV VITE_LOCALSTACK_ACCESS_KEY_ID $VITE_LOCALSTACK_ACCESS_KEY_ID

ARG VITE_LOCALSTACK_SECRET_ACCESS_KEY
ENV VITE_LOCALSTACK_SECRET_ACCESS_KEY $VITE_LOCALSTACK_SECRET_ACCESS_KEY

ARG VITE_LOCALSTACK_AWS_REGION
ENV VITE_LOCALSTACK_AWS_REGION $VITE_LOCALSTACK_AWS_REGION

ARG VITE_LOCALSTACK_AWS_BUCKET
ENV VITE_LOCALSTACK_AWS_BUCKET $VITE_LOCALSTACK_AWS_BUCKET

RUN npm run build

FROM nginx:1.25.4-alpine-slim as prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf  /etc/nginx/conf.d
EXPOSE 4000
CMD ["nginx", "-g", "daemon off;"]