import { NextFunction, Request, Response } from 'express';
import type { S3Util } from '@hdriel/aws-utils';
import logger from '../logger';

export const getDirectoryListCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;

        const directory = req.query?.directory as string; // already handled decodeURIComponent inside s3Util
        const pageNumber = req.query?.page ? +req.query?.page : undefined;
        const pageSize = req.query?.size ? +req.query?.size : undefined;

        // const result = await s3Util.directoryList(directory); // get ALL directory keys
        const result = await s3Util.directoryListPaginated(directory, { pageNumber, pageSize });

        logger.info(req.id, 'get directory file list from directory.', {
            directory,
            pageNumber,
            pageSize,
            totalFetched: result.totalFetched,
        });
        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getDirectoryListCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getDirectoryFileListCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;

        const directory = req.query?.directory as string; // already handled decodeURIComponent inside s3Util
        const pageNumber = req.query?.page ? +req.query?.page : undefined;
        const pageSize = req.query?.size ? +req.query?.size : undefined;

        // const result = await s3Util.fileList(directory); // get ALL directory files info
        const result = await s3Util.fileListPaginated(directory, { pageNumber, pageSize });

        logger.info(req.id, 'get directory file list from directory.', {
            directory,
            pageNumber,
            pageSize,
            totalFetched: result.totalFetched,
        });
        res.json(result.files);
    } catch (err: any) {
        logger.error(req.id, 'failed on getDirectoryFileListCtrl', { errMsg: err.message });
        next(err);
    }
};

export const createDirectoryCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const directory = req.body?.directory as string;
        if (!directory) {
            return next(new Error('No directory path provided for creating directory action'));
        }

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.createDirectory(directory);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on createDirectoryCtrl', { errMsg: err.message });
        next(err);
    }
};

export const deleteDirectoryCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const directory = req.params?.directory as string;
        if (!directory) {
            throw Error('No directory path provided for deleting directory action');
        }

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.deleteDirectory(directory);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on deleteDirectoryCtrl', { errMsg: err.message });
        next(err);
    }
};
