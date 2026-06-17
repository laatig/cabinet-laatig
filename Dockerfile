FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

RUN npm install

COPY server/prisma ./server/prisma
COPY server/package-lock.json ./server/package-lock.json

RUN cd server && npx --package prisma@6.5.0 -- prisma generate

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
