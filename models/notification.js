'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ UserNotification }) {
      Notification.hasMany(UserNotification, {
        foreignKey: 'notificationId',
        as: 'userNotifications',
      });
    }
  }
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        // One line of text
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        // One line of text
        type: DataTypes.STRING,
        allowNull: false,
      },
      data: {
        // JSON object
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
    }
  );
  return Notification;
};
