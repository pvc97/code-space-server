const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const {
  createUser,
  deleteUser,
  updateUser,
  getUserInfo,
  getAllUsers,
  resetPassword,
  changePassword,
} = require('../controllers/user_controller');
const { Role } = require('../models');

const userRouter = express.Router();

userRouter.get('/:id', authenticate, getUserInfo);

userRouter.get('/', authenticate, authorize([Role.Manager]), getAllUsers);

userRouter.post('/', authenticate, authorize([Role.Manager]), createUser);

userRouter.delete('/:id', authenticate, authorize([Role.Manager]), deleteUser);

userRouter.put('/:id', authenticate, updateUser);

userRouter.post('/change-password', authenticate, changePassword);

userRouter.post(
  '/reset-password',
  authenticate,
  authorize([Role.Manager]),
  resetPassword
);

module.exports = {
  userRouter,
};
