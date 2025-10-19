import type { NextFunction, Request, Response } from 'express';
import type { CredentialsPayload } from '../decs';
import { getS3BucketUtil } from '../shared';

export const s3UtilLocalstackMW = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const credentials: CredentialsPayload = {
            localstack: true,
            bucketName: (req.query.bucket as string) || 'demo',
        } as CredentialsPayload;

        const s3Util = getS3BucketUtil(credentials);
        await s3Util.initBucket(credentials.acl, { skipInitializedBucket: true });

        res.locals.s3LocalstackUtil = s3Util;

        next();
    } catch (err: any) {
        res.status(401).json({ message: 'Invalid or expired credentials token' });
    }
};
