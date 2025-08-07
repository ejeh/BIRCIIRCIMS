// 1. First validate and set the environment
const VALID_ENVIRONMENTS = ['development', 'production', 'test'] as const;
type NodeEnv = (typeof VALID_ENVIRONMENTS)[number];

const NODE_ENV: NodeEnv = (() => {
  const env = process.env.NODE_ENV;

  // If no environment specified, default based on some conditions
  if (!env) {
    const isInLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    console.warn(
      `NODE_ENV not set! Defaulting to ${isInLambda ? 'production' : 'development'}`,
    );
    return isInLambda ? 'production' : 'development';
  }

  // Validate the environment
  if (!VALID_ENVIRONMENTS.includes(env as NodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: ${env}. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`,
    );
  }

  return env as NodeEnv;
})();

// Environment checks
const isDev = NODE_ENV === 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

// Get the appropriate database URL based on environment
const getDatabaseUrl = () => {
  if (isProd) {
    if (!process.env.MONGO_CONNECTION_URL) {
      throw new Error('MONGO_CONNECTION_URL is required in production');
    }
    return process.env.MONGO_CONNECTION_URL;
  }

  // For development and test environments
  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is required in development/test');
  }
  return process.env.MONGO_URL;
};

// Main configuration object
const config = {
  // Environment flags
  isDev,
  isProd,
  isTest,
  nodeEnv: NODE_ENV,

  // Server configuration
  host: process.env.API_HOST,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,

  // Database configuration - uses appropriate URL based on environment
  db: getDatabaseUrl(),

  // Mail configuration
  mail: {
    from: {
      name: process.env.MAIL_FROM_NAME,
      address: process.env.MAIL_FROM_ADDRESS,
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: (process.env.CORS_METHODS || 'POST,GET,PUT,OPTIONS,DELETE,PATCH')
      .split(',')
      .map((method) => method.trim()),
    allowedHeaders: [
      'Timezone-Offset',
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'authorization',
      ...(process.env.EXTRA_CORS_HEADERS
        ? process.env.EXTRA_CORS_HEADERS.split(',')
        : []),
      '*',
    ].join(','),
    preflightContinue: false,
    optionsSuccessStatus: 200,
  },

  // Authentication configuration
  auth: {
    jwtTokenExpireInSec: process.env.JWT_EXPIRATION || '100d',
    passwordResetExpireInMs: parseInt(
      process.env.PASSWORD_RESET_EXPIRATION || '3600000',
      10,
    ),
    activationExpireInMs: parseInt(
      process.env.ACTIVATION_EXPIRATION || '86400000',
      10,
    ),
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
    secret: process.env.AUTH_SECRET || 'secret',
  },

  // Static assets configuration
  static: {
    maxAge: isProd ? '1d' : 0,
  },
};

// Database URL export
const dbUrl = config.db;

export default config;
export { dbUrl, NODE_ENV };
