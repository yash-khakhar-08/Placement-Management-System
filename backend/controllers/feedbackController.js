const { InterviewFeedback, Application, Round, Placement } = require('../models');

exports.submitFeedback = async (req, res) => {
  try {
    const { candidate_id, round_id, question_asked, public_feedback, private_feedback, result } = req.body;
    const interviewer_id = req.userId;

    const round = await Round.findByPk(round_id, {
      include: [{ model: Placement, as: 'placement' }]
    });

    if (!round) return res.status(404).json({ message: 'Round not found' });

    if (round.placement && round.placement.date) {
      const today = new Date().toISOString().split('T')[0];
      if (round.placement.date !== today) {
        return res.status(403).json({ message: `Feedback can only be submitted on the scheduled date of the interview (${round.placement.date}). Today is ${today}.` });
      }
    }

    const feedback = await InterviewFeedback.create({
      candidate_id,
      round_id,
      interviewer_id,
      notes: null, // Legacy column if we kept it
      question_asked,
      public_feedback,
      private_feedback,
      result
    });

    // Update Application status if result is selected, rejected, etc.
    // Assuming placement context. If selected, advance round or select.
    // If rejected, mark rejected.
    const application = await Application.findOne({
      where: { candidate_id, placement_id: round.placement.id }
    });

    if (application) {
      if (result === 'rejected') {
        application.status = 'rejected';
      } else if (result === 'selected') {
        if (application.current_round >= round.placement.number_of_rounds) {
          application.status = 'selected';
        } else {
          application.current_round += 1;
          application.status = 'in_progress';
        }
      } else if (result === 'hold') {
        application.status = 'hold';
      }
      application.locked_by_id = null;
      await application.save();
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getFeedbackByRound = async (req, res) => {
  try {
    const { roundId } = req.params;
    const feedbacks = await InterviewFeedback.findAll({
      where: { round_id: roundId }
    });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const feedbacks = await InterviewFeedback.findAll({
      where: { interviewer_id: req.userId },
      include: [
        { model: require('../models').Candidate, as: 'candidate', attributes: ['id', 'name'] },
        { 
          model: Round, 
          as: 'round', 
          include: [{ model: Placement, as: 'placement' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(feedbacks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.lockCandidate = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await Application.findByPk(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    
    // Check if locked by someone else
    if (application.status === 'in_interview' && application.locked_by_id && application.locked_by_id !== req.userId) {
      return res.status(400).json({ message: 'Candidate is already being interviewed by someone else' });
    }
    
    application.status = 'in_interview';
    application.locked_by_id = req.userId;
    await application.save();
    
    // Also fetch historical feedback for this candidate to return back
    const history = await InterviewFeedback.findAll({
      where: { candidate_id: application.candidate_id },
      include: [
        { 
          model: Round, 
          as: 'round',
          include: [{ model: Placement, as: 'placement' }]
        },
        {
          model: require('../models').User,
          as: 'interviewer',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({ message: 'Locked', history });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.unlockCandidate = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await Application.findByPk(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    
    // Revert status safely
    application.status = application.current_round === 1 ? 'applied' : 'in_progress';
    application.locked_by_id = null;
    await application.save();
    res.status(200).json({ message: 'Unlocked' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
