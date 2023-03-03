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
      Role.hasMany(User, { foreignKey: 'roleType', as: 'users' });
    }
  }

  // Define the role types
  Role.Manager = 'manager';
  Role.Student = 'student';
  Role.Teacher = 'teacher';

  Role.init(
    {
      roleType: {
        primaryKey: true,
        type: DataTypes.ENUM,
        values: [Role.Manager, Role.Student, Role.Teacher],
        defaultValue: Role.Student,
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
