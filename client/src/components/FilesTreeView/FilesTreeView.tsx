import * as React from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeNodeItem } from '../../types/ui';
import { CustomTreeItem, EndIcon, ExpandIcon, CollapseIcon } from './FilesTreeView.consts';

interface FilesTreeViewProps {
    data?: TreeNodeItem;
}

const FilesTreeView: React.FC<FilesTreeViewProps> = ({ data = {} }) => {
    return (
        <SimpleTreeView
            aria-label="customized"
            defaultExpandedItems={['1', '3']}
            slots={{
                expandIcon: ExpandIcon,
                collapseIcon: CollapseIcon,
                endIcon: EndIcon,
            }}
            sx={{ overflowX: 'hidden', minHeight: 270, flexGrow: 1, maxWidth: 300 }}
        >
            <CustomTreeItem itemId="1" label="Main">
                <CustomTreeItem itemId="2" label="Hello" />
                <CustomTreeItem itemId="3" label="Subtree with children">
                    <CustomTreeItem itemId="6" label="Hello" />
                    <CustomTreeItem itemId="7" label="Sub-subtree with children">
                        <CustomTreeItem itemId="9" label="Child 1" />
                        <CustomTreeItem itemId="10" label="Child 2" />
                        <CustomTreeItem itemId="11" label="Child 3" />
                    </CustomTreeItem>
                    <CustomTreeItem itemId="8" label="Hello" />
                </CustomTreeItem>
                <CustomTreeItem itemId="4" label="World" />
                <CustomTreeItem itemId="5" label="Something something" />
            </CustomTreeItem>
        </SimpleTreeView>
    );
};

export default FilesTreeView;
