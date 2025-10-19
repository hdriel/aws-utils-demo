import env from './dotenv';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRY = '24h';
export const LOCALSTACK_ENDPOINT = env?.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
