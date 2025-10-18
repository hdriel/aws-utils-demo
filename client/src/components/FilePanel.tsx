import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Box, useMediaQuery, Stack } from '@mui/material';
import { Typography, Button, Checkbox, SVGIcon } from 'mui-simple';
import { s3Service } from '../services/s3Service.ts';
import { formatFileSize, getFileIcon } from '../utils/fileUtils.ts';
import { S3File } from '../types/aws.ts';
import '../styles/filePanel.scss';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { EmptyStatement } from './EmptyStatement.tsx';
import { useFetchingList } from '../hooks/useFetchingList.ts';
import { UploadFilesSection } from './UploadFilesSection.tsx';
import { FileActionsSection } from './FileActionsSection.tsx';

interface FilePanelProps {
    isPublicBucket: boolean;
    currentPath: string;
    onRefresh: () => void;
}

const FilePanel: React.FC<FilePanelProps> = ({ currentPath, onRefresh, isPublicBucket }) => {
    const largeLayout = useMediaQuery((theme) => theme.breakpoints.up('xl'));
    const mobileLayout = useMediaQuery((theme) => theme.breakpoints.down('lg'));

    const [flatPanels, setFlatPanels] = useState(mobileLayout);
    const [pinnedActions, setPinnedActions] = useState(largeLayout);
    const [files, setFiles] = useState<S3File[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [allowedMultipleFilesSelected, setAllowedMultipleFilesSelected] = useState(false);

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

    useFetchingList({
        directory: currentPath === '/' ? '' : currentPath,
        listItemSelector: '.file-item',
        timeout: 1000,
        cb: async (page) => loadFiles(page),
        isListEmpty: !files.length,
    });

    const uploadSectionCmp = (
        <UploadFilesSection
            currentPath={currentPath}
            onUploadCB={async () => {
                await loadFiles();
                onRefresh();
            }}
        />
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
        <FileActionsSection
            pinnedActions={pinnedActions}
            selectedFiles={selectedFiles}
            setPinnedActions={setPinnedActions}
            flatPanels={flatPanels}
            isPublicBucket={isPublicBucket}
            files={files}
            onDeleteCB={async () => {
                if (selectedFiles.size !== 0) setSelectedFiles(new Set());
                await loadFiles();
                onRefresh();
            }}
        />
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
        </div>
    );
};

FilePanel.whyDidYouRender = true;

export default FilePanel;
