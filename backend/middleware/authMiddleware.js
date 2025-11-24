const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.body.token ||
      req.query.token ||
      req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const userData = await User.verifyToken(token);
    if (!userData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // ✅ Только логин
    req.player = {
      login: userData.login,
    };

    // ✅ Сохраняем токен, если нужно
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = authMiddleware;
