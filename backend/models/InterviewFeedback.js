const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InterviewFeedback = sequelize.define('InterviewFeedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  candidate_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  round_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  interviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_asked: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  public_feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  private_feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  result: {
    type: DataTypes.ENUM('selected', 'rejected', 'hold', 'pending'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = InterviewFeedback;
