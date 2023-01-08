const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { User, Role, RefreshToken } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  decodeAccessToken,
  decodeRefreshToken,
} = require('../utils/auth');

const { convertTimeStampToDate } = require('../utils/date_time');
const {
  LOGIN_ERROR_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
} = require('../constants/strings');

// In production, this should be stored in a database
let refreshTokens = [];

const register = async (req, res) => {
  try {
    const { username, name, email, password, roleId } = req.body;

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      roleId,
    });

    const role = await Role.findByPk(user.roleId);
    user.dataValues.role = role.type;

    const accessToken = generateAccessToken(user.dataValues);
    const refreshToken = generateRefreshToken(user.dataValues);

    const decodedRefreshToken = decodeRefreshToken(refreshToken);
    const expiresAt = convertTimeStampToDate(decodedRefreshToken.exp);

    // console.log(new Date().toISOString());
    // console.log(new Date(expiresAt * 1000).toISOString());

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    res.status(201).json({ data: { accessToken, refreshToken } });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const login = async (req, res) => {
  try {
    // Authenticate User
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).send({ error: LOGIN_ERROR_MESSAGE });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).send({ error: LOGIN_ERROR_MESSAGE });
    }

    const role = await Role.findByPk(user.roleId);
    user.dataValues.role = role.type;

    const accessToken = generateAccessToken(user.dataValues);
    const refreshToken = generateRefreshToken(user.dataValues);

    const decodedRefreshToken = decodeRefreshToken(refreshToken);
    const expiresAt = convertTimeStampToDate(decodedRefreshToken.exp);

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    res.json({ data: { accessToken, refreshToken } });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const logout = (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
};

const refreshToken = (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) return res.sendStatus(401);

  if (refreshTokens.includes(refreshToken)) {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = genereateAccessToken({ name: user.name });
      res.json({ accessToken });
    });
  } else {
    res.sendStatus(403);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
};
