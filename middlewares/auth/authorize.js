const translate = require('../../utils/translate');

const authorize = (roles) => (req, res, next) => {
  try {
    const userRole = req.user.roleType;

    if (userRole && roles.includes(userRole)) {
      next();
    } else {
      return res.status(403).send({ error: 'Permission denied' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req) });
  }
};

module.exports = {
  authorize,
};
