const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { User, Role, RefreshToken } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  decodeRefreshToken,
} = require('../utils/auth');
const { convertTimeStampToDate } = require('../utils/date_time');
const {
  LOGIN_ERROR_MESSAGE,
  INVALID_TOKEN_MESSAGE,
  TOKEN_EXPIRED_MESSAGE,
  TOKEN_REQUIRED_MESSAGE,
  INTERNAL_SERVER_ERROR_MESSAGE,
} = require('../constants/strings');

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

    res.status(201).send({ data: { accessToken, refreshToken } });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const login = async (req, res) => {
  try {
    // Authenticate User
    const { username, password } = req.body;

    const user = await User.scope(User.withPassword).findOne({
      where: { username },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['type'],
        },
      ],
    });

    if (!user) {
      return res.status(401).send({ error: LOGIN_ERROR_MESSAGE });
    }

    // Add roleType to user object and remove role object
    user.dataValues.roleType = user.role.type;
    delete user.dataValues.role;

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).send({ error: LOGIN_ERROR_MESSAGE });
    }

    const accessToken = generateAccessToken(user.dataValues);
    const refreshToken = generateRefreshToken(user.dataValues);

    const decodedRefreshToken = decodeRefreshToken(refreshToken);
    const expiresAt = convertTimeStampToDate(decodedRefreshToken.exp);

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    res.status(200).send({ data: { accessToken, refreshToken } });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    await RefreshToken.destroy({
      where: {
        token: refreshToken,
      },
    });

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: INTERNAL_SERVER_ERROR_MESSAGE });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.body.refreshToken;

    if (!token) {
      return res.status(401).send({ error: TOKEN_REQUIRED_MESSAGE });
    }

    const decodedRefreshToken = decodeRefreshToken(token);

    const refreshToken = await RefreshToken.findOne({
      where: {
        userId: decodedRefreshToken.id,
        token: token,
      },
    });
    // If refresh token is not found in the database
    if (!refreshToken) {
      return res.status(401).send({ error: INVALID_TOKEN_MESSAGE });
    } else {
      // Delete the refresh token from the database
      await RefreshToken.destroy({
        where: {
          token: token,
        },
      });
    }

    const user = await User.findByPk(decodedRefreshToken.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['type'],
        },
      ],
    });

    // Add roleType to user object and remove role object
    user.dataValues.roleType = user.role.type;
    delete user.dataValues.role;

    const accessToken = generateAccessToken(user.dataValues);
    const newRefreshToken = generateRefreshToken(user.dataValues);

    const decodedNewRefreshToken = decodeRefreshToken(newRefreshToken);
    const expiresAt = convertTimeStampToDate(decodedNewRefreshToken.exp);

    await RefreshToken.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt,
    });

    res
      .status(200)
      .send({ data: { accessToken, refreshToken: newRefreshToken } });
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
  register,
  login,
  logout,
  refreshToken,
};
