import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import logger from './logger';
import path from 'pathe';

const ENV_FILE_PATH = path.resolve('.env.local');
const myEnv = dotenv.config({ path: ENV_FILE_PATH });
expand(myEnv);

const env: any = myEnv.parsed;

logger.info('SYSTEM', `initializing dotenv file`, {
    path: ENV_FILE_PATH,
    env: JSON.stringify(env, null, 4),
});

export default env;
