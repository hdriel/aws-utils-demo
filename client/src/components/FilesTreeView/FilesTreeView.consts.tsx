import * as React from 'react';
import IndeterminateCheckBoxRoundedIcon from '@mui/icons-material/IndeterminateCheckBoxRounded';
import DisabledByDefaultRoundedIcon from '@mui/icons-material/DisabledByDefaultRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import { styled, alpha } from '@mui/material/styles';
import { SVGIcon } from 'mui-simple';
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';

export const TreeItemStyled = styled(TreeItem)(({ theme }) => ({
    [`& .${treeItemClasses.content}`]: {
        padding: theme.spacing(0.5, 1),
        margin: theme.spacing(0.2, 0),
    },
    [`& .${treeItemClasses.iconContainer}`]: {
        '& .close': {
            opacity: 0.3,
        },
    },
    [`& .${treeItemClasses.groupTransition}`]: {
        marginLeft: 15,
        paddingLeft: 18,
        borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
    },
}));

export function ExpandIcon(props: React.PropsWithoutRef<typeof AddBoxRoundedIcon>) {
    return <SVGIcon muiIconName="Folder" sx={{ opacity: 0.7 }} {...props} />;
}

export function CollapseIcon(props: React.PropsWithoutRef<typeof IndeterminateCheckBoxRoundedIcon>) {
    return <SVGIcon muiIconName="FolderOpen" sx={{ opacity: 0.7 }} {...props} />;
}

export function EndIcon(props: React.PropsWithoutRef<typeof DisabledByDefaultRoundedIcon>) {
    return <SVGIcon muiIconName="Folder" sx={{ opacity: 0.7 }} {...props} />;
}
