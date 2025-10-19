import { Dialog, InputText } from 'mui-simple';
import { DialogTitle } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';

type Props = object;

const versionPlaceholder = 'e.g., 1.0.0';

// eslint-disable-next-line no-empty-pattern
export const TaggingFileDialog = forwardRef<{ open: (key: string) => void }, Props>(({}, ref) => {
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [fileKey, setFileKey] = useState('');
    const [versionTag, setVersionTag] = useState('');
    const [originalVersionTag, setOriginalVersionTag] = useState(versionPlaceholder);

    useImperativeHandle(ref, () => ({
        open: (key: string) => {
            setFileKey(key);
            if (key) setTagDialogOpen(true);
        },
    }));

    useEffect(() => {
        if (tagDialogOpen) {
            s3Service.getTagVersion(fileKey).then((version) => {
                if (version) {
                    setOriginalVersionTag(version);
                    setVersionTag(version);
                }
            });
        }
        return () => {
            setOriginalVersionTag(versionPlaceholder);
        };
    }, [tagDialogOpen]);

    const handleTagVersion = async () => {
        if (!fileKey || !versionTag.trim()) return;

        try {
            await s3Service.tagObject(fileKey, versionTag);
            const version = await s3Service.getTagVersion(fileKey);
            console.log('version: ', version);

            setTagDialogOpen(false);
            setVersionTag('');
        } catch (error) {
            console.error('Failed to tag file:', error);
        }
    };

    return (
        <Dialog
            open={tagDialogOpen}
            title="Tag File Version"
            onClose={() => setTagDialogOpen(false)}
            actions={[
                { onClick: () => setTagDialogOpen(false), label: 'Cancel' },
                {
                    onClick: handleTagVersion,
                    variant: 'contained',
                    label: 'Apply Tag',
                    disabled: !versionTag || originalVersionTag === versionTag,
                },
            ]}
        >
            <DialogTitle>Tag File Version</DialogTitle>
            <InputText
                autoFocus
                margin="dense"
                label="Version"
                fullWidth
                placeholder={versionPlaceholder}
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTagVersion()}
            />
        </Dialog>
    );
});
