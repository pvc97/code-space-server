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
      this.hasMany(User, { foreignKey: 'roleId' });
    }
  }
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
        values: ['Manager', 'Student', 'Teacher'],
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
