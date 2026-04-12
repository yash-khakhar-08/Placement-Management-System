const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Round = sequelize.define('Round', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  placement_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  round_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  criteria: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Round;
