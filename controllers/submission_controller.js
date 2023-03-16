const { submit: submit } = require('../services/submission_service');

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
// const createSubmission = async (req, res) => {
//   try {
//     // Authenticate middleware has attached the user to the request object
//     const userId = req.user.id;
//     const sourceCode = req.body.sourceCode;
//     const problemId = req.body.problemId;

//     if (!sourceCode) {
//       return res
//         .status(400)
//         .send({ error: translate('required_source_code', req.hl) });
//     }

//     if (!problemId) {
//       return res
//         .status(400)
//         .send({ error: translate('required_problem_id', req.hl) });
//     }

//     const problem = await Problem.findByPk(problemId, {
//       include: {
//         model: TestCase,
//         as: 'testCases',
//         where: { active: true },
//       },
//     });

//     const testCases = problem.testCases;
//     const inputSubmissions = [];
//     for (testCase of testCases) {
//       const submission = {
//         source_code: sourceCode,
//         language_id: problem.languageId,
//         stdin: testCase.stdin,
//         expected_output: testCase.expectedOutput,
//       };

//       inputSubmissions.push(submission);
//     }

//     // Submit code to Judge0
//     const judge0Submissions = await getJudge0Submissions(inputSubmissions);

//     let totalPoint = 0;
//     const submissionResults = [];
//     const results = [];
//     for (var i = 0; i < judge0Submissions.length; i++) {
//       const correct = judge0Submissions[i].status.id == 3;
//       if (correct) {
//         totalPoint += problem.pointPerTestCase;
//       }

//       let output =
//         judge0Submissions[i].stdout ||
//         judge0Submissions[i].stderr ||
//         judge0Submissions[i].compile_output ||
//         '';
//       // Replace all \n with ''
//       output = output.replace(/\n/g, '');
//       // Decode base64
//       output = Buffer.from(output, 'base64').toString('ascii');

//       const submissionResult = {
//         testCaseId: testCases[i].id,
//         output,
//         correct,
//       };
//       submissionResults.push(submissionResult);

//       // Only show the test case if it is marked as show
//       if (testCases[i].show == true) {
//         const resultItem = {
//           stdin: testCases[i].stdin,
//           output,
//           correct,
//           show: true,
//         };
//         results.push(resultItem);
//       }
//     }

//     // Save submission to database
//     const submission = await Submission.create({
//       sourceCode,
//       totalPoint: totalPoint,
//       createdBy: userId,
//       problemId,
//     });

//     // Add submission id to each submission result
//     for (submissionResult of submissionResults) {
//       submissionResult.submissionId = submission.id;
//     }

//     // Save submission results to database
//     await SubmissionResult.bulkCreate(submissionResults);

//     res.status(201).send({ data: { id: submission.id } });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: translate('internal_server_error', req.hl) });
//   }
// };

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

    const correct = status.id == 3;

    let output = stdout || stderr || compile_output || '';
    // Replace all \n with ''
    output = output.replace(/\n/g, '');
    // Decode base64
    output = Buffer.from(output, 'base64').toString('ascii');

    // Update submission result
    await SubmissionResult.update(
      {
        output,
        correct,
      },
      {
        where: {
          judgeToken: token,
        },
      }
    );

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
    const submission = await Submission.create({
      sourceCode,
      totalPoint: 0,
      createdBy: userId,
      problemId,
    });

    res.status(201).send({ data: { id: submission.id } });

    // Step 3:
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
        callback_url: `${process.env.DOCKER_LOCALHOST}/api/v1/submissions/callback`,
      };

      inputSubmissions.push(submission);
    }

    // Submit code to Judge0
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

    SubmissionResult.bulkCreate(submissionResults);

    // let totalPoint = 0;
    // const submissionResults = [];
    // const results = [];
    // for (var i = 0; i < judge0Submissions.length; i++) {
    //   const correct = judge0Submissions[i].status.id == 3;
    //   if (correct) {
    //     totalPoint += problem.pointPerTestCase;
    //   }

    //   let output =
    //     judge0Submissions[i].stdout ||
    //     judge0Submissions[i].stderr ||
    //     judge0Submissions[i].compile_output ||
    //     '';
    //   // Replace all \n with ''
    //   output = output.replace(/\n/g, '');
    //   // Decode base64
    //   output = Buffer.from(output, 'base64').toString('ascii');

    //   const submissionResult = {
    //     testCaseId: testCases[i].id,
    //     output,
    //     correct,
    //   };
    //   submissionResults.push(submissionResult);

    //   // Only show the test case if it is marked as show
    //   if (testCases[i].show == true) {
    //     const resultItem = {
    //       stdin: testCases[i].stdin,
    //       output,
    //       correct,
    //       show: true,
    //     };
    //     results.push(resultItem);
    //   }
    // }

    // // // Save submission to database
    // // const submission = await Submission.create({
    // //   sourceCode,
    // //   totalPoint: totalPoint,
    // //   createdBy: userId,
    // //   problemId,
    // // });

    // // Add submission id to each submission result
    // for (submissionResult of submissionResults) {
    //   submissionResult.submissionId = submission.id;
    // }

    // // Save submission results to database
    // await SubmissionResult.bulkCreate(submissionResults);

    // res.status(201).send({ data: { id: submission.id } });
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
