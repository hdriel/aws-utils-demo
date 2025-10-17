import { NextFunction, Request, Response } from 'express';
import { FILE_TYPE, getS3BucketUtil, type UploadedS3File } from '../shared';
import logger from '../logger';
import { extname, basename } from 'pathe';

export const getFileInfoCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePath = req.query?.filePath ? decodeURIComponent(req.query?.filePath as string) : undefined;
    if (!filePath) {
        return next(new Error('No file path provided'));
    }

    const result = await s3BucketUtil.fileInfo(filePath);

    res.json(result);
};

export const getFileDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePath = req.query?.filePath ? decodeURIComponent(req.query?.filePath as string) : undefined;
    if (!filePath) {
        return next(new Error('No file path provided'));
    }

    const result = await s3BucketUtil.fileContent(filePath, 'utf8');

    res.json(result);
};

export const getFileUrlCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePath = req.query?.filePath ? decodeURIComponent(req.query?.filePath as string) : undefined;
    if (!filePath) {
        return next(new Error('No file path provided'));
    }
    const expireIn = req.query?.expireIn ? +req.query.expireIn : undefined;

    const result = await s3BucketUtil.fileUrl(filePath, expireIn);

    res.json(result);
};

export const getFileVersionCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePath = req.query?.filePath ? decodeURIComponent(req.query?.filePath as string) : undefined;
    if (!filePath) {
        return next(new Error('No file path provided'));
    }

    const result = await s3BucketUtil.fileVersion(filePath);

    res.json(result);
};

export const toggingFileVersionCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePath = req.query?.filePath ? decodeURIComponent(req.query?.filePath as string) : undefined;
    if (!filePath) {
        return next(new Error('No file path provided'));
    }

    const result = await s3BucketUtil.taggingFile(filePath, req.body);

    res.json(result);
};

export const deleteFileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePath = req.query?.file ? decodeURIComponent(req.query?.file as string) : undefined;
    if (!filePath) {
        return next(new Error('No file path provided'));
    }

    const result = await s3BucketUtil.deleteFile(filePath);

    res.json(result);
};

export const uploadSingleFileCtrl = (req: Request & { s3File?: UploadedS3File }, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const fileType = req.params?.fileType as FILE_TYPE;

    const encodedDirectory = (req.headers['x-upload-directory'] as string) || '';
    const encodedFilename = req.headers['x-upload-filename'] as string;

    if (!encodedDirectory) {
        return res.status(400).json({ error: 'Directory header is required' });
    }

    let directory = decodeURIComponent(encodedDirectory);
    directory = directory === '/' ? '' : directory;
    const filename = encodedFilename ? decodeURIComponent(encodedFilename) : undefined;

    logger.info(req.id, 'uploading single file', { filename, directory });

    const uploadMiddleware = s3BucketUtil.uploadSingleFile('file', directory, {
        ...(fileType && { fileType }),
        filename: filename || undefined,
    });

    const uploadedCallback = (err?: any) => {
        if (err) {
            logger.warn(req.id, 'failed to upload single file', { message: err.message });
            return next(err);
        }

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

            logger.info(req.id, 'file uploaded', file);
            return res.json({ success: true, file });
        }

        return res.status(400).json({ error: 'No file uploaded' });
    };

    return uploadMiddleware(req, res, uploadedCallback);
};

export const uploadMultiFilesCtrl = (
    req: Request & { s3Files?: UploadedS3File[] },
    res: Response,
    next: NextFunction
) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const fileType = req.params?.fileType as FILE_TYPE;

    const encodedDirectory = (req.headers['x-upload-directory'] as string) || '/';
    if (!encodedDirectory) {
        return res.status(400).json({ error: 'Directory header is required' });
    }

    let directory = decodeURIComponent(encodedDirectory);
    directory = directory === '/' ? '' : directory;

    logger.info(req.id, 'uploading multiple files', { directory });

    // Create a wrapper that intercepts the next() call
    const interceptNext: NextFunction = (err?: any) => {
        if (err) {
            logger.warn(req.id, 'failed to upload files', { message: err.message });
            return next(err);
        }

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

            logger.info(req.id, 'files uploaded', files);
            return res.json({ success: true, files });
        }

        return res.status(400).json({ error: 'No file uploaded' });
    };

    const uploadMiddleware = s3BucketUtil.uploadMultipleFiles('files', directory, {
        ...(fileType && { fileType }),
    });

    return uploadMiddleware(req, res, interceptNext);
};

export const viewImageFileCtrl = async (req: Request, res: Response, _next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const fileKey = req.query?.file ? decodeURIComponent(req.query?.file as string) : undefined;
    if (!fileKey) {
        res.status(404).json({ error: 'file key is required' });
        return;
    }

    try {
        const imageBuffer = await s3BucketUtil.fileContent(fileKey, 'buffer');
        const ext = extname(fileKey).slice(1).toLowerCase();

        // Map extensions to proper MIME types
        const mimeTypeMap: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            ico: 'image/x-icon',
        };

        const contentType = mimeTypeMap[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Length', imageBuffer.length); // Optional: helps with streaming

        res.status(200).send(imageBuffer);
    } catch (error) {
        console.error('Error retrieving file:', error);
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
};

export const viewFileContentCtrl = async (req: Request, res: Response, _next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const fileKey = req.query?.file ? decodeURIComponent(req.query?.file as string) : undefined;
    if (!fileKey) {
        res.status(404).json({ error: 'file key is required' });
        return;
    }

    try {
        const fileBuffer = await s3BucketUtil.fileContent(fileKey, 'buffer');
        const ext = extname(fileKey).slice(1).toLowerCase();

        const mimeTypeMap: Record<string, string> = {
            pdf: 'application/pdf',
            txt: 'text/plain',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        };

        const contentType = mimeTypeMap[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${basename(fileKey)}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('Content-Length', fileBuffer.length);

        res.status(200).send(fileBuffer);
    } catch (error: any) {
        logger.error(req.id, 'Error retrieving file:', { error, errMsg: error.message });
        res.status(500).json({ error: 'Failed to retrieve file' });
    }
};

export const uploadFileDataCtrl = async (req: Request, res: Response, _next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const fileKey = req.body?.path ? decodeURIComponent(req.body?.path as string) : undefined;
    if (!fileKey) {
        res.status(404).json({ error: 'file path is required' });
        return;
    }

    const result = await s3BucketUtil.uploadFile(fileKey, req.body.data || '');

    res.json(result);
};

export const downloadFilesAsZipCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const filePaths = ([] as string[])
        .concat(req.query.file as string[])
        .filter((v) => v)
        .map((file) => decodeURIComponent(file));

    const downloadMiddleware =
        filePaths.length === 1
            ? await s3BucketUtil.getStreamFileCtrl({ filePath: filePaths[0] })
            : await s3BucketUtil.getStreamZipFileCtr({ filePath: filePaths });

    return downloadMiddleware(req, res, next);
};

export const streamVideoFilesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const s3BucketUtil = getS3BucketUtil();
    if (!s3BucketUtil) {
        res.status(403).json({ error: 'credentials not found' });
        return;
    }

    const fileKey = req.query?.file ? decodeURIComponent(req.query?.file as string) : undefined;
    if (!fileKey) {
        return next(new Error('No file path provided'));
    }
    if (!fileKey) {
        return res.status(400).json({ error: 'file is required' });
    }

    const downloadMiddleware = await s3BucketUtil.getStreamVideoFileCtrl({ fileKey });
    return downloadMiddleware(req, res, next);
};
