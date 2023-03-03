const { User, Role } = require('../models');
const translate = require('../utils/translate');

const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    res.status(200).send({ data: user });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: {
        active: true,
        roleType: Role.Teacher,
      },
      attributes: ['id', 'name', 'email'],
    });

    res.status(200).send({ data: teachers });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

const createUser = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  getUserInfo,
  getAllTeachers,
};
