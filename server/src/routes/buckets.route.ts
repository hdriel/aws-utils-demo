import express from 'express';
import {
    createBucketCtrl,
    deleteBucketCtrl,
    deleteLocalstackBucketCtrl,
    getBucketDirectoryTreeCtrl,
    getBucketInfoCtrl,
    getBucketListCtrl,
    getLocalstackBucketListCtrl,
} from '../controls/bucket.control';
import { logApiMW } from '../middleware/logAPI.mw';
import { s3UtilMW } from '../middleware/s3Util.mw';
import { s3UtilLocalstackMW } from '../middleware/s3UtilLocalstack.mw';

export const router: express.Router = express.Router();

router.use(logApiMW);

router.get('/', getBucketListCtrl);
router.get('/bucket-info', s3UtilMW, getBucketInfoCtrl);
router.get('/localstack', s3UtilLocalstackMW, getLocalstackBucketListCtrl);

router.get('/:bucket', s3UtilMW, getBucketDirectoryTreeCtrl);

router.post('/', s3UtilMW, createBucketCtrl);

router.delete('/:bucket', s3UtilMW, deleteBucketCtrl);

router.delete('/localstack/:bucket', s3UtilLocalstackMW, deleteLocalstackBucketCtrl);
