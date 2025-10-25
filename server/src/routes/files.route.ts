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
    downloadFileCtrl,
} from '../controls/file.control';
import { logApiMW } from '../middleware/logAPI.mw';
import { s3UtilMW } from '../middleware/s3Util.mw';
import { uploadMultiFilesMW, uploadSingleFileMW } from '../middleware/streaming.mw';

export const router: express.Router = express.Router();

router.use(logApiMW);

router.post('/:file/content', s3UtilMW, uploadFileDataCtrl);
router.post(['/upload/:fileType', '/upload'], s3UtilMW, uploadSingleFileMW, uploadSingleFileCtrl);
router.post(['/multi-upload/:fileType', '/multi-upload'], s3UtilMW, uploadMultiFilesMW, uploadMultiFilesCtrl);

router.get('/:file/image', s3UtilMW, viewImageFileCtrl);
router.get('/:file/pdf', s3UtilMW, viewPdfFileCtrl);
router.get('/:file/content', s3UtilMW, viewFileContentCtrl);

router.get('/download-zip', s3UtilMW, downloadFilesAsZipCtrl);
router.get('/download', s3UtilMW, downloadFileCtrl);
router.get('/stream', s3UtilMW, streamVideoFilesCtrl);
router.get('/:file/info', s3UtilMW, getFileInfoCtrl);
router.get('/:file/data', s3UtilMW, getFileDataCtrl);
router.get('/:file/url', s3UtilMW, getFileUrlCtrl);

router.get('/:file/version', s3UtilMW, getFileVersionCtrl);
router.put('/:file/version', s3UtilMW, toggingFileVersionCtrl);

router.delete('/', s3UtilMW, deleteFileCtrl);
