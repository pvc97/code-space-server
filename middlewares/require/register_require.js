const {
  REQUIRED_NAME,
  REQUIRED_USERNAME,
  REQUIRED_EMAIL,
  REQUIRED_PASSWORD,
} = require('../../constants/strings');

const { Role } = require('../../models');

const registerRequire = async (req, res, next) => {
  console.log('registerRequire');

  const { username, name, email, password, roleId } = req.body;

  if (!username) {
    return res.status(400).send({ error: REQUIRED_USERNAME });
  }

  if (!name) {
    return res.status(400).send({ error: REQUIRED_NAME });
  }

  if (!email) {
    return res.status(400).send({ error: REQUIRED_EMAIL });
  }

  if (!password) {
    return res.status(400).send({ error: REQUIRED_PASSWORD });
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
