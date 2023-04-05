'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Notification }) {
      UserNotification.belongsTo(User, {
        foreignKey: 'userId',
        as: 'user',
      });
      UserNotification.belongsTo(Notification, {
        foreignKey: 'notificationId',
        as: 'notification',
      });
    }
  }
  UserNotification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'UserNotification',
      timestamps: false,
    }
  );
  return StudentCourse;
};
