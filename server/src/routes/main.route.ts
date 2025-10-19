import express from 'express';
import { setCredentialsCtrl, unsetCredentialsCtrl } from '../controls/credentials.control';
import { logApiMW } from '../middleware/logAPI.mw';
import { s3UtilMW } from '../middleware/s3Util.mw';

export const router: express.Router = express.Router();

router.use(logApiMW);

router.post('/credentials', logApiMW, setCredentialsCtrl);

router.post('/disconnect', logApiMW, s3UtilMW, unsetCredentialsCtrl);
