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
      // testCaseId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'testcases',
      //     key: 'id',
      //   },
      // },
      output: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // submissionId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'submissions',
      //     key: 'id',
      //   },
      // },
      id: {
        type: DataTypes.UUID,
        allowNull: true,
        unique: true,
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
