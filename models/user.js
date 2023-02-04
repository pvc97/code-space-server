'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({
      Role,
      RefreshToken,
      Course,
      StudentCourse,
      Submission,
    }) {
      User.belongsTo(Role, {
        foreignKey: 'roleId',
        as: 'role',
      });
      User.hasMany(RefreshToken, { as: 'refreshTokens' });
      // User.hasMany(Course, { as: 'courses' }); // One teacher can have many courses
      // User.hasMany(StudentCourse, { as: 'studentCourses' }); // One student can have many courses
      User.hasMany(Submission, { as: 'submissions' });
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
      // User.belongsTo automatically creates a foreign key
      // so we don't need to define it here

      // roleId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'roles',
      //     key: 'id',
      //   },
      // },
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
