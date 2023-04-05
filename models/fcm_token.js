'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FCMToken extends Model {
    static associate({ User }) {
      this.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    }
  }
  FCMToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'FCMToken',
    }
  );
  return FCMToken;
};
