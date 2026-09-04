const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');
const config = require('../config/config');

const setTokenCookies = (res, tokens) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken', tokens.access.token, {
    ...cookieOptions,
    expires: tokens.access.expires,
  });

  res.cookie('refreshToken', tokens.refresh.token, {
    ...cookieOptions,
    expires: tokens.refresh.expires,
  });
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  setTokenCookies(res, tokens);
  res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, { user, tokens }, 'User registered successfully'));
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  setTokenCookies(res, tokens);
  res.send(new ApiResponse(httpStatus.OK, { user, tokens }, 'Login successful'));
});

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  await authService.logout(refreshToken);

  clearTokenCookies(res);

  res.status(httpStatus.OK).send(
    new ApiResponse(
      httpStatus.OK,
      null,
      'Logout successful'
    )
  );
});

const refreshTokens = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshAuth(refreshToken);
  setTokenCookies(res, tokens);
  res.send(new ApiResponse(httpStatus.OK, { ...tokens }, 'Tokens refreshed successfully'));
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  // In a real app, send email here. For now, we'll return the token in the response.
  res.send(new ApiResponse(httpStatus.OK, { resetPasswordToken }, 'Reset password token generated'));
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
