const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const isDevelopment = nodeEnv === 'development';

const parseAllowedOrigins = () => {
  const origins = process.env.CORS_ALLOWED_ORIGINS;
  if (!origins || origins.trim() === '') {
    // Sensible development defaults
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];
  }
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseSocketAllowedOrigins = () => {
  const socketOriginEnv = process.env.SOCKET_CORS_ORIGIN;
  if (socketOriginEnv && socketOriginEnv.trim() !== '') {
    return socketOriginEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  const defaultOrigins = parseAllowedOrigins();
  const additional = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://admin.skffurniture.com',
  ];
  for (const origin of additional) {
    if (!defaultOrigins.includes(origin)) {
      defaultOrigins.push(origin);
    }
  }
  return defaultOrigins;
};

const env = {
  nodeEnv,
  isProduction,
  isTest,
  isDevelopment,
  port: parseInt(process.env.PORT, 10) || 7000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  cors: {
    allowedOrigins: parseAllowedOrigins(),
  },
  socket: {
    corsOrigins: parseSocketAllowedOrigins(),
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skf_db',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  },
  cookie: {
    name: process.env.REFRESH_COOKIE_NAME || 'refreshToken',
    secure: process.env.REFRESH_COOKIE_SECURE === 'true' || isProduction,
    sameSite: process.env.REFRESH_COOKIE_SAME_SITE || 'lax',
    domain: process.env.REFRESH_COOKIE_DOMAIN || undefined,
  },
  rateLimit: {
    loginMax: parseInt(process.env.AUTH_LOGIN_RATE_LIMIT, 10) || 10,
    registerMax: parseInt(process.env.AUTH_REGISTER_RATE_LIMIT, 10) || 5,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'skf_furniture',
  },
};

/**
 * Validates required environment variables during startup.
 */
function validateEnv() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
  const missing = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (isProduction) {
    const prodRequired = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
    for (const varName of prodRequired) {
      if (!process.env[varName] || process.env[varName].includes('your_jwt_access_secret_here')) {
        missing.push(varName);
      }
    }
  }

  if (missing.length > 0) {
    const errorMsg = `Environment configuration error: Missing required variables [${missing.join(', ')}]`;
    if (isProduction) {
      throw new Error(errorMsg);
    } else {
      console.warn(`[Config Warning] ${errorMsg}`);
    }
  }
}

module.exports = {
  env,
  validateEnv,
};
