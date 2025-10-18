import env from '../dotenv';
import { ACLs, S3BucketUtil } from '@hdriel/aws-utils';
import logger from '../logger';

let s3BucketUtil: null | S3BucketUtil;
let localstackS3BucketUtil: S3BucketUtil;
// probably in your project you will initialize this instance immediately from your env variable
// here in this project I simulate connections from multiple credentials

export const getS3BucketUtil = () => {
    return s3BucketUtil;
};

export const changeS3BucketUtil = async (bucketName: string, acl: ACLs) => {
    s3BucketUtil = new S3BucketUtil({ bucket: bucketName, logger });
    await s3BucketUtil.initBucket(acl);

    return s3BucketUtil;
};

export const removeS3BucketUtil = () => {
    s3BucketUtil = null;
};

export const getLocalstackS3BucketUtil = (bucketName?: string) => {
    if (!env) throw Error('env must be a defined');

    if (!localstackS3BucketUtil || localstackS3BucketUtil?.bucket !== bucketName) {
        const options = {
            accessKeyId: env?.LOCALSTACK_ACCESS_KEY_ID,
            secretAccessKey: env?.LOCALSTACK_SECRET_ACCESS_KEY,
            region: env?.LOCALSTACK_REGION,
            endpoint: env?.LOCALSTACK_ENDPOINT,
            bucket: bucketName ?? 'demo',
            logger,
        };
        localstackS3BucketUtil = new S3BucketUtil(options);

        const { logger: _logger, ...logOptions } = options;
        logger.info(null, 'localstack s3-bucket-util created', logOptions);
    }

    return localstackS3BucketUtil;
};
