import env from '../dotenv';
import { ACLs, S3Util, S3LocalstackUtil } from '@hdriel/aws-utils';
import logger from '../logger';
import type { CredentialsPayload } from '../decs';

/**
 * probably in your personal project you will initialize this instance immediately from your env variable.
 * for example:
 * ```javascript
 *      export const s3Utils = new S3Util({
 *          accessKeyId: env?.AWS_ACCESS_KEY_ID,
 *          region: env?.AWS_REGION,
 *          secretAccessKey: env?.AWS_SECRET_ACCESS_KEY,
 *          endpoint: env?.AWS_ENDPOINT,
 *          bucket: env?.PROJECT_BUCKET,
 *          logger,
 *      });
 * ```
 * here in this project I simulate multiple credentials connections for this project proposes
 */

export const getS3BucketUtil = ({
    accessKeyId,
    region,
    secretAccessKey,
    endpoint,
    localstack,
    bucketName,
}: Omit<CredentialsPayload, 'acl'>) => {
    if (localstack) {
        return new S3LocalstackUtil({
            accessKeyId: env?.LOCALSTACK_ACCESS_KEY_ID,
            secretAccessKey: env?.LOCALSTACK_SECRET_ACCESS_KEY,
            region: env?.LOCALSTACK_REGION,
            endpoint: env?.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
            bucket: bucketName,
            logger,
        });
    }

    return new S3Util({
        accessKeyId,
        region,
        secretAccessKey,
        endpoint,
        bucket: bucketName,
        logger,
    });
};

export const changeS3BucketUtil = async (s3BucketUtil: S3Util, bucketName: string, acl: ACLs) => {
    s3BucketUtil.changeBucket(bucketName);
    await s3BucketUtil.initBucket(acl);

    return s3BucketUtil;
};
