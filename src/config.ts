export default {
  isDev,
  isProd,
  isTest,
  host: process.env.API_HOST,
  port: process.env.PORT,
  db: process.env.MONGO_CONNECTION_URL,
  mail: {
    from: {
      name: process.env.MAIL_FROM_NAME,
      address: process.env.MAIL_FROM_ADDRESS,
    },
  },

  cors: {
    origin: '*',
    methods: 'POST,GET,PUT,OPTIONS,DELETE, PATCH',
    allowedHeaders:
      'Timezone-Offset,Origin,X-Requested-With,Content-Type,Accept,Authorization,authorization,*',
    preflightContinue: false,
    optionsSuccessStatus: 200,
  },
  auth: {
    jwtTokenExpireInSec: '100d', // 1 day
    passwordResetExpireInMs: 60 * 60 * 1000, // 1 hour
    activationExpireInMs: 24 * 60 * 60 * 1000, // 1 day
    saltRounds: 10,
    secret: process.env.AUTH_SECRET ?? 'secret',
  },
  static: {
    maxAge: isProd() ? '1d' : 0,
  },
};

export const dbUrl = process.env.MONGO_CONNECTION_URL;

function isDev() {
  return process.env.NODE_ENV === 'development';
}

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function isTest() {
  return process.env.NODE_ENV === 'test';
}
