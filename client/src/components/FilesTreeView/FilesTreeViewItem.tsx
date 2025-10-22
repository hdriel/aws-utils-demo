import * as React from 'react';
import { alpha, styled } from '@mui/material/styles';
import { Button, SVGIcon, Text } from 'mui-simple';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
    TreeItemContent,
    TreeItemIconContainer,
    TreeItemRoot,
    TreeItemGroupTransition,
    treeItemClasses,
} from '@mui/x-tree-view/TreeItem';
import { useTreeItem, UseTreeItemParameters } from '@mui/x-tree-view/useTreeItem';
import { TreeItemProvider } from '@mui/x-tree-view/TreeItemProvider';
// import { TreeItemIcon } from '@mui/x-tree-view/TreeItemIcon';
import { TreeNodeItem } from '../../types/ui';

declare module 'react' {
    interface CSSProperties {
        '--tree-view-color'?: string;
        '--tree-view-bg-color'?: string;
    }
}

type StyledTreeItemProps = Omit<UseTreeItemParameters, 'rootRef'> &
    React.HTMLAttributes<HTMLLIElement> &
    TreeNodeItem & { onDeleteClick?: (node: TreeNodeItem) => void };

type CustomTreeItemRootOwnerState = Pick<
    StyledTreeItemProps,
    'color' | 'bgColor' | 'bgColorForDarkMode' | 'colorForDarkMode'
>;

const CustomTreeItemRoot = styled(TreeItemRoot)<{
    ownerState: CustomTreeItemRootOwnerState;
    directory: string;
}>(({ theme, ownerState }) => ({
    '--tree-view-color': ownerState.color,
    '--tree-view-bg-color': ownerState.bgColor,
    color: (theme.vars || theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
        '--tree-view-color': ownerState.colorForDarkMode,
        '--tree-view-bg-color': ownerState.bgColorForDarkMode,
    }),
    [`& .${treeItemClasses.content}`]: {
        padding: theme.spacing(0.5, 1),
        margin: theme.spacing(0.2, 0),
    },
    [`& .${treeItemClasses.iconContainer}`]: {
        '& .close': { opacity: 0.3 },
    },
    [`& [role="group"]`]: {
        marginLeft: 15,
        paddingLeft: 18,
        borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
}));

const CustomTreeItemContent = styled(TreeItemContent)(({ theme }) => ({
    color: (theme.vars || theme).palette.text.secondary,
    paddingLeft: `calc(${theme.spacing(1)} + var(--TreeView-itemChildrenIndentation) * var(--TreeView-itemDepth) * 0)`,
    fontWeight: theme.typography.fontWeightMedium,
    '&[data-expanded]': {
        fontWeight: theme.typography.fontWeightRegular,
    },
    '&:hover': {
        backgroundColor: (theme.vars || theme).palette.action.hover,
    },
    '&[data-focused], &[data-selected], &[data-selected][data-focused]': {
        backgroundColor: `var(--tree-view-bg-color, ${(theme.vars || theme).palette.action.selected})`,
        color: 'var(--tree-view-color)',
    },
}));

const CustomTreeItemIconContainer = styled(TreeItemIconContainer)(({ theme }) => ({
    marginRight: theme.spacing(1),
}));

export const CustomTreeItem = React.forwardRef((props: StyledTreeItemProps, ref: React.Ref<HTMLLIElement>) => {
    const {
        onDeleteClick,
        id,
        itemId,
        name: label,
        disabled,
        children,
        bgColor,
        color,
        size: labelInfo,
        colorForDarkMode,
        bgColorForDarkMode,
        iconName,
        directory,
        path,
        parentId,
        ...other
    } = props;

    const iconLabel = <SVGIcon muiIconName={iconName || 'Description'} sx={{ opacity: 0.7 }} />;

    const {
        getContextProviderProps,
        getRootProps,
        getContentProps,
        getIconContainerProps,
        getLabelProps,
        getGroupTransitionProps,
        // status,
    } = useTreeItem({ id, itemId, children, label, disabled, rootRef: ref });

    const treeItemRootOwnerState = {
        color,
        bgColor,
        colorForDarkMode,
        bgColorForDarkMode,
    };

    const directoryPath = parentId || '/';
    // const iconContainer = directory ? <TreeItemIcon status={status} /> : React.cloneElement(iconLabel, { color });
    const iconContainer = React.cloneElement(iconLabel, { color });

    return (
        <TreeItemProvider {...getContextProviderProps()}>
            <CustomTreeItemRoot
                {...getRootProps(other)}
                ownerState={treeItemRootOwnerState}
                id={path}
                directory={directoryPath}
                list-data-type={'files-tree-view'}
            >
                <CustomTreeItemContent {...getContentProps()}>
                    <CustomTreeItemIconContainer {...getIconContainerProps()}>
                        {iconContainer}
                    </CustomTreeItemIconContainer>
                    <Box
                        sx={{
                            display: 'flex',
                            flexGrow: 1,
                            alignItems: 'center',
                            p: 0.5,
                            pr: 0,
                        }}
                    >
                        <Box sx={{ display: 'flex', fontWeight: 'inherit', flexGrow: 1 }}>
                            <Text {...getLabelProps({ variant: 'body2' })} color={color || 'inherit'} />
                        </Box>

                        <Typography variant="caption" color={color || 'inherit'}>
                            {labelInfo}
                        </Typography>

                        {directory ? (
                            <Button
                                icon="DeleteForever"
                                size="small"
                                padding={'0 5px'}
                                color={color || 'inherit'}
                                onClick={() => onDeleteClick?.(props)}
                            />
                        ) : (
                            <Button
                                icon="Delete"
                                size="small"
                                padding={'0 5px'}
                                color={color || 'inherit'}
                                onClick={() => onDeleteClick?.(props)}
                            />
                        )}
                    </Box>
                </CustomTreeItemContent>

                {children && <TreeItemGroupTransition {...getGroupTransitionProps()} />}
            </CustomTreeItemRoot>
        </TreeItemProvider>
    );
});
