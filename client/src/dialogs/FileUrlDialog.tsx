import { forwardRef, useImperativeHandle, useState } from 'react';
import { Box, DialogTitle, DialogContent } from '@mui/material';
import { Typography, Button, InputText, Dialog } from 'mui-simple';
import { copyToClipboard, isImageFile, isVideoFile } from '../utils/fileUtils.ts';
import { s3Service } from '../services/s3Service.ts';
import { S3File } from '../types/aws.ts';

type Props = object;

export const FileUrlDialog = forwardRef<{ open: (file: S3File | undefined | null) => void }, Props>(
    // eslint-disable-next-line no-empty-pattern
    ({}, ref) => {
        const [tempLink, setTempLink] = useState('');
        const [linkDialogOpen, setLinkDialogOpen] = useState(false);
        const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
        const [file, setFile] = useState<S3File | null | undefined>(null);

        useImperativeHandle(ref, () => ({
            open: (file: S3File | null | undefined) => {
                setFile(file);
                setVideoPreviewUrl('');
                setTempLink('');
                if (file?.key) {
                    setTimeout(() => generateTempLink(file), 0);
                }
            },
        }));

        const generateTempLink = async (file: S3File) => {
            if (!file?.key) return;

            try {
                const url = await s3Service.getSignedUrl(file?.key, 3600);
                setTempLink(url);
                setLinkDialogOpen(true);

                // const file = files.find((f) => f.key === fileKey);
                if (file && isVideoFile(file.name)) {
                    setVideoPreviewUrl(url);
                } else {
                    setVideoPreviewUrl('');
                }
            } catch (error) {
                console.error('Failed to generate link:', error);
            }
        };

        return (
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
                        copyAction
                    />

                    {videoPreviewUrl && (
                        <Box className="file-preview" mt={2}>
                            <video controls src={videoPreviewUrl}>
                                Your browser does not support the video tag.
                            </video>
                        </Box>
                    )}

                    {isImageFile(file?.key ?? '') && (
                        <Box className="file-preview" mt={2}>
                            <img src={tempLink} alt={file?.key} />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        );
    }
);
