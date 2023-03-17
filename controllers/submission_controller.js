const { submit } = require('../services/submission_service');

const {
  Problem,
  TestCase,
  Submission,
  SubmissionResult,
} = require('../models');

const translate = require('../utils/translate');

const getSubmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findByPk(id);

    if (!submission) {
      return res
        .status(404)
        .send({ error: translate('submission_not_found', req.hl) });
    }

    const submissionResults = await SubmissionResult.findAll({
      where: { submissionId: id },
    });

    // Find problem
    const problem = await Problem.findByPk(submission.problemId);
    let totalPoint = 0;

    const results = [];
    for (submissionResult of submissionResults) {
      const testCase = await TestCase.findByPk(submissionResult.testCaseId);

      console.log(testCase);

      // Show the test case if it is marked as show or the submission result is correct
      if (testCase.show === true || submissionResult.correct === true) {
        const resultItem = {
          stdin: testCase.stdin,
          output: submissionResult.output,
          expectedOutput: testCase.expectedOutput,
          correct: submissionResult.correct,
          show: testCase.show,
        };
        results.push(resultItem);
      }

      if (submissionResult.correct && problem) {
        totalPoint += problem.pointPerTestCase;
      }
    }

    // Update total point if old total point is different from new total point
    if (submission.totalPoint !== totalPoint) {
      submission.totalPoint = totalPoint;
      await submission.save();
    }

    submission.dataValues.results = results;
    submission.dataValues.totalTestCase = submissionResults.length;

    res.status(200).send({ data: submission });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

// ENHANCEMENT:
const submissionCallback = async (req, res) => {
  try {
    console.log(req.body);
    const {
      stdout,
      time,
      memory,
      stderr,
      token,
      compile_output,
      message,
      status,
    } = req.body;

    const io = req.io;

    const correct = status.id == 3;

    let output = stdout || stderr || compile_output || '';
    // Replace all \n with ''
    output = output.replace(/\n/g, '');
    // Decode base64
    output = Buffer.from(output, 'base64').toString('ascii');

    // Find submission result with the token
    const submissionResult = await SubmissionResult.findOne({
      where: { judgeToken: token },
    });

    if (submissionResult) {
      io.to(submissionResult.submissionId).emit('result', correct);

      // Update submission result
      await submissionResult.update({
        output,
        correct,
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

const createSubmission = async (req, res) => {
  try {
    // Step 1:
    // Authenticate middleware has attached the user to the request object
    const userId = req.user.id;
    const sourceCode = req.body.sourceCode;
    const problemId = req.body.problemId;

    if (!sourceCode) {
      return res
        .status(400)
        .send({ error: translate('required_source_code', req.hl) });
    }

    if (!problemId) {
      return res
        .status(400)
        .send({ error: translate('required_problem_id', req.hl) });
    }

    // Step 2:
    const problem = await Problem.findByPk(problemId, {
      include: {
        model: TestCase,
        as: 'testCases',
        where: { active: true },
      },
    });

    if (!problem) {
      return res
        .status(400)
        .send({ error: translate('invalid_problem_id', req.hl) });
    }

    // Step 3:
    const submission = await Submission.create({
      sourceCode,
      totalPoint: 0,
      createdBy: userId,
      problemId,
    });

    res.status(201).send({ data: { id: submission.id } });

    // Step 4:
    const testCases = problem.testCases;
    const inputSubmissions = [];
    for (testCase of testCases) {
      const submission = {
        source_code: sourceCode,
        language_id: problem.languageId,
        stdin: testCase.stdin,
        expected_output: testCase.expectedOutput,
        callback_url: `${process.env.DOCKER_LOCALHOST}/api/v1/submissions/callback`,
      };

      inputSubmissions.push(submission);
    }

    // Step 5: Submit code to Judge0
    const tokens = await submit(inputSubmissions);

    // Save list of submissionResult to database
    const submissionResults = [];
    for (var i = 0; i < tokens.length; ++i) {
      const submissionResult = {
        submissionId: submission.id,
        judgeToken: tokens[i],
        testCaseId: testCases[i].id,
        correct: false,
      };
      submissionResults.push(submissionResult);
    }

    await SubmissionResult.bulkCreate(submissionResults);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  createSubmission,
  submissionCallback,
  getSubmissionDetail,
};
