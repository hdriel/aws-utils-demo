import React, { useRef, useState } from 'react';
import { Button, LinearProgress, SVGIcon, Text, Typography } from 'mui-simple';
import { Box } from '@mui/material';
import { FILE_TYPE } from '../types/ui.ts';
import { s3Service } from '../services/s3Service.ts';

interface Props {
    currentPath: string;
    onUploadCB?: () => Promise<void>;
}

export const UploadFilesSection: React.FC<Props> = ({ currentPath, onUploadCB }) => {
    const [allowedMultipleFiles, setAllowedMultipleFiles] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [uploadingFileName, setUploadingFileName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

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

                await onUploadCB?.();
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

    const handleAbortUpload = () => {
        s3Service.abortUploadFiles();
    };

    return (
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
                    disabled={uploading}
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
};
