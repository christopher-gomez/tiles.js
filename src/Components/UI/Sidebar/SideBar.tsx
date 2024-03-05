import React from 'react';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { useTheme, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    // backgroundColor: 'transparent !important',
    // background: 'transparent',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    // backgroundColor: 'transparent !important',
    // background: 'transparent',
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const SidebarButtonGroup = ({ name, subItems, subItemsOpen, action, leftIcon, rightIcon }: ISidebarButtonProps) => {
    return (
        <ListItem key={name} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
                sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                }}
                onClick={action}
            >
                <ListItemIcon
                    sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                    }}
                >
                    {leftIcon}
                </ListItemIcon>
                <ListItemText primary={name} sx={{ opacity: open ? 1 : 0 }} />
                {subItems && open ?
                    (
                        rightIcon ?? <ListItemIcon>
                            {subItemsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ListItemIcon>
                    )
                    : open && (rightIcon ?? <></>)
                }
            </ListItemButton>
            {subItems && open &&
                <>
                    <Collapse in={subItemsOpen} timeout="auto" unmountOnExit>
                        {subItems.map(innerButton => (
                            innerButton
                        ))}
                    </Collapse>
                </>
            }
        </ListItem>)
}

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        // backgroundColor: 'transparent !important',
        scrollbarWidth: 'none',
        '*::-webkit-scrollbar': {
            width: '0 !important'
        },
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

interface ISidebarButtonProps {
    name: string
    leftIcon: React.ReactElement<SvgIconProps>
    action?: () => void
    subItems?: Array<React.ReactNode>
    subItemsOpen?: boolean
    rightIcon?: React.ReactElement<SvgIconProps>
}

export interface SideBarProps {
    open: boolean,
    handleToggle: () => void
    buttonGroups: Array<Array<ISidebarButtonProps>>
}

export default ({ open, handleToggle, buttonGroups }: SideBarProps) => {
    const theme = useTheme();

    return <Drawer variant="permanent" open={open}>
        <DrawerHeader>
            <IconButton onClick={handleToggle}>
                {theme.direction === 'rtl' ? !open ? <ChevronLeftIcon /> : <ChevronRightIcon /> : !open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
        </DrawerHeader>
        <Divider />
        {buttonGroups.filter(g => g !== undefined).map((group, index) => {
            return <>
                {index !== 0 && <Divider />}
                <List>
                    {group.filter(g => g !== undefined).map(button => (
                        <SidebarButtonGroup {...button} />
                    ))}
                </List>
            </>
        })}
    </Drawer>
}