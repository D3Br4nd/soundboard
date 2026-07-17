FROM node:24-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY seed ./seed

ENV DATA_DIR=/data
VOLUME /data

EXPOSE 3000
CMD ["node", "server.js"]
