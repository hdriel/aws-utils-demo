import express, { NextFunction, Response, Request } from 'express';
import { isLocalstackLiveCtrl } from '../controls/credentials.control';

export const router: express.Router = express.Router();

router.get('/', (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({ status: 'OK' });
});

router.get('/health', (_req, res) => res.send('OK'));

router.get('/health/localstack', isLocalstackLiveCtrl);
