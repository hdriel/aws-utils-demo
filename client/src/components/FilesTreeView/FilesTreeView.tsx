import React, { memo } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeNodeItem } from '../../types/ui';
import { EndIcon, ExpandIcon, CollapseIcon } from './FilesTreeView.consts';
import { CustomTreeItem } from './FilesTreeViewItem.tsx';
// import { alpha } from '@mui/material/styles';
// import MailIcon from '@mui/icons-material/Mail';
// import DeleteIcon from '@mui/icons-material/Delete';
// import Label from '@mui/icons-material/Label';
// import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
// import InfoIcon from '@mui/icons-material/Info';
// import ForumIcon from '@mui/icons-material/Forum';
// import LocalOfferIcon from '@mui/icons-material/LocalOffer';
// import DATA from './tree.mock.json';

interface FilesTreeViewProps {
    data?: TreeNodeItem | null;
}

const icons = {
    expandIcon: ExpandIcon,
    collapseIcon: CollapseIcon,
    endIcon: EndIcon,
};

const renderTreeItem = (node: TreeNodeItem | null) => {
    if (!node) return null;
    const { children, icon, ...restProps } = node;

    const itemProps = {
        itemId: node.id as string,
        name: node.name,
        size: node.size,
        color: restProps.color,
        bgColor: restProps.bgColor,
        colorForDarkMode: restProps.colorForDarkMode,
        bgColorForDarkMode: restProps.bgColorForDarkMode,
        icon: icon, // Pass icon directly, not from spread
    };

    return (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        <CustomTreeItem key={node.id} {...itemProps}>
            {children && children.length > 0 ? children.map((child: TreeNodeItem) => renderTreeItem(child)) : undefined}
        </CustomTreeItem>
    );
};

const FilesTreeView: React.FC<FilesTreeViewProps> = ({ data = null }) => {
    return (
        <SimpleTreeView
            aria-label="customized"
            defaultExpandedItems={['1', '3']}
            slots={icons}
            sx={{ overflowX: 'hidden', minHeight: 270, flexGrow: 1 }}
        >
            {renderTreeItem(data)}
        </SimpleTreeView>
    );
};

export default memo(FilesTreeView);

/*
<CustomTreeItem itemId="1" label="All Mail" labelIcon={MailIcon} />
            <CustomTreeItem itemId="2" label="Trash" labelIcon={DeleteIcon} />
            <CustomTreeItem itemId="3" label="Categories" labelIcon={Label}>
                <CustomTreeItem
                    itemId="5"
                    label="Social"
                    labelIcon={SupervisorAccountIcon}
                    labelInfo="90"
                    color="#1a73e8"
                    bgColor="#e8f0fe"
                    colorForDarkMode="#B8E7FB"
                    bgColorForDarkMode={alpha('#00b4ff', 0.2)}
                />
                <CustomTreeItem
                    itemId="6"
                    label="Updates"
                    labelIcon={InfoIcon}
                    labelInfo="2,294"
                    color="#e3742f"
                    bgColor="#fcefe3"
                    colorForDarkMode="#FFE2B7"
                    bgColorForDarkMode={alpha('#ff8f00', 0.2)}
                />
                <CustomTreeItem
                    itemId="7"
                    label="Forums"
                    labelIcon={ForumIcon}
                    labelInfo="3,566"
                    color="#a250f5"
                    bgColor="#f3e8fd"
                    colorForDarkMode="#D9B8FB"
                    bgColorForDarkMode={alpha('#9035ff', 0.15)}
                />
                <CustomTreeItem
                    itemId="8"
                    label="Promotions"
                    labelIcon={LocalOfferIcon}
                    labelInfo="733"
                    color="#3c8039"
                    bgColor="#e6f4ea"
                    colorForDarkMode="#CCE8CD"
                    bgColorForDarkMode={alpha('#64ff6a', 0.2)}
                />
            </CustomTreeItem>
            <CustomTreeItem itemId="4" label="History" labelIcon={Label} />
 */
