const express = require('express');
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/attempt-trend', auth('getAnalytics'), analyticsController.getAttemptAccuracyTrend);
router.get('/subject-performance', auth('getAnalytics'), analyticsController.getSubjectWisePerformance);
router.get('/leaderboard', auth('getAnalytics'), analyticsController.getExamLeaderboard);
router.get('/leaderboard/:examId', auth('getAnalytics'), analyticsController.getExamLeaderboard);
router.get('/course-stats', auth('getAnalytics'), analyticsController.getCourseStats);
router.get('/question-bank', auth('getAnalytics'), analyticsController.getQuestionBankStats);

module.exports = router;
