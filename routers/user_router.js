const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const { getUserInfo } = require('../controllers/user_controller');
const { Role } = require('../models');

const userRouter = express.Router();

userRouter.get(
  '/user-info',
  authenticate,
  // authorize([Role.Student]),
  getUserInfo
);

module.exports = {
  userRouter,
};
