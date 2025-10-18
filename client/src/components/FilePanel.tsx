import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { Box, DialogTitle, DialogContent, useMediaQuery, Stack } from '@mui/material';
import {
    Typography,
    Button,
    Checkbox,
    SVGIcon,
    LinearProgress,
    InputText,
    Dialog,
    Text,
    CircularProgress,
} from 'mui-simple';
import { s3Service } from '../services/s3Service.ts';
import { formatFileSize, isVideoFile, downloadFile, getFileIcon, isImageFile } from '../utils/fileUtils.ts';
import { S3File } from '../types/aws.ts';
import '../styles/filePanel.scss';
import { FILE_TYPE } from '../types/ui.ts';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { EmptyStatement } from './EmptyStatement.tsx';
import { useFetchingList } from '../hooks/useFetchingList.ts';
import { DeleteSelectedFilesDialog } from '../dialogs/DeleteSelectedFilesDialog.tsx';

interface FilePanelProps {
    isPublicBucket: boolean;
    currentPath: string;
    onRefresh: () => void;
}

const FilePanel: React.FC<FilePanelProps> = ({ currentPath, onRefresh, isPublicBucket }) => {
    const largeLayout = useMediaQuery((theme) => theme.breakpoints.up('xl'));
    const smallLayout = useMediaQuery((theme) => theme.breakpoints.down('xl'));
    const mobileLayout = useMediaQuery((theme) => theme.breakpoints.down('lg'));

    const deleteDialogRef = useRef<{ open: (keys: string[]) => void }>(null);
    const [flatPanels, setFlatPanels] = useState(mobileLayout);
    const [pinnedActions, setPinnedActions] = useState(largeLayout);
    const [files, setFiles] = useState<S3File[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [allowedMultipleFiles, setAllowedMultipleFiles] = useState(false);
    const [allowedMultipleFilesSelected, setAllowedMultipleFilesSelected] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [uploadingFileName, setUploadingFileName] = useState('');
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

    useEffect(() => {
        setFlatPanels(mobileLayout);
    }, [mobileLayout]);

    const loadFiles = async (page: number = 0) => {
        try {
            const files = await s3Service.listFileObjects(currentPath, page);

            const loadedFiles: S3File[] = files.map((file) => ({
                id: uuid(),
                key: file.Key,
                name: file.Name,
                link: file.link,
                size: file.Size,
                lastModified: new Date(file.LastModified),
                type: 'file',
            }));
            setFiles((prevFiles) => (page ? [...prevFiles, ...loadedFiles] : loadedFiles));

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
        if (allowedMultipleFilesSelected) {
            const newSelected = new Set(selectedFiles);
            if (newSelected.has(fileKey)) {
                newSelected.delete(fileKey);
            } else {
                newSelected.add(fileKey);
            }

            setSelectedFiles(newSelected);
        } else {
            const newSelected = new Set(selectedFiles.has(fileKey) ? [] : [fileKey]);
            setSelectedFiles(newSelected);
        }
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

    const handleAbortUpload = () => {
        s3Service.abortUploadFiles();
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    useFetchingList({
        directory: currentPath === '/' ? '' : currentPath,
        listItemSelector: '.file-item',
        timeout: 1000,
        cb: async (page) => loadFiles(page),
        isListEmpty: !files.length,
    });

    const fileKey = Array.from(selectedFiles)[0] || '';
    const file = fileKey && files?.find((f) => f.key === fileKey);
    const fileLink = file?.link as string;
    const videoPrivateUrl =
        selectedFiles.size === 1 && file && isVideoFile(file.name)
            ? `${s3Service.baseURL}/files/stream?file=${encodeURIComponent(file.key)}`
            : null;

    const showImagePreview = fileKey && isImageFile(fileKey) && selectedFiles.size === 1;
    const showReadPreview =
        selectedFiles.size === 1 &&
        (fileKey?.toLowerCase().endsWith('.pdf') || fileKey?.toLowerCase().endsWith('.txt'));

    const showPreviewFile = showReadPreview || videoPrivateUrl || showImagePreview;

    const uploadSectionCmp = (
        <Box className="upload-section">
            <Text
                variant="subtitle1"
                component="h3"
                sx={{ display: 'flex', alignItems: 'center' }}
                color={allowedMultipleFiles ? 'primary' : undefined}
            >
                Upload Files
                <Button
                    icon={<SVGIcon muiIconName="LibraryAdd" size={20} sx={{ marginTop: '-5px' }} />}
                    color={allowedMultipleFiles ? 'primary' : undefined}
                    onClick={() => setAllowedMultipleFiles((v) => !v)}
                    tooltipProps={{ title: 'Allow upload multiple files', placement: 'right' }}
                />
            </Text>
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
                {uploading && (
                    <Button startIcon="Block" variant="outlined" color="error" onClick={handleAbortUpload}>
                        Abort
                    </Button>
                )}
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
    );

    const fileListSectionCmp = (
        <Box className="file-list">
            <Box className="file-list-header" sx={{ position: pinnedActions && !flatPanels ? 'sticky' : 'relative' }}>
                <Stack direction="row" spacing={1}>
                    <Typography variant="subtitle1" component="h3">
                        {files.length} - Files in Current Folder View
                    </Typography>
                    <Button
                        icon={<SVGIcon muiIconName="LibraryAddCheck" size={20} sx={{ marginTop: '-5px' }} />}
                        color={allowedMultipleFilesSelected ? 'primary' : undefined}
                        onClick={() => setAllowedMultipleFilesSelected((v) => !v)}
                        tooltipProps={{ title: 'Allow select multiple files', placement: 'right' }}
                    />
                </Stack>
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
    );
    const fileActionsSectionCmp = (
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
                                        console.log(`download ${selectedFiles.size > 1 ? 'as zip' : 'file'} done!`);
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
                                                    console.log('download via link done!');
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
                        disabled={!selectedFiles.size}
                        onClick={() => deleteDialogRef.current?.open(Array.from(selectedFiles))}
                        label="Delete Selected"
                    />
                </Box>
            )}

            {!showPreviewFile && (
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
                    <img src={`${s3Service.baseURL}/files/image?file=${encodeURIComponent(fileKey)}`} alt={fileKey} />
                </Box>
            )}

            {showReadPreview && (
                <Box className="video-preview">
                    <iframe
                        src={`${s3Service.baseURL}/files/content?file=${encodeURIComponent(fileKey)}`}
                        style={{ width: '100%', height: '600px', border: 'none' }}
                        title="PDF Preview"
                    />
                </Box>
            )}
        </Box>
    );

    return (
        <div className="file-panel">
            <div className="file-header">
                <Typography variant="h6" component="h2">
                    File Management
                </Typography>
                <Typography className="current-path">{(currentPath !== '/' && currentPath) || '/ (root)'}</Typography>
            </div>

            {flatPanels && (
                <div className="file-content">
                    {uploadSectionCmp}

                    {files.length > 0 ? (
                        <>
                            {fileListSectionCmp}
                            {fileActionsSectionCmp}
                        </>
                    ) : (
                        <EmptyStatement icon="FolderOpen" title="No Files" subtitle="Upload files to get started" />
                    )}
                </div>
            )}

            {!flatPanels && (
                <div className="file-content">
                    {(!files.length || pinnedActions || flatPanels) && uploadSectionCmp}

                    {files.length > 0 ? (
                        <>
                            <PanelGroup
                                autoSaveId="files-section"
                                direction={pinnedActions ? 'horizontal' : 'vertical'}
                                style={{
                                    width: '100%',
                                    height: pinnedActions ? 'calc(100vh - 410px)' : '100%',
                                }}
                            >
                                <Panel
                                    defaultSize={30}
                                    minSize={30}
                                    style={{ width: '100%', height: 'inherit', overflowY: 'auto' }}
                                >
                                    <PanelGroup
                                        autoSaveId="files-section"
                                        direction={flatPanels ? 'vertical' : 'horizontal'}
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        <Panel
                                            defaultSize={30}
                                            minSize={30}
                                            style={{
                                                width: '100%',
                                                height: 'inherit',
                                                overflowY: 'auto',
                                                paddingInlineEnd: '1em',
                                                paddingBottom: '1em',
                                            }}
                                        >
                                            {fileListSectionCmp}
                                        </Panel>
                                        {!pinnedActions && !flatPanels && (
                                            <>
                                                <PanelResizeHandle style={{ background: '#757575', width: '3px' }} />
                                                <Panel
                                                    minSize={30}
                                                    style={{
                                                        width: '100%',
                                                        overflowY: 'hidden',
                                                        padding: '1em',
                                                    }}
                                                >
                                                    {uploadSectionCmp}
                                                </Panel>
                                            </>
                                        )}
                                    </PanelGroup>
                                </Panel>
                                <PanelResizeHandle
                                    style={{
                                        background: '#757575',
                                        ...(pinnedActions ? { width: '3px' } : { height: '3px' }),
                                    }}
                                />
                                <Panel
                                    minSize={30}
                                    style={{
                                        width: '100%',
                                        overflowY: pinnedActions ? 'auto' : 'hidden',
                                        paddingInlineStart: '1em',
                                        paddingTop: pinnedActions ? 0 : '1em',
                                    }}
                                >
                                    {fileActionsSectionCmp}
                                </Panel>
                            </PanelGroup>
                        </>
                    ) : (
                        <EmptyStatement icon="FolderOpen" title="No Files" subtitle="Upload files to get started" />
                    )}
                </div>
            )}

            <DeleteSelectedFilesDialog
                ref={deleteDialogRef}
                onDeleteCB={async () => {
                    if (selectedFiles.size !== 0) setSelectedFiles(new Set());
                    await loadFiles();
                    onRefresh();
                }}
            />

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
                        endCmp={[<Button onClick={() => copyToClipboard(tempLink)} edge="end" icon="ContentCopy" />]}
                        readOnly
                        sx={{ mb: 2 }}
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
