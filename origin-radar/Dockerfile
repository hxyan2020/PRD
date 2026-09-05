FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV ORIGIN_RADAR_DB=/data/storefront.sqlite
EXPOSE 3000
VOLUME ["/data"]
CMD ["npm", "start"]
