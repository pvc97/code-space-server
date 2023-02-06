const express = require('express');
const createSubmission = require('../controllers/submission_controller');
const { authenticate } = require('../middlewares/auth/authenticate');

const submissionRouter = express.Router();

submissionRouter.post(
  '/',
  // authenticate,
  createSubmission
);

module.exports = submissionRouter;
