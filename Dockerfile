FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

RUN npm install

COPY server/prisma ./server/prisma

RUN cd server && ./node_modules/.bin/prisma generate

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

RUN cd server && ./node_modules/.bin/prisma generate

CMD cd server && ./node_modules/.bin/prisma db push --accept-data-loss && ./node_modules/.bin/prisma db seed && cd .. && npm start
