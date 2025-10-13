import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { Box, DialogTitle, DialogContent } from '@mui/material';
import {
    Typography,
    Button,
    Checkbox,
    SVGIcon,
    LinearProgress,
    InputText,
    Dialog,
    List,
    type ListItemProps,
    Text,
    CircularProgress,
} from 'mui-simple';

import { s3Service } from '../services/s3Service.ts';
import { formatFileSize, isVideoFile, downloadFile, getFileIcon, isImageFile } from '../utils/fileUtils.ts';
import { S3File } from '../types/aws.ts';
import '../styles/filePanel.scss';
import { FILE_TYPE } from '../types/ui.ts';

interface FilePanelProps {
    currentPath: string;
    onRefresh: () => void;
}

const FilePanel: React.FC<FilePanelProps> = ({ currentPath, onRefresh }) => {
    const [files, setFiles] = useState<S3File[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [allowedMultipleFiles, setAllowedMultipleFiles] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [uploadingFileName, setUploadingFileName] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [versionTag, setVersionTag] = useState('');
    const [tempLink, setTempLink] = useState('');
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadFiles();
    }, [currentPath]);

    const loadFiles = async () => {
        try {
            const files = await s3Service.listFileObjects(currentPath);

            const loadedFiles: S3File[] = files.map((file) => ({
                id: uuid(),
                key: file.Key,
                name: file.Name,
                size: file.Size,
                lastModified: new Date(file.LastModified),
                type: 'file',
            }));
            setFiles(loadedFiles);
            if (selectedFiles.size !== 0) {
                setSelectedFiles(new Set());
            }
            setVideoPreviewUrl('');
            setTempLink('');
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const handleFileSelect = (fileKey: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileKey)) {
            newSelected.delete(fileKey);
        } else {
            newSelected.add(fileKey);
        }

        setSelectedFiles(newSelected);
    };

    const handleFileUpload = (type?: FILE_TYPE) => {
        return async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files && [...event.target.files];
            if (!files?.length) return;

            setUploading(true);
            setUploadProgress(0);
            setUploadingFileName(files.map((file) => file.name).join(', '));

            try {
                const filePath = currentPath || '/';
                if (allowedMultipleFiles) {
                    await s3Service.uploadFiles(files, filePath, type, (progress) => setUploadProgress(progress));
                } else {
                    await s3Service.uploadFile(files[0], filePath, type, (progress) => setUploadProgress(progress));
                }

                await loadFiles();
                onRefresh();
            } catch (error) {
                console.error('Failed to upload file:', error);
            } finally {
                setUploading(false);
                setUploadProgress(0);
                setUploadingFileName('');
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
    };

    const handleAbortDownload = () => {
        s3Service.abortDownloadFiles();
    };

    const handleDownloadViaSignedLink = async () => {
        if (selectedFiles.size !== 1) return;

        const fileKey = Array.from(selectedFiles)[0];
        const url = await s3Service.getSignedUrl(fileKey, 5);
        const fileName = files.find((f) => f.key === fileKey)?.name || 'download';
        const openInNewTab = isVideoFile(fileKey);

        if (openInNewTab) {
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

    const downloadMultipleAsZip = async () => {
        const filePath: string[] = Array.from(selectedFiles).filter((fileKey) => files.find((f) => f.key === fileKey));
        const [url, filename] = await s3Service.downloadFilesAsZip(
            filePath,
            'aws-s3-bucket-utils-download.zip',
            (progress) => setDownloadProgress(progress)
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

    const handleDelete = async () => {
        if (selectedFiles.size === 0) return;

        try {
            for (const fileKey of Array.from(selectedFiles)) {
                await s3Service.deleteObject(fileKey);
            }

            setDeleteDialogOpen(false);
            if (selectedFiles.size !== 0) {
                setSelectedFiles(new Set());
            }
            await loadFiles();
            onRefresh();
        } catch (error) {
            console.error('Failed to delete files:', error);
        }
    };

    const handleTagVersion = async () => {
        if (selectedFiles.size !== 1 || !versionTag.trim()) return;

        try {
            const fileKey = Array.from(selectedFiles)[0];
            await s3Service.tagObject(fileKey, versionTag);
            setTagDialogOpen(false);
            setVersionTag('');
        } catch (error) {
            console.error('Failed to tag file:', error);
        }
    };

    const generatePreview = async (fileKey: string) => {
        try {
            const url = await s3Service.getSignedUrl(fileKey, 3600);
            setVideoPreviewUrl(url);
        } catch (error) {
            console.error('Failed to generate preview:', error);
        }
    };

    const generateTempLink = async () => {
        if (selectedFiles.size !== 1) return;

        try {
            const fileKey = Array.from(selectedFiles)[0];
            const url = await s3Service.getSignedUrl(fileKey, 3600);
            setTempLink(url);
            setLinkDialogOpen(true);

            const file = files.find((f) => f.key === fileKey);
            if (file && isVideoFile(file.name)) {
                await generatePreview(fileKey);
            } else {
                setVideoPreviewUrl('');
            }
        } catch (error) {
            console.error('Failed to generate link:', error);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tempLink);
    };

    const fileKey = Array.from(selectedFiles)[0] || '';
    const file = fileKey && files?.find((f) => f.key === fileKey);
    const videoPrivateUrl =
        selectedFiles.size === 1 && file && isVideoFile(file.name)
            ? `${import.meta.env.VITE_SERVER_URL}/files/stream?file=${encodeURIComponent(file.key)}`
            : null;

    return (
        <div className="file-panel">
            <div className="file-header">
                <Typography variant="h6" component="h2">
                    File Management
                </Typography>
                <Typography className="current-path">{currentPath || '/ (root)'}</Typography>
            </div>

            <div className="file-content">
                <Box className="upload-section">
                    <Typography variant="subtitle1" component="h3">
                        Upload Files
                    </Typography>
                    <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
                        <Button
                            icon="AutoAwesomeMotion"
                            color={allowedMultipleFiles ? 'primary' : undefined}
                            onClick={() => setAllowedMultipleFiles((v) => !v)}
                            tooltipProps={{ title: 'Allow upload multiple files', placement: 'left' }}
                        />
                    </Box>
                    <Box className="upload-buttons">
                        <Button
                            variant="contained"
                            startIcon="CloudUpload"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            label={'Upload File' + (allowedMultipleFiles ? 's' : '')}
                        />
                        <Button
                            variant="outlined"
                            startIcon={allowedMultipleFiles ? 'PermMedia' : 'Image'}
                            onClick={() => imageInputRef.current?.click()}
                            disabled={uploading}
                            label={'Upload Image' + (allowedMultipleFiles ? 's' : '')}
                        />

                        <Button
                            variant="outlined"
                            startIcon={allowedMultipleFiles ? 'VideoLibrary' : 'Slideshow'}
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploading}
                            label={'Upload Video' + (allowedMultipleFiles ? 's' : '')}
                        />
                    </Box>

                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        multiple={allowedMultipleFiles}
                        onChange={handleFileUpload()}
                    />
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        multiple={allowedMultipleFiles}
                        onChange={handleFileUpload('image' as FILE_TYPE)}
                    />
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        multiple={allowedMultipleFiles}
                        onChange={handleFileUpload('video' as FILE_TYPE)}
                    />

                    {uploading && (
                        <Box className="upload-progress">
                            <Box className="progress-info">
                                <Typography variant="body2">Uploading: {uploadingFileName}</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                        </Box>
                    )}
                </Box>

                {files.length > 0 ? (
                    <>
                        <Box className="file-list">
                            <Box className="file-list-header">
                                <Typography variant="subtitle1" component="h3">
                                    Files in Current Folder
                                </Typography>
                                {selectedFiles.size > 0 && (
                                    <Typography className="selection-info">
                                        {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                                    </Typography>
                                )}
                            </Box>

                            <Box className="file-items">
                                {files.map((file) => (
                                    <Box
                                        key={file.id}
                                        className={`file-item ${selectedFiles.has(file.key) ? 'selected' : ''}`}
                                        onClick={() => handleFileSelect(file.key)}
                                    >
                                        <Box className="file-info">
                                            <Checkbox
                                                checked={selectedFiles.has(file.key)}
                                                onClick={(e: Event) => {
                                                    e.stopPropagation();
                                                    handleFileSelect(file.key);
                                                }}
                                            />
                                            <Box className="file-icon">
                                                <SVGIcon muiIconName={getFileIcon(file.name)} />
                                            </Box>
                                            <Box className="file-details">
                                                <Typography className="file-name">{file.name}</Typography>
                                                <Typography className="file-meta">
                                                    {formatFileSize(file.size)} • {file.lastModified.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {selectedFiles.size > 0 && (
                            <Box className="file-actions">
                                <Typography variant="subtitle1" component="h3">
                                    Actions
                                </Typography>

                                <Box className="actions-grid">
                                    {selectedFiles.size === 1 && (
                                        <Button
                                            variant="outlined"
                                            startIcon="Download"
                                            onClick={() => {
                                                if (isDownloading) {
                                                    handleAbortDownload();
                                                } else {
                                                    setIsDownloading(true);
                                                    handleDownloadViaSignedLink()
                                                        .then(() => {
                                                            console.log('download via link done!');
                                                        })
                                                        .finally(() => {
                                                            setIsDownloading(false);
                                                        });
                                                }
                                            }}
                                            fullWidth
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
                                                        <CircularProgress
                                                            color="info"
                                                            size={15}
                                                            value={downloadProgress}
                                                        />
                                                    </Box>
                                                ) : null
                                            }
                                            label={isDownloading ? 'Downloading...' : `Download via signed link`}
                                        />
                                    )}
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
                                                        console.log('download as zip done!');
                                                    })
                                                    .finally(() => {
                                                        setIsDownloading(false);
                                                    });
                                            }
                                        }}
                                        fullWidth
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
                                            ) : null
                                        }
                                        label={
                                            isDownloading
                                                ? 'Downloading...'
                                                : `Download ${selectedFiles.size > 1 ? 'as ZIP' : ''}`
                                        }
                                    />

                                    {selectedFiles.size === 1 && (
                                        <>
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon="Label"
                                                onClick={() => setTagDialogOpen(true)}
                                                label="Tag Version"
                                            />
                                            <Button
                                                variant="outlined"
                                                fullWidth
                                                startIcon="Link"
                                                onClick={generateTempLink}
                                                label="Generate Link"
                                            />
                                        </>
                                    )}

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        color="error"
                                        startIcon="Delete"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        label="Delete Selected"
                                    />
                                </Box>

                                {videoPrivateUrl && (
                                    <Box className="video-preview">
                                        <video controls src={videoPrivateUrl}>
                                            Your browser does not support the video tag.
                                        </video>
                                    </Box>
                                )}

                                {fileKey && isImageFile(fileKey) && selectedFiles.size === 1 && (
                                    <Box className="video-preview" mt={2}>
                                        <img
                                            src={`${import.meta.env.VITE_SERVER_URL}/files/image?file=${fileKey}`}
                                            alt={fileKey}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                ) : (
                    <Box className="empty-state">
                        <SVGIcon muiIconName='FolderOpen' className="empty-icon"/>
                        <Text variant="h6" component="h3" fullWidth justifyContent="center">
                            No Files
                        </Text>
                        <Text variant="body2" fullWidth justifyContent="center">
                            Upload files to get started
                        </Text>
                    </Box>
                )}
            </div>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Confirm Delete"
                actions={[
                    { onClick: () => setDeleteDialogOpen(false), label: 'Cancel' },
                    { onClick: handleDelete, variant: 'contained', color: 'error', label: 'Delete' },
                ]}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <Typography>
                    Are you sure you want to delete {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''}?
                </Typography>
                <Typography>This action cannot be undone.</Typography>
                <List
                    buttonItems={false}
                    items={[...selectedFiles].map(
                        (file) => ({ title: file, style: { color: 'red' } }) as ListItemProps
                    )}
                />
            </Dialog>

            <Dialog
                open={tagDialogOpen}
                title="Tag File Version"
                onClose={() => setTagDialogOpen(false)}
                actions={[
                    { onClick: () => setTagDialogOpen(false), label: 'Cancel' },
                    { onClick: handleTagVersion, variant: 'contained', label: 'Apply Tag' },
                ]}
            >
                <DialogTitle>Tag File Version</DialogTitle>
                <InputText
                    autoFocus
                    margin="dense"
                    label="Version"
                    fullWidth
                    placeholder="e.g., 1.0.0"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTagVersion()}
                />
            </Dialog>

            <Dialog
                open={linkDialogOpen}
                onClose={() => {
                    setLinkDialogOpen(false);
                    setVideoPreviewUrl('');
                }}
                maxWidth="md"
                fullWidth
                title="Temporary Link"
                actions={[
                    {
                        onClick: () => {
                            setLinkDialogOpen(false);
                            setVideoPreviewUrl('');
                        },
                        label: 'Close',
                    },
                ]}
            >
                <DialogTitle>Temporary Link</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        This link will expire in 1 hour
                    </Typography>
                    <InputText
                        fullWidth
                        value={tempLink}
                        endCmp={[<Button onClick={copyToClipboard} edge="end" icon="ContentCopy" />]}
                        readOnly
                    />

                    {videoPreviewUrl && (
                        <Box className="video-preview" mt={2}>
                            <video controls src={videoPreviewUrl}>
                                Your browser does not support the video tag.
                            </video>
                        </Box>
                    )}

                    {isImageFile(Array.from(selectedFiles)?.[0] ?? '') && (
                        <Box className="video-preview" mt={2}>
                            <img src={tempLink} alt={Array.from(selectedFiles)[0]} />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

FilePanel.whyDidYouRender = true;

export default FilePanel;
