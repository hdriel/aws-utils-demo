import { lighten } from '@mui/material';
import { ListObjectsOutput, S3ResponseFile } from '../types/aws.ts';
import { AwsTreeItem, TreeNodeItem } from '../types/ui.ts';
import { formatFileSize, getFileIcon } from './fileUtils.ts';
import { randomColorDirectory } from '../utils/random-color.ts';

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

export function buildTreeData(
    root: AwsTreeItem,
    parentId: string | null = null,
    level = 0,
    color: string = ''
): TreeNodeItem | null {
    if (!root) return null;

    const nodeId = root.path || '/';
    const isDirectory = root.type === 'directory';
    const directoryColor = color || randomColorDirectory();

    return {
        id: nodeId,
        parentId,
        path: root.path,
        name: root.name,
        size: isDirectory ? '' : formatFileSize(root.size),
        directory: isDirectory,
        iconName: getFileIcon(isDirectory ? '' : root.name, isDirectory),
        color: directoryColor,
        bgColor: directoryColor && lighten(directoryColor, 0.9),
        children: root.children
            ?.map((node) => buildTreeData(node, nodeId, level + 1, node.type === 'directory' ? '' : directoryColor))
            .filter((v) => v) as TreeNodeItem[],
    };
}

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
