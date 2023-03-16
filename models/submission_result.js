'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubmissionResult extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ TestCase, Submission }) {
      SubmissionResult.belongsTo(TestCase, {
        foreignKey: 'testCaseId',
        as: 'testCase',
      });
      SubmissionResult.belongsTo(Submission, {
        foreignKey: 'submissionId',
        as: 'submission',
      });
    }
  }
  SubmissionResult.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      output: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      judgeToken: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      sequelize,
      timestamps: false,
      modelName: 'SubmissionResult',
    }
  );
  return SubmissionResult;
};
