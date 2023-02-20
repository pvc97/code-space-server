const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const {
  getAllCourses,
  deleteCourse,
  getCourseDetail,
  getProblemsCourse,
} = require('../controllers/course_controller');

const courseRouter = express.Router();

courseRouter.get('/:id/problems', authenticate, getProblemsCourse);

courseRouter.get('/:id', authenticate, getCourseDetail);

courseRouter.delete('/:id', authenticate, deleteCourse);

courseRouter.get('/', authenticate, getAllCourses);

module.exports = courseRouter;
