const express = require('express');

const {
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
} = require('../controllers/auth_controller');

const { registerRequire } = require('../middlewares/require/register_require');

const authRouter = express.Router();

authRouter.post('/register', registerRequire, register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/logout-all', logoutAll);
authRouter.post('/refresh-token', refreshToken);

module.exports = {
  authRouter,
};
