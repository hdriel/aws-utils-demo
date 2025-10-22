// import { TreeViewNodeProps } from 'mui-simple';
// import React from 'react';

export type FILE_TYPE = 'image' | 'video' | 'application' | 'text' | 'audio';

export interface AwsTreeItem {
    id?: string;
    name: string;
    path: string;
    size: number;
    type: 'directory' | 'file';
    index?: number;
    isLast?: boolean;
    children: AwsTreeItem[];
}

export interface TreeNodeItem {
    id: string;
    parentId: null | string;
    directory: boolean;
    prefix?: string;
    path: string;
    name: string;
    icon: any;
    color?: string;
    bgColor?: string;
    colorForDarkMode?: string;
    bgColorForDarkMode?: string;
    size: string;
    children: TreeNodeItem[];
}
