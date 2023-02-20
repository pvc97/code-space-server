const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const {
  getProblemsCourse,
  getCourseDetail,
  deleteCourse,
} = require('../controllers/course_controller');

const courseRouter = express.Router();

courseRouter.get('/:id/problems', authenticate, getProblemsCourse);

courseRouter.get('/:id', authenticate, getCourseDetail);

courseRouter.delete('/:id', authenticate, deleteCourse);

module.exports = courseRouter;
