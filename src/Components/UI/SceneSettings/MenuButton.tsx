import React from 'react';
import { ListItemButton, IconButton, ListItem, SxProps, Theme, Box } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import OverflowText from '../OverflowText';

export interface IMenuButtonComponentProps {
    onClick?: React.MouseEventHandler<HTMLDivElement>
    icon?: React.ReactElement<SvgIconProps>
    children?: string | React.ReactNode | React.ReactNode[]
    sx?: SxProps<Theme>
}

export default ({ onClick, icon, children, sx }: IMenuButtonComponentProps) => {
    sx = sx || {};

    return (
        <ListItemButton onClick={onClick} sx={{ mr: 2, pl: 0, textAlign: 'right', justifyContent: 'flex-end !important', ...sx }}>
            {icon !== undefined && <IconButton sx={{ pr: 2 }}>
                {icon}
            </IconButton>}
            {children}
        </ListItemButton>
    )
}

export const MenuItem = ({ title, children, sx }: { sx?: SxProps<Theme>, title?: string, children: React.ReactNode | React.ReactNode[] }) => {
    sx = sx || {};

    return (
        <ListItem sx={{ mr: 0, pl: 0, justifyContent: 'flex-end !important', display: 'flex', flexFlow: 'column', textAlign: 'right', width: 'auto', marginRight: '16px', ...sx }}>
            {title !== undefined && <Box sx={{ width: '100%', mb: 1 }}><OverflowText>{title}</OverflowText></Box>}
            {children !== undefined &&
                <Box sx={{ pr: 0, width: '100%' }}>
                    {children}
                </Box>}
        </ListItem>
    )
}

export const MenuTooltipText = ({ tip, children, sx }: { tip: string | React.ReactNode, children: string | React.ReactNode | React.ReactNode[], sx?: SxProps<Theme> }) => {
    sx = sx || {};
    return (
        <Tooltip title={tip} sx={{ justifyContent: 'center', alignItems: 'center', justifyItems: 'center', alignContent: 'center', textAlign: 'center' }}>
            <Box sx={{ width: '100%', mb: 1, cursor: 'help', ...sx }}>
                <OverflowText>{children}</OverflowText>
            </Box>
        </Tooltip>
    )
}