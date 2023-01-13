const { INVALID_JSON } = require('../../constants/strings');

const handleInvalidJson = function (err, req, res, next) {
  console.log(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ error: INVALID_JSON });
  }
  next();
};

module.exports = {
  handleInvalidJson,
};
