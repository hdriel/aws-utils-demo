import { NextFunction, Request, Response } from 'express';
import type { S3Util } from '@hdriel/aws-utils';
import logger from '../logger';

export const getDirectoryListCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const directory = req.query?.directory ? decodeURIComponent(req.query?.directory as string) : '';
        const pageNumber = req.query?.page ? +req.query?.page : undefined;
        const pageSize = req.query?.size ? +req.query?.size : undefined;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.directoryListPaginated(directory, { pageNumber, pageSize });

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getDirectoryListCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getDirectoryFileListCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const directory = req.query?.directory ? decodeURIComponent(req.query?.directory as string) : undefined;
        const pageNumber = req.query?.page ? +req.query?.page : undefined;
        const pageSize = req.query?.size ? +req.query?.size : undefined;

        const s3Util: S3Util = res.locals.s3Util;
        const { files: result } = await s3Util.fileListInfoPaginated(directory, { pageNumber, pageSize });
        result.forEach((file) => {
            // @ts-ignore
            file.link = file.Location; // todo: get in client from Location field
        });

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getDirectoryFileListCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getDirectoryTreeCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const directory = req.query?.directory ? decodeURIComponent(req.query?.directory as string) : undefined;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.directoryTree(directory);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getDirectoryTreeCtrl', { errMsg: err.message });
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
        const directory = req.body?.directory as string;
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
