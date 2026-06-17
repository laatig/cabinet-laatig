FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

RUN npm install

COPY server/prisma ./server/prisma
RUN npx prisma generate --schema=server/prisma/schema.prisma

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/uploads ./server/uploads
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/node_modules ./server/node_modules

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "start"]
