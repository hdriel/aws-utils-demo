import { Dialog, Text } from 'mui-simple';
import { DialogTitle } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';
import { formatFileSize } from '../utils/fileUtils.ts';
import './file-info-dialog.scss';

type Props = object;
interface FileIntoType {
    filePath: string;
    fileName: string;
    size: number;
    type: string;
    lastModified: string;
    version: string;
}

// eslint-disable-next-line no-empty-pattern
export const FileInfoDialog = forwardRef<{ open: (key: string | string) => void }, Props>(({}, ref) => {
    const [fileInfoDialogOpen, setFileInfoDialogOpen] = useState(false);
    const [fileKey, setFileKey] = useState('');
    const [fileInfo, setFileInfo] = useState<FileIntoType | null>(null);

    useImperativeHandle(ref, () => ({
        open: (key: string | string) => {
            setFileKey(key || '');
            if (key) setFileInfoDialogOpen(true);
        },
    }));

    useEffect(() => {
        if (fileInfoDialogOpen) {
            s3Service.getFileInfo(fileKey).then((data) => setFileInfo(data));
        }
        return () => {
            setFileInfo(null);
        };
    }, [fileInfoDialogOpen]);

    return (
        <Dialog
            open={fileInfoDialogOpen}
            title="File Info"
            onClose={() => setFileInfoDialogOpen(false)}
            actions={[{ onClick: () => setFileInfoDialogOpen(false), label: 'Cancel' }]}
        >
            <DialogTitle>File Info</DialogTitle>
            {fileInfo && (
                <div className="file-info-container">
                    <div className="file-name">
                        <Text>File Name:</Text>
                        <Text>{fileInfo.fileName}</Text>
                    </div>
                    <div className="file-path">
                        <Text>File Path:</Text>
                        <Text>{fileInfo.filePath}</Text>
                    </div>
                    <div className="file-size">
                        <Text>File Size:</Text>
                        <Text>{formatFileSize(fileInfo.size)}</Text>
                    </div>
                    <div className="file-data">
                        <Text>File Modified At:</Text>
                        <Text>{new Date(fileInfo.lastModified).toLocaleString()}</Text>
                    </div>
                    <div className="file-type">
                        <Text>File Type:</Text>
                        <Text>{fileInfo.type}</Text>
                    </div>
                    <div className="file-version">
                        <Text>File Version:</Text>
                        <Text>{fileInfo.version}</Text>
                    </div>
                </div>
            )}
            {!fileInfo && <div>Data Not Found!</div>}
        </Dialog>
    );
});
