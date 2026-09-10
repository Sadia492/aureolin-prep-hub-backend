const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const userValidation = require('../validations/user.validation');
const userController = require('../controllers/user.controller');

const router = express.Router();
router.get(
  '/teachers/public',
  validate(userValidation.getPublicTeachers),
  userController.getPublicTeachers
);

// ✅ Current user profile routes (before /:userId)
router.get(
  '/me',
  auth(),
  userController.getMe
);

router.patch(
  '/me',
  auth(),
  validate(userValidation.updateMe),
  userController.updateMe
);

router.patch(
  '/me/password',
  auth(),
  validate(userValidation.changePassword),
  userController.changePassword
);

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;
