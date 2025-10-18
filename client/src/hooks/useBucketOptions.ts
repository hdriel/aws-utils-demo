import { useEffect, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';
import { DEFAULT_REGIONS_OPTION_VALUE } from '../consts.ts';

export const useBucketOptions = ({ bucketName, isLocalstack, credentials, setShowLocalstack, setCredentials }: any) => {
    const [localstackBuckets, setLocalstackBuckets] = useState<
        Array<{
            id: string;
            label: string;
            region: string;
            date: Date;
            public: boolean;
        }>
    >([]);
    const [awsBuckets, setAwsBuckets] = useState<
        Array<{
            id: string;
            label: string;
            region: string;
            date: Date;
            public: boolean;
        }>
    >([]);
    const [bucketOptions, setBucketOptions] = useState<
        Array<{
            id: string;
            label: string;
            region: string;
            date: Date;
            public: boolean;
        }>
    >([]);

    const loadLocalstackBucketList = async () => {
        return s3Service
            .localstackBucketsList()
            .then((buckets) => {
                const options = buckets.map(({ Name, BucketRegion, CreationDate, PublicAccessBlockConfiguration }) => ({
                    id: Name,
                    label: Name,
                    region: BucketRegion,
                    date: new Date(CreationDate),
                    public: !PublicAccessBlockConfiguration.BlockPublicPolicy,
                }));
                setBucketOptions(options);
                setLocalstackBuckets(options);
            })
            .catch(console.error);
    };

    const loadBucketList = async () => {
        return s3Service
            .listBuckets(credentials)
            .then((buckets) => {
                const options = buckets.map(({ Name, BucketRegion, CreationDate, PublicAccessBlockConfiguration }) => ({
                    id: Name,
                    label: Name,
                    region: BucketRegion,
                    date: new Date(CreationDate),
                    public: !PublicAccessBlockConfiguration.BlockPublicPolicy,
                }));
                setAwsBuckets(options);
                setBucketOptions(options);
            })
            .catch(console.error);
    };

    const isLocalstackAvailable = async (): Promise<boolean> => {
        return s3Service
            .localstackAlive()
            .then((isAlive) => {
                setShowLocalstack(isAlive);
                if (!isAlive) {
                    setCredentials({
                        accessKeyId: sessionStorage.getItem('accessKeyId') ?? '',
                        secretAccessKey: sessionStorage.getItem('secretAccessKey') ?? '',
                        region: sessionStorage.getItem('region') ?? DEFAULT_REGIONS_OPTION_VALUE,
                    });
                }
                return isAlive;
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    };

    useEffect(() => {
        setBucketOptions(isLocalstack ? localstackBuckets : awsBuckets);
    }, [isLocalstack]);

    useEffect(() => {
        isLocalstackAvailable()
            .then((isAlive) => {
                if (isAlive) return loadLocalstackBucketList();
            })
            .then(() => loadBucketList())
            .catch(console.error);
    }, []);

    const selectedOption = bucketOptions.find((b) => b.id === bucketName);

    return { selectedOption, bucketOptions, loadBucketList, loadLocalstackBucketList };
};
