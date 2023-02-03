const express = require('express');
const { authRouter } = require('../routers/auth_router');
const { userRouter } = require('../routers/user_router');
const submitCodeRouter = require('../routers/submit_code_router');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/user', userRouter);
rootRouter.use('/submit-code', submitCodeRouter);

module.exports = {
  rootRouter,
};
