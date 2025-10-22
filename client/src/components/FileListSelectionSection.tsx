import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import { Typography, Button, Checkbox, SVGIcon } from 'mui-simple';
import { formatFileSize, getFileIcon } from '../utils/fileUtils.ts';
import { S3File } from '../types/aws.ts';

interface Props {
    directory: string;
    pinnedActions: boolean;
    flatPanels: boolean;
    files: S3File[];
    selectedFiles: Set<string>;
    setSelectedFiles: (selectedFiles: Set<string>) => void;
}

export const FileListSelectionSection: React.FC<Props> = ({
    directory,
    flatPanels,
    pinnedActions,
    files,
    selectedFiles,
    setSelectedFiles,
}) => {
    const [allowedMultipleFilesSelected, setAllowedMultipleFilesSelected] = useState(false);

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

    return (
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
                        file-directory={directory}
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
};
