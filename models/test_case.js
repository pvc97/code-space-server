'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TestCase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Problem, SubmissionResult }) {
      TestCase.belongsTo(Problem, { foreignKey: 'problemId', as: 'problem' });
      TestCase.hasMany(SubmissionResult, {
        foreignKey: 'testCaseId',
        as: 'submissionResults',
        onDelete: 'CASCADE',
      });
    }
  }
  TestCase.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      stdin: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      expectedOutput: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      // problemId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'problems',
      //     key: 'id',
      //   },
      // },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      show: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'TestCase',
    }
  );
  return TestCase;
};
