const express = require('express');
const submitCode = require('../controllers/submit_code_controller');
const { authenticate } = require('../middlewares/auth/authenticate');

const submitCodeRouter = express.Router();

submitCodeRouter.post(
  '/',
  // authenticate,
  submitCode
);

module.exports = submitCodeRouter;
