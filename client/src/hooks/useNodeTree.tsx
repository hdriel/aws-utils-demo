import { useEffect, useMemo, useState } from 'react';
import { s3Service } from '../services/s3Service.ts';
import { TreeNodeItem } from '../types/ui.ts';
import { formatFileSize, getFileIcon } from '../utils/fileUtils.ts';
import { buildTreeData } from '../utils/treeView.converters.ts';

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
    const [selectedId, setSelectedId] = useState<string>();

    useEffect(() => {
        loadRootFiles();
    }, [refreshTrigger]);

    const loadRootFiles = async () => {
        try {
            const result = await s3Service.listObjects();
            const data = buildTreeData(result);
            if (!data) return;

            setTreeData(data);
            setSelectedId(data.id);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    };

    const loadNodeFiles = async (nodeId: string, page: number = 0) => {
        const node = findNodeById(treeData, nodeId) as TreeNodeItem;
        debugger;

        if (node?.directory) {
            try {
                const paths = node.children.map((n) => n.path);
                const nodeData = await s3Service.listObjects(node.path, page);

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

    const handleNodeToggle = async (nodeId: string) => {
        return loadNodeFiles(nodeId);
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
        if (selectedId) {
            loadNodeFiles(selectedId);
        }
    }, [selectedId]);

    return {
        handleNodeToggle,
        loadNodeFiles,
        loadRootFiles,
        selectedNode,
        selectedId,
        setSelectedId,
        treeData,
    };
};
