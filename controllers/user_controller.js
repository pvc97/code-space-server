'use strict';

const bcryptjs = require('bcryptjs');
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
    const { username, name, email, password, roleType } = req.body;

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

    if (!roleType) {
      return res
        .status(400)
        .send({ error: translate('required_role_type', req.hl) });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Register can only create student account
    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      roleType,
    });

    return res.status(201).send({ data: { id: user.id } });
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

module.exports = {
  createUser,
  getUserInfo,
  getAllTeachers,
};
