const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const {
  getUserInfo,
  getAllTeachers,
} = require('../controllers/user_controller');
const { Role } = require('../models');

const userRouter = express.Router();

userRouter.get('/user-info', authenticate, getUserInfo);

userRouter.get(
  '/teachers',
  authenticate,
  authorize([Role.Manager]),
  getAllTeachers
);

module.exports = {
  userRouter,
};
