import React from 'react';
import { List, Collapse, Box, SxProps, Theme, ListItem, Divider } from '@mui/material';
import MenuButton, { MenuItem, MenuTooltipText } from './MenuButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OverflowText from '../OverflowText';

export const SubMenu = ({ open, onToggle, children, title, sx }: { sx?: SxProps<Theme>, title?: string, open?: boolean, onToggle?: (open: boolean) => void, children: React.ReactNode | React.ReactNode[] }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    sx = sx || {};

    React.useEffect(() => {
        if (open !== undefined) {
            setIsOpen(open);
        }
    }, [open]);

    return (
        <MenuItem sx={sx}>
            <Box sx={{ display: 'flex', flexFlow: 'column', width: '100%' }}>
                <MenuButton
                    sx={{ pr: 0, mr: 0, pb: 0, pt: 0 }}
                    icon={isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => {
                        let next = !isOpen
                        setIsOpen(next);
                        if (onToggle !== undefined) onToggle(next);
                    }}
                >
                    <OverflowText>{title}</OverflowText>
                </MenuButton>
                <MenuItem sx={{ pr: 0, pt: 0, pb: 0, justifyContent: 'end', justifyItems: 'end', marginRight: '0 !important' }}>
                    <Collapse in={isOpen} timeout="auto">
                        <SettingsMenu sx={{ pl: 0, pb: 0, pr: 0,justifyContent: 'end', justifyItems: 'end', "&>*": { pr: 0 } }}>
                            {children}
                        </SettingsMenu>
                    </Collapse>
                </MenuItem>
            </Box>
        </MenuItem>
    )
}

export const SubMenuItem = ({ children, sx, title, tooltip }: { tooltip?: string, title?: string, children?: React.ReactNode | React.ReactNode[] | string, sx?: SxProps<Theme> }) => {
    sx = sx || {};
    return (
        <ListItem sx={{ display: 'flex', flexFlow: 'column', textAlign: 'right', p: 0, mb: 0, pt: 1, pb: 1, borderLeft: '0', borderRight: '0', justifyItems: 'end', justifyContent: 'end', ...sx }}>
            {title !== undefined &&
                (tooltip !== undefined ? <MenuTooltipText tip={tooltip}>{title}</MenuTooltipText> :
                    <Box sx={{ width: '100%', mb: 1, }}>
                        <OverflowText>{title}</OverflowText>
                    </Box>)}
            {children !== undefined &&
                <Box sx={{ width: '100%' }}>
                    {children}
                </Box>}
        </ListItem>
    )
}

const SettingsMenu = ({ children, sx }: { sx?: SxProps<Theme>, children: React.ReactNode }) => {
    sx = sx || {};

    return (
        <List sx={{
            pl: 4,
            pr: 0,
            pb: 0,
            display: 'flex',
            flexFlow: 'column',
            justifyItems: 'right',
            textAlign: 'right',
            '& *': {
                "& label": {
                    "::after": {
                        color: 'transparent',
                        display: 'none'
                    }
                }
            },
            ...sx
        }}>
            {children}
        </List>
    )
}

export default SettingsMenu;