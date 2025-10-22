import { Dialog, Text } from 'mui-simple';
import { DialogTitle } from '@mui/material';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';
import { TreeNodeItem } from '../types/ui.ts';

interface Props {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    onDeleteCB?: () => void;
}

export const DeleteFolderOrFileDialog = forwardRef<{ open: (node?: TreeNodeItem) => void }, Props>(
    ({ loading, setLoading, onDeleteCB }, ref) => {
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
        const [nodeActionSelected, setNodeActionSelected] = useState<TreeNodeItem | null | undefined>();

        const handleDeleteAction = async () => {
            const nodeAction = nodeActionSelected;
            if (!nodeAction || nodeAction?.id === '/') return;

            setLoading(true);
            try {
                if (nodeAction) {
                    if (nodeAction.directory) {
                        await s3Service.deleteFolder(nodeAction.path);
                    } else {
                        await s3Service.deleteObject(nodeAction.path);
                    }
                    setDeleteDialogOpen(false);
                    onDeleteCB?.();
                }
            } catch (error) {
                console.error('Failed to delete:', error);
            } finally {
                setLoading(false);
                setNodeActionSelected(null);
            }
        };

        useImperativeHandle(ref, () => ({
            open: (node?: TreeNodeItem) => {
                setNodeActionSelected(node);
                setDeleteDialogOpen(true);
            },
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
                        disabled: loading,
                    },
                ]}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <Text>Are you sure you want to delete this item?</Text>
                <Text color="error">
                    {nodeActionSelected?.directory ? 'Directory' : 'File'}: {nodeActionSelected?.name}
                </Text>
                <br />
                <Text>This action cannot be undone.</Text>
            </Dialog>
        );
    }
);
