const translate = require('../utils/translate');
const {
  Language,
  Course,
  Problem,
  TestCase,
  Role,
  sequelize,
} = require('../models');

const createProblem = async (req, res) => {
  try {
    // console.log(req);
    // Only teacher can create problem,
    // Use authorization middleware to check if user is teacher
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
        where: { active: true },
        attributes: { exclude: ['problemId', 'createdAt', 'updatedAt'] },
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
  try {
    const name = req.body.name;
    const testCases = JSON.parse(req.body.testCases);
    const languageId = req.body.languageId;
    const pointPerTestCase = req.body.pointPerTestCase;
    const file = req.file;
    const multerError = req.multerError;

    if (multerError) {
      return res.status(400).send({ error: translate(multerError, req.hl) });
    }

    let pdfPath = undefined;
    if (!file) {
      pdfPath = file.path.replace(/\\/g, '/');
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
  getProblem,
  deleteProblem,
};
