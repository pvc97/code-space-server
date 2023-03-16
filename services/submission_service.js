// const sleep = require('../utils/sleep');

const apiProvider = require('./api_provider');

// const POLL_INTERVAL = 1000; // 1 second

// const createJudge0Submissions = async (submissions) => {
//   // NOTE: We don't need encode source code to base64 because
//   // judge0 api will encode it for us when set base64_encoded to true
//   const response = await apiProvider.post('/submissions/batch', {
//     submissions,
//     params: {
//       base64_encoded: true,
//     },
//   });

//   console.log(response);

//   const tokens = response.data.map((submission) => submission.token);
//   return tokens;
// };

/**
 * Fetch submission status from Judge0 API
 * result is an array of submission
 * but status may be still in queue or in process
 */
// const fetchJudge0Submission = async (joinedTokens) => {
//   // Need use base64 encoded source code to prevent error
//   // "error": "some attributes for this submission cannot be converted to UTF-8, use base64_encoded=true query parameter"
//   const response = await apiProvider.get('/submissions/batch', {
//     params: {
//       tokens: joinedTokens,
//       base64_encoded: true,
//       fields:
//         'source_code,expected_output,stdin,stdout,stderr,time,memory,compile_output,status',
//     },
//   });
//   return response.data.submissions;
// };

/**
 * Submit source code to Judge0 API with callback_url
 * Then return list of tokens
 */
const submit = async (submissions) => {
  const response = await apiProvider.post('/submissions/batch', {
    submissions,
    params: {
      base64_encoded: true,
    },
  });

  const tokens = response.data.map((submission) => submission.token);

  return tokens;
};

// function isComplete(submissions) {
//   let completed = true;
//   for (sub of submissions) {
//     // Status 1: In queue
//     // Status 2: In process
//     if (sub.status.id == 1 || sub.status.id == 2) {
//       completed = false;
//       break;
//     }
//   }
//   return completed;
// }

module.exports = {
  submit,
};
