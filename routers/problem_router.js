const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const {
  history,
  getProblem,
  createProblem,
  deleteProblem,
  updateProblem,
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

problemRouter.delete(
  '/:id',
  authenticate,
  authorize([Role.Teacher]),
  deleteProblem
);

// Update problem
problemRouter.put(
  '/:id',
  authenticate,
  authorize([Role.Teacher]),
  uploadPdf,
  updateProblem
);

// Get problem history
problemRouter.get('/:id/history', authenticate, history);

module.exports = problemRouter;
