const {
  createSubmissions,
  getSubmission,
} = require('../services/submission_service');

const {
  Problem,
  TestCase,
  Submission,
  SubmissionResult,
} = require('../models');

const translate = require('../utils/translate');
const sleep = require('../utils/sleep');

// const submitCode = async (req, res) => {
//   try {
//     const submissions = req.body.submissions;

//     const tokens = await createSubmissions(submissions);

//     const tokensParam = tokens.join(',');

//     // Because submission batch doesn't have wait parameter,
//     // Judge0 provide callback_url for "each submission" so it really hard to implement
//     // So I need to poll the API to check if the submission is complete
//     // A little bit slow but it works :)
//     await sleep(1000); // Wait for 1 second before polling

//     let result = await getSubmission(tokensParam);
//     while (!submitComplete(result)) {
//       await sleep(1000);
//       result = await getSubmission(tokensParam);
//     }

//     res.status(200).send({ data: result });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: translate('internal_server_error', req.hl ) });
//   }
// };

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
    const languageId = problem.dataValues.languageId;

    const testCases = problem.testCases;

    const submissions = [];

    for (testCase of testCases) {
      const submission = {
        source_code: sourceCode,
        language_id: languageId,
        stdin: testCase.dataValues.stdin,
        expected_output: testCase.dataValues.expectedOutput,
      };
      submissions.push(submission);
    }

    // Submit code to Judge0
    const tokens = await createSubmissions(submissions);
    const tokensParam = tokens.join(',');

    await sleep(1000); // Wait for 1 second before polling

    let result = await getSubmission(tokensParam);
    while (!submitComplete(result)) {
      await sleep(1000);
      result = await getSubmission(tokensParam);
    }

    let totalPoint = 0;
    const submissionResults = [];
    const listOutput = [];
    for (var i = 0; i < result.length; i++) {
      const correct = result[i].status.id == 3;
      if (correct) {
        totalPoint += problem.dataValues.pointPerTestCase;
      }

      // TODO: Handle error and encode base64
      const output = result[i].stdout;

      const submissionResult = {
        testCaseId: testCase.dataValues.id,
        output,
        correct,
      };
      submissionResults.push(submissionResult);

      const outputItem = {
        stdin: testCases[i].dataValues.stdin,
        output,
        correct,
      };
      listOutput.push(outputItem);
    }

    const submission = await Submission.create({
      sourceCode,
      totalPoint: totalPoint,
      createdBy: userId,
      problemId,
    });

    for (submissionResult of submissionResults) {
      submissionResult.submissionId = submission.dataValues.id;
    }

    await SubmissionResult.bulkCreate(submissionResults);

    submission.dataValues.testCase = listOutput;

    res.status(200).send({ data: submission });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

function submitComplete(submissions) {
  let isComplete = true;
  for (sub of submissions) {
    console.log(sub);
    if (sub.status.id == 1 || sub.status.id == 2) {
      isComplete = false;
      break;
    }
  }
  return isComplete;
}

module.exports = createSubmission;
