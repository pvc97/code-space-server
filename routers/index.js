const express = require('express');
const { authRouter } = require('../routers/auth_router');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);

module.exports = {
  rootRouter,
};
