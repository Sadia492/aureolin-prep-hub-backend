const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const courseRoute = require('./course.route');
const examRoute = require('./exam.route');
const questionRoute = require('./question.route');
const attemptRoute = require('./attempt.route');
const qnaRoute = require('./qna.route');
const analyticsRoute = require('./analytics.route');
const dashboardRoute = require('./dashboard.route');
const successStoryRoute = require('./successStory.route');
const materialRoute = require('./material.route');
const uploadRoute = require('./upload.route');
const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/courses',
    route: courseRoute,
  },
  {
    path: '/exams',
    route: examRoute,
  },
  {
    path: '/questions',
    route: questionRoute,
  },
  {
    path: '/attempts',
    route: attemptRoute,
  },
  {
    path: '/qnas',
    route: qnaRoute,
  },
  {
    path: '/analytics',
    route: analyticsRoute,
  },
  {
    path: '/dashboard',
    route: dashboardRoute,
  },
  {
    path: '/success-stories',
    route: successStoryRoute,
  },
  {
    path: '/materials',
    route: materialRoute,
  },
  {
    path: '/uploads',
    route: uploadRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});



module.exports = router;
