import { useEffect, useMemo, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';
import { AwsTreeItem, TreeNodeItem } from '../types/ui.ts';
import { Box } from '@mui/material';
import { Button, SVGIcon, Typography } from 'mui-simple';
import { formatFileSize, getFileIcon } from '../utils/fileUtils.ts';
import { ListObjectsOutput, S3ResponseFile } from '../types/aws.ts';

const buildTreeFromFiles = (result: ListObjectsOutput, basePath: string = ''): AwsTreeItem => {
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
        children: !basePath || children.length ? children : ([{ id: '.', name: '', path: '' }] as AwsTreeItem[]),
    };
};

const findNodeById = (node: TreeNodeItem | null, nodeId: string): TreeNodeItem | null => {
    if (!node) return null;
    const stack = [node];

    while (stack.length) {
        const currNode = stack.shift();
        if (!currNode) break;

        if (currNode.id === nodeId) {
            return currNode;
        }

        if (currNode.children?.length) {
            stack.push(...currNode.children);
        }
    }

    return null;
};

interface UseNodeTreeProps {
    refreshTrigger: number;
    onFolderSelect: (path: string) => void;
}

export const useNodeTree = ({ refreshTrigger, onFolderSelect }: UseNodeTreeProps) => {
    const [treeData, setTreeData] = useState<TreeNodeItem | null>(null);
    const [expanded, setExpanded] = useState<string[]>([]);
    const [, setSelectedIds] = useState<string[]>(['root']);
    const [selected, setSelected] = useState<string>();

    useEffect(() => {
        loadRootFiles();
    }, [refreshTrigger]);

    function buildTreeData(root: AwsTreeItem, parentId: string | null = null, level = 0): TreeNodeItem | null {
        if (!root) return null;

        const nodeId = !root.path || root.path === '/' ? 'root' : root.path || '/';
        const isDirectory = root.type === 'directory';

        return {
            id: nodeId,
            parentId,
            path: root.path,
            name: root.name,
            size: isDirectory ? '' : formatFileSize(root.size),
            directory: isDirectory,
            iconName: getFileIcon(isDirectory ? '' : root.name, isDirectory),

            children: root.children
                ?.map((node) => buildTreeData(node, nodeId, level + 1))
                .filter((v) => v) as TreeNodeItem[],
        };
    }

    const loadRootFiles = async () => {
        try {
            const result = await s3Service.listObjects();
            const nodeData = buildTreeFromFiles(result);
            const data = buildTreeData(nodeData);
            if (!data) return;

            setTreeData(data);
            setSelected(data.id);
            setExpanded([data.id]);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const loadNodeFiles = async (nodeId: string, page: number = 0) => {
        const node = findNodeById(treeData, nodeId) as TreeNodeItem;
        if (node?.directory) {
            try {
                const paths = node.children.map((n) => n.path);
                const result = await s3Service.listObjects(node.path, page);
                const nodeData = buildTreeFromFiles(result, node.path);

                const children = nodeData.children
                    .filter((n) => !paths.includes(n.path))
                    .map((currNode) => {
                        const currNodePath =
                            currNode.type === 'file' ? currNode.path : `${node.path ?? ''}/${currNode.path}`;

                        const currNodeId = currNodePath;
                        const isDirectory = currNode.type === 'directory';

                        return {
                            id: currNodeId,
                            parentId: node.path,
                            path: currNodePath,
                            name: currNode.name,
                            size: isDirectory ? '' : formatFileSize(currNode.size),
                            directory: isDirectory,
                            children: [],
                            iconName: getFileIcon(isDirectory ? '' : node.name, isDirectory),
                        } as TreeNodeItem;
                    });

                const allChildren = [...node.children, ...children].filter((v) => v);
                const newChildren = page || !children.length ? allChildren : children;

                updateNodeChildren(
                    nodeId,
                    newChildren
                    // newChildren.sort((a, b) => +b.directory - +a.directory)
                );

                return result.files.length + result.directories.length;
            } catch (error) {
                console.error('Failed to load folder contents:', error);
            }
        }
        return 0;
    };

    const updateNodeChildren = (nodeId: string, children: TreeNodeItem[]) => {
        const updateNodes = (nodes: TreeNodeItem[]): TreeNodeItem[] => {
            return nodes.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, children };
                }
                if (node.children) {
                    return { ...node, children: updateNodes(node.children) };
                }
                return node;
            });
        };

        if (treeData) {
            const result = updateNodes([treeData]);

            setTreeData({ ...result[0] });
        }
    };

    const handleNodeToggle = async (nodeId: string) => {
        if (expanded.includes(nodeId)) {
            setExpanded(expanded.filter((id) => id !== nodeId));
        } else {
            setExpanded([...expanded, nodeId]);

            return loadNodeFiles(nodeId);
        }
    };

    const selectedNode = useMemo(() => {
        return selected ? findNodeById(treeData, selected) : null;
    }, [selected]);

    useEffect(() => {
        if (selectedNode?.path) {
            const path = selectedNode.directory
                ? selectedNode.path
                : selectedNode.path.split('/').slice(0, -1).join('/');

            onFolderSelect(path);
        } else {
            onFolderSelect('');
        }
    }, [selectedNode]);

    return {
        expanded,
        handleNodeToggle,
        loadNodeFiles,
        loadRootFiles,
        selected,
        selectedNode,
        setExpanded,
        setSelected,
        setSelectedIds,
        treeData,
    };
};
