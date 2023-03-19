'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Submission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Problem, SubmissionResult }) {
      Submission.belongsTo(User, { foreignKey: 'createdBy', as: 'user' });
      Submission.belongsTo(Problem, { foreignKey: 'problemId', as: 'problem' });
      Submission.hasMany(SubmissionResult, {
        foreignKey: 'submissionId',
        as: 'submissionResults',
        onDelete: 'CASCADE',
      });
    }
  }
  Submission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sourceCode: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // createdBy: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'users',
      //     key: 'id',
      //   },
      // },
      // problemId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'problems',
      //     key: 'id',
      //   },
      // },
    },
    {
      sequelize,
      modelName: 'Submission',
    }
  );
  return Submission;
};
