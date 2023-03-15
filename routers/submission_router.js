const express = require('express');
const {
  createSubmission,
  submissionCallback,
  getSubmissionDetail,
} = require('../controllers/submission_controller');
const { authenticate } = require('../middlewares/auth/authenticate');

const submissionRouter = express.Router();

submissionRouter.post('/', authenticate, createSubmission);
submissionRouter.get('/:id', authenticate, getSubmissionDetail);
submissionRouter.put('/callback', submissionCallback);

module.exports = submissionRouter;
