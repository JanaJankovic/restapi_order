FROM node

RUN npm install -g @nestjs/cli

WORKDIR /nest-app

COPY package.json .

RUN npm install

COPY . .

CMD ["npm", "run", "start"]

EXPOSE 3000