const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  candidate_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  placement_id: {
    type: DataTypes.INTEGER,
    allowNull: false, 
  },
  custom_resume_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  current_round: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('applied', 'in_progress', 'in_interview', 'selected', 'rejected', 'hold'),
    allowNull: false,
    defaultValue: 'applied',
  },
  locked_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Application;
