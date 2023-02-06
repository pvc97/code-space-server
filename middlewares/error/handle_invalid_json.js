const translate = require('../../utils/translate');

const handleInvalidJson = function (err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ error: translate('invalid_json', req.hl) });
  }
  next();
};

module.exports = {
  handleInvalidJson,
};
