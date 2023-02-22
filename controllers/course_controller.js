const { Op, where } = require('sequelize');
const translate = require('../utils/translate');
const { Course, Problem, Role, StudentCourse, User } = require('../models');
const { DEFAULT_LIMIT, DEFAULT_PAGE } = require('../constants/constants');

// All user logged in can get course detail
const getCourseDetail = async (req, res) => {
  try {
    const courseId = req.params.id;

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }

    // findByPk don't work with with where clause
    // So I have to use findOne
    const course = await Course.findOne({
      where: {
        id: courseId,
        active: true,
      },
      // attributes: {
      //   exclude: [
      //     'createdAt',
      //     'updatedAt',
      //     'createdBy',
      //     'accessCode',
      //     'active',
      //   ],
      // },
      // Use attributes to select columns instead of exclude because exclude so long
      attributes: ['id', 'name', 'code'],
      include: [
        {
          model: User,
          as: 'teacher',
          where: { active: true },
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
    }

    return res.status(200).send({ data: course });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
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
    const page = req.query.page * 1 || DEFAULT_PAGE;
    const offset = (page - 1) * limit;
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
          teacherId: userId,
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

const deleteCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const course = await Course.findOne({
      where: {
        id: id,
        active: true,
      },
    });

    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
    }

    await course.update({ active: false });

    return res.status(200).send({ data: translate('delete_success', req.hl) });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const limit = req.query.limit * 1 || DEFAULT_LIMIT;
    // if req.query.limit is text => req.query.limit * 1 = NaN => limit = DEFAULT_LIMIT
    const page = req.query.page * 1 || DEFAULT_PAGE;
    const offset = (page - 1) * limit;
    const q = req.query.q;

    const whereCondition = {};
    whereCondition.active = true;

    if (q) {
      whereCondition.name = {
        [Op.like]: `%${q}%`,
      };
    }

    // Find all courses
    const courses = await Course.findAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      attributes: ['id', 'name', 'code'],
      include: [
        {
          model: User,
          as: 'teacher',
          where: { active: true },
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'ASC']], // Order by created date from oldest to newest (ASC)
    });

    return res.status(200).send({ data: courses });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const createCourse = async (req, res) => {
  try {
    const { name, code, accessCode, teacherId } = req.body;

    if (!name) {
      return res
        .status(400)
        .send({ error: translate('required_course_name', req.hl) });
    }

    if (!code) {
      return res
        .status(400)
        .send({ error: translate('required_course_code', req.hl) });
    }

    if (!accessCode) {
      return res
        .status(400)
        .send({ error: translate('required_access_code', req.hl) });
    }

    if (!teacherId) {
      return res
        .status(400)
        .send({ error: translate('required_teacher_id', req.hl) });
    }

    // Create new course
    const course = await Course.create({
      name,
      code,
      accessCode,
      teacherId,
    });

    return res.status(201).send({ data: course });
  } catch (error) {
    console.log(error);
    switch (error.name) {
      case 'SequelizeForeignKeyConstraintError':
        return res.status(409).send({
          error: translate('invalid_teacher_id', req.hl),
        });
      case 'SequelizeUniqueConstraintError':
        return res.status(409).send({
          error: translate('duplicate_course_code', req.hl),
        });
    }
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { name, code, accessCode } = req.body;

    const course = await Course.findOne({
      where: { id: courseId, active: true },
    });

    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
    }

    if (name) {
      console.log(`name: ${name}`);
      course.name = name;
    }

    if (code) {
      course.code = code;
    }

    if (accessCode) {
      course.accessCode = accessCode;
    }

    await course.save();

    res.status(200).json({ data: course });
  } catch (error) {
    console.log(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({
        error: translate('duplicate_course_code', req.hl),
      });
    }

    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  deleteCourse,
  createCourse,
  updateCourse,
  getAllCourses,
  getCourseDetail,
  getProblemsCourse,
};
