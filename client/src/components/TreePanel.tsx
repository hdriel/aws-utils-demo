import React, { useState, useRef } from 'react';
import { Box, Stack } from '@mui/material';
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
    const [colorize, setColorize] = useState(false);
    const [loading, setLoading] = useState(false);

    const { loadRootFiles, selectedNode, setSelectedId, treeData, reset, selectedId } = useNodeTree({
        isExpandedId: TreeViewRef.current?.isExpandedId,
        onFolderSelect,
        refreshTrigger,
    });

    console.debug('treeData', treeData);

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

                    <Stack direction="row" spacing={0}>
                        <Button
                            variant="outlined"
                            size="small"
                            icon="Palette"
                            color={colorize ? 'primary' : undefined}
                            tooltipProps={{ title: 'colorize tree' }}
                            onClick={() => setColorize((v) => !v)}
                        />
                        <Button
                            variant="outlined"
                            size="small"
                            icon="Refresh"
                            tooltipProps={{ title: 'refresh tree' }}
                            onClick={() => {
                                setSelectedId('');
                                setTimeout(() => loadRootFiles(), 500);
                            }}
                        />
                    </Stack>
                </Box>
            </div>

            <div className="tree-content">
                <FilesTreeView
                    colorize={colorize}
                    data={treeData}
                    onDeleteFileDialogOpen={deleteDialogRef.current?.open}
                    onSelect={setSelectedId}
                    ref={TreeViewRef}
                    reset={reset}
                    selectedId={selectedId}
                />
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
                    setSelectedId('/');
                    onRefresh();
                }}
            />
        </div>
    );
};

// TreePanel.whyDidYouRender = true;

export default TreePanel;
