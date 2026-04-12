const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/upload-resume', verifyToken, upload.single('resume'), candidateController.uploadResume);
router.post('/apply', verifyToken, upload.single('resume'), candidateController.apply);
router.get('/applications', verifyToken, candidateController.getMyApplications);
router.put('/profile', verifyToken, candidateController.updateProfile);
router.get('/all', verifyToken, candidateController.getAllCandidates); // For admin to view candidates

module.exports = router;
