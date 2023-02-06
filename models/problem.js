'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Problem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Submission, TestCase, Language }) {
      // If we don't add foreignKey: 'problemId',
      // When querying Submission, it will return ProblemId instead of problemId
      Problem.hasMany(Submission, {
        foreignKey: 'problemId',
        as: 'submissions',
      });
      Problem.hasMany(TestCase, { as: 'testCases' });
      Problem.belongsTo(Language, { foreignKey: 'languageId', as: 'language' });
    }
  }
  Problem.init(
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
      pdfPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pointPerTestCase: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      courseId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id',
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      // languageId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: false,
      //   references: {
      //     model: 'languages',
      //     key: 'id',
      //   },
      // },
    },
    {
      sequelize,
      modelName: 'Problem',
    }
  );
  return Problem;
};
