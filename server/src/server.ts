import env from './dotenv';
import express, { Express, json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import logger from './logger';
import { initAppRoutes } from './routes/route';

export const app: Express = express();

const corsOptions: CorsOptions = {
    origin: env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
};
logger.debug(null, 'cors options', corsOptions);

// @ts-ignore
app.use(cors(corsOptions));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req: express.Request, _res: express.Response, next: any) => {
    req.id = req.id || 'UNKNOWN_ID';
    next();
});

initAppRoutes(app);

app.use((err: any, req: express.Request, res: express.Response, _next: any) => {
    logger.error(req.id, 'request error', {
        errorMsg: err.message,
        errorName: err.name,
        stackTraceLines: 3,
    });
    res.status(500).json({ message: err.message });
});

const PORT = +(env.SERVER_PORT || '5001');
app.listen(PORT, () => {
    logger.info(null, 'server is up', { port: PORT });
});
