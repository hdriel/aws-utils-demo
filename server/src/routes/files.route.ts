import express from 'express';
import {
    getFileInfoCtrl,
    uploadFileDataCtrl,
    deleteFileCtrl,
    getFileDataCtrl,
    getFileUrlCtrl,
    getFileVersionCtrl,
    toggingFileVersionCtrl,
    uploadSingleFileCtrl,
    downloadFilesAsZipCtrl,
    streamVideoFilesCtrl,
    viewImageFileCtrl,
    uploadMultiFilesCtrl,
    viewFileContentCtrl,
    viewPdfFileCtrl,
} from '../controls/file.control';
import { logApiMW } from '../middleware/logAPI.mw';
import { s3UtilMW } from '../middleware/s3Util.mw';

export const router: express.Router = express.Router();

router.use(logApiMW);

router.post('/content', s3UtilMW, uploadFileDataCtrl);
router.post(['/upload/:fileType', '/upload'], s3UtilMW, uploadSingleFileCtrl);
router.post(['/multi-upload/:fileType', '/multi-upload'], s3UtilMW, uploadMultiFilesCtrl);

router.get('/image', s3UtilMW, viewImageFileCtrl);
router.get('/pdf', s3UtilMW, viewPdfFileCtrl);
router.get('/content', s3UtilMW, viewFileContentCtrl);

router.get('/download', s3UtilMW, downloadFilesAsZipCtrl);
router.get('/stream', s3UtilMW, streamVideoFilesCtrl);
router.get('/info', s3UtilMW, getFileInfoCtrl);
router.get('/data', s3UtilMW, getFileDataCtrl);
router.get('/url', s3UtilMW, getFileUrlCtrl);

router.get('/version', s3UtilMW, getFileVersionCtrl);
router.put('/version', s3UtilMW, toggingFileVersionCtrl);

router.delete('/', s3UtilMW, deleteFileCtrl);
