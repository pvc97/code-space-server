const apiProvider = require('./api_provider');

const createSubmissions = async (submissions) => {
  const response = await apiProvider.post('/submissions/batch', {
    submissions,
    params: {
      base64_encoded: true,
    },
  });

  const tokens = response.data.map((submission) => submission.token);
  return tokens;
};

const getSubmission = async (tokens) => {
  const response = await apiProvider.get('/submissions/batch', {
    params: {
      tokens,
      base64_encoded: true,
      fields:
        'source_code,stdin,stdout,stderr,time,memory,compile_output,status',
    },
  });
  return response.data.submissions;
};

module.exports = {
  createSubmissions,
  getSubmission,
};
