const express = require('express');
const router = express.Router();
const roundController = require('../controllers/roundController');
const { verifyToken, isAdmin, isInterviewer } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, isAdmin, roundController.createRound);
router.get('/interviewer/assigned', verifyToken, isInterviewer, roundController.getAssignedRounds);
router.get('/placement/:placementId', verifyToken, roundController.getRoundsByPlacement);

module.exports = router;
