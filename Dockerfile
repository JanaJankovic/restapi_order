FROM node:19.0-alpine

RUN npm install -g @nestjs/cli

WORKDIR /nest-app

COPY package.json .

RUN npm install

COPY . .

CMD nest start

EXPOSE 3000