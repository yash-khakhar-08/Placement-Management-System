const { Round, Placement, User, Application, Candidate } = require('../models');

exports.createRound = async (req, res) => {
  try {
    const { placement_id, round_number, interviewer_id } = req.body;
    
    // Check if placement exists
    const placement = await Placement.findByPk(placement_id);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    // Check if interviewer exists and is actually an interviewer
    const interviewer = await User.findOne({ where: { id: interviewer_id, role: 'interviewer' } });
    if (!interviewer) {
      return res.status(404).json({ message: 'Interviewer not found or invalid role' });
    }

    const round = await Round.create({
      placement_id,
      round_number,
      interviewer_id
    });

    res.status(201).json({ message: 'Round created successfully', round });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAssignedRounds = async (req, res) => {
  try {
    const interviewer_id = req.userId;
    const placements = await Placement.findAll({
      include: [
        { model: User, as: 'interviewers', where: { id: interviewer_id }, attributes: [] },
        { model: Round, as: 'rounds' } // Need rounds context for criteria
      ]
    });
    
    // Fetch active candidates for each drive
    const drivesData = await Promise.all(placements.map(async (p) => {
      const pJson = p.toJSON();
      const applications = await Application.findAll({
        where: {
          placement_id: p.id,
          status: ['applied', 'in_progress', 'hold', 'in_interview']
        },
        include: [{ model: Candidate, as: 'candidate' }]
      });
      pJson.applications = applications;
      return pJson;
    }));

    res.status(200).json(drivesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getRoundsByPlacement = async (req, res) => {
  try {
    const { placementId } = req.params;
    const rounds = await Round.findAll({
      where: { placement_id: placementId }
    });
    res.status(200).json(rounds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
