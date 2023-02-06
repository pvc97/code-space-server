const sleep = require('../utils/sleep');

const apiProvider = require('./api_provider');

const POLL_INTERVAL = 1000; // 1 second

const createJudge0Submissions = async (submissions) => {
  const response = await apiProvider.post('/submissions/batch', {
    submissions,
    params: {
      // base64_encoded: true,
    },
  });

  const tokens = response.data.map((submission) => submission.token);
  return tokens;
};

/**
 * Fetch submission status from Judge0 API
 * result is an array of submission
 * but status may be still in queue or in process
 */
const fetchJudge0Submission = async (joinedTokens) => {
  const response = await apiProvider.get('/submissions/batch', {
    params: {
      tokens: joinedTokens,
      // base64_encoded: true,
      fields:
        'source_code,expected_output,stdin,stdout,stderr,time,memory,compile_output,status',
    },
  });
  return response.data.submissions;
};

/**
 * Get submission result from Judge0 API
 * Then check if all submissions are completed calling fetchSubmission after a second
 */
const getJudge0Submissions = async (submissions) => {
  const tokens = await createJudge0Submissions(submissions);
  const joinedTokens = tokens.join(',');

  await sleep(POLL_INTERVAL); // Wait for 1 second before polling

  let result = await fetchJudge0Submission(joinedTokens);
  while (!isComplete(result)) {
    await sleep(POLL_INTERVAL);
    result = await fetchJudge0Submission(joinedTokens);
  }

  return result;
};

function isComplete(submissions) {
  let completed = true;
  for (sub of submissions) {
    // Status 1: In queue
    // Status 2: In process
    if (sub.status.id == 1 || sub.status.id == 2) {
      completed = false;
      break;
    }
  }
  return completed;
}

module.exports = {
  createJudge0Submissions: createJudge0Submissions,
  getJudge0Submissions: getJudge0Submissions,
};
