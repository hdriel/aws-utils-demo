import React from 'react';
import { EmptyStatement } from './EmptyStatement.tsx';
import { Box } from '@mui/material';
import { s3Service } from '../services/s3Service.ts';
import { isImageFile, isVideoFile } from '../utils/fileUtils.ts';
import { S3File } from '../types/aws.ts';

interface Props {
    show: boolean;
    isPublicBucket: boolean;
    file?: S3File | null | undefined;
}

export const FilePreview: React.FC<Props> = ({ show: showPreviewFile, isPublicBucket, file }) => {
    const encodedFileKey = encodeURIComponent(file?.key ?? '');

    const [showImagePreview, showReadPreview, videoPrivateUrl] = [
        showPreviewFile && file && isImageFile(file.key),
        showPreviewFile && file && file.key.toLowerCase().endsWith('.pdf'),
        showPreviewFile && file && isVideoFile(file?.name)
            ? `${s3Service.baseURL}/files/stream?file=${encodedFileKey}`
            : null,
    ];

    const isPreviewAvailable = showImagePreview || showReadPreview || videoPrivateUrl;

    return (
        <>
            {(!showPreviewFile || !isPreviewAvailable) && (
                <EmptyStatement
                    icon="Image"
                    title="File Preview"
                    subtitle={`Select single image / video to preview ${isPublicBucket ? 'public' : 'private'} bucket content`}
                />
            )}

            {videoPrivateUrl && (
                <Box className="video-preview">
                    <video controls src={videoPrivateUrl}>
                        Your browser does not support the video tag.
                    </video>
                </Box>
            )}

            {showImagePreview && (
                <Box className="video-preview">
                    <img src={`${s3Service.baseURL}/files/image?file=${encodedFileKey}`} alt={file?.name} />
                </Box>
            )}

            {showReadPreview && (
                <Box className="video-preview">
                    <iframe
                        src={`${s3Service.baseURL}/files/content?file=${encodedFileKey}`}
                        style={{ width: '100%', height: '600px', border: 'none' }}
                        title="PDF Preview"
                    />
                </Box>
            )}
        </>
    );
};
