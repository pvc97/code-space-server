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
        foreignKey: 'roleType',
        as: 'role',
      });
      User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
      User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' }); // One teacher can have many courses
      User.hasMany(StudentCourse, {
        foreignKey: 'studentId',
        as: 'studentCourses',
      }); // One student can have many courses

      // Have to add foreignKey: 'createdBy' to fix change UserId to createdBy in Submission model
      // If not, it will be a error: Error: Unknown column 'UserId' in 'field list'
      User.hasMany(Submission, { foreignKey: 'createdBy', as: 'submissions' });
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

      // roleType: {
      //   type: DataTypes.ENUM,
      //   allowNull: false,
      //   references: {
      //     model: 'roles',
      //     key: 'roleType',
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
        withPassword: {},
      },
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
    }
  );
  return User;
};
