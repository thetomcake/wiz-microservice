FROM node:12
COPY . /app
WORKDIR /app
RUN npm install
ENTRYPOINT ["node", "index.js"]