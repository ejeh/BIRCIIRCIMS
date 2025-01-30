import * as dotenv from 'dotenv';
// init environment
dotenv.config({ path: __dirname + '/../.env', override: false });
import { bootstrap } from './bootsrap';
bootstrap();
