import React, { useRef, useState } from 'react';
import { Button, SVGIcon, Text, CircularProgress } from 'mui-simple';
import { Box, useMediaQuery } from '@mui/material';
import { s3Service } from '../services/s3Service.ts';
import { isVideoFile, downloadFile, isImageFile, copyToClipboard } from '../utils/fileUtils.ts';
import { FilePreview } from './FilePreview.tsx';
import { S3File } from '../types/aws.ts';
import { DeleteSelectedFilesDialog } from '../dialogs/DeleteSelectedFilesDialog.tsx';
import { TaggingFileDialog } from '../dialogs/TaggingFileDialog.tsx';
import { FileUrlDialog } from '../dialogs/FileUrlDialog.tsx';

interface Props {
    isPublicBucket: boolean;
    flatPanels: boolean;
    pinnedActions: boolean;
    selectedFiles: Set<string>;
    files: S3File[];
    setPinnedActions: (value: boolean | ((value: boolean) => boolean)) => void;
    onDeleteCB: () => Promise<void>;
}

export const FileActionsSection: React.FC<Props> = ({
    flatPanels,
    pinnedActions,
    isPublicBucket,
    selectedFiles,
    setPinnedActions,
    files,
    onDeleteCB,
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const deleteDialogRef = useRef<{ open: (keys: string[]) => void }>(null);
    const tagDialogRef = useRef<{ open: (key: string) => void }>(null);
    const fileUrlDialogRef = useRef<{ open: (file: S3File | null | undefined) => void }>(null);

    const smallLayout = useMediaQuery((theme) => theme.breakpoints.down('xl'));

    const handleAbortDownload = () => {
        s3Service.abortDownloadFiles();
    };

    const downloadMultipleAsZip = async () => {
        const filePath: string[] = Array.from(selectedFiles).filter((fileKey) => files.find((f) => f.key === fileKey));
        const [url, filename] = await s3Service.downloadFilesAsZip(filePath, 'download.zip', (progress) =>
            setDownloadProgress(progress)
        );

        return downloadFile(url, filename);
    };

    const downloadSingleFile = async () => {
        const [filePath]: string[] = Array.from(selectedFiles).filter((fileKey) =>
            files.find((f) => f.key === fileKey)
        );
        const [url, filename] = await s3Service.downloadSingleFile(filePath, (progress) =>
            setDownloadProgress(progress)
        );

        return downloadFile(url, filename);
    };

    const handleDownloadViaSignedLink = async (openInNewTab: boolean = false) => {
        if (selectedFiles.size !== 1) return;

        const fileKey = Array.from(selectedFiles)[0];
        const url = await s3Service.getSignedUrl(fileKey, 5);
        const fileName = files.find((f) => f.key === fileKey)?.name || 'download';
        const _openInNewTab = openInNewTab || isVideoFile(fileKey) || isImageFile(fileKey);

        if (_openInNewTab) {
            // Open in new tab - browser will display video player
            window.open(url, '_blank');

            // Clean up after some delay (give browser time to load)
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);
        } else {
            await downloadFile(url, fileName);
        }
    };

    const handleDownload = async () => {
        if (selectedFiles.size === 0) return;

        setDownloadProgress(0);
        try {
            if (selectedFiles.size === 1) {
                await downloadSingleFile();
            } else {
                await downloadMultipleAsZip();
            }
        } catch (error) {
            console.error('Failed to download:', error);
        } finally {
            setDownloadProgress(0);
        }
    };

    const fileKey = Array.from(selectedFiles)[0] || '';
    const file = fileKey ? files?.find((f) => f.key === fileKey) : null;
    const fileLink = file?.link as string;

    return (
        <Box
            className="file-actions"
            height="100%"
            mt={flatPanels ? 2 : 0}
            sx={{ ...(flatPanels && { display: 'block !important' }) }}
        >
            <Box
                sx={{
                    position: pinnedActions && !flatPanels ? 'sticky' : 'relative',
                    top: 0,
                    background: 'white',
                    zIndex: 1,
                    height: '25px',
                }}
            >
                <Text variant="subtitle1" component="h3" fullWidth>
                    Actions
                    {!smallLayout && (
                        <Button
                            color="primary"
                            tooltipProps={{
                                title: pinnedActions ? 'Move Panel Down' : 'Move Panel Right',
                            }}
                            icon={pinnedActions ? 'PictureInPictureAlt' : 'PictureInPicture'}
                            onClick={() => setPinnedActions((v) => !v)}
                            sx={{ position: 'absolute', top: '-7px', right: '-5px' }}
                        />
                    )}
                </Text>
            </Box>

            {selectedFiles.size > 0 && (
                <Box className="actions-grid">
                    <Button
                        variant="outlined"
                        startIcon="Download"
                        onClick={() => {
                            if (isDownloading) {
                                handleAbortDownload();
                            } else {
                                setIsDownloading(true);
                                handleDownload()
                                    .then(() => {
                                        console.debug(`download ${selectedFiles.size > 1 ? 'as zip' : 'file'} done!`);
                                    })
                                    .finally(() => {
                                        setIsDownloading(false);
                                    });
                            }
                        }}
                        fullWidth
                        label={isDownloading ? 'Downloading...' : `Download ${selectedFiles.size > 1 ? 'as ZIP' : ''}`}
                        color={isDownloading ? 'info' : 'primary'}
                        endIcon={
                            isDownloading ? (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '5px',
                                        bottom: 0,
                                    }}
                                >
                                    <CircularProgress color="info" size={15} value={downloadProgress} />
                                </Box>
                            ) : selectedFiles.size === 1 ? (
                                <Button
                                    sx={{ position: 'absolute', right: 0, top: 0 }}
                                    icon={<SVGIcon muiIconName="OpenInNew" size={22} color="info" />}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        if (isDownloading) {
                                            handleAbortDownload();
                                        } else {
                                            setIsDownloading(true);
                                            handleDownloadViaSignedLink()
                                                .then(() => {
                                                    console.debug('download via link done!');
                                                })
                                                .finally(() => {
                                                    setIsDownloading(false);
                                                });
                                        }
                                    }}
                                    color={isDownloading ? 'info' : 'primary'}
                                    tooltipProps={{ title: 'Download via sign open link.', placement: 'top' }}
                                />
                            ) : null
                        }
                    />

                    {selectedFiles.size === 1 && (
                        <>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon="ContentCopy"
                                onClick={() => copyToClipboard(fileLink ?? '')}
                                label="Copy File Key"
                            />
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon="Label"
                                onClick={() => tagDialogRef.current?.open(Array.from(selectedFiles)?.[0])}
                                label="Tag Version"
                            />
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon="Link"
                                onClick={() => fileUrlDialogRef.current?.open(file)}
                                label="Generate Link"
                            />
                        </>
                    )}

                    <Button
                        variant="outlined"
                        fullWidth
                        color="error"
                        startIcon="Delete"
                        disabled={!selectedFiles.size}
                        onClick={() => deleteDialogRef.current?.open(Array.from(selectedFiles))}
                        label="Delete Selected"
                    />
                </Box>
            )}

            <FilePreview isPublicBucket={isPublicBucket} show={selectedFiles.size === 1} file={file} />

            <DeleteSelectedFilesDialog ref={deleteDialogRef} onDeleteCB={onDeleteCB} />

            <TaggingFileDialog ref={tagDialogRef} />

            <FileUrlDialog ref={fileUrlDialogRef} />
        </Box>
    );
};
