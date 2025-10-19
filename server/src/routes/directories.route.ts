import express from 'express';
import {
    createDirectoryCtrl,
    deleteDirectoryCtrl,
    getDirectoryFileListCtrl,
    getDirectoryListCtrl,
    getDirectoryTreeCtrl,
} from '../controls/directory.control';
import { logApiMW } from '../middleware/logAPI.mw';
import { s3UtilMW } from '../middleware/s3Util.mw';

export const router: express.Router = express.Router();

router.use(logApiMW);

router.get('/', s3UtilMW, getDirectoryListCtrl);

router.get('/files', s3UtilMW, getDirectoryFileListCtrl);

router.get('/tree', s3UtilMW, getDirectoryTreeCtrl);

router.get('/tree/:directory', s3UtilMW, getDirectoryTreeCtrl);

router.post('/', s3UtilMW, createDirectoryCtrl);

router.delete('/', s3UtilMW, deleteDirectoryCtrl);
