import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
import { TreeView, Button, Typography, SVGIcon, IndentBorderTreeItemIcons, IndentBorderTreeItem } from 'mui-simple';
import '../styles/treeView.scss';
import { TreeNodeItem } from '../types/ui';
import { useFetchingList } from '../hooks/useFetchingList.ts';
import { CreateFolderDialog } from '../dialogs/CreateFolderDialog.tsx';
import { DeleteFolderOrFileDialog } from '../dialogs/DeleteFolderOrFileDialog.tsx';
import { useNodeTree } from '../hooks/useNodeTree.tsx';
import FilesTreeView from './FilesTreeView/FilesTreeView.tsx';

interface TreePanelProps {
    onFolderSelect: (path: string) => void;
    onRefresh: () => void;
    bucketName: string;
    refreshTrigger: number;
}

const TreePanel: React.FC<TreePanelProps> = ({ onFolderSelect, onRefresh, refreshTrigger }) => {
    const deleteDialogRef = useRef<{ open: (node?: TreeNodeItem) => void }>(null);
    const createDialogRef = useRef<{ open: () => void }>(null);
    const [loading, setLoading] = useState(false);

    const {
        expanded,
        loadNodeFiles,
        loadRootFiles,
        selectedNode,
        setExpanded,
        setSelected,
        treeData,
        // handleNodeToggle,
        // selected,
        // setSelectedIds,
    } = useNodeTree({
        openDeleteDialog: deleteDialogRef.current?.open,
        onFolderSelect,
        refreshTrigger,
    });

    useFetchingList({
        directory: selectedNode?.path as string,
        // todo: need to put in the list some intensifier on the sub list group to pull nested directory by pulling scrollable
        listItemSelector: `li.MuiTreeItem-root[role="treeitem"][parentid="${!selectedNode?.parentId || selectedNode?.parentId === '/' ? 'root' : selectedNode.parentId}"]`,
        isListEmpty: !selectedNode?.children?.length || !expanded.includes(selectedNode?.id as string),
        timeout: 1000,
        mountedTimeout: 2000,
        cb: async (page) => {
            if (selectedNode?.id) return loadNodeFiles(selectedNode.id, page);
        },
        deps: [expanded.join()],
    });

    console.log('treeData', treeData);

    return (
        <div className="tree-panel">
            <div className="tree-header">
                <Box sx={{ minWidth: 'max-content' }}>
                    <Typography variant="h6" component="h2">
                        Files & Folders
                    </Typography>
                </Box>

                <Box className="tree-actions">
                    <Button
                        variant="outlined"
                        size="small"
                        icon={<SVGIcon muiIconName="AddCircleOutlined" size="22px" sx={{ marginTop: '-3px' }} />}
                        tooltipProps={{ title: 'New Folder' }}
                        onClick={() => createDialogRef.current?.open()}
                    />

                    <Button
                        variant="outlined"
                        size="small"
                        icon="Refresh"
                        tooltipProps={{ title: 'refresh tree' }}
                        onClick={() => {
                            setSelected('');
                            setTimeout(() => {
                                loadRootFiles();
                            }, 500);
                        }}
                    />
                </Box>
            </div>

            <div className="tree-content">
                <FilesTreeView data={treeData} />
                {/*{false && (*/}
                {/*    <TreeView*/}
                {/*        expandedIds={expanded}*/}
                {/*        // selectedIds={selectedIds}*/}
                {/*        selectedIds={['root']}*/}
                {/*        fieldId="id"*/}
                {/*        onExpanded={(nodeIds: string[]) => setExpanded(nodeIds)}*/}
                {/*        TransitionComponent={null}*/}
                {/*        nodes={treeData ? [treeData] : undefined}*/}
                {/*        TreeItemComponent={IndentBorderTreeItem as unknown as React.ReactElement}*/}
                {/*        {...IndentBorderTreeItemIcons}*/}
                {/*        collapseIcon="FolderOpen"*/}
                {/*        expandIcon="Folder"*/}
                {/*        endIcon="Folder"*/}
                {/*        onSelected={(nodeIds: string[]) => {*/}
                {/*            setSelectedIds((state) => (state.join(',') !== nodeIds.join(',') ? nodeIds : state));*/}
                {/*            const [nodeId] = nodeIds;*/}
                {/*            if (nodeId !== selected || nodeId !== 'root') {*/}
                {/*                setSelected(nodeId);*/}
                {/*                return handleNodeToggle(nodeId);*/}
                {/*            }*/}
                {/*        }}*/}
                {/*    />*/}
                {/*)}*/}
            </div>

            <CreateFolderDialog
                ref={createDialogRef}
                isNodeSelected={!!selectedNode}
                path={selectedNode?.path ?? ''}
                setLoading={setLoading}
                onCreateFolder={async () => {
                    await loadRootFiles();
                    onRefresh();
                }}
            />

            <DeleteFolderOrFileDialog
                ref={deleteDialogRef}
                loading={loading}
                setLoading={setLoading}
                onDeleteCB={async () => {
                    await loadRootFiles();
                    setExpanded(['root']);
                    setSelected('root');
                    onRefresh();
                }}
            />
        </div>
    );
};

// TreePanel.whyDidYouRender = true;

export default TreePanel;
