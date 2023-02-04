'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({ Role, RefreshToken }) {
      this.belongsTo(Role, {
        foreignKey: 'roleId',
        as: 'role',
        onDelete: 'CASCADE',
      });
      this.hasMany(RefreshToken, { foreignKey: 'userId' });
    }
  }

  // Static fields for user
  User.withPassword = 'withPassword';
  // =======================

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      scopes: {
        withPassword: {
          attributes: { exclude: ['roleId'] },
        },
      },
      defaultScope: {
        attributes: { exclude: ['roleId', 'password'] },
      },
    }
  );
  return User;
};
