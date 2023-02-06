const express = require('express');
const { authRouter } = require('../routers/auth_router');
const { userRouter } = require('../routers/user_router');
const submissionRouter = require('../routers/submission_router');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/user', userRouter);
rootRouter.use('/submission', submissionRouter);

module.exports = {
  rootRouter,
};
