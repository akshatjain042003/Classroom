FROM node:22-alpine

WORKDIR /backend

COPY package.json ./

RUN  npm i

COPY . .

EXPOSE 4000

CMD ["npm","run","start:dev"]

