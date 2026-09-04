const jwt = require('jsonwebtoken');
const httpStatus = require('http-status').default;
const config = require('../config/config');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const auth = (...requiredRights) => async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    const payload = jwt.verify(token, config.jwt.secret);
    
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
    }

    req.user = user;

    if (requiredRights.length) {
      const userRights = roleRights.get(user.role) || [];
      const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
      if (!hasRequiredRights && req.params.userId !== user.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    } else {
      next(error);
    }
  }
};

module.exports = auth;
