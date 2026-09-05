// backend/src/validations/auth.validation.js
const Joi = require('joi');
const { password } = require('./custom.validation');
const { roles } = require('../config/roles');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    phone: Joi.string().optional(),
    role: Joi.string().valid(...roles).default('student'),
    // Student specific fields
    background: Joi.string().when('role', {
      is: 'student',
      then: Joi.string().valid('Science', 'Business Studies', 'Humanities').required(),
      otherwise: Joi.string().optional(),
    }),
    targetUnit: Joi.string().when('role', {
      is: 'student',
      then: Joi.string().valid('A Unit', 'C Unit', 'A & C Unit').required(),
      otherwise: Joi.string().optional(),
    }),
    // Teacher specific fields (for admin creating teachers)
    subject: Joi.string().when('role', {
      is: 'teacher',
      then: Joi.string().required(),
      otherwise: Joi.string().optional(),
    }),
    qualifications: Joi.string().when('role', {
      is: 'teacher',
      then: Joi.string().optional(),
      otherwise: Joi.string().optional(),
    }),
    experience: Joi.string().when('role', {
      is: 'teacher',
      then: Joi.string().optional(),
      otherwise: Joi.string().optional(),
    }),
    bio: Joi.string().when('role', {
      is: 'teacher',
      then: Joi.string().optional(),
      otherwise: Joi.string().optional(),
    }),
    expertise: Joi.array().items(Joi.string()).when('role', {
      is: 'teacher',
      then: Joi.array().optional(),
      otherwise: Joi.array().optional(),
    }),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
};