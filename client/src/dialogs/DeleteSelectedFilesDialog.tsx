import { Dialog, List, type ListItemProps, Typography } from 'mui-simple';
import { DialogTitle } from '@mui/material';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';

interface Props {
    onDeleteCB?: () => void;
}

export const DeleteSelectedFilesDialog = forwardRef<{ open: (keys: string[]) => void }, Props>(
    ({ onDeleteCB }, ref) => {
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
        const [selectedFileKeys, setSelectedFileKeys] = useState<string[]>([]);

        const handleDelete = async () => {
            if (!selectedFileKeys.length) return;

            try {
                await Promise.allSettled(selectedFileKeys.map(async (fileKey) => s3Service.deleteObject(fileKey)));
                setDeleteDialogOpen(false);

                onDeleteCB?.();
            } catch (error) {
                console.error('Failed to delete files:', error);
            }
        };

        useImperativeHandle(ref, () => ({
            open: (keys: string[]) => {
                setSelectedFileKeys(keys);
                if (keys.length) setDeleteDialogOpen(true);
            },
        }));

        return (
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
                    Are you sure you want to delete {selectedFileKeys.length} file
                    {selectedFileKeys.length > 1 ? 's' : ''}?
                </Typography>
                <List
                    buttonItems={false}
                    items={[...selectedFileKeys].map(
                        (file) => ({ title: file, style: { color: 'red' } }) as ListItemProps
                    )}
                />

                <br />
                <Typography>This action cannot be undone.</Typography>
            </Dialog>
        );
    }
);
