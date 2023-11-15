import React from "react";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import { styled, useTheme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AvatarTabs from "./AvatarTabs";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  pointerEvents: "none",
  backgroundColor: "transparent",
  width: open !== undefined ? `calc(100% - ${theme.spacing(7)})` : "100%",
  [theme.breakpoints.up("sm")]: {
    width: open !== undefined ? `calc(100% - ${theme.spacing(8)})` : "100%",
  },
  boxShadow: "none",
}));

interface Props {
  sidebarOpen?: boolean;
  children?: JSX.Element | JSX.Element[];
}

export default ({ sidebarOpen, children }: Props) => {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      open={sidebarOpen}
      sx={
        sidebarOpen !== undefined && sidebarOpen
          ? {
              // marginLeft: drawerWidth,
              width: `calc(100% - ${drawerWidth}px)`,
              [theme.breakpoints.up("sm")]: {
                width: `calc(100% - ${drawerWidth}px)`,
              },
              transition: theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }
          : {}
      }
    >
      <Toolbar sx={{ display: "flex", flexDirection: "row-reverse" }}>
        {children}
      </Toolbar>
    </AppBar>
  );
};
