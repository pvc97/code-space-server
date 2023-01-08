const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { getUserInfo } = require('../controllers/user_controller');

const userRouter = express.Router();

userRouter.get('/user-info', authenticate, getUserInfo);

module.exports = {
  userRouter,
};
