'use strict';

const bcryptjs = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Role, Course, sequelize } = require('../models');
const translate = require('../utils/translate');
const {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  PASSWORD_SALT_LENGTH,
} = require('../constants/constants');

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

    let whereCondition = { active: true };

    if (roleType) {
      whereCondition.roleType = roleType;
    }

    if (q) {
      // Search by name or username
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { username: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
        ],
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

    return res.status(200).send({ data: users });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Only manager with username 'admin' can create new manager
const createUser = async (req, res) => {
  try {
    const { username, name, email, password, roleType } = req.body;
    const admin = 'admin';
    const mangerUsername = req.user.username;

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

    if (roleType === Role.Manager && mangerUsername !== admin) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    const hashedPassword = await bcryptjs.hash(password, PASSWORD_SALT_LENGTH);

    // Register can only create student account
    const user = await User.create({
      username,
      name,
      email,
      password: hashedPassword,
      roleType,
    });

    return res.status(201).send({
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roleType: user.roleType,
      },
    });
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
  try {
    const admin = 'admin';
    const { id } = req.params;
    const currentUserId = req.user.id;
    const currentUsername = req.user.username;

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

    // Only manager with username 'admin' can delete other managers
    if (user.roleType === Role.Manager && currentUsername !== admin) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    // But admin can not delete himself
    if (user.id === currentUserId) {
      return res
        .status(400)
        .send({ error: translate('cannot_delete_yourself', req.hl) });
    }

    // Have to put all transaction to each query to able to rollback
    await sequelize.transaction(async (transaction) => {
      await user.update({ active: false }, { transaction });

      // If user is teacher, delete all courses that teacher created
      if (user.roleType === Role.Teacher) {
        await Course.update(
          { active: false },
          {
            where: {
              teacherId: user.id,
            },
          },
          { transaction }
        );
      }
    });

    return res.status(200).send({ data: translate('delete_success', req.hl) });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: translate('internal_server_error', req.hl) });
  }
};

// Update user info
// Manager can update all user info except other managers
// Only manager with username 'admin' can update other managers :)
// Or user can update their own info
// If update success, return updated user info instead of userId
// Because FE need to save new user info to local storage
const updateUser = async (req, res) => {
  try {
    const admin = 'admin';
    const userIdToUpdate = req.params.id;
    const roleType = req.user.roleType;
    const currentUserId = req.user.id;
    const currentUsername = req.user.username;
    const { name, email } = req.body;

    let canUpdate = false;

    // Manager can update all user info except other managers
    // Only manager with username 'admin' can update other managers :)
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
      attributes: ['id', 'username', 'name', 'email', 'roleType'],
    });

    if (!user) {
      return res
        .status(400)
        .send({ error: translate('invalid_user_id', req.hl) });
    }

    // Check if manager is trying to update other manager or not
    // Only manager with username 'admin' can update other managers
    if (
      user.id !== currentUserId &&
      user.roleType === Role.Manager &&
      currentUsername !== admin
    ) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
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
        error: translate('email_already_exists', req.hl),
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

    const hashedPassword = await bcryptjs.hash(
      newPassword,
      PASSWORD_SALT_LENGTH
    );

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
// Only manager with username 'admin' can reset other managers password
const resetPassword = async (req, res) => {
  try {
    const admin = 'admin';
    const { userId, newPassword } = req.body;
    const currentUsername = req.user.username;

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

    const targetUser = await User.scope(User.withPassword).findOne({
      where: { id: userId, active: true },
      attributes: ['id', 'password', 'roleType'],
    });

    if (!targetUser) {
      return res.status(403).send({
        error: translate('invalid_user_id', req.hl),
      });
    }

    // Only manager with username 'admin' can reset other managers password
    if (targetUser.roleType === Role.Manager && currentUsername !== admin) {
      return res
        .status(403)
        .send({ error: translate('permission_denied', req.hl) });
    }

    const hashedPassword = await bcryptjs.hash(
      newPassword,
      PASSWORD_SALT_LENGTH
    );

    await targetUser.update({ password: hashedPassword });

    return res.status(200).send({
      data: {
        id: targetUser.id,
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
