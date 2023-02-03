const translate = require('../../utils/translate');

const handleInvalidJson = function (err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.log(req.query);

    return res.status(400).send({ error: translate('invalid_json', req) });
  }
  next();
};

module.exports = {
  handleInvalidJson,
};
