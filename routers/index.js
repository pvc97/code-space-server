const express = require('express');
const { authRouter } = require('../routers/auth_router');
const { userRouter } = require('../routers/user_router');
const submissionRouter = require('../routers/submission_router');
const problemRouter = require('../routers/problem_router');

const rootRouter = express.Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/users', userRouter);
rootRouter.use('/submissions', submissionRouter);
rootRouter.use('/problems', problemRouter);

module.exports = {
  rootRouter,
};
