import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { randomColorDirectory } from '../utils/random-color';
import { lighten } from '@mui/material';
import { s3Service } from '../services/s3Service';
import { TreeNodeItem } from '../types/ui';
import { formatFileSize, getFileIcon } from '../utils/fileUtils';
import { getNewRootTreeItem } from '../utils/treeView.converters';
import { useFetchingList } from './useFetchingList';
import { useRender } from './useRender.ts';

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
    isExpandedId?: (id: string) => boolean;
}

const updateNodes = ({
    nodes,
    children,
    nodeId,
}: {
    nodes: TreeNodeItem[];
    children: TreeNodeItem[];
    nodeId: string;
}): TreeNodeItem[] => {
    return nodes.map((node) => {
        if (node.id === nodeId) {
            return { ...node, children };
        }
        if (node.children) {
            return { ...node, children: updateNodes({ nodes: node.children, children, nodeId }) };
        }
        return node;
    });
};

export const useNodeTree = ({ refreshTrigger, onFolderSelect, isExpandedId }: UseNodeTreeProps) => {
    const [treeData, setTreeData] = useState<TreeNodeItem | null>(null);
    const [selectedId, setSelectedId] = useState<string>('');
    const [expandedIds, setExpandedIds] = React.useState<string[]>(['/']);

    const [reset, setReset] = useState<number>(0);
    const { render } = useRender();
    const isSelectedIdExpanded = isExpandedId?.(selectedId);

    useEffect(() => {
        loadRootFiles();
    }, [refreshTrigger]);

    const loadRootFiles = async () => {
        try {
            await loadNodeFiles('/', 0, true);
            setReset((c) => c + 1);
            setSelectedId('/');
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const loadNodeFiles = async (nodeId: string, page: number = 0, reset: boolean = false) => {
        const root = reset && nodeId === '/' ? getNewRootTreeItem() : null;
        const node = (findNodeById(treeData, nodeId) as TreeNodeItem) || root;
        const isExpanded = node?.directory && (isExpandedId?.(nodeId) || reset);

        if (node?.directory && isExpanded) {
            try {
                const nodeData = await s3Service.listObjects(node.path, page);
                let newChildren: TreeNodeItem[];
                if (page) {
                    const paths = reset ? [] : node.children.map((n) => n.path);
                    const children = nodeData.children
                        .filter((n) => !paths.includes(n.path))
                        .map((currNode) => {
                            const isDirectory = currNode.type === 'directory';

                            let currNodePath = currNode.path;
                            if (isDirectory) {
                                currNodePath = `${node.path === '/' ? '' : (node.path ?? '')}/${currNode.path}`;
                            }
                            const currNodeId = currNodePath;
                            const directoryColor = isDirectory ? randomColorDirectory() : node.color;

                            return {
                                id: currNodeId,
                                parentId: node.path || '/',
                                path: currNodePath,
                                name: currNode.name,
                                size: isDirectory ? '' : formatFileSize(currNode.size),
                                directory: isDirectory,
                                color: directoryColor,
                                bgColor: directoryColor && lighten(directoryColor, 0.7),
                                iconName: getFileIcon(isDirectory ? '' : currNode.name, isDirectory),
                                children: [],
                            } as TreeNodeItem;
                        });

                    newChildren = [...(reset ? [] : node.children), ...children].filter((v) => v);
                } else {
                    const children = nodeData.children.map((currNode) => {
                        const isDirectory = currNode.type === 'directory';

                        let currNodePath = currNode.path;
                        if (isDirectory) {
                            currNodePath = `${node.path === '/' ? '' : (node.path ?? '')}/${currNode.path}`;
                        }
                        const currNodeId = currNodePath;
                        const directoryColor = isDirectory ? randomColorDirectory() : node.color;

                        return {
                            id: currNodeId,
                            parentId: node.path || '/',
                            path: currNodePath,
                            name: currNode.name,
                            size: isDirectory ? '' : formatFileSize(currNode.size),
                            directory: isDirectory,
                            color: directoryColor,
                            bgColor: directoryColor && lighten(directoryColor, 0.7),
                            iconName: getFileIcon(isDirectory ? '' : currNode.name, isDirectory),
                            children: [],
                        } as TreeNodeItem;
                    });

                    newChildren = children;
                }

                const _treeData = reset && nodeId === '/' ? root : treeData;
                if (_treeData) {
                    const result = updateNodes({ nodes: [_treeData], children: newChildren, nodeId });
                    setTreeData({ ...result[0] });
                }

                return nodeData ? 1 : 0;
            } catch (error) {
                console.error('Failed to load folder contents:', error);
            }
        }

        return 0;
    };

    const selectedNode = useMemo(() => {
        return selectedId ? findNodeById(treeData, selectedId) : null;
    }, [selectedId]);

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

    useEffect(() => {
        if (selectedId) loadNodeFiles(selectedId);
        render();
    }, [selectedId]);

    let parentDirectory = selectedNode?.parentId || '/';
    if (selectedNode?.directory && parentDirectory !== selectedNode?.path) parentDirectory = selectedNode?.path;
    const listItemSelector = `ul[role="group"] li[role="treeitem"][list-data-type="files-tree-view"][directory="${parentDirectory}"]`;
    const emptyChildren = !selectedNode?.children?.length;

    const { resetPagination } = useFetchingList({
        directory: selectedNode?.path as string,
        listItemSelector,
        isListEmpty: emptyChildren,
        timeout: 1500,
        mountedTimeout: 1000,
        deps: [isSelectedIdExpanded],
        reset,
        cb: async (page) => {
            if (selectedId) return loadNodeFiles(selectedId, page);
        },
    });

    const reloadDirectory = useCallback(async () => {
        if (selectedNode?.parentId || selectedNode?.path === '/') {
            const path = selectedNode.directory ? selectedNode.path : (selectedNode.parentId ?? '');
            if (!expandedIds.includes(path)) setExpandedIds([...expandedIds, path]);

            setTimeout(async () => {
                await loadNodeFiles(path); // here the path tab is not expanded
                resetPagination(selectedNode?.path);
            }, 0);
        }
    }, [selectedNode]);

    return {
        loadNodeFiles,
        loadRootFiles,
        selectedNode,
        selectedId,
        setExpandedIds,
        expandedIds,
        reset,
        treeData,
        reloadDirectory,
        setSelectedId: (id: string) => {
            setSelectedId(id);
            render();
        },
    };
};
