'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User }) {
      Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
    }
  }

  // Define the role types
  Role.Manager = 'manager';
  Role.Student = 'student';
  Role.Teacher = 'teacher';

  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        onDelete: 'CASCADE',
      },
      type: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: [Role.Manager, Role.Student, Role.Teacher],
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'Role',
      timestamps: false,
    }
  );
  return Role;
};
