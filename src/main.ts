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


// Force DNS to override systemd resolver (bypass 127.0.0.53)
dns.setServers(['8.8.8.8', '1.1.1.1']);
// import * as dns from 'dns';

// dns.resolve4('cluster0.mongodb.net', (err, addresses) => {
//   if (err) {
//     console.log('Error resolving DNS:', err);
//   } else {
//     console.log('Resolved MongoDB Atlas address:', addresses);
//   }
// });

// init environment
// dotenv.config({ path: __dirname + '/../.env', override: false });
import { bootstrap } from './bootsrap';
bootstrap();
