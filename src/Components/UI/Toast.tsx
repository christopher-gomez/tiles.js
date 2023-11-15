import React from 'react';
import Box from '@mui/material/Box';
import { SvgIconProps } from '@mui/material/SvgIcon';
import ConstructionIcon from '@mui/icons-material/Construction';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CasinoIcon from '@mui/icons-material/Casino';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import BrushIcon from '@mui/icons-material/Brush';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Slider from '@mui/material/Slider';
import HexagonIcon from '@mui/icons-material/Hexagon';
import { Card, CardContent, CircularProgress, Collapse, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, Icon, InputLabel, List, MenuItem, Paper, Select, Slide, SlideProps, TextField, Typography, useTheme, SxProps, Theme } from '@mui/material';
import { TypographyProps } from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import DataObjectIcon from '@mui/icons-material/DataObject';
import JSONInput from 'react-json-editor-ajrm';
import ScienceIcon from '@mui/icons-material/Science';
import locale from 'react-json-editor-ajrm/locale/en';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AddIcon from '@mui/icons-material/Add';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props: SlideProps) {
    return <Slide {...props} />;
}

export interface IToastComponentProps {
    open?: boolean;
    onClose?: () => void;
    children: React.ReactElement<TypographyProps> | React.ReactElement<TypographyProps>[]
    vertical?: "bottom" | "top"
    horizontal?: "center" | "right" | "left",
    actionButton?: React.ReactNode,
    severity?: 'success' | 'info' | 'warning' | 'error';
    sx?: SxProps<Theme>
    slideDirection?: "up" | "down" | "left" | "right",
}

export default ({ open, onClose, children, vertical, horizontal, actionButton, severity, sx, slideDirection }: IToastComponentProps) => {

    const [isOpen, setIsOpen] = React.useState(false);
    const [hasEntered, setHasEntered] = React.useState(false);

    sx = sx ?? {};
    slideDirection = slideDirection ?? "up"

    React.useEffect(() => {
        if (open !== undefined) {

            if (open === isOpen) {
                return;
            }

            if (!open && isOpen) {
                setHasEntered(false);
                if (onClose !== undefined) onClose();
            }

            setIsOpen(open);
        }
    }, [open]);

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setIsOpen(false);
    };

    actionButton = actionButton ??
        (
            <IconButton
                size="medium"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
                sx={{ padding: '0 !important' }}
            >
                <CloseIcon fontSize="medium" />
            </IconButton>
        )

    severity = severity ?? "info";

    return (
        <Snackbar
            open={isOpen}
            onClose={handleClose}
            sx={{ zIndex: "999999999999999999 !important", ...sx }}
            anchorOrigin={{ vertical: vertical ?? "bottom", horizontal: horizontal ?? "right" }}
            key={"bottom" + "left" + "paint"}
            TransitionComponent={props =>
                <SlideTransition {...props}
                    // onEntering={() => {
                    //     setHasLeft(false);
                    //     setIsEntering(true);
                    // }}
                    onEntered={() => {
                        setHasEntered(true);
                    }}
                    // onExiting={() => {
                    //     setHasEntered(false);
                    //     setIsLeaving(true);
                    // }}
                    onExited={() => {
                        setHasEntered(false);
                    }}
                    direction={slideDirection}
                    appear={isOpen ? hasEntered ? false : true : true}
                />}
        >
            <Alert
                severity={severity}
                onClose={handleClose}
                action={actionButton}
                sx={{ alignItems: 'center !important' }}
            >
                <Box>
                    {children}
                </Box>
            </Alert>
        </Snackbar>
    )
}