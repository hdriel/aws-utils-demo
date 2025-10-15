import env from './dotenv';
import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import logger from './logger';
import { initAppRoutes } from './routes/route';

export const app: Express = express();

// @ts-ignore
app.use(cors());
// app.use(cors({ origin: [env.CLIENT_URL as string].filter((v) => v) }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req: express.Request, _res: express.Response, next: any) => {
    req.id = req.id || 'UNKNOWN_ID';
    next();
});

initAppRoutes(app);

app.use((err: any, req: express.Request, res: express.Response, _next: any) => {
    logger.error(req.id, 'request error', {
        errorMsg: err.message,
        errorName: err.name,
        error: err,
        stackTraceLines: 3,
    });
    res.status(500).json({ message: err.message });
});

const PORT = +(env.SERVER_PORT || '5001');
app.listen(PORT, () => {
    logger.info(null, 'server is up', { port: PORT });
});
