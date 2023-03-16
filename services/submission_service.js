const apiProvider = require('./api_provider');

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

module.exports = {
  submit,
};
