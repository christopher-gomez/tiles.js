import React from 'react';
import { IconButton, Slider } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import MenuButton from './MenuButton';
import SettingsMenu, { SubMenu, SubMenuItem } from './SettingsMenu';

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

    cameraAutoRotates?: boolean;
    cameraMaxPolar?: number;
    cameraMinPolar?: number;
    cameraCurPolar?: number;
    allowUserVerticalRotation?: boolean;
    cameraMaxAzimuth?: number;
    cameraMinAzimuth?: number;
    cameraCurAzimuth?: number;
    allowUserHorizontalRotation?: boolean;

    onCameraAutoRotateToggled?: () => void;
    onCameraMaxPolarChange?: (angle: number) => void;
    onCameraMinPolarChange?: (angle: number) => void;
    onCameraCurPolarChange?: (angle: number) => void;
    onCameraMaxAzimuthChange?: (angle: number) => void;
    onCameraMinAzimuthChange?: (angle: number) => void;
    onCameraCurAzimuthChange?: (angle: number) => void;
    onUserVerticalRotationChange?: (val: boolean) => void;
    onUserHorizontalRotationChange?: (val: boolean) => void;
}

export default ({ open, cameraControlled, onCameraControlledToggled, cameraMaxZoom, cameraMinZoom, cameraCurZoom, cameraZoomDelta, onCameraMaxZoomChange, onCameraMinZoomChange, onCameraCurZoomChange, onCameraZoomDeltaChange, onCameraSettingsToggled, cameraAutoRotates, cameraMaxPolar, cameraMinPolar, cameraCurPolar, onCameraMaxPolarChange, onCameraMinPolarChange, onCameraCurPolarChange, cameraMaxAzimuth, cameraMinAzimuth, cameraCurAzimuth, onCameraAutoRotateToggled, onCameraCurAzimuthChange, onCameraMaxAzimuthChange, onCameraMinAzimuthChange, allowUserHorizontalRotation, allowUserVerticalRotation, onUserHorizontalRotationChange, onUserVerticalRotationChange }: ICameraSettingsComponentProps) => {
    const [zoomSettingsOpen, setZoomSettingsOpen] = React.useState(false);
    const [curCameraMaxZoom, setCurCameraMaxZoom] = React.useState(0);
    const [curCameraMinZoom, setCurCameraMinZoom] = React.useState(0);
    const [curCameraZoom, setCurCameraZoom] = React.useState(0);
    const [curCameraZoomDelta, setCurCameraZoomDelta] = React.useState(0);

    const [rotationSettingsOpen, setRotationSettingsOpen] = React.useState(false);
    const [curMaxPolar, setCurMaxPolar] = React.useState(0);
    const [curMinPolar, setCurMinPolar] = React.useState(0);
    const [curPolar, setCurPolar] = React.useState(0);
    const [curMaxAzimuth, setCurMaxAzimuth] = React.useState(0);
    const [curMinAzimuth, setCurMinAzimuth] = React.useState(0);
    const [curAzimuth, setCurAzimuth] = React.useState(0);

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

    React.useEffect(() => {
        if (cameraMaxPolar !== undefined) {
            setCurMaxPolar(cameraMaxPolar);
        }
    }, [cameraMaxPolar]);

    React.useEffect(() => {
        if (cameraMinPolar !== undefined) {
            setCurMinPolar(cameraMinPolar);
        }
    }, [cameraMinPolar]);

    React.useEffect(() => {
        if (cameraCurPolar !== undefined) {
            setCurPolar(cameraCurPolar);
        }
    }, [cameraCurPolar]);

    React.useEffect(() => {
        if (cameraMaxAzimuth !== undefined) {
            setCurMaxAzimuth(cameraMaxAzimuth);
        }
    }, [cameraMaxAzimuth]);

    React.useEffect(() => {
        if (cameraMinAzimuth !== undefined) {
            setCurMinAzimuth(cameraMinAzimuth);
        }
    }, [cameraMinAzimuth]);

    React.useEffect(() => {
        if (cameraCurAzimuth !== undefined) {
            setCurAzimuth(cameraCurAzimuth);
        }
    }, [cameraCurAzimuth]);

    return (
        <SettingsMenu>

            {cameraControlled !== undefined &&
                <MenuButton
                    icon={cameraControlled ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    onClick={() => {
                        if (onCameraControlledToggled) onCameraControlledToggled();
                    }}>
                    Can Control
                </MenuButton>
            }
            {(cameraMinZoom !== undefined || cameraMaxZoom !== undefined || cameraCurZoom !== undefined) &&
                <SubMenu
                    open={zoomSettingsOpen}
                    onToggle={(open) => {
                        setZoomSettingsOpen(open);
                    }}
                    title="Zoom"
                >
                    {cameraMinZoom !== undefined &&
                        <SubMenuItem title="Min Zoom">
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
                                    setCurCameraMinZoom(val as number)
                                    if (onCameraMinZoomChange) onCameraMinZoomChange(val as number);
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {cameraMaxZoom !== undefined &&
                        <SubMenuItem title="Max Zoom">
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
                                    setCurCameraMaxZoom(val as number)
                                    if (onCameraMaxZoomChange) onCameraMaxZoomChange(val as number);
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>}
                    {cameraCurZoom !== undefined &&
                        <SubMenuItem title="Current Zoom">
                            <Slider
                                aria-label="cur-zoom-slider"
                                step={1}
                                marks
                                min={cameraMinZoom}
                                max={cameraMaxZoom}
                                disabled={cameraMinZoom === cameraMaxZoom}
                                value={curCameraZoom}
                                onChange={(e, val) => {
                                    setCurCameraZoom(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurCameraZoom(val as number)
                                    if (onCameraCurZoomChange) onCameraCurZoomChange(val as number);
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>}
                    {/* <ListItem sx={{ flexFlow: 'column' }}>
                            <Box sx={{ width: '100%', pr: 0, mb: .25 }}>Zoom Delta</Box>
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
                                    setCurCameraZoomDelta(val as number)
                                    if (onCameraZoomDeltaChange) onCameraZoomDeltaChange(val as number);
                                }}
                                valueLabelDisplay="auto"
                            />
                        </ListItem> */}
                </SubMenu>
            }

            {(cameraCurPolar !== undefined || cameraMinPolar !== undefined || cameraMaxPolar !== undefined || cameraCurAzimuth !== undefined || cameraMaxAzimuth !== undefined || cameraMinAzimuth !== undefined || cameraAutoRotates !== undefined) &&
                <SubMenu open={rotationSettingsOpen} title="Rotation" onToggle={(open) => setRotationSettingsOpen(open)}>
                    {cameraMinPolar !== undefined &&
                        <SubMenuItem title='Min Polar Angle' tooltip="Amount of rotation allowed up">
                            <Slider
                                aria-label="min-zoom-slider"
                                step={1}
                                min={-360}
                                max={cameraMaxPolar}
                                value={curMinPolar}
                                onChange={(e, val) => {
                                    setCurMinPolar(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurMinPolar(val as number)

                                    if (onCameraMinPolarChange) onCameraMinPolarChange((val as number));
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {cameraMaxPolar !== undefined &&
                        <SubMenuItem tooltip='Amount of rotation allowed down' title="Max Polar Angle">
                            <Slider
                                aria-label="max-zoom-slider"
                                step={1}
                                min={cameraMinPolar}
                                max={360}
                                value={curMaxPolar}
                                onChange={(e, val) => {
                                    setCurMaxPolar(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurMaxPolar(val as number)
                                    if (onCameraMaxPolarChange) onCameraMaxPolarChange((val as number));
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {cameraCurPolar !== undefined &&
                        <SubMenuItem title="Current Polar Angle" tooltip="Amount of rotation on the Y-axis">
                            <Slider
                                aria-label="cur-zoom-slider"
                                step={1}
                                marks
                                min={cameraMinPolar}
                                max={cameraMaxPolar}
                                disabled={cameraMinPolar === cameraMaxPolar}
                                value={curPolar}
                                onChange={(e, val) => {
                                    setCurPolar(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurPolar(val as number)

                                    if (onCameraCurPolarChange) onCameraCurPolarChange((val as number));
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {allowUserVerticalRotation !== undefined &&
                        <SubMenuItem title="User Vertical Rotation">
                            <IconButton sx={{ p: 0 }} onClick={() => {
                                if (onUserVerticalRotationChange) onUserVerticalRotationChange(!allowUserVerticalRotation);
                            }}>
                                {allowUserVerticalRotation ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                            </IconButton>
                        </SubMenuItem>
                    }
                    {cameraMinAzimuth !== undefined &&
                        <SubMenuItem title="Min Azimuth Angle" tooltip='Amount of rotation allowed to the left'>
                            <Slider
                                aria-label="min-zoom-slider"
                                step={15}
                                min={-360}
                                max={cameraMaxAzimuth}
                                value={curMinAzimuth}
                                onChange={(e, val) => {
                                    setCurMinAzimuth(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurMinAzimuth(val as number)

                                    if (onCameraMinAzimuthChange) onCameraMinAzimuthChange((val as number));
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {cameraMaxAzimuth !== undefined &&
                        <SubMenuItem tooltip='Amount of rotation allowed to the right' title="Max Azimuth Angle">
                            <Slider
                                aria-label="max-zoom-slider"
                                step={15}
                                min={cameraMinAzimuth}
                                max={360}
                                value={curMaxAzimuth}
                                onChange={(e, val) => {
                                    setCurMaxAzimuth(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurMaxAzimuth(val as number)

                                    if (onCameraMaxAzimuthChange) onCameraMaxAzimuthChange((val as number));
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {cameraCurAzimuth !== undefined &&
                        <SubMenuItem title="Current Azimuth Angle" tooltip='Amount of rotation in the X-axis'>
                            <Slider
                                aria-label="cur-zoom-slider"
                                step={15}
                                marks
                                min={cameraMinAzimuth}
                                max={cameraMaxAzimuth}
                                disabled={cameraMinAzimuth === cameraMaxAzimuth}
                                value={curAzimuth}
                                onChange={(e, val) => {
                                    setCurAzimuth(val as number)
                                }}
                                onChangeCommitted={(e, val) => {
                                    setCurAzimuth(val as number)

                                    if (onCameraCurAzimuthChange) onCameraCurAzimuthChange(val as number);
                                }}
                                valueLabelDisplay="auto"
                            />
                        </SubMenuItem>
                    }
                    {allowUserHorizontalRotation !== undefined &&
                        <SubMenuItem title="User Vertical Rotation">
                            <IconButton sx={{ p: 0 }} onClick={() => {
                                if (onUserHorizontalRotationChange) onUserHorizontalRotationChange(!allowUserHorizontalRotation);
                            }}>
                                {allowUserHorizontalRotation ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                            </IconButton>
                        </SubMenuItem>
                    }
                    {cameraAutoRotates !== undefined &&
                        <SubMenuItem title='Auto Rotate'>
                            <IconButton sx={{ p: 0 }} onClick={() => {
                                if (onCameraAutoRotateToggled) onCameraAutoRotateToggled();
                            }}>
                                {cameraAutoRotates ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                            </IconButton>

                        </SubMenuItem>
                    }
                </SubMenu>
            }
        </SettingsMenu>
    )
}