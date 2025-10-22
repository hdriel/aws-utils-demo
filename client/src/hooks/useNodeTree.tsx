import { useEffect, useMemo, useState } from 'react';
import randomColor from '../utils/random-color';
import { darken, lighten } from '@mui/material';
import { s3Service } from '../services/s3Service';
import { TreeNodeItem } from '../types/ui';
import { formatFileSize, getFileIcon } from '../utils/fileUtils';
import { buildTreeData } from '../utils/treeView.converters';
import { useFetchingList } from './useFetchingList';

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

const useRender = () => {
    const [, render] = useState<number>(0);
    return () => render((c) => c + 1);
};

export const useNodeTree = ({ refreshTrigger, onFolderSelect, isExpandedId }: UseNodeTreeProps) => {
    const [treeData, setTreeData] = useState<TreeNodeItem | null>(null);
    const [selectedId, setSelectedId] = useState<string>('');
    const [reset, setReset] = useState<number>(0);
    const render = useRender();
    const isSelectedIdExpanded = isExpandedId?.(selectedId);

    useEffect(() => {
        loadRootFiles();
    }, [refreshTrigger]);

    const loadRootFiles = async () => {
        try {
            const result = await s3Service.listObjects();
            const data = buildTreeData(result);
            if (!data) return;
            setReset((c) => c + 1);
            setTreeData(data);
            setSelectedId(data.id);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const loadNodeFiles = async (nodeId: string, page: number = 0) => {
        const node = findNodeById(treeData, nodeId) as TreeNodeItem;
        const isExpanded = node?.directory && isExpandedId?.(nodeId);

        if (node?.directory && isExpanded) {
            try {
                const paths = node.children.map((n) => n.path);
                const nodeData = await s3Service.listObjects(node.path, page);

                const children = nodeData.children
                    .filter((n) => !paths.includes(n.path))
                    .map((currNode) => {
                        const isDirectory = currNode.type === 'directory';

                        let currNodePath = currNode.path;
                        if (isDirectory) {
                            currNodePath = `${node.path === '/' ? '' : (node.path ?? '')}/${currNode.path}`;
                        }
                        const currNodeId = currNodePath;
                        const directoryColor = isDirectory ? darken(randomColor(), 1) : node.color;

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

                const allChildren = [...node.children, ...children].filter((v) => v);
                const newChildren = page || !children.length ? allChildren : children;

                updateNodeChildren(
                    nodeId,
                    newChildren
                    // newChildren.sort((a, b) => +b.directory - +a.directory)
                );

                return nodeData ? 1 : 0;
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

    useEffect(() => {
        if (selectedId) loadNodeFiles(selectedId);
    }, [selectedId]);

    let parentDirectory = selectedNode?.parentId || '/';
    if (selectedNode?.directory && parentDirectory !== selectedNode?.path) parentDirectory = selectedNode?.path;
    const listItemSelector = `ul[role="group"] li[role="treeitem"][list-data-type="files-tree-view"][directory="${parentDirectory}"]`;
    const emptyChildren = !selectedNode?.children?.length;

    useFetchingList({
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

    return {
        loadNodeFiles,
        loadRootFiles,
        selectedNode,
        selectedId,
        reset,
        setSelectedId: (id: string) => {
            setSelectedId(id);
            render();
        },
        treeData,
    };
};
