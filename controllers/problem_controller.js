'use strict';

const translate = require('../utils/translate');
const { DEFAULT_LIMIT, DEFAULT_PAGE } = require('../constants/constants');
const {
  User,
  Language,
  Course,
  Problem,
  TestCase,
  Role,
  Submission,
  SubmissionResult,
  sequelize,
} = require('../models');
const sendNotification = require('../services/notification_service');
const fs = require('fs');

const createProblem = async (req, res) => {
  try {
    // console.log(req);
    // Only teacher of current course can create problem,
    // Use authorization middleware to check if user is teacher
    const courseId = req.body.courseId;
    const name = req.body.name;
    const testCases = JSON.parse(req.body.testCases);
    const languageId = req.body.languageId;
    const pointPerTestCase = req.body.pointPerTestCase;
    const file = req.file;
    const multerError = req.multerError;
    const teacherId = req.user.id;

    if (multerError) {
      return res.status(400).send({ error: translate(multerError, req.hl) });
    }

    if (!file) {
      return res
        .status(400)
        .send({ error: translate('required_pdf_file', req.hl) });
    }

    if (!pointPerTestCase) {
      return res
        .status(400)
        .send({ error: translate('required_point_per_test_case', req.hl) });
    }

    const pdfPath = file.path.replace(/\\/g, '/');

    if (!courseId) {
      return res
        .status(400)
        .send({ error: translate('required_course_id', req.hl) });
    }

    if (!name) {
      return res
        .status(400)
        .send({ error: translate('required_problem_name', req.hl) });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
    }

    // Check if teacher is teacher of current course
    if (course.teacherId !== teacherId) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    // Khi update thì có trường hợp là thêm test case mới
    // sửa test case cũ và xóa test case cũ
    // Khi test case thay đổi thì phải chấm lại toàn bộ bài làm ứng với test case đó
    // KHÓ ĐÓ
    // TODO: Handle test case update
    if (!testCases || testCases.length === 0) {
      return res
        .status(400)
        .send({ error: translate('requires_at_least_one_test_case', req.hl) });
    }

    if (!languageId) {
      return res
        .status(400)
        .send({ error: translate('required_language_id', req.hl) });
    }

    // Check if language exists
    const language = await Language.findByPk(languageId);
    if (!language) {
      return res
        .status(400)
        .send({ error: translate('invalid_language_id', req.hl) });
    }

    // Create problem with test cases
    const problem = await sequelize.transaction(async (transaction) => {
      const problemResult = await Problem.create(
        {
          name,
          pdfPath,
          pointPerTestCase,
          courseId,
          languageId,
        },
        { transaction }
      );

      const testCasesResult = testCases.map((testCase) => ({
        ...testCase,
        problemId: problemResult.id,
      }));

      await TestCase.bulkCreate(testCasesResult, { transaction });
      return problemResult;
    });

    return res
      .status(201)
      .send({ data: { id: problem.id, name: problem.name, completed: false } });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const getProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.roleType;

    const include = [];
    include.push({
      model: Language,
      as: 'language',
    });

    // All user can get problem, but only teacher can get test cases
    if (role === Role.Teacher) {
      include.push({
        model: TestCase,
        as: 'testCases',
        required: false, // If problem don't have test case, it still return problem
        where: { active: true },
        attributes: ['stdin', 'expectedOutput', 'show'],
      });
    }
    // findByPk don't work with with where clause
    // So I have to use findOne
    const problem = await Problem.findOne({
      where: {
        id: id,
        active: true,
      },
      include: include,
    });

    if (!problem) {
      return res
        .status(400)
        .send({ error: translate('invalid_problem_id', req.hl) });
    }

    // Get numbers of test cases of problem
    const numberOfTestCases = await TestCase.count({
      where: {
        problemId: problem.id,
        active: true,
      },
    });

    problem.dataValues.numberOfTestCases = numberOfTestCases;

    delete problem.dataValues.languageId;
    delete problem.dataValues.active;

    return res.status(200).send({ data: problem });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    const problem = await Problem.findOne({
      where: {
        id: id,
        active: true,
      },
    });

    if (!problem) {
      return res
        .status(400)
        .send({ error: translate('invalid_problem_id', req.hl) });
    }

    // Only teacher of this course can delete problem
    const course = await Course.findOne({
      where: {
        id: problem.courseId,
        active: true,
      },
    });

    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
    }

    if (course.teacherId !== req.user.id) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    // Set active to false
    await problem.update({ active: false });

    return res.status(200).send({ data: translate('delete_success', req.hl) });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const updateProblem = async (req, res) => {
  // When updating problem
  // There are 3 cases can cause submission will be deleted
  // 1. Language change
  // 2. PDF change
  // 3. Test case change

  // At client side, I will only send changed data
  // Ex: Only when language changed, I will send new languageId to server
  // otherwise, I will not add languageId to body

  try {
    const problemId = req.params.id;
    const name = req.body.name;
    let testCases = req.body.testCases;
    const languageId = req.body.languageId;
    const courseId = req.body.courseId;
    const pointPerTestCase = req.body.pointPerTestCase;
    const pdfDeleteSubmission = req.body.pdfDeleteSubmission;
    const file = req.file;
    const multerError = req.multerError;

    let deleteAllSubmissions = false; // If true, notify user that their submission will be deleted

    if (multerError) {
      return res.status(400).send({ error: translate(multerError, req.hl) });
    }

    // Only teacher of this course can update problem
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

    if (course.teacherId !== req.user.id) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    const problem = await Problem.findOne({
      where: {
        id: problemId,
        active: true,
      },
    });

    if (!problem) {
      return res
        .status(400)
        .send({ error: translate('invalid_problem_id', req.hl) });
    }

    if (name) {
      problem.name = name;
    }

    if (languageId) {
      const language = await Language.findByPk(languageId);
      if (!language) {
        return res
          .status(400)
          .send({ error: translate('invalid_language_id', req.hl) });
      }

      problem.languageId = languageId;

      deleteAllSubmissions = true;
    }

    if (pointPerTestCase) {
      problem.pointPerTestCase = pointPerTestCase;
    }

    if (file) {
      // Delete old pdf file
      const oldPdfPath = problem.pdfPath;
      fs.unlink(oldPdfPath, (err) => {
        if (err) {
          console.error(err);
        }
      });

      const pdfPath = file.path.replace(/\\/g, '/');
      problem.pdfPath = pdfPath;

      if (pdfDeleteSubmission === 'true') {
        deleteAllSubmissions = true;
      }
    }

    if (testCases) {
      testCases = JSON.parse(testCases);
      if (testCases.length === 0) {
        return res.status(400).send({
          error: translate('requires_at_least_one_test_case', req.hl),
        });
      }

      // Delete all test cases of problem and delete all submissionResult of this test case
      // because I use cascade delete in model and migration
      await TestCase.destroy({
        where: {
          problemId: problemId,
        },
      });

      // Create new test cases
      const testCasesResult = testCases.map((testCase) => ({
        ...testCase,
        problemId: problemId,
      }));

      await TestCase.bulkCreate(testCasesResult);

      deleteAllSubmissions = true;
    }

    await problem.save();

    if (deleteAllSubmissions) {
      // Find students submit this problem
      const students = await Submission.findAll({
        where: {
          problemId: problemId,
        },
        attributes: [[sequelize.literal('user.id'), 'id']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: [],
            where: {
              roleType: Role.Student,
            },
          },
        ],
      });

      // If teacher update problem 2 times, in the first time
      // server will send notification to students
      // but in the second time, server will not send notification to students
      // because in the first time, all submission of this problem is deleted
      // so students.length == 0

      // Only send notification to students if students.length > 0
      if (students.length > 0) {
        // Send notification to students
        const studentIds = students.map((student) => student.id);
        sendNotification(
          translate('code_space', req.hl),
          translate('problem_updated_please_resubmit', req.hl),
          {
            foo: 'bar',
          },
          studentIds
        );
      }

      // Delete all submission of this problem and delete all submissionResult of this submission
      // because I use cascade delete in model and migration
      await Submission.destroy({
        where: {
          problemId: problemId,
        },
      });
    }

    return res.status(200).send({
      data: {
        id: problem.id,
        name: problem.name,
        completed: false,
        // Because only teacher can update problem
        // And in the list of problem ui, completed does not show for teacher (only for student)
        // So I set it to false here
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const history = async (req, res) => {
  try {
    const limit = req.query.limit * 1 || DEFAULT_LIMIT;
    const page = req.query.page * 1 || DEFAULT_PAGE;
    const offset = (page - 1) * limit;

    const problemId = req.params.id;
    const userId = req.user.id;

    const problem = await Problem.findOne({
      where: {
        id: problemId,
        active: true,
      },
      include: [
        {
          model: TestCase,
          as: 'testCases',
          required: false,
          attributes: ['id'],
        },
        {
          model: Language,
          as: 'language',
        },
      ],
    });

    if (!problem) {
      return res
        .status(400)
        .send({ error: translate('invalid_problem_id', req.hl) });
    }

    const numberOfTestCases = problem.testCases.length;

    const submissions = await Submission.findAll({
      where: {
        problemId: problemId,
        createdBy: userId,
      },
      limit: limit,
      offset: offset,
      attributes: ['id', 'sourceCode', 'createdAt'],
      include: [
        {
          model: SubmissionResult,
          as: 'submissionResults',
          required: false,
          attributes: ['correct'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    submissions.forEach((submission) => {
      let correctTestCases = 0;
      submission.submissionResults.forEach((submissionResult) => {
        if (submissionResult.correct) {
          correctTestCases++;
        }
      });

      submission.dataValues.numberOfTestCases = numberOfTestCases;
      submission.dataValues.correctTestCases = correctTestCases;
      submission.dataValues.pointPerTestCase = problem.pointPerTestCase;
      submission.dataValues.language = problem.language;
      delete submission.dataValues.submissionResults;
    });

    return res.status(200).send({ data: submissions });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  history,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
};
