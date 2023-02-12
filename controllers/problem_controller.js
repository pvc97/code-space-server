const translate = require('../utils/translate');
const { Language, Course } = require('../models');

const createProblem = async (req, res) => {
  try {
    // console.log(req);
    // Only teacher can create problem,
    // Use authorization middleware to check if user is teacher
    const teacherId = req.user.id;
    const courseId = req.body.courseId;
    const name = req.body.name;
    const testCases = req.body.testCases;
    const languageId = req.body.languageId;

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

    return res.status(201).send({ message: 'OK' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  createProblem,
};
