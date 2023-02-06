const jwt = require('jsonwebtoken');
const translate = require('../../utils/translate');

const { decodeAccessToken } = require('../../utils/auth');

const authenticate = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res
        .status(401)
        .send({ error: translate('token_required', req.hl) });
    }

    const accessToken = req.headers.authorization.replace('Bearer ', '');
    if (!accessToken) {
      return res
        .status(401)
        .send({ error: translate('token_required', req.hl) });
    }

    // Verify the token
    const decoded = decodeAccessToken(accessToken);

    // Attach the decoded token payload to the request object
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .send({ error: translate('token_expired', req.hl) });
    } else if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof SyntaxError
    ) {
      return res
        .status(401)
        .send({ error: translate('invalid_token', req.hl) });
    } else {
      console.log(error);
      res
        .status(500)
        .send({ error: translate('internal_server_error', req.hl) });
    }
  }
};

module.exports = {
  authenticate,
};
