const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const { getAllLanguages } = require('../controllers/language_controller');
const { Role } = require('../models');

const languageRouter = express.Router();

// Only teacher can get all languages
languageRouter.get(
  '/',
  authenticate,
  authorize([Role.Teacher]),
  getAllLanguages
);

module.exports = languageRouter;
