import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}
const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: 'transparent',
    width: `calc(100% - ${theme.spacing(7)})`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${theme.spacing(8)})`,
    },
    pointerEvents: "none",
    boxShadow: 'none',
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

interface Props {
    sidebarOpen: boolean,
}

export default ({ sidebarOpen, children }: React.PropsWithChildren<Props>) => {
    const theme = useTheme();

    const openSide = sidebarOpen ? {
        // marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        [theme.breakpoints.up('sm')]: {
            width: `calc(100% - ${drawerWidth}px)`,
        },
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    } : {};

    return (
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0, backgroundColor: "transparent", paddingBottom: 2, ...openSide }} open={sidebarOpen}>
            <Toolbar>
                <Box sx={{ flexGrow: 1 }} />
                {children}
            </Toolbar>
        </AppBar>
    )
}