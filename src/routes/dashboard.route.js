const express = require('express');
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/stats', auth('getDashboard'), dashboardController.getStats);
router.get('/my-courses', auth('getDashboard'), dashboardController.getMyCourses);
router.get('/recent-attempts', auth('getDashboard'), dashboardController.getRecentAttempts);

module.exports = router;
