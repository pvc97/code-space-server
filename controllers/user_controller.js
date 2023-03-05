'use strict';

const bcryptjs = require('bcryptjs');
const { User, Role, sequelize } = require('../models');
const translate = require('../utils/translate');
const { DEFAULT_LIMIT, DEFAULT_PAGE } = require('../constants/constants');

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
  try {
    const roleType = req.query.roleType;

    let limit = req.query.limit * 1 || DEFAULT_LIMIT;
    const page = req.query.page * 1 || DEFAULT_PAGE;
    let offset = (page - 1) * limit;
    const q = req.query.q;
    const all = req.query.all; // Get all users without pagination

    const whereCondition = { active: true };

    if (roleType) {
      whereCondition.roleType = roleType;
    }

    if (q) {
      whereCondition.name = {
        [Op.like]: `%${q}%`,
      };
    }

    if (all === 'true') {
      limit = null;
      offset = null;
    }

    const users = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'username', 'name', 'email', 'roleType'],
      limit: limit,
      offset: offset,
      order: [[sequelize.literal("SUBSTRING_INDEX(name, ' ', -1)"), 'ASC']],
      // Order by last name in vietnamese
    });

    res.status(200).send({ data: users });
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

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({
      where: {
        id: id,
        active: true,
      },
    });

    if (!user) {
      return res
        .status(400)
        .send({ error: translate('invalid_user_id', req.hl) });
    }

    await user.update({ active: false });

    return res.status(200).send({ data: translate('delete_success', req.hl) });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Update user info
// Manager can update all user info
// Or user can update their own info
// If update success, return updated user info instead of userId
// Because FE need to save new user info to local storage
const updateUser = async (req, res) => {
  try {
    const userIdToUpdate = req.params.id;
    const roleType = req.user.roleType;
    const currentUserId = req.user.id;

    const { name, email } = req.body;

    let canUpdate = false;

    if (canUpdate === false && roleType === Role.Manager) {
      canUpdate = true;
    }

    if (canUpdate === false && currentUserId === userIdToUpdate) {
      canUpdate = true;
    }

    if (canUpdate === false) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    const user = await User.findOne({
      where: { id: userIdToUpdate, active: true },
    });

    if (!user) {
      return res
        .status(400)
        .send({ error: translate('invalid_user_id', req.hl) });
    }

    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }

    await user.save();

    res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send({
        error: translate('duplicate_course_code', req.hl),
      });
    }

    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Only current user can change their password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return res
        .status(400)
        .send({ error: translate('required_old_password', req.hl) });
    }

    if (!newPassword) {
      return res
        .status(400)
        .send({ error: translate('required_new_password', req.hl) });
    }

    if (oldPassword === newPassword) {
      return res
        .status(400)
        .send({ error: translate('new_password_same_as_old', req.hl) });
    }

    const user = await User.scope(User.withPassword).findOne({
      where: { id: userId, active: true },
      attributes: ['id', 'password'],
    });

    if (!user) {
      return res.status(403).send({
        error: translate('invalid_user_id', req.hl),
      });
    }

    const isValidPassword = await bcryptjs.compare(oldPassword, user.password);

    if (!isValidPassword) {
      return res.status(403).send({
        error: translate('invalid_old_password', req.hl),
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await user.update({ password: hashedPassword });

    return res.status(200).send({
      data: {
        id: user.id,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Only manager can reset user password
// Manager can reset user password without knowing old password
const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId) {
      return res
        .status(400)
        .send({ error: translate('required_user_id', req.hl) });
    }

    if (!newPassword) {
      return res
        .status(400)
        .send({ error: translate('required_new_password', req.hl) });
    }

    const user = await User.scope(User.withPassword).findOne({
      where: { id: userId, active: true },
      attributes: ['id', 'password'],
    });

    if (!user) {
      return res.status(403).send({
        error: translate('invalid_user_id', req.hl),
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await user.update({ password: hashedPassword });

    return res.status(200).send({
      data: {
        id: user.id,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

module.exports = {
  createUser,
  deleteUser,
  updateUser,
  getUserInfo,
  getAllUsers,
  resetPassword,
  changePassword,
};
