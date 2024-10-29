FROM node:20.12.0 AS build-stage

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm config set registry https://registry.npmmirror.com/

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN pnpm build-only

FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY docker/nginx.conf /etc/nginx/sites-available/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
