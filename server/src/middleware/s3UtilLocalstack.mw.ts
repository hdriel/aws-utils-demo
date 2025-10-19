import type { NextFunction, Request, Response } from 'express';
import type { CredentialsPayload } from '../decs';
import { getS3BucketUtil } from '../shared';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../consts';

export const s3UtilLocalstackMW = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.credentialsToken;
        let bucketName: string = (req.params?.bucket ?? req.query?.bucket) as string;

        try {
            if (!bucketName && token) {
                const decoded = jwt.verify(token, JWT_SECRET) as CredentialsPayload;
                bucketName = decoded.bucketName;
            }
        } catch {}

        const credentials: CredentialsPayload = {
            localstack: true,
            bucketName: bucketName || 'demo',
        } as CredentialsPayload;

        const s3Util = getS3BucketUtil(credentials);
        await s3Util.initBucket(credentials.acl, { skipInitializedBucket: true });

        res.locals.s3LocalstackUtil = s3Util;

        next();
    } catch (err: any) {
        res.status(401).json({ message: 'Invalid or expired credentials token' });
    }
};
