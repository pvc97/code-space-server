const apiProvider = require('./api_provider');

/**
 * Submit source code to Judge0 API with callback_url
 * Then return list of tokens
 */
const submit = async (submissions) => {
  try {
    const response = await apiProvider.post('/submissions/batch', {
      submissions,
      params: {
        base64_encoded: true,
      },
    });

    const tokens = response.data.map((submission) => submission.token);

    return tokens;
  } catch (error) {
    // If judge0 api is down, return empty list of tokens
    console.log('Judge0 API is down');
    return [];
  }
};

module.exports = {
  submit,
};
