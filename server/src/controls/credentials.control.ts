import axios from 'axios';
import env from '../dotenv';
import ms from 'ms';
import { NextFunction, Request, Response } from 'express';
import { getS3BucketUtil } from '../shared';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRY, JWT_SECRET, LOCALSTACK_ENDPOINT } from '../consts';
import type { CredentialsPayload } from '../decs';
import { ACLs } from '@hdriel/aws-utils';

export const setCredentialsCtrl = async (req: Request, res: Response, _next: NextFunction) => {
    const localstack = Boolean(req.body.localstack);
    const accessKeyId = req.body?.accessKeyId as string;
    const secretAccessKey = req.body?.secretAccessKey as string;
    const region = req.body?.region as string;
    const bucketName = req.body?.bucket as string;
    const acl = req.body?.acl as ACLs;
    const endpoint = localstack ? LOCALSTACK_ENDPOINT : undefined;

    try {
        if ([accessKeyId, region, secretAccessKey, bucketName].every((v) => v)) {
            const payload: CredentialsPayload = {
                accessKeyId,
                secretAccessKey,
                region,
                endpoint,
                localstack,
                bucketName,
                acl,
            };

            getS3BucketUtil(payload);

            const expiresInMS = ms(JWT_EXPIRY);
            const expiresInSeconds = expiresInMS / 1000;
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });

            // Store JWT in HTTP-only cookie
            res.cookie('credentialsToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                maxAge: expiresInMS,
            });

            res.status(200).json({ message: 'Credentials stored successfully' });
        } else {
            res.status(403).json({ message: 'MISSING CREDENTIALS' });
        }
    } catch (err: any) {
        res.status(403).json({ message: err.message });
    }
};

export const unsetCredentialsCtrl = (_req: Request, res: Response, _next: NextFunction) => {
    res.clearCookie('credentialsToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
    });
    res.status(200).json({ message: 'Disconnected successfully' });
};

export const isLocalstackLiveCtrl = async (_req: Request, res: Response, _next: NextFunction) => {
    try {
        const response = await axios(`${env?.LOCALSTACK_ENDPOINT ?? 'http://localhost:4566'}/_localstack/health`, {
            timeout: 2000,
        });

        return res.send(response.status === 200);
    } catch (error: any) {
        return res.status(403).json({ message: error.message });
    }
};
