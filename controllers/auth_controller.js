const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { User, Role, RefreshToken } = require('../models');

// In production, this should be stored in a database
let refreshTokens = [];

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 15 });
};

const createToken = (data, tokenSecrete, expiresIn) => {
  return jwt.sign(data, tokenSecrete, {
    expiresIn,
  });
};

const decodeToken = (token, tokenSecrete) => jwt.verify(token, tokenSecrete);

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

    // Remove hashed password
    delete user.dataValues.password;

    const accessToken = createToken(
      user.dataValues,
      process.env.ACCESS_TOKEN_SECRET,
      150 // 5 minutes
    );
    const refreshToken = createToken(
      user.dataValues,
      process.env.REFRESH_TOKEN_SECRET,
      604800 // 7 days
    );

    user.dataValues.accessToken = accessToken;
    user.dataValues.refreshToken = refreshToken;

    const decodedRefreshToken = decodeToken(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const expiresAt = new Date(decodedRefreshToken.exp * 1000);

    // console.log(new Date().toISOString());
    // console.log(new Date(expiresAt * 1000).toISOString());

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    res.send({ data: { accessToken, refreshToken } });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

const login = (req, res) => {
  // Authenticate User
  const { username } = req.body;

  const accessToken = genereateAccessToken({ name: username });
  const refreshToken = jwt.sign(
    { name: username },
    process.env.REFRESH_TOKEN_SECRET
  );
  refreshTokens.push(refreshToken);

  res.json({ accessToken, refreshToken });
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
