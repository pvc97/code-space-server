const express = require('express');

const { authenticate } = require('../middlewares/auth/authenticate');

const {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
} = require('../controllers/auth_controller');

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', authenticate, logout);
authRouter.post('/logout-all', authenticate, logoutAll);
authRouter.post('/refresh-token', refreshToken);

module.exports = {
  authRouter,
};
