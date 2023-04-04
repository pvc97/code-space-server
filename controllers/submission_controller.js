const { submit } = require('../services/submission_service');

const {
  Problem,
  TestCase,
  Submission,
  SubmissionResult,
  sequelize,
} = require('../models');
const { QueryTypes } = require('sequelize');

const translate = require('../utils/translate');

const getSubmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // const submission = await Submission.findByPk(id);
    const queryResult = await sequelize.query(
      `SELECT Submissions.id, Submissions.sourceCode, Submissions.problemId, CAST(SUM(IF(correct = true, correct * (Problems.pointPerTestCase), 0)) AS UNSIGNED) as totalPoints
      FROM Submissions
      INNER JOIN SubmissionResults
      ON Submissions.id = SubmissionResults.submissionId AND Submissions.id = "${id}"
      INNER JOIN Problems
      ON Problems.id = Submissions.problemId LIMIT 1`,
      {
        type: QueryTypes.SELECT,
      }
    );

    const submission = queryResult[0];
    // Have to use (submission[0].id === null) of !submission
    // Because return value will be an array
    if (submission.id === null) {
      return res
        .status(404)
        .send({ error: translate('submission_not_found', req.hl) });
    }

    const submissionResults = await SubmissionResult.findAll({
      where: { submissionId: id },
      attributes: [
        'output',
        'correct',

        [sequelize.literal('testCase.stdin'), 'stdin'],
        [sequelize.literal('testCase.expectedOutput'), 'expectedOutput'],
        [sequelize.literal('testCase.show'), 'show'],
        // "testCase" in testCase.stdin is "as" in the include below
      ],
      include: [
        {
          model: TestCase,
          as: 'testCase',
          where: { active: true },
          attributes: [],
        },
      ],
    });

    // Remove test case if correct is false and show is false
    const filteredSubmissionResults = submissionResults.filter(
      (submissionResult) => {
        if (submissionResult.correct) {
          return true;
        } else {
          return submissionResult.dataValues.show;
        }
      }
    );

    submission.results = filteredSubmissionResults;

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
    // Step 1: Get body information
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

    // Step 2: Find problem and check if it exists
    const problem = await Problem.findByPk(problemId, {
      include: {
        model: TestCase,
        as: 'testCases',
        where: { active: true },
      },
    });

    if (!problem) {
      // Check number of test cases
      const numberOfTestCases = await TestCase.count({
        where: { problemId, active: true },
      });

      if (numberOfTestCases === 0) {
        return res
          .status(400)
          .send({ error: translate('problem_has_no_test_case', req.hl) });
      }

      return res
        .status(400)
        .send({ error: translate('invalid_problem_id', req.hl) });
    }

    // Step 3: Return submission id to client
    const submission = await Submission.create({
      sourceCode,
      createdBy: userId,
      problemId,
    });

    res.status(201).send({ data: { id: submission.id } });

    // Step 4: Get all test cases
    const testCases = problem.testCases;
    const inputSubmissions = [];
    for (testCase of testCases) {
      const submission = {
        source_code: sourceCode,
        language_id: problem.languageId,
        stdin: testCase.stdin,
        expected_output: testCase.expectedOutput,
        callback_url: `${process.env.NODEJS_LOCALHOST}/api/v1/submissions/callback`,
      };

      inputSubmissions.push(submission);
    }

    // Step 5: Submit code to Judge0
    const tokens = await submit(inputSubmissions);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }

  try {
    // Save list of submissionResult to database with tokes from Judge0
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
  }
};

module.exports = {
  createSubmission,
  submissionCallback,
  getSubmissionDetail,
};
