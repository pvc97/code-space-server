const express = require('express');
const {
  createSubmission,
  submissionCallback,
  getSubmissionDetail,
} = require('../controllers/submission_controller');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const { Role } = require('../models');

const submissionRouter = express.Router();

submissionRouter.post(
  '/',
  authenticate,
  authorize([Role.Student, Role.Teacher]),
  createSubmission
);
submissionRouter.get(
  '/:id',
  authenticate,
  authorize([Role.Student, Role.Teacher]),
  getSubmissionDetail
);
submissionRouter.put('/callback', submissionCallback);

module.exports = submissionRouter;
