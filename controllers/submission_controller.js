const {
  getJudge0Submissions: getJudge0Submissions,
} = require('../services/submission_service');

const {
  Problem,
  TestCase,
  Submission,
  SubmissionResult,
} = require('../models');

const translate = require('../utils/translate');

/**
 * Create submission flow:
 * 1. Find the problem and its test cases
 * 2. Submit code to Judge0 and get the submission result
 * 4. Calculate the total point
 * 5. Save the submission and submission results to database
 * 6. Return the formatted submission containing submission results
 */
const createSubmission = async (req, res) => {
  try {
    // Authenticate middleware has attached the user to the request object
    const userId = req.user.id;
    const sourceCode = req.body.sourceCode;
    const problemId = req.body.problemId;

    const problem = await Problem.findByPk(problemId, {
      include: {
        model: TestCase,
        as: 'testCases',
        where: { active: true },
      },
    });

    const testCases = problem.testCases;

    const inputSubmissions = [];
    for (testCase of testCases) {
      const submission = {
        source_code: sourceCode,
        language_id: problem.languageId,
        stdin: testCase.stdin,
        expected_output: testCase.expectedOutput,
      };

      inputSubmissions.push(submission);
    }

    // Submit code to Judge0
    const judge0Submissions = await getJudge0Submissions(inputSubmissions);

    console.log(judge0Submissions);

    let totalPoint = 0;
    const submissionResults = [];
    const results = [];
    for (var i = 0; i < judge0Submissions.length; i++) {
      const correct = judge0Submissions[i].status.id == 3;
      if (correct) {
        totalPoint += problem.pointPerTestCase;
      }

      // TODO: Handle error and encode base64
      let output =
        judge0Submissions[i].stdout ||
        judge0Submissions[i].stderr ||
        judge0Submissions[i].compile_output ||
        '';
      // Replace all \n with ''
      output = output.replace(/\n/g, '');

      const submissionResult = {
        testCaseId: testCase.id,
        output,
        correct,
      };
      submissionResults.push(submissionResult);

      // Only show the test case if it is marked as show
      if (testCases[i].show == true) {
        const resultItem = {
          stdin: testCases[i].stdin,
          output,
          correct,
          show: true,
        };
        results.push(resultItem);
      }
    }

    // Save submission to database
    const submission = await Submission.create({
      sourceCode,
      totalPoint: totalPoint,
      createdBy: userId,
      problemId,
    });

    // Add submission id to each submission result
    for (submissionResult of submissionResults) {
      submissionResult.submissionId = submission.id;
    }

    // Save submission results to database
    await SubmissionResult.bulkCreate(submissionResults);

    // Attach some additional data to the submission
    submission.dataValues.results = results;
    submission.dataValues.totalTestCase = testCases.length;

    res.status(201).send({ data: submission });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = createSubmission;
