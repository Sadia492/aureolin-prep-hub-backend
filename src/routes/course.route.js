// backend/src/routes/course.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const courseValidation = require('../validations/course.validation');
const courseController = require('../controllers/course.controller');

const router = express.Router();

// ✅ Public route for courses (no auth required) - MUST be before /:courseId
router.get(
  '/public',
  validate(courseValidation.getPublicCourses),
  courseController.getPublicCourses
);

// Protected routes
router
  .route('/')
  .post(
    auth('manageCourses'),
    validate(courseValidation.createCourse),
    courseController.createCourse
  )
  .get(
    auth('getCourses'),
    courseController.getCourses
  );

router
  .route('/:courseId')
  .get(
    auth('getCourses'),
    validate(courseValidation.getCourse),
    courseController.getCourse
  )
  .patch(
    auth('manageCourses'),
    validate(courseValidation.updateCourse),
    courseController.updateCourse
  )
  .delete(
    auth('manageCourses'),
    courseController.deleteCourse
  );

router.post(
  '/:courseId/enroll',
  auth('enrollCourses'),
  validate(courseValidation.enrollStudent),
  courseController.enrollStudent
);

router.delete(
  '/:courseId/enroll/:userId',
  auth('manageCourses'),
  validate(courseValidation.unenrollStudent),
  courseController.unenrollStudent
);

module.exports = router;