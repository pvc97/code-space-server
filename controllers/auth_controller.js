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
  console.log('register');
  try {
    const { username, name, email, password, roleType } = req.body;

    const hashedPassword = await bcryptjs.hash(password, 10);

    const roleId = (await Role.findOne({ where: { type: roleType } }))
      .dataValues.id;

    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      roleId,
    });

    user.dataValues.role = roleType;

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
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({
        error: translate('register_username_or_email_already_exists', req),
      });
    }
    res.status(500).send({ error: translate('internal_server_error', req) });
  }
};

const login = async (req, res) => {
  try {
    // Authenticate User
    const { username, password } = req.body;

    if (!username) {
      return res
        .status(400)
        .send({ error: translate('required_username', req) });
    }

    if (!password) {
      return res
        .status(400)
        .send({ error: translate('required_password', req) });
    }

    const user = await User.scope(User.withPassword).findOne({
      where: { username },
      include: ['role'],
    });

    if (!user) {
      return res
        .status(401)
        .send({ error: translate('login_invalid_username_or_password', req) });
    }

    // Add roleType to user object and remove role object
    user.dataValues.roleType = user.role.type;
    delete user.dataValues.role;

    const isValidPassword = await bcryptjs.compare(password, user.password);

    if (!isValidPassword) {
      return res
        .status(401)
        .send({ error: translate('login_invalid_username_or_password', req) });
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
    res.status(500).send({ error: translate('internal_server_error', req) });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!token) {
      return res.status(403).send({ error: translate('token_required', req) });
    }

    await RefreshToken.destroy({
      where: {
        token: refreshToken,
      },
    });

    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req) });
  }
};

// If user logs out from all devices, all refresh tokens will be deleted
// If some user still have some valid access tokens, they will be able to use them
// until they are expired.
const logoutAll = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).send({ error: translate('token_required', req) });
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
    res.status(500).send({ error: translate('internal_server_error', req) });
  }
};

const refreshToken = async (req, res) => {
  // DO NOT RETURN STATUS CODE 401 UNAUTHORIZED WHEN REFRESH TOKEN
  // THIS MAY CAUSE INFINITE LOOP AT CLIENT SIDE

  // Code-Space-Client has implemented a mechanism to prevent infinite loop, so we can return 401 status code without any problem
  try {
    const token = req.body.refreshToken;

    if (!token) {
      return res.status(403).send({ error: translate('token_required', req) });
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
      return res.status(403).send({ error: translate('invalid_token', req) });
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
      return res.status(401).send({ error: translate('token_expired', req) });
    } else if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof SyntaxError
    ) {
      console.log(error);
      return res.status(401).send({ error: translate('invalid_token', req) });
    } else {
      console.log(error);
      res.status(500).send({ error: translate('internal_server_error', req) });
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
