import * as dotenv from 'dotenv';

import * as dns from 'dns';

// Force DNS to override systemd resolver (bypass 127.0.0.53)
// dns.setServers(['8.8.8.8', '1.1.1.1']);
// init environment
dotenv.config({ path: __dirname + '/../.env', override: false });
import { bootstrap } from './bootsrap';
bootstrap();
