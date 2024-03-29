const express = require('express');
const { authenticate } = require('../middlewares/auth/authenticate');
const { authorize } = require('../middlewares/auth/authorize');
const { Role } = require('../models');

const {
  getRanking,
  joinCourse,
  leaveCourse,
  deleteCourse,
  createCourse,
  updateCourse,
  getAllCourses,
  getCourseDetail,
  getProblemsCourse,
} = require('../controllers/course_controller');

const courseRouter = express.Router();

courseRouter.get('/:id/problems', authenticate, getProblemsCourse);

courseRouter.get('/:id', authenticate, getCourseDetail);

courseRouter.delete('/:id', authenticate, deleteCourse);

courseRouter.get('/', authenticate, getAllCourses);

courseRouter.post('/', authenticate, authorize([Role.Manager]), createCourse);

courseRouter.put('/:id', authenticate, authorize([Role.Manager]), updateCourse);

courseRouter.post(
  '/:id/join',
  authenticate,
  authorize([Role.Student]),
  joinCourse
);

courseRouter.delete(
  '/:id/leave',
  authenticate,
  authorize([Role.Student]),
  leaveCourse
);

courseRouter.get('/:id/ranking', authenticate, getRanking);

module.exports = courseRouter;
