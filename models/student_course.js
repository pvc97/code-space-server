'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StudentCourse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(User, Course) {
      StudentCourse.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
      StudentCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
    }
  }
  StudentCourse.init(
    {
      // studentId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'users',
      //     key: 'id',
      //   },
      // },
      // courseId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'courses',
      //     key: 'id',
      //   },
      // },
    },
    {
      sequelize,
      modelName: 'StudentCourse',
      timestamps: false,
    }
  );
  return StudentCourse;
};
