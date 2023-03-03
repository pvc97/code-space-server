const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const {
  createUser,
  getUserInfo,
  getAllTeachers,
} = require('../controllers/user_controller');
const { Role } = require('../models');

const userRouter = express.Router();

userRouter.get('/:id', authenticate, getUserInfo);

userRouter.get(
  '/teachers',
  authenticate,
  authorize([Role.Manager]),
  getAllTeachers
);

userRouter.post('/', authenticate, authorize([Role.Manager]), createUser);

module.exports = {
  userRouter,
};
