import { lighten } from '@mui/material';
import { ListObjectsOutput, S3ResponseFile } from '../types/aws.ts';
import { AwsTreeItem, TreeNodeItem } from '../types/ui.ts';
import { getFileIcon } from './fileUtils.ts';
import { randomColorDirectory } from './random-color.ts';

export const buildTreeFromFiles = (result: ListObjectsOutput, basePath: string = ''): AwsTreeItem => {
    const { files, directories } = result;
    const children: AwsTreeItem[] = [];

    directories.forEach((path: string) => {
        const name =
            '/' +
                path
                    .split('/')
                    .filter((p) => p)
                    .pop() || path;

        children.push({
            name,
            path,
            size: 0,
            type: 'directory',
            children: [],
        });
    });

    files.forEach((file: S3ResponseFile) => {
        children.push({
            name: file.Name,
            path: file.Key,
            size: file.Size,
            type: 'file',
            children: [],
        });
    });

    return {
        name: basePath || 'root',
        path: basePath || '/',
        type: 'directory',
        size: 0,
        children: !basePath || children.length ? children : ([] as AwsTreeItem[]),
    };
};

export const getNewRootTreeItem = () => {
    const directoryColor = randomColorDirectory();

    return {
        id: '/',
        parentId: null,
        path: '/',
        name: '/ (root)',
        size: '',
        directory: true,
        iconName: getFileIcon('', true),
        color: directoryColor,
        bgColor: directoryColor && lighten(directoryColor, 0.9),
        children: [] as TreeNodeItem[],
    };
};
