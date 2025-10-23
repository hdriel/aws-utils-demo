import React, { forwardRef, memo, SyntheticEvent, useCallback, useEffect, useImperativeHandle } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeNodeItem } from '../../types/ui';
import { treeViewNodeIcons } from './FilesTreeView.consts';
import { CustomTreeItem } from './FilesTreeViewItem.tsx';

interface FilesTreeViewProps {
    data?: TreeNodeItem | null;
    onDeleteFileDialogOpen?: (node: TreeNodeItem) => void;
    onReloadDirectoryObjects?: (node: TreeNodeItem) => Promise<void>;
    onSelect?: (itemId: string) => void;
    reset?: number;
    selectedId?: string;
    colorize?: boolean;
    setExpandedIds: (expandedIds: string[]) => void;
    expandedIds: string[];
}

const FilesTreeView = forwardRef<{ isExpandedId: (id: string) => boolean }, FilesTreeViewProps>(
    (
        {
            data = null,
            onDeleteFileDialogOpen,
            onReloadDirectoryObjects,
            onSelect,
            reset,
            selectedId,
            colorize,
            setExpandedIds,
            expandedIds,
        },
        ref
    ) => {
        const [selectedItemId, setSelectedItemId] = React.useState<string>(selectedId ?? '');

        const renderTreeItem = useCallback(
            (node: TreeNodeItem | null) => {
                if (!node) return null;
                const { children, ...restProps } = node;

                const itemProps = {
                    itemId: restProps.path as string,
                    name: restProps.name,
                    size: restProps.size,
                    directory: restProps.directory,
                    iconName: restProps.iconName,
                    path: restProps.path,
                    parentId: restProps.parentId,
                    ...(colorize && {
                        color: restProps.color,
                        bgColor: restProps.bgColor,
                        colorForDarkMode: restProps.colorForDarkMode,
                        bgColorForDarkMode: restProps.bgColorForDarkMode,
                    }),
                };

                return (
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    <CustomTreeItem
                        key={node.id}
                        {...itemProps}
                        onDeleteClick={onDeleteFileDialogOpen}
                        onRefreshClick={async (node) => {
                            const itemId = node.directory ? node.path : (node.parentId ?? '');
                            setSelectedItemId(itemId);
                            addToExpanded(itemId);
                            onReloadDirectoryObjects?.(node);
                        }}
                    >
                        {children?.map((child: TreeNodeItem) => renderTreeItem(child))}
                    </CustomTreeItem>
                );
            },
            [onDeleteFileDialogOpen]
        );

        useImperativeHandle(ref, () => ({
            isExpandedId: (id: string) => {
                return expandedIds.includes(id);
            },
        }));

        useEffect(() => {
            setExpandedIds(['/']);
        }, [reset]);

        useEffect(() => {
            setSelectedItemId(selectedId ?? '');
        }, [selectedId]);

        const removeFromExpanded = (itemId: string) => {
            if (!itemId) return;
            if (!expandedIds.includes(itemId)) return;
            setExpandedIds(expandedIds.filter((id) => id !== itemId));
        };
        const addToExpanded = (itemId: string) => {
            if (!itemId) return;
            if (expandedIds.includes(itemId)) return;
            setExpandedIds([...expandedIds, itemId]);
        };

        const handleSelectedItemsChange = (
            _event: SyntheticEvent<Element, Event> | null,
            itemId: string | null
        ): void => {
            const selectNewItem = itemId !== selectedItemId;
            setSelectedItemId(itemId ?? '');

            if (selectNewItem) {
                if (itemId) {
                    if (expandedIds.includes(itemId)) removeFromExpanded(itemId);
                    else addToExpanded(itemId);
                }
            } else {
                addToExpanded(itemId);
            }
        };

        const handleExpandedItemsChange = (_event: React.SyntheticEvent | null, itemIds: string[]) => {
            setExpandedIds(itemIds);
        };

        useEffect(() => {
            onSelect?.(selectedItemId ?? '');
        }, [selectedItemId]);

        return (
            <SimpleTreeView
                aria-label="customized"
                slots={treeViewNodeIcons}
                sx={{ overflowX: 'hidden', minHeight: 200, flexGrow: 1 }}
                expandedItems={expandedIds}
                onExpandedItemsChange={handleExpandedItemsChange}
                onSelectedItemsChange={handleSelectedItemsChange}
                selectedItems={selectedItemId}
            >
                {renderTreeItem(data)}
            </SimpleTreeView>
        );
    }
);

export default memo(FilesTreeView);
