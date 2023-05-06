import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { forwardRef } from 'react';
import TopBar from './TopBar';
import SideBar from './SideBar';
import BottomBar from './BottomBar';
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
import Engine, { ViewType } from '../../lib/Engine';
import View from '../../lib/scene/View';
import Tile, { TileTerrain } from '../../lib/map/Tile';
import { Card, CardContent, CircularProgress, Collapse, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, List, MenuItem, Paper, Select, Slide, SlideProps, TextField, Typography, useTheme } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import DataObjectIcon from '@mui/icons-material/DataObject';
import Tools from '../../lib/utils/Tools';
import JSONInput from 'react-json-editor-ajrm';
import ScienceIcon from '@mui/icons-material/Science';
import locale from 'react-json-editor-ajrm/locale/en';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Fab from '@mui/material/Fab';
import { MuiFileInput } from 'mui-file-input'
import { EntityPlacementType } from '../../lib/env/Entity';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import VideocamIcon from '@mui/icons-material/Videocam';
import CameraSettings, { ICameraSettingsComponentProps } from './SceneSettings/CameraSettings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EntitiesMenu, { IEntitiesMenuComponentProps } from './SceneSettings/EntitiesMenu';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface IProps {
    // general
    loading?: boolean
    onSideMenuToggled?: (open: boolean) => void;

    onDiceRolled?: (val: number) => void;

    hasEntityMenu?: boolean;

    // map design tools
    onDesignToggled?: (open: boolean) => void;
    onMapSizeToggled?: (open: boolean) => void;
    onMapSizeChanged?: (val: number) => void;
    onTilePaintToggled?: (open: boolean) => void;
    onSetPaintTerrainType?: (type: TileTerrain) => void;

    mapSize?: number;
    onTileDataSelected?: (open: boolean) => void;
    onTileDiceValueSelected?: (open: boolean) => void;
    onDiceValueInput?: (val: number) => void;
    onTileJSONDataSelected?: (open: boolean, onTileSelectCB?: (tile: Tile) => void) => void;
    onTileJSONDataInput?: (val: string) => void;
    curHighlightedTile?: Tile;

    hasCameraSettings?: boolean;

    onSaveMapSelected?: (open: boolean) => void;
    onModalToggled?: (open: boolean) => void;
    onSaveMap?: (cb: (data: string) => void) => void;
    onLoadJSON?: (jsonObj: { [key: string]: any }) => void;
}

type Props = Omit<IProps & ICameraSettingsComponentProps & IEntitiesMenuComponentProps, "open">

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
}

export default forwardRef(({ loading, onSideMenuToggled, hasEntityMenu, onMapSizeChanged, mapSize, onTilePaintToggled, onDesignToggled, onSetPaintTerrainType, onMapSizeToggled, curHighlightedTile, onTileDataSelected, onTileDiceValueSelected, onDiceValueInput, onSaveMapSelected, onSaveMap, onTileJSONDataInput, onTileJSONDataSelected, onModalToggled, onDiceRolled, onLoadJSON, hasCameraSettings, ...others }: Props, ref: React.ForwardedRef<HTMLDivElement>) => {
    const theme = useTheme();

    const { onCameraControlledToggled, onCameraCurZoomChange, onCameraMaxZoomChange, onCameraMinZoomChange, onCameraSettingsToggled, onCameraZoomDeltaChange, cameraControlled, cameraCurZoom, cameraMaxZoom, cameraMinZoom, cameraZoomDelta, ...more } = others;

    const cameraSettings = { onCameraControlledToggled, onCameraCurZoomChange, onCameraMaxZoomChange, onCameraMinZoomChange, onCameraSettingsToggled, onCameraZoomDeltaChange, cameraControlled, cameraCurZoom, cameraMaxZoom, cameraMinZoom, cameraZoomDelta };


    const [isLoading, setIsLoading] = React.useState(true);
    const [sideOpen, setSideOpen] = React.useState(false);

    const [entitiesOpen, setEntityMenuOpen] = React.useState(false);

    const [designOpen, setDesignOpen] = React.useState(false);
    const [mapSizeOpen, setMapSizeOpen] = React.useState(false);
    const [curMapSize, setMapSize] = React.useState(0);
    const [paintOpen, setPaintOpen] = React.useState(false);
    const [paintType, setPaintType] = React.useState(TileTerrain.Ocean);
    const [paintTipOpen, setPaintTipOpen] = React.useState(false);
    const [showedPaintTipOnce, setShowedPaintTipOnce] = React.useState(false);
    const [tileDataOpen, setTileDataOpen] = React.useState(false);
    const [tileDiceValueOpen, setTileDiceValueOpen] = React.useState(false);
    const [tileDiceValueTipOpen, setTileDiceValueTipOpen] = React.useState(false);
    const [showedtileDiceValueTipOnce, setShowedTileDiceValueTipOnce] = React.useState(false);
    const [tileJSONDataOpen, setTileJSONDataOpen] = React.useState(false);
    const [curTileJSONData, setCurTileJSONData] = React.useState({});
    const [tileJSONModalOpen, setTileJSONModalOpen] = React.useState(false);
    const [tileJSONDataTipOpen, setTileJSONDataTipOpen] = React.useState(false);
    const [showedTileJSONTipOnce, setShowedTileJSONTipOnce] = React.useState(false);

    const [cameraSettingsOpen, setCameraSettingsOpen] = React.useState(false);

    const [savingMap, setSavingMap] = React.useState(false);
    const [mapName, setMapName] = React.useState('');

    const [loadModalOpen, setLoadModalOpen] = React.useState(false);
    const [selectedLoadFile, setSelectedLoadFile] = React.useState<File>(null);

    const [diceRolled, setDiceRolled] = React.useState(false);
    const [curDiceVal, setCurDiceVal] = React.useState(0);

    const fabRef: React.RefObject<HTMLButtonElement> = React.useRef(null);

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Escape" && !savingMap) {
            setSideOpen(false);
        }
    }

    React.useEffect(() => {
        if (loading !== undefined) {
            console.log('uiManager loading: ' + loading);
            setIsLoading(loading);
        }
    }, [loading]);

    React.useEffect(() => {
        document.body.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.removeEventListener("keydown", onKeyDown);
        }
    }, [])

    React.useEffect(() => {
        if (onSideMenuToggled) onSideMenuToggled(sideOpen);

        if (!sideOpen) {
            if (entitiesOpen) setEntityMenuOpen(false);
            if (designOpen) setDesignOpen(false);
            if (cameraSettingsOpen) setCameraSettingsOpen(false);
        }
    }, [sideOpen])

    React.useEffect(() => {
        if (entitiesOpen) {
            if (!sideOpen) setSideOpen(true);
            if (designOpen) setDesignOpen(false);
            if (cameraSettingsOpen) setCameraSettingsOpen(false);
        } else {
        }
    }, [entitiesOpen])

    React.useEffect(() => {
        if (onDesignToggled) onDesignToggled(designOpen);

        if (designOpen) {
            if (!sideOpen) setSideOpen(true);
            if (entitiesOpen) setEntityMenuOpen(false);
            if (cameraSettingsOpen) setCameraSettingsOpen(false);
        } else {
            if (mapSizeOpen)
                setMapSizeOpen(false);
            if (paintOpen)
                setPaintOpen(false);
            if (tileDataOpen)
                setTileDataOpen(false);
        }
    }, [designOpen]);

    React.useEffect(() => {
        if (onMapSizeToggled) onMapSizeToggled(mapSizeOpen);

        if (mapSizeOpen) {
            if (paintOpen) setPaintOpen(false);
            if (tileDataOpen) setTileDataOpen(false);
        }
    }, [mapSizeOpen]);

    React.useEffect(() => {
        if (mapSize !== undefined) setMapSize(mapSize);
    }, [mapSize])

    React.useEffect(() => {
        if (onTilePaintToggled) onTilePaintToggled(paintOpen);

        if (paintOpen) {
            if (mapSizeOpen)
                setMapSizeOpen(false);

            if (tileDataOpen)
                setTileDataOpen(false);

            if (!showedPaintTipOnce) setPaintTipOpen(true);
        } else {
            if (paintTipOpen) setPaintTipOpen(false);
        }
    }, [paintOpen]);


    // React.useEffect(() => {
    //     if (paintTipOpen) {
    //         if (!showedPaintTipOnce) setShowedPaintTipOnce(true);
    //     }
    // }, [paintTipOpen])

    React.useEffect(() => {
        if (onTileDataSelected) onTileDataSelected(tileDataOpen);

        if (tileDataOpen) {
            if (mapSizeOpen)
                setMapSizeOpen(false);
            if (paintOpen)
                setPaintOpen(false);
        } else {
            if (tileDiceValueOpen)
                setTileDiceValueOpen(false);

            if (tileJSONDataOpen)
                setTileJSONDataOpen(false)
        }
    }, [tileDataOpen]);

    React.useEffect(() => {
        if (onTileDiceValueSelected) onTileDiceValueSelected(tileDiceValueOpen);

        if (tileDiceValueOpen) {
            if (tileJSONDataOpen)
                setTileJSONDataOpen(false)

            if (!showedtileDiceValueTipOnce) setTileDiceValueTipOpen(true);
        } else {
            setTileDiceValueTipOpen(false);
        }
    }, [tileDiceValueOpen]);

    React.useEffect(() => {
        if (onTileJSONDataSelected) onTileJSONDataSelected(tileJSONDataOpen, (tile) => {
            setCurTileJSONData(tile.customData);

            window.setTimeout(() => {
                setTileJSONModalOpen(true);
            }, 100)
        });

        if (tileJSONDataOpen) {
            if (tileDiceValueOpen)
                setTileDiceValueOpen(false)

            if (!showedTileJSONTipOnce) setTileJSONDataTipOpen(true);
        } else {
            setTileJSONDataTipOpen(false);
            setCurTileJSONData({});
        }
    }, [tileJSONDataOpen]);

    React.useEffect(() => {
        if (onModalToggled) onModalToggled(tileJSONModalOpen)

        if (!tileJSONModalOpen) {
            setCurTileJSONData({});
        }

    }, [tileJSONModalOpen])

    // React.useEffect(() => {
    //     if (tileDiceValueTipOpen && !showedtileDiceValueTipOnce) setShowedTileDiceValueTipOnce(true);
    // }, [tileDiceValueTipOpen]);

    // React.useEffect(() => {
    //     if (tileJSONDataTipOpen && !showedTileJSONTipOnce) setShowedTileJSONTipOnce(true);
    // }, [tileJSONDataTipOpen]);

    React.useEffect(() => {
        if (onTileDiceValueSelected) onTileDiceValueSelected(tileDiceValueOpen);

        if (tileDiceValueOpen) {
            if (!showedtileDiceValueTipOnce) setTileDiceValueTipOpen(true);
        } else {
            setTileDiceValueTipOpen(false);
        }
    }, [tileDiceValueOpen]);

    React.useEffect(() => {
        if (cameraSettingsOpen) {
            if (!sideOpen) setSideOpen(true);
            if (entitiesOpen) setEntityMenuOpen(false);
            if (designOpen) setDesignOpen(false);
        }
    }, [cameraSettingsOpen]);

    React.useEffect(() => {

        if (loadModalOpen) setLoadModalOpen(false);

        if (onSaveMapSelected) onSaveMapSelected(savingMap);

        if (onModalToggled) {
            onModalToggled(savingMap)
        }

        if (savingMap) {
            setEntityMenuOpen(false);
            setDesignOpen(false);

        } else {
            setMapName('');
        }
    }, [savingMap])

    React.useEffect(() => {

        if (savingMap) setSavingMap(false);

        if (onModalToggled) { onModalToggled(loadModalOpen); }

        if (loadModalOpen) {
            setEntityMenuOpen(false);
            setDesignOpen(false);

        } else {
            setSelectedLoadFile(null);
        }
    }, [loadModalOpen])

    React.useEffect(() => {
        if (diceRolled) {
            const val = Tools.randomInt(1, 12);

            if (onDiceRolled) onDiceRolled(val);

            setCurDiceVal(val);
        }
    }, [diceRolled]);

    const handlePaintTipClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setPaintTipOpen(false);
    };

    const handleTileDiceTipClose = (event) => (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setTileDiceValueTipOpen(false);
    };

    const handleJSONDataTipClose = (event) => (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setTileJSONDataTipOpen(false);
    };
    return (<>

        <SideBar
            open={sideOpen}
            buttonGroups={[
                hasEntityMenu && [
                    {
                        name: 'Entities',
                        leftIcon: <SmartToyIcon />,
                        action: () => {
                            setEntityMenuOpen(!entitiesOpen);
                        },
                        subItems: [
                            (
                                <EntitiesMenu {...more} open={entitiesOpen} />
                            ),
                        ],
                        subItemsOpen: entitiesOpen
                    },
                ],
                [
                    {
                        name: 'Design',
                        leftIcon: <DesignServicesIcon />,
                        action: () => {
                            setDesignOpen(!designOpen);
                        },
                        subItems: [
                            (
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
                                    <ListItemButton sx={{ flexFlow: 'row-reverse', mr: 2 }} onClick={() => {
                                        setMapSizeOpen(!mapSizeOpen);
                                    }}>
                                        {/* <ListItemIcon>
                                            <HexagonIcon />
                                        </ListItemIcon> */}
                                        <ListItemText primary={"Map Size"} />
                                        <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                                            {mapSizeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </ListItemIcon>
                                    </ListItemButton>
                                    <Collapse in={mapSizeOpen} timeout="auto">
                                        <TextField
                                            sx={{ p: 0, mr: 1, }}
                                            size="small"
                                            id="map-size-controlled"
                                            type="number"
                                            value={curMapSize}
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val;
                                                if (Number.isNaN(Number.parseInt(event.target.value))) {
                                                    val = 0;
                                                } else { val = Number.parseInt(event.target.value) };

                                                setMapSize(val);

                                                if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Collapse>
                                    <ListItemButton sx={{ flexFlow: 'row-reverse', mr: 2 }} onClick={() => {
                                        setPaintOpen(!paintOpen);
                                    }}>
                                        {/* <ListItemIcon>
                                            <BrushIcon />
                                        </ListItemIcon> */}
                                        <ListItemText primary={"Paint"} />
                                        <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                                            {paintOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </ListItemIcon>

                                    </ListItemButton>
                                    <Collapse in={paintOpen} timeout="auto">
                                        <FormControl size="small">
                                            <InputLabel id="demo-simple-select-label">Terrain</InputLabel>
                                            <Select
                                                labelId="demo-simple-select-label"
                                                id="demo-simple-select"
                                                value={paintType}
                                                label="Terrain"
                                                onChange={(e) => {
                                                    setPaintType(TileTerrain[e.target.value])
                                                    if (onSetPaintTerrainType) onSetPaintTerrainType(TileTerrain[e.target.value]);
                                                }}
                                            >
                                                {Object.keys(TileTerrain).map((val) => {

                                                    return <MenuItem value={TileTerrain[val]}>{val}</MenuItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Collapse>
                                    <ListItemButton sx={{ flexFlow: 'row-reverse', mr: 2 }} onClick={() => {
                                        setTileDataOpen(!tileDataOpen);
                                    }}>
                                        {/* <ListItemIcon>
                                            <ScienceIcon />
                                        </ListItemIcon> */}
                                        <ListItemText primary={"Tile Data"} />
                                        <ListItemIcon sx={{ maxWidth: '30px', pr: 1 }}>
                                            {tileDataOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </ListItemIcon>

                                    </ListItemButton>
                                    <Collapse in={tileDataOpen} timeout="auto">
                                        <Box sx={{
                                            pl: 6,
                                            pr: 0,
                                            display: 'flex',
                                            flexFlow: 'column',
                                            justifyItems: 'right',
                                            "& label": {
                                                "::after": {
                                                    color: 'transparent',
                                                    display: 'block'
                                                }
                                            }
                                        }}>
                                            <ListItemButton onClick={() => {
                                                setTileDiceValueOpen(!tileDiceValueOpen);
                                            }} sx={{ flexFlow: 'row-reverse' }}>
                                                <ListItemIcon sx={{ minWidth: '28px' }}>
                                                    <CasinoIcon />
                                                </ListItemIcon>
                                                <ListItemText primary={"Dice Value"} sx={{ textAlign: 'right', mr: 1 }} />
                                                <ListItemIcon sx={{ minWidth: '28px' }}>
                                                    {tileDiceValueOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                </ListItemIcon>
                                            </ListItemButton>
                                            <Collapse in={tileDiceValueOpen} timeout="auto" unmountOnExit sx={{}}>
                                                <Box
                                                    component="form"
                                                    sx={{
                                                        pl: 4,
                                                        right: 0,
                                                        '& > :not(style)': { m: 1, p: 0 },
                                                    }}
                                                    noValidate
                                                    autoComplete="off"
                                                >
                                                    <TextField type='number' size="small" id="outlined-basic" label="Dice Value" variant="outlined" sx={{ p: 0 }} onChange={(e) => {
                                                        let num;
                                                        let s = e.target.value.trim();
                                                        if (s === "") {
                                                            num = -1;
                                                        } else {
                                                            if (!s.includes('.'))
                                                                num = Number.parseFloat(s)
                                                            else
                                                                num = Number.parseInt(s);
                                                        }

                                                        if (onDiceValueInput) onDiceValueInput(num)
                                                    }} />
                                                </Box>
                                            </Collapse>
                                        </Box>
                                        <Box sx={{
                                            pl: 6,
                                            pr: 0,
                                            display: 'flex',
                                            flexFlow: 'column',
                                            justifyItems: 'right',
                                            "& label": {
                                                "::after": {
                                                    color: 'transparent',
                                                    display: 'block'
                                                }
                                            }
                                        }}>
                                            <ListItemButton onClick={() => {
                                                setTileJSONDataOpen(!tileJSONDataOpen);
                                            }} sx={{ flexFlow: 'row-reverse' }}>
                                                <ListItemIcon sx={{ minWidth: '28px' }}>
                                                    <DataObjectIcon />
                                                </ListItemIcon>
                                                <ListItemText primary={"Custom Data"} sx={{ textAlign: 'right', mr: 1 }} />
                                                <ListItemIcon sx={{ minWidth: '28px' }}>
                                                    {tileJSONDataOpen ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                                                </ListItemIcon>
                                            </ListItemButton>
                                            <Collapse in={tileJSONDataOpen} timeout="auto" unmountOnExit sx={{}}>
                                                <Box
                                                    component="form"
                                                    sx={{
                                                        pl: 2.25,
                                                        right: 0,
                                                        '& > :not(style)': { m: 1, p: 0 },
                                                    }}
                                                    noValidate
                                                    autoComplete="off"
                                                >

                                                </Box>
                                            </Collapse>
                                        </Box>
                                    </Collapse >
                                </List>
                            ),
                        ],
                        subItemsOpen: designOpen
                    },
                ],
                hasCameraSettings && [
                    {
                        name: 'Camera', leftIcon: <VideocamIcon />, action: () => {
                            setCameraSettingsOpen(!cameraSettingsOpen);
                        },
                        subItems: [
                            <CameraSettings {...cameraSettings} open={cameraSettingsOpen} />
                        ],
                        subItemsOpen: cameraSettingsOpen
                    }
                ],
                [
                    {
                        name: 'Save Map', leftIcon: <SaveAsIcon />, action: () => {
                            setSavingMap(true);
                        }
                    },
                    { name: 'Load Map', leftIcon: <FileOpenIcon />, action: () => { setLoadModalOpen(true); } }
                ]
            ]}
            handleToggle={() => {
                setSideOpen(!sideOpen);
            }}
        ></SideBar >
        <Box component="main" sx={{ p: 0, height: '100%', width: '100%', opacity: isLoading ? 0 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
            {/* <DrawerHeader /> */}
            <div id="gui"></div>
            <div id="fps"></div>

            <div
                className="SceneView"
                ref={ref}
                style={{
                    height: "100%",
                    width: "100%",
                    cursor: designOpen ? 'crosshair' : 'default'
                }}>
                <Dialog open={savingMap} onClose={(e, reason) => {
                    if (reason === 'backdropClick') {
                        return;
                    }

                    setSavingMap(false);
                }} sx={{
                    textAlign: 'left', pl: 2, pr: 2, "& label": {
                        "::after": {
                            color: 'transparent',
                            display: 'none'
                        }
                    }
                }}>
                    <DialogTitle>Save?</DialogTitle>
                    <DialogContentText sx={{ pl: 4, pr: 4, textAling: 'left' }}>
                        Your map will be downloaded as a .JSON file.
                    </DialogContentText>
                    <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                        <TextField
                            margin="dense"
                            id="name"
                            label="Map Name"
                            type="text"
                            variant="outlined"
                            autoComplete='off'
                            error={(!isNaN(parseFloat(mapName)))}
                            value={mapName}
                            onChange={(e) => setMapName(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSavingMap(false)}>Cancel</Button>
                        <Button disabled={(!mapName || !isNaN(parseFloat(mapName)))} onClick={() => {
                            if (onSaveMap) onSaveMap((JSON) => {
                                Tools.download(JSON, mapName + ".json", 'text/json')
                                setSavingMap(false);
                            });
                        }}>Save</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={tileJSONModalOpen} onClose={(e, reason) => {
                    if (reason === 'backdropClick') {
                        return;
                    }

                    setTileJSONModalOpen(false);
                }} sx={{
                    textAlign: 'left', pl: 2, pr: 2, "& label": {
                        "::after": {
                            color: 'transparent',
                            display: 'block'
                        }
                    }
                }}>
                    <DialogTitle>Custom Data</DialogTitle>
                    {/* <DialogContentText sx={{ pl: 4, pr: 4, textAling: 'left' }}>
                        Your map will be downloaded as a .JSON file.
                    </DialogContentText> */}
                    <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                        <JSONInput
                            id='a_unique_id'
                            placeholder={curTileJSONData}
                            confirmGood={false}
                            locale={locale}
                            height={200}
                            width={250}
                            onChange={(e) => {
                                if (e.error) return;

                                setCurTileJSONData(e.jsObject);
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setTileJSONModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            if (onTileJSONDataInput) onTileJSONDataInput(JSON.stringify(curTileJSONData));

                            setTileJSONModalOpen(false);
                        }}>Save</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={loadModalOpen} onClose={(e, reason) => {
                    if (reason === 'backdropClick') {
                        return;
                    }

                    setLoadModalOpen(false);
                }} sx={{
                    textAlign: 'left', pl: 2, pr: 2, "& *": {
                        "::after": {
                            color: 'transparent',
                            display: 'none'
                        }
                    }
                }}>
                    <DialogTitle>Load Save</DialogTitle>
                    {/* <DialogContentText sx={{ pl: 4, pr: 4, textAling: 'left' }}>
                        Your map will be downloaded as a .JSON file.
                    </DialogContentText> */}
                    <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                        <MuiFileInput placeholder="Grid JSON File"
                            sx={{
                                textAlign: 'left', pl: 2, pr: 2, "& *": {
                                    "::after": {
                                        color: 'transparent',
                                        display: 'none'
                                    }
                                }
                            }}
                            inputProps={{
                                accept: '.json'
                            }} multiple={false} value={selectedLoadFile} onChange={(file) => {
                                if (!file) { setSelectedLoadFile(null); return; }

                                if (file.name.split(".")[1] !== "json") return;

                                setSelectedLoadFile(file);
                            }} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLoadModalOpen(false)}>Cancel</Button>
                        <Button disabled={selectedLoadFile === null || selectedLoadFile === undefined} onClick={async () => {
                            let fileStr = await selectedLoadFile.text();

                            if (onLoadJSON) onLoadJSON(JSON.parse(fileStr));

                            setLoadModalOpen(false);
                        }}>Save</Button>
                    </DialogActions>
                </Dialog>
                <TopBar sidebarOpen={sideOpen} />
                <Container sx={{
                    position: 'fixed', padding: 0, pl: '0 !important', top: 0, left: !sideOpen ? theme.spacing(7) : 240,
                    [theme.breakpoints.up('sm')]: {
                        left: !sideOpen ? theme.spacing(8) : 240,
                    },
                    pointerEvents: 'none',
                    maxWidth: '300px !important',
                }}>
                    <Card
                        variant="outlined"
                        sx={{ backgroundColor: `rgba(0,0,0,.2)`, color: 'white', borderRadius: '0 0 2em 0' }}
                    >
                        <CardContent>
                            {/* <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                {positionString}
                            </Typography> */}
                            <Box sx={{ display: 'flex', flexFlow: 'row', ">*": { m: 1, mt: 0, mb: 0, mr: 0 } }}>
                                <Typography>Wood: 0</Typography>
                                <Typography>Sheep: 0</Typography>
                                <Typography>Grain: 0</Typography>
                                <Typography>Stone: 0</Typography>
                            </Box>
                            {curHighlightedTile &&
                                <Box sx={{ display: 'flex', flexFlow: 'column', ">*": { mt: 1, ml: 1 }, textAlign: 'left' }}>
                                    <Typography>
                                        Mesh Position: {"(" + curHighlightedTile.position.toArray().map(x => Math.round(x)).toString().replaceAll(",", ", ") + ")"}
                                    </Typography>
                                    <Typography>
                                        Cell Position: {"(" + curHighlightedTile.cell.gridPosition.toArray().map(x => Math.round(x)).toString().replaceAll(",", ", ") + ")"}
                                    </Typography>
                                    <Typography>
                                        Terrain Type: {curHighlightedTile.terrainInfo.type.toString()}
                                    </Typography>
                                    <Typography>
                                        Terrain Elevation: {(curHighlightedTile.terrainInfo.elevation)}
                                    </Typography>
                                    <Typography>
                                        Terrain Moisture: {(curHighlightedTile.terrainInfo.moisture)}
                                    </Typography>
                                    <Typography>
                                        Custom Data: {(JSON.stringify(curHighlightedTile.customData, null, 2))}
                                    </Typography>
                                </Box>
                            }

                            {/* <Typography sx={{}} color="text.secondary">
                                {_tile.getTerrainType()}
                            </Typography> */}
                        </CardContent>
                    </Card>
                </Container>
                <Snackbar
                    open={paintTipOpen}
                    onClose={handlePaintTipClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    key={"bottom" + "left" + "paint"}
                    TransitionComponent={SlideTransition}
                >
                    <Alert severity="info" onClose={handlePaintTipClose} action={<IconButton
                        size="medium"
                        aria-label="close"
                        color="inherit"
                        onClick={handlePaintTipClose}

                    >
                        <CloseIcon fontSize="medium" />
                    </IconButton>}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                                Right click a tile to change it to the selected terrain type.
                            </Typography>
                            <Typography variant='subtitle2' sx={{ textAlign: 'left' }}>
                                Tip: Drag the mouse while right clicking to paint faster!
                            </Typography>
                        </Box>
                    </Alert>
                </Snackbar>
                <Snackbar
                    open={tileDiceValueTipOpen}
                    onClose={handleTileDiceTipClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    key={"bottom" + "left" + "Dice"}
                    TransitionComponent={SlideTransition}
                >
                    <Alert severity="info" onClose={handleTileDiceTipClose} action={<IconButton
                        size="medium"
                        aria-label="close"
                        color="inherit"
                        onClick={handleTileDiceTipClose}

                    >
                        <CloseIcon fontSize="medium" />
                    </IconButton>}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                                Enter a number value in the text box then right click a tile to add it on top.
                            </Typography>
                            <Typography variant='subtitle2' sx={{ textAlign: 'left' }}>
                                Tip: Drag the mouse while right clicking to paint faster!
                            </Typography>
                        </Box>
                    </Alert>
                </Snackbar>
                <Snackbar
                    open={tileJSONDataTipOpen}
                    onClose={handleJSONDataTipClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    key={"bottom" + "left" + "JSON"}
                    TransitionComponent={SlideTransition}
                >
                    <Alert severity="info" onClose={handleJSONDataTipClose} action={<IconButton
                        size="medium"
                        aria-label="close"
                        color="inherit"
                        onClick={handleJSONDataTipClose}

                    >
                        <CloseIcon fontSize="medium" />
                    </IconButton>}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                                Right click on tile to view and edit it's custom data.
                            </Typography>
                        </Box>
                    </Alert>
                </Snackbar>
                <BottomBar sidebarOpen={sideOpen}>
                    <Box sx={{ display: 'flex', flexFlow: 'column', transition: 'all 1s linear' }}>
                        <Slide direction="up" in={diceRolled} mountOnEnter unmountOnExit container={fabRef.current} timeout={200}>
                            <Typography variant='h1'>{curDiceVal}</Typography>
                        </Slide>
                        <Fab disabled={diceRolled} ref={fabRef} aria-label={"rolLFab"} onClick={() => { if (!diceRolled) setDiceRolled(true) }} size="large" variant={"extended"} sx={{ "&>*": { mr: .5 }, pointerEvents: "auto" }}>
                            <CasinoIcon />
                            <Box />
                            <Typography>Roll</Typography>
                        </Fab>
                    </Box>
                </BottomBar>
            </div>
        </Box>
        {isLoading && <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, height: '100%', width: '100%', backgroundColor: 'white', zIndex: 10000, display: 'flex', flexFlow: 'row', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Box>
                <CircularProgress />
                <Typography sx={{ mt: 3 }} variant="body1">Loading</Typography>
            </Box>
        </Box>}
    </>)
})