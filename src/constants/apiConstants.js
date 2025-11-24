// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGN_UP: '/auth/signup',
    SIGN_IN: '/auth/signin',
    SIGN_OUT: '/auth/signout',
    REFRESH_TOKEN: '/auth/refresh-token',
    GET_CURRENT_USER: '/auth/me',
  },
  GAME: {
    CREATE: '/game/create',
    JOIN: '/game/join',
    GET_GAMES: '/game/list',
    GET_GAME_DETAILS: '/game/:id',
  },
  USER: {
    GET_PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    GET_STATISTICS: '/user/statistics',
  },
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
}

// API Messages
export const API_MESSAGES = {
  SUCCESS: {
    SIGN_UP: 'Sign up successful!',
    SIGN_IN: 'Sign in successful!',
    SIGN_OUT: 'Sign out successful!',
    UPDATE_PROFILE: 'Profile updated successfully!',
  },
  ERROR: {
    SIGN_UP_FAILED: 'Sign up failed. Please try again.',
    SIGN_IN_FAILED: 'Sign in failed. Please check your credentials.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Unauthorized. Please sign in again.',
    SERVER_ERROR: 'Server error. Please try again later.',
  },
}