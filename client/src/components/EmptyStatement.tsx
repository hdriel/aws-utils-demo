import React, { ReactNode } from 'react';
import { SVGIcon, Text } from 'mui-simple';
import { Box } from '@mui/material';

interface Props {
    title: string;
    subtitle: string;
    icon: string | ReactNode;
}

export const EmptyStatement: React.FC<Props> = ({ title, subtitle, icon }) => {
    return title ? (
        <Box className="empty-state">
            {icon && <SVGIcon className="empty-icon">{icon}</SVGIcon>}
            <Text variant="h6" component="h3" fullWidth justifyContent="center">
                {title}
            </Text>
            {subtitle && (
                <Text variant="body2" fullWidth justifyContent="center">
                    {subtitle}
                </Text>
            )}
        </Box>
    ) : null;
};
