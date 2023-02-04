'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, StudentCourse }) {
      Course.belongsTo(User, { foreignKey: 'createdBy', as: 'teacher' }); // A course only has one teacher
      Course.hasMany(StudentCourse, { as: 'students' }); // A course has many students
    }
  }
  Course.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      // createdBy: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'users',
      //     key: 'id',
      //   },
      // },
      accessCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Course',
    }
  );
  return Course;
};
