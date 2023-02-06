const translate = require('../../utils/translate');

const { Role } = require('../../models');

const registerRequire = async (req, res, next) => {
  console.log('registerRequire');

  const { username, name, email, password, roleId } = req.body;

  if (!username) {
    return res
      .status(400)
      .send({ error: translate('required_username', req.hl) });
  }

  if (!name) {
    return res.status(400).send({ error: translate('required_name', req.hl) });
  }

  if (!email) {
    return res.status(400).send({ error: translate('required_email', req.hl) });
  }

  if (!password) {
    return res
      .status(400)
      .send({ error: translate('required_password', req.hl) });
  }

  if (!roleId) {
    // If roleId is not provided, set it to Student
    const studentRole = await Role.findOne({ where: { type: Role.Student } });

    console.log(studentRole.id);
    req.body.roleId = studentRole.id;
  }

  next();
};

module.exports = {
  registerRequire,
};
