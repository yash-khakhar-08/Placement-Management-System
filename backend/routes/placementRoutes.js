const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, isAdmin, placementController.createPlacement);
router.put('/:id', verifyToken, isAdmin, placementController.updatePlacement);
router.get('/', verifyToken, placementController.getAllPlacements);
router.get('/:id', verifyToken, placementController.getPlacementById);

// Rounds logic is often inside Round Controller, but let's expose specific placement round creation here or in roundRoutes
// We'll put generic round creation in roundRoutes instead, but for this specific flow, Admin might use placement ID.

module.exports = router;
