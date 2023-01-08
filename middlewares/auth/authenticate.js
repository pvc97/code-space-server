const jwt = require('jsonwebtoken');
const {
  INVALID_TOKEN_MESSAGE,
  TOKEN_EXPIRED_MESSAGE,
  TOKEN_REQUIRED_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
} = require('../../constants/strings');

const { decodeAccessToken } = require('../../utils/auth');

const authenticate = (req, res, next) => {
  try {
    const accessToken = req.headers.authorization.replace('Bearer ', '');
    if (!accessToken) {
      return res.status(401).send({ error: TOKEN_REQUIRED_MESSAGE });
    }

    // Verify the token
    const decoded = decodeAccessToken(accessToken);

    // Attach the decoded token payload to the request object
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).send({ error: TOKEN_EXPIRED_MESSAGE });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).send({ error: INVALID_TOKEN_MESSAGE });
    } else {
      console.log(error);
      res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
  }
};

module.exports = {
  authenticate,
};
