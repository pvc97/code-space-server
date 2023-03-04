const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const {
  createUser,
  deleteUser,
  getUserInfo,
  getAllUsers,
} = require('../controllers/user_controller');
const { Role } = require('../models');

const userRouter = express.Router();

userRouter.get('/:id', authenticate, getUserInfo);

userRouter.get('/', authenticate, authorize([Role.Manager]), getAllUsers);

userRouter.post('/', authenticate, authorize([Role.Manager]), createUser);

userRouter.delete('/:id', authenticate, authorize([Role.Manager]), deleteUser);

module.exports = {
  userRouter,
};
