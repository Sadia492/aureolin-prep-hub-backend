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
router.get('/teacher-stats', auth('getAnalytics'), analyticsController.getTeacherStats);
router.get('/student-stats', auth('getAnalytics'), analyticsController.getStudentStats);
router.get(
  '/admin/subject-performance',
  auth('getAnalytics'),
  analyticsController.getAdminSubjectWisePerformance
);

router.get(
  '/admin/exam-results',
  auth('getAnalytics'),
  analyticsController.getAdminExamResults
);
module.exports = router;
