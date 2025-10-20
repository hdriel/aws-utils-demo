import React, { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useMediaQuery, useTheme } from '@mui/material';
import { Typography } from 'mui-simple';
import { s3Service } from '../services/s3Service.ts';
import { S3File } from '../types/aws.ts';
import '../styles/filePanel.scss';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { EmptyStatement } from './EmptyStatement.tsx';
import { useFetchingList } from '../hooks/useFetchingList.ts';
import { UploadFilesSection } from './UploadFilesSection.tsx';
import { FileActionsSection } from './FileActionsSection.tsx';
import { FileListSelectionSection } from './FileListSelectionSection.tsx';

interface FilePanelProps {
    isPublicBucket: boolean;
    currentPath: string;
    onRefresh: () => void;
}

const FilePanel: React.FC<FilePanelProps> = ({ currentPath, onRefresh, isPublicBucket }) => {
    const theme = useTheme();
    const largeLayout = useMediaQuery((theme) => theme.breakpoints.up('xl'));
    const mobileLayout = useMediaQuery((theme) => theme.breakpoints.down('lg'));

    const [flatPanels, setFlatPanels] = useState(mobileLayout);
    const [pinnedActions, setPinnedActions] = useState(largeLayout);
    const [files, setFiles] = useState<S3File[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

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

            return files.length;
        } catch (error) {
            console.error('Failed to load files:', error);
            return 0;
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
        <FileListSelectionSection
            flatPanels={flatPanels}
            pinnedActions={pinnedActions}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            files={files}
        />
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
                                                <PanelResizeHandle
                                                    style={{ background: theme.palette.primary.main, width: '3px' }}
                                                />
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
                                        background: theme.palette.primary.main,
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

// FilePanel.whyDidYouRender = true;

export default FilePanel;
