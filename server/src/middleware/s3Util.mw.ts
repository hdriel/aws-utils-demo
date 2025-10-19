import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../consts';
import type { CredentialsPayload } from '../decs';
import { getS3BucketUtil } from '../shared';

export const s3UtilMW = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.credentialsToken;

        if (!token) {
            res.status(401).json({ message: 'No credentials token found' });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as CredentialsPayload;

        // Store credentials in res.locals for use in route handlers
        res.locals.credentials = {
            accessKeyId: decoded.accessKeyId,
            secretAccessKey: decoded.secretAccessKey,
            region: decoded.region,
            localstack: decoded.localstack,
            bucketName: decoded.bucketName,
            acl: decoded.acl,
        };
        const s3Util = getS3BucketUtil(res.locals.credentials);
        await s3Util.initBucket(decoded.acl, { skipInitializedBucket: true });
        res.locals.s3Util = s3Util;

        next();
    } catch (err: any) {
        res.status(401).json({ message: 'Invalid or expired credentials token' });
    }
};
