'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Problem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
      languageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'languages',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Problem',
    }
  );
  return Problem;
};
