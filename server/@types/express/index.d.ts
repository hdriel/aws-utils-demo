import { S3Util } from '@hdriel/aws-utils';
export {};

declare global {
    namespace Express {
        interface Request {
            id: string;
            user?: any;
            token?: any;
            ua?: string;
            userAgent?: any;
            mac?: any;
        }
        interface Response {
            s3Util: S3Util;
        }
    }
}
