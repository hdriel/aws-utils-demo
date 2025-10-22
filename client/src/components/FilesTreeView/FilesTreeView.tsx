import React, { forwardRef, memo, SyntheticEvent, useCallback, useEffect, useImperativeHandle } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeNodeItem } from '../../types/ui';
import { treeViewNodeIcons } from './FilesTreeView.consts';
import { CustomTreeItem } from './FilesTreeViewItem.tsx';

interface FilesTreeViewProps {
    data?: TreeNodeItem | null;
    onDeleteFileDialogOpen?: (node: TreeNodeItem) => void;
    onSelect?: (itemId: string) => void;
    reset?: number;
    selectedId?: string;
}

const FilesTreeView = forwardRef<{ isExpandedId: (id: string) => boolean }, FilesTreeViewProps>(
    ({ data = null, onDeleteFileDialogOpen, onSelect, reset, selectedId }, ref) => {
        const [expandedIds, setExpandedIds] = React.useState<string[]>(['/']);

        useImperativeHandle(ref, () => ({
            isExpandedId: (id: string) => {
                return expandedIds.includes(id);
            },
        }));

        useEffect(() => {
            setExpandedIds(['/']);
        }, [reset]);

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
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    <CustomTreeItem key={node.id} {...itemProps} onDeleteClick={onDeleteFileDialogOpen}>
                        {children?.map((child: TreeNodeItem) => renderTreeItem(child))}
                    </CustomTreeItem>
                );
            },
            [onDeleteFileDialogOpen]
        );

        const handleSelectedItemsChange = (
            _event: SyntheticEvent<Element, Event> | null,
            itemId: string | null
        ): void => {
            if (itemId) {
                if (expandedIds.includes(itemId)) setExpandedIds(expandedIds.filter((id) => id !== itemId));
                else setExpandedIds([...expandedIds, itemId]);
            }
            setTimeout(() => onSelect?.(itemId ?? ''), 0);
        };

        const handleExpandedItemsChange = (_event: React.SyntheticEvent | null, itemIds: string[]) => {
            setExpandedIds(itemIds);
        };

        return (
            <SimpleTreeView
                aria-label="customized"
                slots={treeViewNodeIcons}
                sx={{ overflowX: 'hidden', minHeight: 200, flexGrow: 1 }}
                expandedItems={expandedIds}
                onExpandedItemsChange={handleExpandedItemsChange}
                onSelectedItemsChange={handleSelectedItemsChange}
                selectedItems={selectedId}
            >
                {renderTreeItem(data)}
            </SimpleTreeView>
        );
    }
);

export default memo(FilesTreeView);
