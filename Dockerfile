FROM node:14.21-buster-slim as build-app
RUN apt-get update && apt-get install -y git && apt-get install -y python3 && apt-get install -y make
WORKDIR /app
EXPOSE 8545
COPY package.json hardhat.config.js ./
RUN yarn

CMD ["yarn", "hardhat", "node"]