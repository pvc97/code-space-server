const express = require('express');
const { authRouter } = require('../routers/auth_router');
const { userRouter } = require('../routers/user_router');
const submissionRouter = require('../routers/submission_router');
const problemRouter = require('../routers/problem_router');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/user', userRouter);
rootRouter.use('/submission', submissionRouter);
rootRouter.use('/problem', problemRouter);

module.exports = {
  rootRouter,
};
