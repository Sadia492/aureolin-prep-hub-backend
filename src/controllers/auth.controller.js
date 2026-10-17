const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');
const config = require('../config/config');
const emailService = require('../services/email.service');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res
    .status(httpStatus.CREATED)
    .send(
      new ApiResponse(httpStatus.CREATED, { user, tokens }, 'User registered successfully')
    );
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send(new ApiResponse(httpStatus.OK, { user, tokens }, 'Login successful'));
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Logout successful'));
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send(new ApiResponse(httpStatus.OK, { ...tokens }, 'Tokens refreshed successfully'));
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email
  );

  // ✅ Only send email if the user exists. Don't leak token in response.
  if (resetPasswordToken) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetPasswordToken}`;
    await emailService.sendResetPasswordEmail(req.body.email, resetUrl);
  }

  // ✅ Same response whether or not the email exists
  res.send(
    new ApiResponse(
      httpStatus.OK,
      null,
      'If that email is registered, a reset link has been sent.'
    )
  );
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
};
