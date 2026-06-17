FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN npm install

COPY . .

RUN npx prisma generate --schema=server/prisma/schema.prisma && \
    npm run build

EXPOSE 3001

CMD ["npm", "start"]
