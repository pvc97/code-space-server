const { Op } = require('sequelize');
const translate = require('../utils/translate');
const { Course, Problem, Role, StudentCourse } = require('../models');
const { DEFAULT_LIMIT, DEFAULT_OFFSET } = require('../constants/constants');

const getCourseDetail = async (req, res) => {
  return res.status(200).send({ message: 'OK' });
};

/**
 * Get all problems of a course
 * User can get all problems of a course if:
 * 1. User is teacher of this course
 * 2. User is student of this course
 * 3. User is manager
 * */
const getProblemsCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const role = req.user.roleType;
    const userId = req.user.id;
    const limit = req.query.limit * 1 || DEFAULT_LIMIT;
    // if req.query.limit is text => req.query.limit * 1 = NaN => limit = DEFAULT_LIMIT
    const offset = req.query.offset * 1 || DEFAULT_OFFSET;
    const q = req.query.q;

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }

    // Check if course exists
    const course = await Course.findOne({
      where: {
        id: courseId,
        active: true,
      },
    });

    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
    }

    let accessible = false;

    if (role === Role.Manager) {
      accessible = true;
    }

    if (accessible === false && role === Role.Teacher) {
      // Check if teacher is teacher of this course
      const course = await Course.findOne({
        where: {
          id: courseId,
          createdBy: userId,
          active: true,
        },
      });

      if (course) {
        accessible = true;
      }
    }

    if (accessible === false && role === Role.Student) {
      // Check if student is in this course
      // TODO: ReCheck condition
      const studentCourse = await StudentCourse.findOne({
        where: {
          courseId: courseId,
          studentId: userId,
        },
      });

      if (studentCourse) {
        accessible = true;
      }
    }

    if (accessible === false) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    const whereCondition = {};
    whereCondition.courseId = courseId;
    whereCondition.active = true;

    if (q) {
      whereCondition.name = {
        [Op.like]: `%${q}%`,
      };
    }

    // Find all problems of this course
    const problems = await Problem.findAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      attributes: ['id', 'name'],
      order: [['createdAt', 'ASC']], // Order by created date from oldest to newest (ASC)
    });

    return res.status(200).send({ data: problems });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  getProblemsCourse,
  getCourseDetail,
};