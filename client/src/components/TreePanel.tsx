import React, { useState, useRef } from 'react';
import { Box } from '@mui/material';
// import {  Button, Typography, SVGIcon, TreeView, IndentBorderTreeItemIcons, IndentBorderTreeItem } from 'mui-simple';
import { Button, Typography, SVGIcon } from 'mui-simple';
import '../styles/treeView.scss';
import { TreeNodeItem } from '../types/ui';
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
    const TreeViewRef = useRef<{ isExpandedId: (id: string) => boolean }>(null);
    const [loading, setLoading] = useState(false);

    const { loadRootFiles, selectedNode, setSelectedId, treeData } = useNodeTree({
        isExpandedId: TreeViewRef.current?.isExpandedId,
        onFolderSelect,
        refreshTrigger,
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
                            setSelectedId('');
                            setTimeout(() => {
                                loadRootFiles();
                            }, 500);
                        }}
                    />
                </Box>
            </div>

            <div className="tree-content">
                <FilesTreeView
                    data={treeData}
                    onDeleteFileDialogOpen={deleteDialogRef.current?.open}
                    onSelect={setSelectedId}
                    ref={TreeViewRef}
                />
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
                path={!selectedNode?.path || selectedNode?.path === '/' ? '' : selectedNode.path}
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
                    setSelectedId('root');
                    onRefresh();
                }}
            />
        </div>
    );
};

// TreePanel.whyDidYouRender = true;

export default TreePanel;
