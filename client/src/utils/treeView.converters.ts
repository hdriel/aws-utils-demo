import { ListObjectsOutput, S3ResponseFile } from '../types/aws.ts';
import { AwsTreeItem, TreeNodeItem } from '../types/ui.ts';
import { formatFileSize, getFileIcon } from './fileUtils.ts';
import randomColor from '../utils/random-color.ts';
import { darken } from '@mui/material';

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
    const directoryColor = color || darken(randomColor(), 0.25);

    return {
        id: nodeId,
        parentId,
        path: root.path,
        name: root.name,
        size: isDirectory ? '' : formatFileSize(root.size),
        directory: isDirectory,
        iconName: getFileIcon(isDirectory ? '' : root.name, isDirectory),
        color: directoryColor,
        children: root.children
            ?.map((node) => buildTreeData(node, nodeId, level + 1, node.type === 'directory' ? '' : directoryColor))
            .filter((v) => v) as TreeNodeItem[],
    };
}
