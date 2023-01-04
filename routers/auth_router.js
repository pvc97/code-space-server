const express = require('express');

const {
  login,
  logout,
  refreshToken,
} = require('../controllers/auth_controller');

const authRouter = express.Router();

authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/refresh-token', refreshToken);

module.exports = {
  authRouter,
};
