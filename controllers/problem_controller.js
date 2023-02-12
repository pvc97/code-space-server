const translate = require('../utils/translate');
const { Language, Course, Problem, TestCase, sequelize } = require('../models');

const createProblem = async (req, res) => {
  try {
    // console.log(req);
    // Only teacher can create problem,
    // Use authorization middleware to check if user is teacher
    const teacherId = req.user.id;
    const courseId = req.body.courseId;
    const name = req.body.name;
    const testCases = JSON.parse(req.body.testCases);
    const languageId = req.body.languageId;
    const pointPerTestCase = req.body.pointPerTestCase;
    const file = req.file;
    const multerError = req.multerError;

    if (multerError) {
      return res.status(400).send({ error: translate(multerError, req.hl) });
    }

    if (!file) {
      return res
        .status(400)
        .send({ error: translate('required_pdf_file', req.hl) });
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

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res
        .status(400)
        .send({ error: translate('invalid_course_id', req.hl) });
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
      const problemResult = await Problem.create({
        name,
        pdfPath,
        pointPerTestCase,
        courseId,
        languageId,
      });

      const testCasesResult = testCases.map((testCase) => ({
        ...testCase,
        problemId: problemResult.id,
      }));

      await TestCase.bulkCreate(testCasesResult, { transaction });
      return problemResult;
    });

    return res.status(201).send({ data: problem });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  createProblem,
};
