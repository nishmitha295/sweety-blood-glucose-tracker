FROM node:20-alpine

WORKDIR /app/server

COPY package*.json ./
COPY server/package*.json ./server/

WORKDIR /app
COPY package.json ./

WORKDIR /app/server

RUN npm install --omit=dev

COPY server/ ./

EXPOSE 5000

CMD ["node", "src/index.js"]