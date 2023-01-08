const jwt = require('jsonwebtoken');
const {
  ACCESS_TOKEN_DURATION,
  REFRESH_TOKEN_DURATION,
} = require('../constants/constants');

const generateToken = (data, tokenSecrete, expiresIn) => {
  // Remove hashed password
  console.log(data);
  if (data.password) {
    delete data.password;
  }

  return jwt.sign(data, tokenSecrete, {
    expiresIn,
  });
};

const verifyToken = (token, tokenSecrete) => jwt.verify(token, tokenSecrete);

const generateAccessToken = (user) =>
  generateToken(user, process.env.ACCESS_TOKEN_SECRET, ACCESS_TOKEN_DURATION);

const generateRefreshToken = (user) =>
  generateToken(user, process.env.REFRESH_TOKEN_SECRET, REFRESH_TOKEN_DURATION);

const decodeAccessToken = (token) =>
  verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

const decodeRefreshToken = (token) =>
  verifyToken(token, process.env.REFRESH_TOKEN_SECRET);

module.exports = {
  generateToken,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  decodeAccessToken,
  decodeRefreshToken,
};
