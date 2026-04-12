const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, isInterviewer } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, isInterviewer, feedbackController.submitFeedback);
router.post('/lock', verifyToken, isInterviewer, feedbackController.lockCandidate);
router.post('/unlock', verifyToken, isInterviewer, feedbackController.unlockCandidate);
router.get('/round/:roundId', verifyToken, feedbackController.getFeedbackByRound);
router.get('/history', verifyToken, isInterviewer, feedbackController.getMyHistory);

module.exports = router;
