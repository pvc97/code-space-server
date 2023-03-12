const { Op, where } = require('sequelize');
const translate = require('../utils/translate');
const {
  Course,
  Problem,
  Role,
  StudentCourse,
  User,
  sequelize,
} = require('../models');
const { QueryTypes } = require('sequelize');

const { DEFAULT_LIMIT, DEFAULT_PAGE } = require('../constants/constants');

// All user logged in can get course detail
const getCourseDetail = async (req, res) => {
  try {
    const courseId = req.params.id;
    const role = req.user.roleType;

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }

    // Student can't get accessCode
    const attributes = ['id', 'name', 'code'];
    if (role === Role.Manager || role === Role.Teacher) {
      attributes.push('accessCode');
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
      attributes: attributes,
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
      attributes: ['id', 'name', 'pointPerTestCase'],
      order: [['createdAt', 'ASC']], // Order by created date from oldest to newest (ASC)
    });

    // TODO: Get all problem with completed fields with one query
    // Only calculate completed field if user is student
    for (const problem of problems) {
      if (role === Role.Student) {
        const problemId = problem.id;
        const maxPointOfUser = await sequelize.query(
          `SELECT COALESCE(MAX(submissions.totalPoint), 0) as maxPoint 
        FROM code_space_db.submissions
        WHERE submissions.problemId = "${problemId}" AND submissions.createdBy = "${userId}"`,
          {
            type: QueryTypes.SELECT,
          }
        );
        const maxUserPoint = maxPointOfUser[0]['maxPoint'];

        const numberOfTestcases = await sequelize.query(
          `SELECT COUNT(*) as numberOfTestcases
        FROM code_space_db.testcases 
        WHERE testcases.problemId = "${problemId}"`,
          {
            type: QueryTypes.SELECT,
          }
        );
        const testCaseCount = numberOfTestcases[0]['numberOfTestcases'];
        // problem.dataValues.maxUserPoint = maxUserPoint;
        // problem.dataValues.testCaseCount = testCaseCount;

        problem.dataValues.completed =
          maxUserPoint !== 0 &&
          maxUserPoint === testCaseCount * problem.pointPerTestCase;
      } else {
        // If user is not student => set completed field to false
        problem.dataValues.completed = false;
      }

      delete problem.dataValues.pointPerTestCase;
    }

    return res.status(200).send({ data: problems });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

/// Delete course will delete all problems of this course
/// I think deleting problem will not delete its testcases
/// Because testcases can't access directly without problem
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

    // find all problems of this course
    const problems = await Problem.findAll({
      where: {
        courseId: id,
        active: true,
      },
    });

    // delete all problems of this course
    const problemIds = problems.map((problem) => problem.id);

    await Problem.update(
      { active: false },
      {
        where: {
          id: {
            [Op.in]: problemIds,
          },
        },
      }
    );

    // delete course
    await course.update({ active: false });

    return res.status(200).send({ data: translate('delete_success', req.hl) });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Filter my courses:
// 1. If user is teacher => get all courses of this teacher
// 2. If user is student => get all courses of this student
// 3. If user is manager => get all courses
const getAllCourses = async (req, res) => {
  try {
    const limit = req.query.limit * 1 || DEFAULT_LIMIT;
    // if req.query.limit is text => req.query.limit * 1 = NaN => limit = DEFAULT_LIMIT
    const page = req.query.page * 1 || DEFAULT_PAGE;
    const offset = (page - 1) * limit;
    const q = req.query.q;
    const role = req.user.roleType;
    const userId = req.user.id;
    const me = req.query.me === 'true';

    const whereCondition = {};
    whereCondition.active = true;

    if (me) {
      if (role === Role.Teacher) {
        whereCondition.teacherId = userId;
      } else if (role === Role.Student) {
        // TODO: Refactor this when remove StudentCourse table and use many-to-many relationship
        // Because this is not efficient, but It's ok for now
        const studentCourses = await StudentCourse.findAll({
          where: {
            studentId: userId,
          },
        });

        const courseIds = studentCourses.map((item) => item.courseId);

        whereCondition.id = {
          [Op.in]: courseIds,
        };
      }
    }

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
    const { name, code, accessCode, teacherId } = req.body;

    const course = await Course.findOne({
      where: { id: courseId, active: true },
      attributes: ['id', 'name', 'code', 'teacherId'],
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

    if (teacherId) {
      const user = await User.findOne({
        where: { id: teacherId, active: true },
      });
      if (!user || user.roleType !== Role.Teacher) {
        return res
          .status(400)
          .send({ error: translate('invalid_teacher_id', req.hl) });
      }
      course.teacherId = teacherId;
    }

    await course.save();

    const updatedCourse = await course.reload({
      include: [
        {
          model: User,
          as: 'teacher',
          where: { active: true },
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Right here I can remove some attributes of course object like accessCode, updatedAt
    // Because I've reassign them to course object, but for now I'll keep it as it is

    res.status(200).json({
      data: {
        id: updatedCourse.id,
        name: updatedCourse.name,
        code: updatedCourse.code,
        teacher: updatedCourse.teacher,
      },
    });
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

// Only student can join course (already checked in authorize middleware)
// Check if student already joined course
// Check if access code is correct
// Create new student course
const joinCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.roleType;
    const { accessCode } = req.body;
    const courseId = req.params.id;

    // Check required fields
    if (!accessCode) {
      return res
        .status(400)
        .send({ error: translate('required_access_code', req.hl) });
    }

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }
    //================================================================================================

    const studentCourse = await StudentCourse.findOne({
      where: {
        courseId: courseId,
        studentId: userId,
      },
    });

    if (studentCourse) {
      return res
        .status(400)
        .send({ error: translate('already_joined_course', req.hl) });
    }

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

    if (course.accessCode !== accessCode) {
      return res
        .status(400)
        .send({ error: translate('invalid_access_code', req.hl) });
    }

    const newStudentCourse = await StudentCourse.create({
      courseId: courseId,
      studentId: userId,
    });

    return res.status(201).send({ data: newStudentCourse });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const leaveCourse = async (req, res) => {
  try {
    // const role = req.user.roleType;
    // Don't need role because in authorize middleware already checked,
    // and StudentCourse table only have studentId
    const userId = req.user.id;
    const courseId = req.params.id;

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }
    //================================================================================================

    await StudentCourse.destroy({
      where: {
        courseId: courseId,
        studentId: userId,
      },
    });

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Step 1: Find all problems of this course
// Use for loop to find all submissions of each problem
// With list of submissions, find the highest score for each user
const getRanking = async (req, res) => {
  try {
    const courseId = req.params.id;

    const limit = req.query.limit * 1 || DEFAULT_LIMIT;
    // if req.query.limit is text => req.query.limit * 1 = NaN => limit = DEFAULT_LIMIT
    const page = req.query.page * 1 || DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }

    // https://sequelize.org/docs/v6/core-concepts/raw-queries/
    // Refer from: https://stackoverflow.com/questions/6553531/mysql-get-sum-grouped-max-of-group
    // TODO: Recheck this query
    const ranking = await sequelize.query(
      `
      SELECT bests.name, CAST(COALESCE(SUM(best), 0) AS UNSIGNED) as totalPoint
      FROM 
      (SELECT users.name, COALESCE(MAX(submissions.totalPoint), 0) as best
      FROM users
      INNER JOIN studentcourses
      ON users.id = studentcourses.studentId AND users.active = true AND studentcourses.courseId = "${courseId}"
      LEFT JOIN problems
      ON studentcourses.courseId = problems.courseId AND problems.active = true
      LEFT JOIN submissions
      ON submissions.createdBy = users.id AND submissions.problemId = problems.id
      GROUP BY users.id, problems.id) as bests
      GROUP BY name
      ORDER BY totalPoint DESC
      LIMIT ${limit} OFFSET ${offset}`,
      {
        type: QueryTypes.SELECT,
      }
    );

    return res.status(200).json({ data: ranking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  getRanking,
  joinCourse,
  leaveCourse,
  deleteCourse,
  createCourse,
  updateCourse,
  getAllCourses,
  getCourseDetail,
  getProblemsCourse,
};
