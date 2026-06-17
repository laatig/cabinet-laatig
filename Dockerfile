FROM node:20-alpine

WORKDIR /app

# Install ALL dependencies
COPY package.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source and build
COPY . .
RUN cd server && npx prisma generate && npx tsc && cd ../client && npx vite build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD cd server && npx prisma db push --accept-data-loss --skip-generate && npx prisma db seed && node dist/index.js
