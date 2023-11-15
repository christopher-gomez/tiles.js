import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { forwardRef } from 'react';
import TopBar from './TopBar';
import SideBar from './Sidebar/SideBar';
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
import View from '../../lib/scene/View';
import Tile, { } from '../../lib/map/Tile';
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
import { EntityPlacementType } from '../../lib/env/MeshEntity';
import CarpenterIcon from '@mui/icons-material/Carpenter';
import VideocamIcon from '@mui/icons-material/Videocam';
import CameraSettings, { ICameraSettingsComponentProps } from './SceneSettings/CameraSettings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EntitiesMenu, { IEntitiesMenuComponentProps } from './SceneSettings/EntitiesMenu';
import DesignMapMenu, { IDesignMapMenuComponentProps } from './SceneSettings/DesignMapMenu';
import AvatarTabs from './AvatarTabs';
import MenuIcon from '@mui/icons-material/Menu';

interface IProps {
    // general
    onSideMenuToggled?: (open: boolean) => void;

    onDiceRolled?: (val: number) => void;

    designProps?: DesignMenuProps;

    cameraProps?: CameraMenuProps;

    entitiesProps?: EntitiesMenuProps;

    curHighlightedTile?: Tile;

    onSaveMapSelected?: (open: boolean) => void;
    onModalToggled?: (open: boolean) => void;
    onSaveScene?: (sceneName: string, cb: (data: string) => void) => void;
    onLoadScene?: (jsonObj: { [key: string]: any }) => void;
}

type DesignMenuProps = Omit<IDesignMapMenuComponentProps, "open">;
type CameraMenuProps = Omit<ICameraSettingsComponentProps, "open">;
type EntitiesMenuProps = Omit<IEntitiesMenuComponentProps, "open">;

export default ({ onSideMenuToggled, curHighlightedTile, onSaveMapSelected, onSaveScene, onModalToggled, onDiceRolled, onLoadScene, designProps, cameraProps, entitiesProps }: IProps) => {
    const theme = useTheme();

    const [sideOpen, setSideOpen] = React.useState(false);

    const [entitiesOpen, setEntityMenuOpen] = React.useState(false);

    const [designOpen, setDesignOpen] = React.useState(false);

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
            setLoadModalOpen(false);
            setSavingMap(false);
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
        if (designOpen) {
            if (!sideOpen) setSideOpen(true);
            if (entitiesOpen) setEntityMenuOpen(false);
            if (cameraSettingsOpen) setCameraSettingsOpen(false);
        } else {
        }
    }, [designOpen]);

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

    return (<>
        <SideBar
            open={sideOpen}
            buttonGroups={[
                entitiesProps && [
                    {
                        name: 'Entities',
                        leftIcon: <SmartToyIcon />,
                        action: () => {
                            setEntityMenuOpen(!entitiesOpen);
                        },
                        subItems: [
                            (
                                <EntitiesMenu {...entitiesProps} open={entitiesOpen} />
                            ),
                        ],
                        subItemsOpen: entitiesOpen
                    },
                ],
                designProps && [
                    {
                        name: 'Design',
                        leftIcon: <DesignServicesIcon />,
                        action: () => {
                            setDesignOpen(!designOpen);
                        },
                        subItems: [
                            (
                                <DesignMapMenu {...designProps} open={designOpen} onModalToggled={onModalToggled} />
                            ),
                        ],
                        subItemsOpen: designOpen
                    },
                ],
                cameraProps && [
                    {
                        name: 'Camera', leftIcon: <VideocamIcon />, action: () => {
                            setCameraSettingsOpen(!cameraSettingsOpen);
                        },
                        subItems: [
                            <CameraSettings {...cameraProps} open={cameraSettingsOpen} />
                        ],
                        subItemsOpen: cameraSettingsOpen
                    }
                ],
                [
                    {
                        name: 'Save Scene', leftIcon: <SaveAsIcon />, action: () => {
                            setSavingMap(true);
                        }
                    },
                    { name: 'Load Scene', leftIcon: <FileOpenIcon />, action: () => { setLoadModalOpen(true); } }
                ]
            ]}
            handleToggle={() => {
                setSideOpen(!sideOpen);
            }}
        />
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
                    if (onSaveScene) onSaveScene(mapName, (JSON) => {
                        Tools.download(JSON, mapName + ".json", 'text/json')
                        setSavingMap(false);
                    });
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
            <DialogTitle>Load Scene</DialogTitle>
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

                    setLoadModalOpen(false);
                    setSideOpen(false);

                    if (onLoadScene) onLoadScene(JSON.parse(fileStr));

                }}>Load</Button>
            </DialogActions>
        </Dialog>
        <TopBar sidebarOpen={sideOpen}>
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
        </TopBar>
        <Box sx={{
            position: 'fixed', padding: 0, pl: '0 !important', top: 0, left: !sideOpen ? theme.spacing(7) : 240,
            [theme.breakpoints.up('sm')]: {
                left: !sideOpen ? theme.spacing(8) : 240,
            },
            pointerEvents: 'none',
            // maxWidth: '300px !important',
        }}>

            {curHighlightedTile &&
                <Box sx={{ backgroundColor: `rgba(0,0,0,.2)`, color: 'white', borderRadius: '0 0 2em 0', display: 'flex', flexFlow: 'column', p: 1, pb: 1.5, pr: 2, ">*": { mt: 1, ml: 1 }, textAlign: 'left' }}>
                    <Typography>
                        Mesh Position: {"(" + curHighlightedTile.mapPosition.toArray().map(x => Math.round(x)).toString().replaceAll(",", ", ") + ")"}
                    </Typography>
                    <Typography>
                        Cell Position: {"(" + curHighlightedTile.cell?.gridPosition.toArray().map(x => Math.round(x)).toString().replaceAll(",", ", ") + ")"}
                    </Typography>
                    {/* <Typography>
                                        Terrain Type: {curHighlightedTile.terrainInfo.type.toString()}
                                    </Typography>
                                    <Typography>
                                        Terrain Elevation: {(curHighlightedTile.terrainInfo.elevation)}
                                    </Typography>
                                    <Typography>
                                        Terrain Moisture: {(curHighlightedTile.terrainInfo.moisture)}
                                    </Typography> */}
                    <Typography>
                        Custom Data: {(JSON.stringify(curHighlightedTile.getCustomData(), null, 2))}
                    </Typography>
                </Box>
            }
            {/* <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                {positionString}
                            </Typography> */}
            {/* <Box sx={{ display: 'flex', flexFlow: 'row', ">*": { m: 1, mt: 0, mb: 0, mr: 0 } }}>
                                <Typography>Wood: 0</Typography>
                                <Typography>Sheep: 0</Typography>
                                <Typography>Grain: 0</Typography>
                                <Typography>Stone: 0</Typography>
                            </Box> */}


            {/* <Typography sx={{}} color="text.secondary">
                                {_tile.getTerrainType()}
                            </Typography> */}

        </Box>
        <BottomBar sidebarOpen={sideOpen}>
            <Box sx={{ display: 'flex', flexFlow: 'column', transition: 'all 1s linear' }}>
                <Slide direction="up" in={diceRolled} mountOnEnter unmountOnExit container={fabRef.current} timeout={200}>
                    <Typography variant='h1'>{curDiceVal}</Typography>
                </Slide>
                {/* <Fab disabled={diceRolled} ref={fabRef} aria-label={"rolLFab"} onClick={() => { if (!diceRolled) setDiceRolled(true) }} size="large" variant={"extended"} sx={{ "&>*": { mr: .5 }, pointerEvents: "auto" }}>
                            <CasinoIcon />
                            <Box />
                            <Typography>Roll</Typography>
                        </Fab> */}
            </Box>
        </BottomBar>
    </>)
}