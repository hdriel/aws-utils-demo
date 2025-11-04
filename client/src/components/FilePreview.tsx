import React from 'react';
import { EmptyStatement } from './EmptyStatement.tsx';
import { Box } from '@mui/material';
import { s3Service } from '../services/s3Service.ts';
import { isImageFile, isVideoFile } from '../utils/fileUtils.ts';
import { S3File } from '../types/aws.ts';
import { SUPPORTED_IFRAME_EXTENSIONS } from '../consts.ts';

interface Props {
    show: boolean;
    isPublicBucket: boolean;
    file?: S3File | null | undefined;
}

export const FilePreview: React.FC<Props> = ({ show: showPreviewFile, isPublicBucket, file }) => {
    const encodedFileKey = file?.key ? encodeURIComponent(file.key) : null;

    const [showImagePreview, showReadPreview, videoPrivateUrl] = [
        showPreviewFile && file && isImageFile(file.key),
        showPreviewFile &&
            file &&
            SUPPORTED_IFRAME_EXTENSIONS.includes(file.key.toLowerCase().split('.').pop() as string) &&
            !isImageFile(file.key),
        showPreviewFile && file && isVideoFile(file?.name)
            ? `${s3Service.baseURL}/files/${encodedFileKey}/stream`
            : null,
    ];

    const isPreviewAvailable = showImagePreview || showReadPreview || videoPrivateUrl;

    const imageUrl = `${s3Service.baseURL}/files/${encodedFileKey}/image`;
    const iframeUrl = `${s3Service.baseURL}/files/${encodedFileKey}/iframe`;

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
                <Box>
                    <span style={{ marginTop: '-10px' }}>&lt;video src="{file?.key}"&gt;</span>
                    <Box className="file-preview">
                        <video controls src={videoPrivateUrl}>
                            Your browser does not support the video tag.
                        </video>
                    </Box>
                </Box>
            )}

            {showImagePreview && (
                <Box>
                    <span style={{ marginTop: '-10px', lineBreak: 'anywhere' }}>&lt;img src="{imageUrl}"&gt;</span>
                    <Box className="file-preview">
                        <img src={imageUrl} alt={file?.name} />
                    </Box>
                </Box>
            )}

            {showReadPreview && (
                <Box className="iframe-preview">
                    <span style={{ marginTop: '-10px', lineBreak: 'anywhere' }}>&lt;iframe src="{iframeUrl}"&gt;</span>
                    <iframe
                        src={`${s3Service.baseURL}/files/${encodedFileKey}/iframe`}
                        style={{ width: '100%', height: '390px', border: 'none' }}
                        title="Iframe Preview"
                    />
                </Box>
            )}
        </>
    );
};
