const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const {
  createProblem,
  getProblem,
} = require('../controllers/problem_controller');
const { Role } = require('../models');
const uploadPdf = require('../middlewares/upload/upload_pdf');

const problemRouter = express.Router();

problemRouter.post(
  '/',
  authenticate,
  authorize([Role.Teacher]),
  uploadPdf,
  createProblem
);

problemRouter.get('/:id', authenticate, getProblem);

module.exports = problemRouter;
