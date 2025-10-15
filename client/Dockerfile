FROM node:22.11.0 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ENV $(cat .env-temp | xargs)

ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

ARG VITE_LOCALSTACK_ACCESS_KEY_ID
ENV VITE_LOCALSTACK_ACCESS_KEY_ID=${VITE_LOCALSTACK_ACCESS_KEY_ID}

ARG VITE_LOCALSTACK_SECRET_ACCESS_KEY
ENV VITE_LOCALSTACK_SECRET_ACCESS_KEY=${VITE_LOCALSTACK_SECRET_ACCESS_KEY}

ARG VITE_LOCALSTACK_AWS_REGION
ENV VITE_LOCALSTACK_AWS_REGION=${VITE_LOCALSTACK_AWS_REGION}

RUN npm run build

FROM nginx:alpine

ARG PORT=80

EXPOSE ${PORT}

COPY config/app/nginx/nginx.conf /etc/nginx/nginx.conf
COPY config/app/nginx/conf.d/ /etc/nginx/conf.d/
COPY config/app/entrypoint.sh /entrypoint.sh
COPY config/app/nginx/init-scripts/ /docker-entrypoint.d/

RUN chmod +x /entrypoint.sh /docker-entrypoint.d/*.sh

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/dist ./