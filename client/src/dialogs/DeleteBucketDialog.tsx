import { Dialog, Text } from 'mui-simple';
import { DialogTitle } from '@mui/material';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';
import { TreeNodeItem } from '../types/ui.ts';

interface Props {
    localstack?: boolean;
    bucketName: string;
    onDeleteCB?: () => void;
}

export const DeleteBucketDialog = forwardRef<{ open: (node?: TreeNodeItem) => void }, Props>(
    ({ localstack, bucketName, onDeleteCB }, ref) => {
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

        const handleDeleteAction = async () => {
            return s3Service
                .deleteLocalstackBucket(bucketName)
                .then(() => onDeleteCB?.())
                .catch(() => alert('Failed to delete localstack bucket'));
        };

        useImperativeHandle(ref, () => ({
            open: () => setDeleteDialogOpen(true),
        }));

        return (
            <Dialog
                open={deleteDialogOpen}
                title="Confirm Delete"
                onClose={() => setDeleteDialogOpen(false)}
                actions={[
                    { onClick: () => setDeleteDialogOpen(false), label: 'Cancel' },
                    {
                        onClick: handleDeleteAction,
                        label: 'Delete',
                        variant: 'contained',
                        color: 'error',
                        disabled: !localstack,
                    },
                ]}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <Text>Are you sure you want to delete the entire bucket??</Text>
                <Text color="error">Bucket: {bucketName}</Text>
                <br />
                <Text>This action cannot be undone.</Text>
            </Dialog>
        );
    }
);
