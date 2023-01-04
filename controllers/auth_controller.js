const jwt = require('jsonwebtoken');

// In production, this should be stored in a database
let refreshTokens = [];

const genereateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
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
  login,
  logout,
  refreshToken,
};
