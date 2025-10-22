import React, { memo, SyntheticEvent, useCallback } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeNodeItem } from '../../types/ui';
import { treeViewNodeIcons } from './FilesTreeView.consts';
import { CustomTreeItem } from './FilesTreeViewItem.tsx';

interface FilesTreeViewProps {
    data?: TreeNodeItem | null;
    onDeleteFileDialogOpen?: (node: TreeNodeItem) => void;
}

const FilesTreeView: React.FC<FilesTreeViewProps> = ({ data = null, onDeleteFileDialogOpen }) => {
    const renderTreeItem = useCallback(
        (node: TreeNodeItem | null) => {
            if (!node) return null;
            const { children, ...restProps } = node;

            const itemProps = {
                itemId: restProps.path as string,
                name: restProps.name,
                size: restProps.size,
                directory: restProps.directory,
                color: restProps.color,
                bgColor: restProps.bgColor,
                colorForDarkMode: restProps.colorForDarkMode,
                bgColorForDarkMode: restProps.bgColorForDarkMode,
                iconName: restProps.iconName,
                path: restProps.path,
                parentId: restProps.parentId,
            };

            return (
                <CustomTreeItem key={node.id} {...itemProps} onDeleteClick={onDeleteFileDialogOpen}>
                    {children?.map((child: TreeNodeItem) => renderTreeItem(child))}
                </CustomTreeItem>
            );
        },
        [onDeleteFileDialogOpen]
    );

    const handleSelectedItemsChange = (_event: SyntheticEvent<Element, Event> | null, itemId: string | null): void => {
        console.log('event, value', itemId);
    };

    return (
        <SimpleTreeView
            aria-label="customized"
            defaultExpandedItems={['/']}
            slots={treeViewNodeIcons}
            sx={{ overflowX: 'hidden', minHeight: 200, flexGrow: 1 }}
            onSelectedItemsChange={handleSelectedItemsChange}
        >
            {renderTreeItem(data)}
        </SimpleTreeView>
    );
};

export default memo(FilesTreeView);
