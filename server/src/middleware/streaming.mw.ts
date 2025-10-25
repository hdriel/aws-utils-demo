import { NextFunction, Request, Response } from 'express';
import { FILE_TYPE, type S3Util, UploadedS3File } from '../shared';
import logger from '../logger';

export const uploadSingleFileMW = (req: Request & { s3File?: UploadedS3File }, res: Response, next: NextFunction) => {
    try {
        const fileType = req.params?.fileType as FILE_TYPE;

        if (!req.headers.hasOwnProperty('x-upload-directory')) {
            return res.status(400).json({ error: 'Directory header is required' });
        }

        const directory = (req.headers['x-upload-directory'] as string) || '';
        const filename = req.headers['x-upload-filename'] as string;

        logger.info(req.id, 'uploading single file', { filename, directory });

        const s3Util: S3Util = res.locals.s3Util;
        const uploadMiddleware = s3Util.uploadSingleFile('file', directory, {
            ...(fileType && { fileType }),
            ...(filename && { filename }),
        });

        return uploadMiddleware(req, res, next);
    } catch (err: any) {
        logger.error(req.id, 'failed on uploadMultiFilesCtrl', { errMsg: err.message });
        next(err);
    }
};

export const uploadMultiFilesMW = (
    req: Request & { s3Files?: UploadedS3File[] },
    res: Response,
    next: NextFunction
) => {
    try {
        const fileType = req.params?.fileType as FILE_TYPE;
        if (!req.headers.hasOwnProperty('x-upload-directory')) {
            return res.status(400).json({ error: 'Directory header is required' });
        }

        const directory = (req.headers['x-upload-directory'] as string) || '/';
        logger.info(req.id, 'uploading multiple files', { directory });

        const s3Util: S3Util = res.locals.s3Util;
        const uploadMiddleware = s3Util.uploadMultipleFiles('files', directory, { ...(fileType && { fileType }) });

        return uploadMiddleware(req, res, next);
    } catch (err: any) {
        logger.warn(req.id, 'failed to upload files', { message: err.message });
        next(err);
    }
};
