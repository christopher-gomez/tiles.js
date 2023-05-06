import React from 'react';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import { styled, useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AvatarTabs from './AvatarTabs';

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
    pointerEvents: 'none',
    backgroundColor: 'transparent',
    width: `calc(100% - ${theme.spacing(7)})`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${theme.spacing(8)})`,
    },
    boxShadow: 'none',
}));

interface Props {
    sidebarOpen: boolean
}

export default ({ sidebarOpen }: Props) => {
    const theme = useTheme();

    return (
        <AppBar position="fixed" open={sidebarOpen} sx={sidebarOpen ? {
            // marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            [theme.breakpoints.up('sm')]: {
                width: `calc(100% - ${drawerWidth}px)`,
            },
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        } : {}}>
            <Toolbar sx={{ display: 'flex', flexDirection: 'row-reverse', ">*": { marginRight: 5 }}}>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    sx={{
                        pointerEvents: "auto" 
                    }}
                >
                    <MenuIcon />
                </IconButton>
                <AvatarTabs names={["Chris Gomez", "Hanna Vieregg", "Camilla Gomez", "Justin Vong"]} />
            </Toolbar>
        </AppBar>
    )
}