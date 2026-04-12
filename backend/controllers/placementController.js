const { Placement, Round, User, Application } = require('../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

exports.createPlacement = async (req, res) => {
  try {
    const { type, college_name, date, job_role, description, location, number_of_rounds, roundsInfo, year, interviewer_emails } = req.body;
    
    // Auto-generate a passkey if it's a college drive
    let passkey = null;
    if (type === 'college') {
      passkey = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    }

    const placement = await Placement.create({
      type: type || 'college',
      college_name: type === 'college' ? college_name : null,
      passkey,
      year: year || new Date(date).getFullYear(),
      date,
      job_role,
      description,
      location,
      number_of_rounds
    });

    // Handle interviewer pooling
    if (interviewer_emails && typeof interviewer_emails === 'string') {
      const emails = interviewer_emails.split(',').map(e => e.trim()).filter(Boolean);
      for (const email of emails) {
        let interviewer = await User.findOne({ where: { email } });
        if (!interviewer) {
          const hashedPassword = await bcrypt.hash('password123', 10);
          interviewer = await User.create({
            name: email.split('@')[0], // placeholder name
            email: email,
            password: hashedPassword,
            role: 'interviewer'
          });
        }
        await placement.addInterviewer(interviewer); // Sequelize magic method
      }
    }

    // Handle dynamic rounds mapping
    if (roundsInfo && Array.isArray(roundsInfo)) {
      for (const rInfo of roundsInfo) {        
        await Round.create({
          placement_id: placement.id,
          round_number: rInfo.round_number,
          criteria: rInfo.criteria || null
        });
      }
    }

    res.status(201).json({ message: 'Drive created successfully', placement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updatePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, college_name, date, job_role, description, location, number_of_rounds, roundsInfo, year, interviewer_emails } = req.body;
    
    const placement = await Placement.findByPk(id);
    if (!placement) return res.status(404).json({ message: 'Placement not found' });
    
    await placement.update({
      type: type || placement.type,
      college_name: type === 'college' ? college_name : null,
      year: year || placement.year,
      date: date || placement.date,
      job_role: job_role || placement.job_role,
      description: description !== undefined ? description : placement.description,
      location: location || placement.location,
      number_of_rounds: number_of_rounds || placement.number_of_rounds
    });

    // Replace Interviewer Pool
    if (interviewer_emails && typeof interviewer_emails === 'string') {
      const emails = interviewer_emails.split(',').map(e => e.trim()).filter(Boolean);
      const interviewersToSet = [];
      for (const email of emails) {
        let interviewer = await User.findOne({ where: { email } });
        if (!interviewer) {
          const hashedPassword = await bcrypt.hash('password123', 10);
          interviewer = await User.create({
            name: email.split('@')[0],
            email: email,
            password: hashedPassword,
            role: 'interviewer'
          });
        }
        interviewersToSet.push(interviewer);
      }
      await placement.setInterviewers(interviewersToSet);
    }

    // Replace rounds
    if (roundsInfo && Array.isArray(roundsInfo)) {
      await Round.destroy({ where: { placement_id: id } });
      for (const rInfo of roundsInfo) {
        await Round.create({
          placement_id: placement.id,
          round_number: rInfo.round_number,
          criteria: rInfo.criteria || null
        });
      }
    }

    res.status(200).json({ message: 'Drive updated successfully', placement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllPlacements = async (req, res) => {
  try {
    const placements = await Placement.findAll({
      include: [
        { model: Round, as: 'rounds' },
        { model: require('../models').User, as: 'interviewers', attributes: ['id', 'name', 'email'] },
        { model: Application, as: 'applications', attributes: ['id', 'current_round', 'status'] }
      ]
    });
    res.status(200).json(placements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPlacementById = async (req, res) => {
  try {
    const placement = await Placement.findByPk(req.params.id, {
      include: [
        { model: Round, as: 'rounds' },
        { model: require('../models').User, as: 'interviewers', attributes: ['id', 'name', 'email'] },
        { 
          model: Application, 
          as: 'applications',
          include: [
            { 
              model: require('../models').Candidate, 
              as: 'candidate',
              include: [
                { 
                  model: require('../models').InterviewFeedback, 
                  as: 'feedbacks',
                  include: [{ model: require('../models').User, as: 'interviewer', attributes: ['name'] }]
                },
                { model: require('../models').User, as: 'user', attributes: ['email'] }
              ]
            }
          ]
        }
      ]
    });
    
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    res.status(200).json(placement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
