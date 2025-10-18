import { Dialog, InputText } from 'mui-simple';
import { DialogTitle } from '@mui/material';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';

interface Props {
    isNodeSelected: boolean;
    path: string;
    setLoading: (loading: boolean) => void;
    onCreateFolder?: () => void;
}

export const CreateFolderDialog = forwardRef<{ open: () => void }, Props>(
    ({ isNodeSelected, path, setLoading, onCreateFolder }, ref) => {
        const [createDialogOpen, setCreateDialogOpen] = useState(false);
        const [newFolderName, setNewFolderName] = useState('');

        useImperativeHandle(ref, () => ({
            open: () => setCreateDialogOpen(true),
        }));

        const handleCreateFolder = async () => {
            if (!newFolderName.trim()) return;

            setLoading(true);
            try {
                if (!isNodeSelected) return;

                const basePath = path || '';
                const folderPath = [basePath, newFolderName]
                    .filter((v) => v)
                    .map((p) => p.replace(/\/$/, ''))
                    .join('/');

                await s3Service.createFolder(`${folderPath}/`);
                setCreateDialogOpen(false);
                setNewFolderName('');
                onCreateFolder?.();
            } catch (error) {
                console.error('Failed to create folder:', error);
            } finally {
                setLoading(false);
            }
        };

        return (
            <Dialog
                title="Create New Folder"
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                actions={[
                    { onClick: () => setCreateDialogOpen(false), label: 'Cancel' },
                    { onClick: handleCreateFolder, label: 'Create', variant: 'contained' },
                ]}
            >
                <DialogTitle>Create New Folder</DialogTitle>
                <InputText
                    autoFocus
                    margin="dense"
                    label="Folder Name"
                    fullWidth
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyUp={(e: KeyboardEvent) => e.key === 'Enter' && handleCreateFolder()}
                />
            </Dialog>
        );
    }
);
