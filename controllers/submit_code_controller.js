const {
  createSubmissions,
  getSubmission,
} = require('../services/submission_service');
const translate = require('../utils/translate');
const sleep = require('../utils/sleep');

const submitCode = async (req, res) => {
  try {
    const submissions = req.body.submissions;

    const tokens = await createSubmissions(submissions);

    const tokensParam = tokens.join(',');

    // Because submission batch doesn't have wait parameter, we need to poll the API
    // to check if the submission is complete
    await sleep(1000); // Wait for 1 second before polling

    let result = await getSubmission(tokensParam);
    while (!submitComplete(result)) {
      await sleep(1000);
      result = await getSubmission(tokensParam);
    }

    res.status(200).send({ data: result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req) });
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

module.exports = submitCode;
