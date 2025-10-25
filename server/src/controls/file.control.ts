import { NextFunction, Request, Response } from 'express';
import type { S3Util, UploadedS3File } from '../shared';
import logger from '../logger';

export const getFileInfoCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const _filePath = req.query?.filePath as string;

    try {
        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.fileInfo(_filePath);
        const versionResult = await s3Util.fileVersion(_filePath);
        const filePath = result.Key.split('/').slice(0, -1).join('/');

        const data = {
            filePath: filePath ? `/${filePath}` : '/',
            fileName: result.Name,
            size: result.ContentLength,
            type: result.ContentType,
            lastModified: result.LastModified,
            version: versionResult,
        };

        res.json(data);
    } catch (err: any) {
        logger.error(req.id, 'failed on getFileInfoCtrl', { errMsg: err.message, file: _filePath });
        next(err);
    }
};

export const getFileDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = req.query?.filePath as string;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.fileContent(filePath, 'utf8');

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getFileDataCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getFileUrlCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = req.query?.filePath as string;
        const expireIn = req.query?.expireIn ? +req.query.expireIn : undefined;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.fileUrl(filePath, expireIn);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getFileUrlCtrl', { errMsg: err.message });
        next(err);
    }
};

export const getFileVersionCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = req.query?.filePath as string;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.fileVersion(filePath);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on getFileVersionCtrl', { errMsg: err.message });
        next(err);
    }
};

export const toggingFileVersionCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = req.query?.filePath as string;
        const version = req.body?.version as string;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.taggingFile(filePath, { Key: 'version', Value: version });

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on toggingFileVersionCtrl', { errMsg: err.message });
        next(err);
    }
};

export const deleteFileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePath = req.query?.file as string;

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.deleteFile(filePath);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on deleteFileCtrl', { errMsg: err.message });
        next(err);
    }
};

export const uploadSingleFileCtrl = (
    req: Request & { s3File?: UploadedS3File },
    res: Response,
    _next: NextFunction
) => {
    const s3File = req.s3File;

    if (s3File) {
        const file = {
            key: s3File.key,
            location: s3File.location,
            bucket: s3File.bucket,
            etag: s3File.etag,
            // @ts-ignore
            size: s3File.size,
        };

        // todo: store your fileKey in your database

        logger.info(req.id, 'file uploaded', file);
        return res.json({ success: true, file });
    }

    return res.status(400).json({ error: 'No file uploaded' });
};

export const uploadMultiFilesCtrl = (
    req: Request & { s3Files?: UploadedS3File[] },
    res: Response,
    _next: NextFunction
) => {
    const s3Files = req.s3Files;

    if (s3Files?.length) {
        const files = s3Files.map((s3File) => ({
            key: s3File.key,
            location: s3File.location,
            bucket: s3File.bucket,
            etag: s3File.etag,
            // @ts-ignore
            size: s3File.size,
        }));

        // todo: store your fileKey in your database

        logger.info(req.id, 'files uploaded', files);
        return res.json({ success: true, files });
    }

    return res.status(400).json({ error: 'No file uploaded' });
};

export const viewImageFileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;
        const mw = s3Util.getImageFileViewCtrl({
            // fileKey: req.query?.filePath as string, // you get pass the fileKey yourself
            // queryField: 'file', // default value
        });

        return mw(req, res, next);
    } catch (err: any) {
        logger.error(req.id, 'failed on viewImageFileCtrl', { errMsg: err.message });
        next(err);
    }
};

export const viewFileContentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;
        const mw = s3Util.getPdfFileViewCtrl({
            // fileKey: req.query?.filePath as string, // you get pass the fileKey yourself
            // queryField: 'file', // default value
        });

        return mw(req, res, next);
    } catch (err: any) {
        logger.error(req.id, 'failed on viewFileContentCtrl', { errMsg: err.message });
        next(err);
    }
};

export const viewPdfFileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const s3Util: S3Util = res.locals.s3Util;
        const mw = await s3Util.getStreamFileCtrl(req.query?.file as string, { forDownloading: false });

        return mw(req, res, next);
    } catch (err: any) {
        logger.error(req.id, 'failed on viewFileContentCtrl', { errMsg: err.message });
        next(err);
    }
};

export const uploadFileDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fileKey = req.body?.path as string;
        const fileContent = (req.body?.data as string) || '';

        const s3Util: S3Util = res.locals.s3Util;
        const result = await s3Util.uploadFile(fileKey, fileContent);

        res.json(result);
    } catch (err: any) {
        logger.error(req.id, 'failed on uploadFileDataCtrl', { errMsg: err.message });
        next(err);
    }
};

export const downloadFilesAsZipCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filePaths = ([] as string[])
            .concat(req.query.file as string[])
            .filter((v) => v)
            .map((file) => decodeURIComponent(file)); // already handled decodeURIComponent inside s3Util

        const s3Util: S3Util = res.locals.s3Util;
        const mw =
            filePaths.length === 1
                ? await s3Util.getStreamFileCtrl(filePaths[0])
                : await s3Util.getStreamZipFileCtr(filePaths);

        return mw(req, res, next);
    } catch (err: any) {
        logger.error(req.id, 'failed on downloadFilesAsZipCtrl', { errMsg: err.message });
        next(err);
    }
};

export const streamVideoFilesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fileKey = req.query?.file as string;

        const s3Util: S3Util = res.locals.s3Util;
        const mw = await s3Util.getStreamVideoFileCtrl({ fileKey });

        return mw(req, res, next);
    } catch (err: any) {
        logger.error(req.id, 'failed on streamVideoFilesCtrl', { errMsg: err.message });
        next(err);
    }
};
