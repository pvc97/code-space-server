FROM node:18-alpine

ENV PORT=3000
ENV NODE_ENV=production
ENV ACCESS_TOKEN_SECRET=dbc9be189c6113b8e62c72614da4bd64e07b8e59aacab0b06fced291b5e06cc7754b54df7838af031cadb11d40b43f82098432a65863654bc6d241fb11a173eb
ENV REFRESH_TOKEN_SECRET=e736e9a2536882fc7e9fe2372863e87430baf80cb4eda38108a776ff1d11427f600610fe0af8f0bd27f93c9cec985aa39bb4b0bdb595fb034141548ecfd7ab28
ENV JUDGE0_BASE_URL=http://host.docker.internal:2358
ENV NODEJS_LOCALHOST=http://host.docker.internal:3000

WORKDIR /codespace/backend

COPY package*.json yarn.lock ./

RUN yarn install

RUN yarn global add sequelize-cli

COPY . .

CMD [ "yarn", "start" ]

# docker build --tag node-docker .
# docker run -p 3000:3000 -d node-docker