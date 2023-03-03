const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const translate = require('../utils/translate');
const { User, Role, RefreshToken } = require('../models');
const {
  generateAccessToken,
  generateRefreshToken,
  decodeRefreshToken,
} = require('../utils/auth');
const { convertTimeStampToDate } = require('../utils/date_time');

const register = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username) {
      return res
        .status(400)
        .send({ error: translate('required_username', req.hl) });
    }

    if (!name) {
      return res
        .status(400)
        .send({ error: translate('required_name', req.hl) });
    }

    if (!email) {
      return res
        .status(400)
        .send({ error: translate('required_email', req.hl) });
    }

    if (!password) {
      return res
        .status(400)
        .send({ error: translate('required_password', req.hl) });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Register can only create student account
    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      roleType: Role.Student,
    });

    // Remove createdAt and updatedAt
    delete user.dataValues.createdAt;
    delete user.dataValues.updatedAt;

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
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({
        error: translate('register_username_or_email_already_exists', req.hl),
      });
    }
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

const login = async (req, res) => {
  try {
    // Authenticate User
    const { username, password } = req.body;

    if (!username) {
      return res
        .status(400)
        .send({ error: translate('required_username', req.hl) });
    }

    if (!password) {
      return res
        .status(400)
        .send({ error: translate('required_password', req.hl) });
    }

    const user = await User.scope(User.withPassword).findOne({
      where: { username },
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    });

    if (!user) {
      return res.status(403).send({
        error: translate('login_invalid_username_or_password', req.hl),
      });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(403).send({
        error: translate('login_invalid_username_or_password', req.hl),
      });
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
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!token) {
      return res
        .status(403)
        .send({ error: translate('token_required', req.hl) });
    }

    await RefreshToken.destroy({
      where: {
        token: refreshToken,
      },
    });

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof SyntaxError
    ) {
      return res
        .status(401)
        .send({ error: translate('invalid_token', req.hl) });
    }

    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// If user logs out from all devices, all refresh tokens will be deleted
// If some user still have some valid access tokens, they will be able to use them
// until they are expired.
const logoutAll = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(403)
        .send({ error: translate('token_required', req.hl) });
    }

    const decodedRefreshToken = decodeRefreshToken(refreshToken);

    await RefreshToken.destroy({
      where: {
        userId: decodedRefreshToken.id,
      },
    });

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof SyntaxError
    ) {
      console.log(error);
      return res
        .status(401)
        .send({ error: translate('invalid_token', req.hl) });
    }

    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

const refreshToken = async (req, res) => {
  // DO NOT RETURN STATUS CODE 401 UNAUTHORIZED WHEN REFRESH TOKEN
  // THIS MAY CAUSE INFINITE LOOP AT CLIENT SIDE

  // Code-Space-Client has implemented a mechanism to prevent infinite loop, so we can return 401 status code without any problem
  try {
    const token = req.body.refreshToken;

    if (!token) {
      return res
        .status(403)
        .send({ error: translate('token_required', req.hl) });
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
      return res
        .status(401)
        .send({ error: translate('invalid_token', req.hl) });
    } else {
      // Delete the refresh token from the database
      await RefreshToken.destroy({
        where: {
          token: token,
        },
      });
    }

    const user = await User.findOne({
      where: {
        id: decodedRefreshToken.id,
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt'],
      },
    });

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
      return res
        .status(401)
        .send({ error: translate('token_expired', req.hl) });
    } else if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof SyntaxError
    ) {
      console.log(error);
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
  register,
  login,
  logout,
  logoutAll,
  refreshToken,
};
