import { useEffect, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';

export const useBucketOptions = ({ bucketName, isLocalstack, credentials, localstackExists }: any) => {
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

    useEffect(() => {
        setBucketOptions(isLocalstack ? localstackBuckets : awsBuckets);
    }, [isLocalstack]);

    useEffect(() => {
        if (localstackExists) {
            loadLocalstackBucketList();
        } else {
            loadBucketList();
        }
    }, [localstackExists]);

    const selectedOption = bucketOptions.find((b) => b.id === bucketName);

    console.log('selectedOption', selectedOption);

    return { selectedOption, bucketOptions, loadBucketList, loadLocalstackBucketList };
};
