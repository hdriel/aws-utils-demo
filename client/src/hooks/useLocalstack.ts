import { useEffect, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';

export const useLocalstack = () => {
    const [localstackExists, setLocalstackExists] = useState<boolean>(true);

    const isLocalstackAvailable = async (): Promise<boolean> => {
        const isAlive = await s3Service.localstackAlive().catch((error) => {
            console.error(error);
            return false;
        });

        setLocalstackExists(isAlive);

        return isAlive;
    };

    useEffect(() => {
        isLocalstackAvailable().then(setLocalstackExists).catch(console.error);
    }, []);

    return localstackExists;
};
