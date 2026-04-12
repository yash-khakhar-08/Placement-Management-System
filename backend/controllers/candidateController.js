const { Candidate, Application, Placement, User } = require('../models');
const bcrypt = require('bcrypt');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const candidate = await Candidate.findOne({ where: { user_id: req.userId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found' });

    candidate.resume_url = req.file.path; // e.g. uploads/resume-123.pdf
    await candidate.save();

    res.status(200).json({ message: 'Resume uploaded successfully', resume_url: candidate.resume_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { phone } = req.body;
    const candidate = await Candidate.findOne({ where: { user_id: req.userId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found' });

    await candidate.update({ phone });

    res.status(200).json({ message: 'Profile updated successfully', candidate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.apply = async (req, res) => {
  try {
    const { placement_id, passkey } = req.body;
    
    if (!placement_id) {
      return res.status(400).json({ message: 'Must provide placement_id' });
    }

    const candidate = await Candidate.findOne({ where: { user_id: req.userId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found. Complete profile first.' });

    const placement = await Placement.findByPk(placement_id);
    if (!placement) return res.status(404).json({ message: 'Placement not found' });

    // Validate passkey for college drives
    if (placement.type === 'college') {
      if (!passkey || passkey.trim() !== placement.passkey) {
        return res.status(403).json({ message: 'Invalid or missing passkey for this drive.' });
      }
    }

    // Ensure candidate hasn't applied already
    const existingApplication = await Application.findOne({
      where: {
        candidate_id: candidate.id,
        placement_id
      }
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this opportunity.' });
    }

    // Handle custom resume. If req.file is present, use it. Otherwise, use candidate.resume_url
    let custom_resume_url = null;
    if (req.file) {
      custom_resume_url = req.file.path;
    } else if (!candidate.resume_url) {
      return res.status(400).json({ message: 'Please upload a resume before applying.' });
    }

    const application = await Application.create({
      candidate_id: candidate.id,
      placement_id: placement_id,
      custom_resume_url: custom_resume_url || candidate.resume_url,
      current_round: 1,
      status: 'applied'
    });

    res.status(201).json({ message: 'Applied successfully', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ where: { user_id: req.userId } });
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found' });

    const applications = await Application.findAll({
      where: { candidate_id: candidate.id },
      include: [
        { model: Placement, as: 'placement' }
      ]
    });

    const feedbacks = await require('../models').InterviewFeedback.findAll({
      where: { candidate_id: candidate.id },
      attributes: ['id', 'round_id', 'public_feedback', 'result', 'createdAt'],
      include: [{ model: require('../models').Round, as: 'round', attributes: ['round_number', 'placement_id'] }]
    });

    res.status(200).json({ applications, feedbacks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getAllCandidates = async (req, res) => {
  try {
    // Only Admin can view all candidates
    const candidates = await Candidate.findAll();
    res.status(200).json(candidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
