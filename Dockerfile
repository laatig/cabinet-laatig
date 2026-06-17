FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

RUN npm install
RUN cd server && npm install
RUN cd client && npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD cd server && npx prisma db push --accept-data-loss && npm run seed && npm start
