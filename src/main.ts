import * as dotenv from 'dotenv';

import * as dns from 'dns';

import * as path from 'path';

// Load .env.production for production environment
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.production') });
} else {
  // Default to .env file for development or other environments
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}

import { bootstrap } from './bootsrap';
bootstrap();
