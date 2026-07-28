FROM node:22-alpine AS builder
WORKDIR /backend
COPY package*.json ./
RUN  npm ci
COPY . .
RUN npm run build

FROM node:22-alpine 
WORKDIR /backend
COPY --from=builder /backend/dist ./dist
COPY --from=builder /backend/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["node","dist/src/main.js"]