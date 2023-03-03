'use strict';

const bcryptjs = require('bcryptjs');
const { User, Role } = require('../models');
const translate = require('../utils/translate');

const getUserInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: {
        id,
        active: true,
      },
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
    });

    if (!user) {
      return res
        .status(404)
        .send({ error: translate('user_not_found', req.hl) });
    }

    res.status(200).send({ data: user });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: translate('internal_server_error', req.hl) });
  }
};

const getAllUsers = async (req, res) => {
  // TODO: Handle pagination
  // When get all teacher for create course, we don't need pagination
  // => Add query param to enable/disable pagination
  try {
    const roleType = req.query.roleType;
    const whereCondition = { active: true };

    if (roleType) {
      whereCondition.roleType = roleType;
    }

    const teachers = await User.findAll({
      where: whereCondition,
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
  getAllUsers,
};
