const express = require('express');

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
authRouter.post('/logout', logout);
authRouter.post('/logout-all', logoutAll);
authRouter.post('/refresh-token', refreshToken);

module.exports = {
  authRouter,
};
