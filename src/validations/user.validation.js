// backend/src/validations/user.validation.js
const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { roles } = require('../config/roles');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    phone: Joi.string().optional(),
    role: Joi.string()
      .valid(...roles)
      .default('student'),
    // Student fields
    background: Joi.string().optional(),
    targetUnit: Joi.string().optional(),
    // Teacher fields
    subject: Joi.string().optional(),
    qualifications: Joi.string().optional(),
    experience: Joi.string().optional(),
    bio: Joi.string().optional(),
    expertise: Joi.array().items(Joi.string()).optional(),
    avatar: Joi.string().optional(),
    isActive: Joi.boolean().default(true),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string().optional(),
    phone: Joi.string().optional(),
    role: Joi.string().optional(),
    subject: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().default(10),
    page: Joi.number().integer().default(1),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
const getPublicTeachers = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(4),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email().optional(),
      password: Joi.string().custom(password).optional(),
      name: Joi.string().optional(),
      phone: Joi.string().optional(),
      role: Joi.string().valid(...roles).optional(),
      // Student fields
      background: Joi.string().optional(),
      targetUnit: Joi.string().optional(),
      // Teacher fields
      subject: Joi.string().optional(),
      qualifications: Joi.string().optional(),
      experience: Joi.string().optional(),
      bio: Joi.string().optional(),
      expertise: Joi.array().items(Joi.string()).optional(),
      avatar: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
// ✅ Update own profile validation
const updateMe = {
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      phone: Joi.string().allow(''),
      // Teacher fields
      subject: Joi.string().allow(''),
      qualifications: Joi.string().allow(''),
      experience: Joi.string().allow(''),
      bio: Joi.string().allow(''),
      expertise: Joi.array().items(Joi.string()),
      // Student fields
      background: Joi.string().valid('Science', 'Business Studies', 'Humanities'),
      targetUnit: Joi.string().valid('A Unit', 'C Unit', 'A & C Unit'),
    })
    .min(1),
};

// ✅ Change password validation
const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password),
  }),
};


module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPublicTeachers,
  updateMe,
  changePassword,
};