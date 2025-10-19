import { ACLs } from '@hdriel/aws-utils';

export interface CredentialsPayload {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint?: string;
    localstack: boolean;
    bucketName: string;
    acl?: ACLs;
}
