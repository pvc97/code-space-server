const express = require('express');
const {
  createSubmission,
  getSubmissionDetail,
} = require('../controllers/submission_controller');
const { authenticate } = require('../middlewares/auth/authenticate');

const submissionRouter = express.Router();

submissionRouter.post('/', authenticate, createSubmission);
submissionRouter.get('/:id', authenticate, getSubmissionDetail);

module.exports = submissionRouter;
