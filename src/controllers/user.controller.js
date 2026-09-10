const httpStatus = require('http-status').default;
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, user, 'User created successfully'));
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(new ApiResponse(httpStatus.OK, result, 'Users retrieved successfully'));
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(new ApiResponse(httpStatus.OK, user, 'User retrieved successfully'));
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(new ApiResponse(httpStatus.OK, user, 'User updated successfully'));
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

// ✅ Add this new controller for public teachers
const getPublicTeachers = catchAsync(async (req, res) => {
  const limit = req.query.limit || 4;
  const result = await userService.getPublicTeachers(limit);
  res.send(new ApiResponse(httpStatus.OK, result, 'Teachers retrieved successfully'));
});
// ✅ Get current user's profile
const getMe = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(new ApiResponse(httpStatus.OK, user, 'Profile retrieved successfully'));
});

// ✅ Update current user's profile
const updateMe = catchAsync(async (req, res) => {
  // Prevent role/password change through this endpoint
  const allowedFields = [
    'name', 'email', 'phone',
    'subject', 'qualifications', 'experience', 'bio', 'expertise',
    'background', 'targetUnit',
  ];
  
  const updateBody = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateBody[field] = req.body[field];
    }
  });

  const user = await userService.updateUserById(req.user.id, updateBody);
  res.send(new ApiResponse(httpStatus.OK, user, 'Profile updated successfully'));
});

// ✅ Change password
const changePassword = catchAsync(async (req, res) => {
  await userService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  res.send(new ApiResponse(httpStatus.OK, null, 'Password changed successfully'));
});


module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPublicTeachers,
  getMe,
  updateMe,
  changePassword,
};
