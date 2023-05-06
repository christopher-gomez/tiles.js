import React from 'react';
import { Box, Collapse, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Slider } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface ICameraSettingsComponentProps {
    open: boolean
    onCameraSettingsToggled?: (opean: boolean) => void;
    cameraControlled?: boolean;
    onCameraControlledToggled?: () => void;
    cameraMaxZoom?: number;
    cameraMinZoom?: number;
    cameraCurZoom?: number;
    cameraZoomDelta?: number;
    onCameraMaxZoomChange?: (zoom: number) => void;
    onCameraMinZoomChange?: (zoom: number) => void;
    onCameraCurZoomChange?: (zoom: number) => void;
    onCameraZoomDeltaChange?: (delta: number) => void;
}

export default ({ open, cameraControlled, onCameraControlledToggled, cameraMaxZoom, cameraMinZoom, cameraCurZoom, cameraZoomDelta, onCameraMaxZoomChange, onCameraMinZoomChange, onCameraCurZoomChange, onCameraZoomDeltaChange, onCameraSettingsToggled }: ICameraSettingsComponentProps) => {
    const [zoomSettingsOpen, setZoomSettingsOpen] = React.useState(false);
    const [curCameraMaxZoom, setCurCameraMaxZoom] = React.useState(0);
    const [curCameraMinZoom, setCurCameraMinZoom] = React.useState(0);
    const [curCameraZoom, setCurCameraZoom] = React.useState(0);
    const [curCameraZoomDelta, setCurCameraZoomDelta] = React.useState(0);
    const [rotationSettingsOpen, setRotationSettingsOpen] = React.useState(false);

    React.useEffect(() => {
        if (onCameraSettingsToggled) onCameraSettingsToggled(open);

        if (open) {
        } else {
            if (zoomSettingsOpen) setZoomSettingsOpen(false);
            if (rotationSettingsOpen) setRotationSettingsOpen(false);
        }
    }, [open]);

    React.useEffect(() => {
        if (cameraMaxZoom !== undefined) {
            setCurCameraMaxZoom(cameraMaxZoom);
        }
    }, [cameraMaxZoom]);

    React.useEffect(() => {
        if (cameraMinZoom !== undefined) {
            setCurCameraMinZoom(cameraMinZoom);
        }
    }, [cameraMinZoom]);

    React.useEffect(() => {
        if (cameraCurZoom !== undefined) {
            setCurCameraZoom(cameraCurZoom);
        }
    }, [cameraCurZoom]);

    React.useEffect(() => {
        if (cameraZoomDelta !== undefined) {
            setCurCameraZoomDelta(cameraZoomDelta);
        }
    }, [cameraZoomDelta]);

    React.useEffect(() => {
        if (zoomSettingsOpen) {
            if (rotationSettingsOpen) setRotationSettingsOpen(false);
        }
    }, [zoomSettingsOpen]);

    React.useEffect(() => {
        if (rotationSettingsOpen) {
            if (zoomSettingsOpen) setZoomSettingsOpen(false);
        }
    }, [rotationSettingsOpen])
    
    return (
        <List sx={{
            pl: 4,
            pr: 0,
            display: 'flex',
            flexFlow: 'column',
            justifyItems: 'right',
            textAlign: 'right',
            '& *': {
                textAlign: 'right !important',
                justifyContent: 'flex-end',
                "& label": {
                    "::after": {
                        color: 'transparent',
                        display: 'none'
                    }
                }
            }
        }}>
            {cameraControlled !== undefined &&
                <ListItem>
                    <IconButton sx={{ pr: 1 }} onClick={() => {
                        if (onCameraControlledToggled) onCameraControlledToggled();
                    }}>
                        {cameraControlled ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    </IconButton>
                    Can Control
                </ListItem>
            }
            {cameraMinZoom !== undefined && cameraMaxZoom !== undefined && cameraCurZoom !== undefined &&
                <>
                    <ListItemButton onClick={() => {
                        setZoomSettingsOpen(!zoomSettingsOpen);
                    }} sx={{ flexFlow: 'row-reverse', mr: 2 }}>
                        <ListItemText primary={"Zoom"} sx={{ textAlign: 'right' }} />
                        <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                            {zoomSettingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </ListItemIcon>
                    </ListItemButton>
                    <Collapse in={zoomSettingsOpen} timeout='auto'>
                        <List>
                            {cameraMinZoom !== undefined &&
                                <ListItem sx={{ flexFlow: 'column', textAlign: 'right' }}>
                                    <Box sx={{ width: '100%', pr: 2, mb: .5 }}>Min Zoom</Box>
                                    <Slider
                                        aria-label="min-zoom-slider"
                                        step={1}
                                        min={0}
                                        max={cameraMaxZoom}
                                        value={curCameraMinZoom}
                                        onChange={(e, val) => {
                                            setCurCameraMinZoom(val as number)
                                        }}
                                        onChangeCommitted={(e, val) => {
                                            setCurCameraMinZoom(val as number);

                                            if (onCameraMinZoomChange) onCameraMinZoomChange(val as number);
                                        }}
                                        valueLabelDisplay="auto"
                                    />
                                </ListItem>
                            }
                            {cameraMaxZoom !== undefined &&
                                <ListItem sx={{ flexFlow: 'column', textAlign: 'right' }}>
                                    <Box sx={{ width: '100%', pr: 2, mb: .5 }}>Max Zoom</Box>
                                    <Slider
                                        aria-label="max-zoom-slider"
                                        step={1}
                                        min={cameraMinZoom}
                                        max={1000}
                                        value={curCameraMaxZoom}
                                        onChange={(e, val) => {
                                            setCurCameraMaxZoom(val as number)
                                        }}
                                        onChangeCommitted={(e, val) => {
                                            setCurCameraMaxZoom(val as number);

                                            if (onCameraMaxZoomChange) onCameraMaxZoomChange(val as number);
                                        }}
                                        valueLabelDisplay="auto"
                                    />
                                </ListItem>}
                            {cameraCurZoom !== undefined &&
                                <ListItem sx={{ flexFlow: 'column', textAlign: 'right' }}>
                                    <Box sx={{ width: '100%', pr: 2, mb: .5 }}>Current Zoom</Box>
                                    <Slider
                                        aria-label="cur-zoom-slider"
                                        step={1}
                                        marks
                                        min={cameraMinZoom}
                                        max={cameraMaxZoom}
                                        value={curCameraZoom}
                                        onChange={(e, val) => {
                                            setCurCameraZoom(val as number)
                                        }}
                                        onChangeCommitted={(e, val) => {
                                            setCurCameraZoom(val as number);

                                            if (onCameraCurZoomChange) onCameraCurZoomChange(val as number);
                                        }}
                                        valueLabelDisplay="auto"
                                    />
                                </ListItem>}
                            <ListItem sx={{ flexFlow: 'column', textAlign: 'right' }}>
                                <Box sx={{ width: '100%', pr: 2, mb: .5 }}>Zoom Delta</Box>
                                <Slider
                                    aria-label="cur-zoom-delta-slider"
                                    step={1}
                                    min={1}
                                    max={20}
                                    value={curCameraZoomDelta}
                                    onChange={(e, val) => {
                                        setCurCameraZoomDelta(val as number)
                                    }}
                                    onChangeCommitted={(e, val) => {
                                        setCurCameraZoomDelta(val as number);

                                        if (onCameraZoomDeltaChange) onCameraZoomDeltaChange(val as number);
                                    }}
                                    valueLabelDisplay="auto"
                                /></ListItem>
                        </List>
                    </Collapse>
                </>
            }

            <>
                <ListItemButton onClick={() => {
                    setRotationSettingsOpen(!rotationSettingsOpen);
                }} sx={{ flexFlow: 'row-reverse', mr: 2 }}>
                    <ListItemText primary={"Rotation"} sx={{ textAlign: 'right' }} />
                    <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                        {rotationSettingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItemIcon>
                </ListItemButton>
                <Collapse in={rotationSettingsOpen} timeout="auto">
                    <List>
                        <ListItem>Max Polar Angle</ListItem>
                        <ListItem>Min Polar Angle</ListItem>
                        <ListItem>Current Polar Angle</ListItem>
                        <ListItem>Max Azimuth Angle</ListItem>
                        <ListItem>Min Azimuth Angle</ListItem>
                        <ListItem>Current Azimuth Angle</ListItem>
                        <ListItem>Auto Rotate</ListItem>
                    </List>
                </Collapse>
            </>
        </List>
    )
}