const { sequelize } = require('../config/db');
const User = require('./User');
const Placement = require('./Placement');
const Round = require('./Round');
const Candidate = require('./Candidate');
const Application = require('./Application');
const InterviewFeedback = require('./InterviewFeedback');

// Define Relationships

// User <-> Candidate (One-to-One or One-to-Many depending on if candidate can re-register)
User.hasOne(Candidate, { foreignKey: 'user_id', as: 'candidateProfile' });
Candidate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Placement <-> Round (One-to-Many)
Placement.hasMany(Round, { foreignKey: 'placement_id', as: 'rounds' });
Round.belongsTo(Placement, { foreignKey: 'placement_id', as: 'placement' });

// Job <-> Round (A Walk-in job could have rounds)
// But for simplicity based on the prompt, rounds are linked mostly to placements, 
// though jobs can have rounds explicitly defined later or implicitly in applications.

const PlacementInterviewer = sequelize.define('PlacementInterviewer', {
  placement_id: require('sequelize').DataTypes.INTEGER,
  interviewer_id: require('sequelize').DataTypes.INTEGER
}, { timestamps: false });

Placement.belongsToMany(User, { through: PlacementInterviewer, as: 'interviewers', foreignKey: 'placement_id' });
User.belongsToMany(Placement, { through: PlacementInterviewer, as: 'assignedDrives', foreignKey: 'interviewer_id' });

// Candidate <-> Application (One-to-Many)
Candidate.hasMany(Application, { foreignKey: 'candidate_id', as: 'applications' });
Application.belongsTo(Candidate, { foreignKey: 'candidate_id', as: 'candidate' });

// Placement <-> Application (One-to-Many)
Placement.hasMany(Application, { foreignKey: 'placement_id', as: 'applications' });
Application.belongsTo(Placement, { foreignKey: 'placement_id', as: 'placement' });

  // Job <-> Application association removed

// Application <-> InterviewFeedback (One-to-Many conceptually, but actually Round <-> Candidate)
// Better is Round/Candidate specific feedbacks
Candidate.hasMany(InterviewFeedback, { foreignKey: 'candidate_id', as: 'feedbacks' });
InterviewFeedback.belongsTo(Candidate, { foreignKey: 'candidate_id', as: 'candidate' });

Round.hasMany(InterviewFeedback, { foreignKey: 'round_id', as: 'feedbacks' });
InterviewFeedback.belongsTo(Round, { foreignKey: 'round_id', as: 'round' });

User.hasMany(InterviewFeedback, { foreignKey: 'interviewer_id', as: 'feedbacksGiven' });
InterviewFeedback.belongsTo(User, { foreignKey: 'interviewer_id', as: 'interviewer' });


module.exports = {
  sequelize,
  User,
  Placement,
  Round,
  Candidate,
  Application,
  InterviewFeedback,
  PlacementInterviewer
};
