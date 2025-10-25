import { NextFunction, Request, Response } from 'express';
import logger from '../logger';
import type { S3Util } from '@hdriel/aws-utils';
import { getS3BucketUtil } from '../shared';
import { CredentialsPayload } from '../decs';

export const getBucketListCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const region = req.query.region as string;
    const secretAccessKey = req.query.secretAccessKey as string;
    const accessKeyId = req.query.accessKeyId as string;
    if (!region || !secretAccessKey || !accessKeyId) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    try {
        const options: CredentialsPayload = {
            accessKeyId,
            secretAccessKey,
            region,
            bucketName: 'demo',
            localstack: false,
        };
        const bucketUtil = getS3BucketUtil(options);

        const result = await bucketUtil.getBucketList({ includePublicAccess: true });

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getBucketListCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getBucketInfoCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.bucketInfo();

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getBucketInfoCtrl', { errMsg: err.message });
        next(err);
    }
};

export const createBucketCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // handled on mw
        res.sendStatus(200);
    } catch (err: any) {
        logger.error(req.id, 'failed on createBucketCtrl', { errMsg: err.message });
        next(err);
    }
};

export const deleteBucketCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.destroyBucket(!!+(req.query.force ?? '0'));

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on deleteBucketCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getLocalstackBucketListCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3LocalstackUtil: S3Util = res.locals.s3LocalstackUtil;
        let result = await s3LocalstackUtil.getBucketList({ includePublicAccess: true });
        if (!result) {
            res.status(403).json({ error: 'Error on getting localstack bucket list' });
        }

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getLocalstackBucketListCtrl', { errMsg: err.message });
        next(err);
    }
};

export const deleteLocalstackBucketCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3LocalstackUtil: S3Util = res.locals.s3LocalstackUtil;
        const result = await s3LocalstackUtil.destroyBucket(true);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on deleteLocalstackBucketCtrl', { errMsg: err.message });
        next(err);
    }
};

// Not recommended to pull all bucket tree, could be bigger and failed to fetch
export const getBucketDirectoryTreeCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.directoryTree();

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getBucketDirectoryTreeCtrl', { errMsg: err.message });
        next(err);
    }
};
