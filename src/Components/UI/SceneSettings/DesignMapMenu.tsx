import React from 'react';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Tile, { } from '../../../lib/map/Tile';
import { Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Icon, InputLabel, List, Select, TextField, Typography, MenuItem as SelectItem, Grid, Checkbox } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/en';
import AddIcon from '@mui/icons-material/Add';
import Toast from '../Toast';
import SettingsMenu, { SubMenu, SubMenuItem } from './SettingsMenu';
import HoverButton from '../HoverButton';
import { TileType } from '../../../lib/utils/Interfaces';
import { ExtrudeGeometryOptions } from 'three';
import { EngineGridShapes, EngineTileShapes } from '../../../lib/Engine';
import { MeshTextFontWeights, MeshTextFonts } from '../../../lib/env/MeshText';
import { SketchPicker } from 'react-color';
import MenuButton from './MenuButton';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ColorPicker from '../ColorPicker';
import JSONEditor from '../JSONEditor';

export interface IDesignMapMenuComponentProps {
    open: boolean;

    // map design tools
    onDesignToggled?: (open: boolean) => void;

    mapRadius?: number;
    mapShape?: EngineGridShapes;
    tileRadius?: number;
    tileShape?: EngineTileShapes;
    overlay?: boolean;
    overlayColor?: string | number;
    overlayLineColor?: string | number;
    overlayLineOpacity?: number;
    onMapSettingsToggled?: (open: boolean) => void;
    onTileRadiusChanged?: (val: number) => void;
    onMapRadiusChanged?: (val: number) => void;
    onMapShapeSelected?: (val: EngineGridShapes) => void;
    onTileShapeSelected?: (val: EngineTileShapes) => void;
    onOverlayToggled?: (active: boolean) => void;
    onOverlayColorChanged?: (color: string) => void;
    onOverlayLineColorChanged?: (color: string) => void;
    onOverlayLineOpacityChanged?: (opacity: number) => void;

    tileTypes?: string[];
    onTilePaintToggled?: (open: boolean) => void;
    onTilePaintTypeSelected?: (type: string) => void;

    onTileTypeCreated?: (type: TileType) => void;
    onTileTypeEdited?: (type: TileType) => void;

    onTextPaintToggled?: (open: boolean) => void;
    onTextPaintValueInput?: (val: string) => void;
    textPaintOpts?: { mirror: boolean; hover: number; height: number; size: number; faceColor: string; scale: number[], outlineColor: string, font: MeshTextFonts, fontWeight: MeshTextFontWeights };
    onTextPaintOptsChange?: (val: { mirror: boolean, height: number, hover: number, size: number, faceColor: string, scale: number[], outlineColor: string, font: MeshTextFonts, fontWeight: MeshTextFontWeights }) => void;

    onTileSelectJSONEdit?: (open: boolean, onTileSelectCB?: (tile: Tile) => void) => void;
    onTileJSONDataInput?: (val: string) => void;

    onModalToggled?: (val: boolean) => void;
}

export default ({ open, onDesignToggled, onMapRadiusChanged, onMapSettingsToggled, onTilePaintToggled, onTextPaintToggled, onTextPaintValueInput, onTileJSONDataInput, onTileSelectJSONEdit, mapRadius, onModalToggled, tileTypes, onTilePaintTypeSelected, onTileTypeCreated, onTileTypeEdited, mapShape, onMapShapeSelected, tileShape, onTileShapeSelected, textPaintOpts, onTextPaintOptsChange, tileRadius, onTileRadiusChanged, overlay, onOverlayToggled, overlayColor, onOverlayColorChanged, overlayLineColor, overlayLineOpacity, onOverlayLineColorChanged, onOverlayLineOpacityChanged }: IDesignMapMenuComponentProps) => {

    const [mapSettingsOpen, setMapSettingsOpen] = React.useState(false);

    const [curMapSize, setMapSize] = React.useState(0);
    const [curTileSize, setTileSize] = React.useState(0);
    const [curOverlayColor, setCurOverlayColor] = React.useState<string | number>(undefined);
    const [curOverlayLineColor, setCurOverlayLineColor] = React.useState<string | number>(undefined);
    const [curOverlayLineOpacity, setCurOverlayLineOpacity] = React.useState(1);

    const [overlaySettingsOpen, setOverlaySettingsOpen] = React.useState(false);
    const [sizeSettingsOpen, setSizeSettingsOpen] = React.useState(false);
    const [shapeSettingsOpen, setShapeSettingsOpen] = React.useState(false);

    const [paintOpen, setPaintOpen] = React.useState(false);

    const [tilePaintOpen, setTilePaintOpen] = React.useState(false);
    const [curTileType, setCurTileType] = React.useState("");
    const [tilePaintTipOpen, setTilePaintTipOpen] = React.useState(false);
    const [showedTilePaintTipOnce, setShowedPaintTipOnce] = React.useState(false);

    const [textPaintOpen, setTextPaintOpen] = React.useState(false);
    const [textPaintVal, setTextPaintVal] = React.useState("");
    const [textPaintTipOpen, setTextPaintTipOpen] = React.useState(false);
    const [showedTextPaintTipOnce, setShowedTextPaintTipOnce] = React.useState(false);
    const [curTextPaintOpts, setCurTextPaintOpts] = React.useState<{ mirror: boolean, height: number, hover: number, size: number, faceColor: string, scale: number[], outlineColor: string, font: MeshTextFonts, fontWeight: MeshTextFontWeights }>(undefined)

    const [createTypeModalOpen, setCreateTypeModalOpen] = React.useState(false);
    const [createType, setCreateType] = React.useState<TileType>({
        name: 'Type 1', color: 'white', scale: 1, geomOpts: {
            steps: 1,
            depth: .1,
            bevelEnabled: true,
            bevelThickness: .1,
            bevelSize: .5,
            bevelSegments: 2
        } as ExtrudeGeometryOptions,
        customData: {}
    })
    const [editType, setEditType] = React.useState<TileType>(null);
    const [editTypeModalOpen, setEditTypeModalOpen] = React.useState(false);

    // const [tileDataOpen, setTileDataOpen] = React.useState(false);
    const [editingTileJSONData, setEdittingTileJSONData] = React.useState(false);
    const [curTileJSONData, setCurTileJSONData] = React.useState({});

    const [tileJSONModalOpen, setTileJSONModalOpen] = React.useState(false);
    const [tileJSONDataTipOpen, setTileJSONDataTipOpen] = React.useState(false);
    const [showedTileJSONTipOnce, setShowedTileJSONTipOnce] = React.useState(false);

    React.useEffect(() => {
        if (onDesignToggled) onDesignToggled(open);

        if (open) {

        } else {
            if (mapSettingsOpen)
                setMapSettingsOpen(false);
            if (paintOpen)
                setPaintOpen(false);
            if (editingTileJSONData)
                setEdittingTileJSONData(false);
        }
    }, [open]);

    React.useEffect(() => {
        if (onMapSettingsToggled) onMapSettingsToggled(mapSettingsOpen);

        if (mapSettingsOpen) {
            if (paintOpen) setPaintOpen(false);
            if (editingTileJSONData)
                setEdittingTileJSONData(false);
        } else {
            if (overlaySettingsOpen) setOverlaySettingsOpen(false);
            if (sizeSettingsOpen) setSizeSettingsOpen(false);
            if (shapeSettingsOpen) setShapeSettingsOpen(false);
        }
    }, [mapSettingsOpen]);

    React.useEffect(() => {
        if (sizeSettingsOpen) {
            if (overlaySettingsOpen) setOverlaySettingsOpen(false);
            if (shapeSettingsOpen) setShapeSettingsOpen(false);
        } else {
            setMapSize(curMapSize);
        }
    }, [sizeSettingsOpen])

    React.useEffect(() => {
        if (overlaySettingsOpen) {
            if (sizeSettingsOpen) setSizeSettingsOpen(false);
            if (shapeSettingsOpen) setShapeSettingsOpen(false);
        } else {
        }
    }, [overlaySettingsOpen]);

    React.useEffect(() => {
        if (shapeSettingsOpen) {
            if (sizeSettingsOpen) setSizeSettingsOpen(false);
            if (overlaySettingsOpen) setOverlaySettingsOpen(false);
        } else {
        }
    }, [shapeSettingsOpen])

    React.useEffect(() => {
        if (mapRadius !== undefined) setMapSize(mapRadius);
    }, [mapRadius]);

    React.useEffect(() => {
        if (tileRadius !== undefined) setTileSize(tileRadius);
    }, [tileRadius]);

    React.useEffect(() => {
        if (overlayColor !== undefined && curOverlayColor == undefined) {
            setCurOverlayColor(overlayColor);
        }
    }, [overlayColor])

    React.useEffect(() => {
        if (overlayLineOpacity !== undefined) {
            setCurOverlayLineOpacity(overlayLineOpacity);
        }
    }, [overlayLineOpacity])

    React.useEffect(() => {
        if (overlayLineColor !== undefined && curOverlayLineColor == undefined) {
            setCurOverlayLineColor(overlayLineColor);
        }
    }, [overlayLineColor]);

    React.useEffect(() => {
        if (paintOpen) {
            if (mapSettingsOpen)
                setMapSettingsOpen(false);

            if (editingTileJSONData)
                setEdittingTileJSONData(false);
        } else {
            if (tilePaintOpen) setTilePaintOpen(false);
            if (textPaintOpen) setTextPaintOpen(false);
        }
    }, [paintOpen]);

    React.useEffect(() => {
        if (onTilePaintToggled) onTilePaintToggled(tilePaintOpen);

        if (tilePaintOpen) {
            if (textPaintOpen) setTextPaintOpen(false);

            if (!showedTilePaintTipOnce) setTilePaintTipOpen(true);
        } else {
            if (tilePaintTipOpen) setTilePaintTipOpen(false);
        }

    }, [tilePaintOpen])

    React.useEffect(() => {
        if (tileTypes && tileTypes.length > 0) {
            if (curTileType === "") setCurTileType(tileTypes[0]);
        }
    }, [tileTypes])

    React.useEffect(() => {
        if (onTilePaintTypeSelected) onTilePaintTypeSelected(curTileType)
    }, [curTileType])

    React.useEffect(() => {
        if (onModalToggled) onModalToggled(tileJSONModalOpen)

        if (!createTypeModalOpen) {
            setCreateType({
                ...Object.values(Tile.tileTypes)[Object.values(Tile.tileTypes).length - 1],
                name: 'Type ' + tileTypes.length,
                color: 'white'
            })
        }
    }, [createTypeModalOpen]);

    React.useEffect(() => {
        if (onModalToggled) onModalToggled(tileJSONModalOpen)

        if (!editTypeModalOpen) {
            setEditType(null)
        } else {
            setEditType({ ...Tile.tileTypes[curTileType], customData: Tile.tileTypes[curTileType].customData ?? {} });
        }
    }, [editTypeModalOpen]);


    React.useEffect(() => {
        if (onTextPaintToggled) onTextPaintToggled(textPaintOpen);

        if (textPaintOpen) {
            if (tilePaintOpen) setTilePaintOpen(false);

            if (!showedTextPaintTipOnce) setTextPaintTipOpen(true);
        } else {
            setTextPaintTipOpen(false);
        }
    }, [textPaintOpen]);

    React.useEffect(() => {
        if (curTextPaintOpts === undefined && textPaintOpts !== undefined) {
            if (textPaintOpts.height === 0) {
                textPaintOpts.height = null;
            }

            if (textPaintOpts.size === 0) {
                textPaintOpts.size = null;
            }

            if (textPaintOpts.scale.length < 3 || textPaintOpts.scale.length > 3) {
                textPaintOpts.scale = new Array<number>(3);
            }

            if (textPaintOpts.scale[0] < 0) textPaintOpts.scale[0] = 0;
            if (textPaintOpts.scale[1] < 0) textPaintOpts.scale[1] = 0;
            if (textPaintOpts.scale[2] < 0) textPaintOpts.scale[2] = 0;

            setCurTextPaintOpts(textPaintOpts);
        }
    }, [textPaintOpts]);

    React.useEffect(() => {
        if (onTileSelectJSONEdit)
            onTileSelectJSONEdit(editingTileJSONData, (tile) => {
                setCurTileJSONData(tile.getCustomData());

                window.setTimeout(() => {
                    setTileJSONModalOpen(true);
                }, 100)
            });

        if (editingTileJSONData) {
            if (mapSettingsOpen) setMapSettingsOpen(false);
            if (paintOpen) setPaintOpen(false);

            if (!showedTileJSONTipOnce) setTileJSONDataTipOpen(true);
        } else {
            setTileJSONDataTipOpen(false);
            setCurTileJSONData({});
        }
    }, [editingTileJSONData]);

    React.useEffect(() => {
        if (onModalToggled) onModalToggled(tileJSONModalOpen)

        if (!tileJSONModalOpen) {
            setCurTileJSONData({});
        }

    }, [tileJSONModalOpen]);

    return (
        <>
            <SettingsMenu>
                <SubMenu title="Map" open={mapSettingsOpen} onToggle={(open) => setMapSettingsOpen(open)}>
                    {(mapRadius !== undefined || tileRadius !== undefined) &&
                        <SubMenu title="Size" open={sizeSettingsOpen} onToggle={(open) => setSizeSettingsOpen(open)} sx={{ marginRight: '0 !important', paddingRight: '0 !important' }}>
                            {mapRadius !== undefined && <SubMenuItem title={"Map Radius"}>
                                <Box sx={{ width: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'right', pt: 0, pb: 0 }}>
                                    <TextField
                                        sx={{ p: 0, mr: 0, maxWidth: 50, alignSelf: 'flex-end', display: 'flex', flexFlow: 'row-reverse !important', "& *": { p: 0, display: 'flex', flexFlow: 'row-reverse !important' } }}
                                        size="small"
                                        id="map-size-controlled"
                                        type="number"
                                        value={curMapSize}
                                        fullWidth={false}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val = null;
                                            if (event.target.value && event.target.value.length > 0)
                                                val = Number.parseInt(event.target.value.split('.')[0]);

                                            if (val !== null && val < 0) val = 0;
                                            if (val !== null && val > 99) val = 99;

                                            setMapSize(val);
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                    {curMapSize !== mapRadius && <Box sx={{ display: 'flex', flexFlow: 'row', justifyContent: 'flex-end !important', pt: 2, pb: 0 }}>
                                        <HoverButton sx={{ p: .25, mr: 1, minWidth: 50, lineHeight: 'unset' }} fromVariant={curMapSize === mapRadius ? "outlined" : "contained"} toVariant={curMapSize === mapRadius ? "contained" : "outlined"} size="small" disabled={curMapSize === mapRadius || curMapSize === null || curMapSize === 0} onClick={() => {
                                            if (onMapRadiusChanged) onMapRadiusChanged(curMapSize);
                                        }}>Save</HoverButton>
                                        <HoverButton fromVariant="text" toVariant='text' sx={{ p: .25, mr: -.25, minWidth: 50 }} onClick={() => setMapSize(mapRadius)}>Reset</HoverButton>
                                    </Box>}
                                </Box>
                            </SubMenuItem>}
                            {tileRadius !== undefined &&
                                <SubMenuItem title={"Tile Radius"}>
                                    <Box sx={{ width: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'right', pt: 0, pb: 0 }}>
                                        <TextField
                                            sx={{ p: 0, mr: 0, maxWidth: 50, alignSelf: 'flex-end', display: 'flex', flexFlow: 'row-reverse !important', "& *": { p: 0, display: 'flex', flexFlow: 'row-reverse !important' } }}
                                            size="small"
                                            id="map-size-controlled"
                                            type="number"
                                            value={curTileSize}
                                            fullWidth={false}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                if (event.target.value && event.target.value.length > 0)
                                                    val = Number.parseInt(event.target.value.split('.')[0]);

                                                if (val !== null && val < 0) val = 0;
                                                if (val !== null && val > 99) val = 99;

                                                setTileSize(val);
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                        {curTileSize !== tileRadius && <Box sx={{ display: 'flex', flexFlow: 'row', justifyContent: 'flex-end !important', pt: 2, pb: 0 }}>
                                            <HoverButton sx={{ p: .25, mr: 1, minWidth: 50, lineHeight: 'unset' }} fromVariant={curTileSize === tileRadius ? "outlined" : "contained"} toVariant={curTileSize === tileRadius ? "contained" : "outlined"} size="small" disabled={curTileSize === tileRadius || curTileSize === null || curTileSize === 0} onClick={() => {
                                                if (onTileRadiusChanged) onTileRadiusChanged(curTileSize);
                                            }}>Save</HoverButton>
                                            <HoverButton fromVariant="text" toVariant='text' sx={{ p: .25, mr: -.25, minWidth: 50 }} onClick={() => setTileSize(tileRadius)}>Reset</HoverButton>
                                        </Box>}
                                    </Box>
                                </SubMenuItem>
                            }
                        </SubMenu>

                    }
                    {(tileShape !== undefined || mapShape !== undefined) &&
                        <SubMenu title="Shape" open={shapeSettingsOpen} onToggle={(open) => setShapeSettingsOpen(open)} sx={{ marginRight: '0 !important', paddingRight: '0 !important' }}>
                            {tileShape !== undefined &&
                                <SubMenuItem title="Tile Shape">
                                    <FormControl size="small" fullWidth sx={{ mt: 1.5, mb: 1.5, p: 0 }}>
                                        <InputLabel id="demo-simple-select-label">Tile Shape</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={tileShape}
                                            fullWidth
                                            sx={{ pt: 0, pb: 0, "& *": { paddingRight: '0 !important', textAlign: 'left !important' } }}
                                            label="Terrain"
                                            onChange={(e) => {
                                                let val = e.target.value as EngineTileShapes;
                                                if (onTileShapeSelected) onTileShapeSelected(val);
                                            }}
                                        >
                                            {Object.values(EngineTileShapes).filter((v) => isNaN(Number(v))).map((val) => {
                                                return <SelectItem value={EngineTileShapes[val]}>{val}</SelectItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </SubMenuItem>
                            }
                            {mapShape !== undefined &&
                                <SubMenuItem title="Map Shape">
                                    <FormControl size="small" fullWidth sx={{ mt: 1.5, mb: 1.5, p: 0 }}>
                                        <InputLabel id="demo-simple-select-label">Map Shape</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={mapShape}
                                            fullWidth
                                            sx={{ pt: 0, pb: 0, "& *": { paddingRight: '0 !important', textAlign: 'left !important' } }}
                                            label="Terrain"
                                            onChange={(e) => {
                                                let val = e.target.value as EngineGridShapes;
                                                if (onMapShapeSelected) onMapShapeSelected(val);
                                            }}
                                        >
                                            {Object.values(EngineGridShapes).filter((v) => isNaN(Number(v))).map((val) => {
                                                if (tileShape !== undefined) {
                                                    if (tileShape === EngineTileShapes.HEX) {
                                                        if (EngineGridShapes[val] === EngineGridShapes.SQUARE) {
                                                            return null;
                                                        }
                                                    } else if (tileShape === EngineTileShapes.SQUARE) {
                                                        if (EngineGridShapes[val] === EngineGridShapes.FLAT_TOP_HEX || EngineGridShapes.POINT_TOP_HEX === EngineGridShapes[val]) {
                                                            return null;
                                                        }
                                                    }
                                                }

                                                return <SelectItem value={EngineGridShapes[val]}>{val}</SelectItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </SubMenuItem>
                            }
                        </SubMenu>
                    }
                    {overlay !== undefined &&
                        <SubMenu title="Grid Underlay" open={overlaySettingsOpen} onToggle={(open) => setOverlaySettingsOpen(open)} sx={{ marginRight: '0 !important', paddingRight: '0 !important' }}>
                            <SubMenuItem title="Enabled">
                                <MenuButton
                                    sx={{ flexFlow: 'row', justifySelf: 'end', mr: 0, p: 0, mt: 0, mb: 0 }}
                                    icon={overlay ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                                    onClick={() => {
                                        if (onOverlayToggled) onOverlayToggled(!overlay);
                                    }}>
                                    Underlay
                                </MenuButton>
                            </SubMenuItem>
                            {
                                overlay !== undefined && overlay && curOverlayColor !== undefined &&
                                <SubMenuItem title="Underlay Color">
                                    <ColorPicker
                                        color={curOverlayColor}
                                        onChange={(color) => {
                                            setCurOverlayColor(color);
                                            if (onOverlayColorChanged) onOverlayColorChanged(color)
                                        }} />
                                </SubMenuItem>
                            }
                            {
                                overlay !== undefined && overlay && curOverlayLineColor !== undefined &&
                                <SubMenuItem title="Underlay Line Color">
                                    <ColorPicker
                                        color={curOverlayLineColor}
                                        onChange={(color) => {
                                            setCurOverlayLineColor(color);
                                            if (onOverlayLineColorChanged) onOverlayLineColorChanged(color)
                                        }} />
                                </SubMenuItem>
                            }
                            {
                                overlay !== undefined && overlay && overlayLineOpacity !== undefined &&
                                <SubMenuItem title={"Underlay Line Opacity"}>
                                    <Box sx={{ width: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'right', pt: 0, pb: 0 }}>
                                        <TextField
                                            sx={{ p: 0, mr: 0, maxWidth: 50, alignSelf: 'flex-end', display: 'flex', flexFlow: 'row-reverse !important', "& *": { p: 0, display: 'flex', flexFlow: 'row-reverse !important' } }}
                                            size="small"
                                            id="map-underlay-line-opacity-controlled"
                                            type="number"
                                            value={curOverlayLineOpacity}
                                            fullWidth={false}
                                            inputProps={{
                                                step: '0.01'
                                            }}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                if (event.target.value)
                                                    val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;
                                                if (val !== null && val > 1) val = 1;

                                                setCurOverlayLineOpacity(val);
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                        {curOverlayLineOpacity !== overlayLineOpacity && <Box sx={{ display: 'flex', flexFlow: 'row', justifyContent: 'flex-end !important', pt: 2, pb: 0 }}>
                                            <HoverButton sx={{ p: .25, mr: 1, minWidth: 50, lineHeight: 'unset' }} fromVariant={curOverlayLineOpacity === overlayLineOpacity ? "outlined" : "contained"} toVariant={curOverlayLineOpacity === overlayLineOpacity ? "contained" : "outlined"} size="small" disabled={curOverlayLineOpacity === overlayLineOpacity || curOverlayLineOpacity === null} onClick={() => {
                                                if (onOverlayLineOpacityChanged) onOverlayLineOpacityChanged(curOverlayLineOpacity);
                                            }}>Save</HoverButton>
                                            <HoverButton fromVariant="text" toVariant='text' sx={{ p: .25, mr: -.25, minWidth: 50 }} onClick={() => setCurOverlayLineOpacity(overlayLineOpacity)}>Reset</HoverButton>
                                        </Box>}
                                    </Box>
                                </SubMenuItem>
                            }
                        </SubMenu>
                    }

                </SubMenu>

                <SubMenu title="Paint" open={paintOpen} onToggle={(open) => setPaintOpen(open)} sx={{
                    '&>*': {
                        display: 'flex', flexFlow: 'row-reverse'
                    }
                }}>
                    <SubMenu title="Tile" open={tilePaintOpen} onToggle={(open) => setTilePaintOpen(open)}>
                        {curTileType && curTileType.length > 0 &&
                            <>
                                <SubMenuItem title={"Current Tile Type"} />
                                <SubMenuItem>
                                    <Box sx={{ width: '100%', display: 'flex', flexFlow: 'column' }}>
                                        <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                                            <InputLabel id="demo-simple-select-label">Tile Type</InputLabel>
                                            <Select
                                                labelId="demo-simple-select-label"
                                                id="demo-simple-select"
                                                value={curTileType}
                                                fullWidth
                                                sx={{ "& *": { paddingRight: '0 !important', textAlign: 'left !important' } }}
                                                label="Terrain"
                                                onChange={(e) => {
                                                    setCurTileType(e.target.value)
                                                    // if (onSetPaintTerrainType) onSetPaintTerrainType(TileTerrain[e.target.value]);
                                                }}
                                            >
                                                {tileTypes.map((val) => {

                                                    return <SelectItem value={val}>{val}</SelectItem>
                                                })}
                                            </Select>
                                        </FormControl>
                                        <Box sx={{ width: '100%', display: 'flex', flexFlow: 'row', justifyContent: 'flex-end' }}>
                                            <HoverButton sx={{ p: 1, mr: -.25, lineHeight: 'unset' }} size="small" onClick={() => {
                                                if (curTileType in Tile.tileTypes) {
                                                    setEditTypeModalOpen(true);
                                                }
                                            }}>Edit</HoverButton>
                                            <HoverButton sx={{ p: 1, mr: -.25, lineHeight: 'unset' }} size="small" onClick={() => setCreateTypeModalOpen(true)}>Add</HoverButton>
                                        </Box>
                                    </Box>
                                </SubMenuItem>
                            </>
                        }
                    </SubMenu>
                    <SubMenu title="Text" open={textPaintOpen} onToggle={(open) => setTextPaintOpen(open)}>
                        <SubMenuItem title="Current Paint Text">
                            <TextField
                                sx={{ p: 0, mr: 0 }}
                                size="small"
                                id="map-paint-text-controlled"
                                type="text"
                                autoComplete='off'
                                value={textPaintVal}
                                fullWidth={false}
                                variant='outlined'
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    if (onTextPaintValueInput) onTextPaintValueInput(event.target.value);

                                    setTextPaintVal(event.target.value);
                                }}
                            />
                        </SubMenuItem>
                        {curTextPaintOpts !== undefined &&
                            <>
                                <SubMenuItem title="Text Properties" />
                                <SubMenuItem>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel id="demo-simple-select-label">Font</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={curTextPaintOpts.font}
                                            fullWidth
                                            sx={{ pt: 0, pb: 0, "& *": { paddingRight: '0 !important', textAlign: 'left !important' } }}
                                            label="Font"
                                            onChange={(e) => {
                                                let val = e.target.value as MeshTextFonts;
                                                let newOpts = { ...curTextPaintOpts, font: val };
                                                if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                                setCurTextPaintOpts(newOpts);
                                            }}
                                        >
                                            {Object.values(MeshTextFonts).filter((v) => isNaN(Number(v))).map((val) => {
                                                return <SelectItem value={MeshTextFonts[val]}>{val}</SelectItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </SubMenuItem>
                                <SubMenuItem>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel id="demo-simple-select-label">Font Weight</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={curTextPaintOpts.fontWeight}
                                            fullWidth
                                            sx={{ pt: 0, pb: 0, "& *": { paddingRight: '0 !important', textAlign: 'left !important' } }}
                                            label="Font Weight"
                                            onChange={(e) => {
                                                let val = e.target.value as MeshTextFontWeights;
                                                let newOpts = { ...curTextPaintOpts, fontWeight: val };
                                                if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                                setCurTextPaintOpts(newOpts);
                                            }}
                                        >
                                            {Object.values(MeshTextFontWeights).filter((v) => isNaN(Number(v))).map((val) => {
                                                return <SelectItem value={MeshTextFontWeights[val]}>{val}</SelectItem>
                                            })}
                                        </Select>
                                    </FormControl>
                                </SubMenuItem>

                                <SubMenuItem title="Face Color">
                                    <ColorPicker color={curTextPaintOpts.faceColor} onChange={(color) => {
                                        const newState = { ...curTextPaintOpts, faceColor: color };
                                        setCurTextPaintOpts(newState);

                                        if (onTextPaintOptsChange) onTextPaintOptsChange(newState);
                                    }} />
                                </SubMenuItem>
                                <SubMenuItem title="Outline Color">
                                    <ColorPicker color={curTextPaintOpts.outlineColor} onChange={(color) => {
                                        const newState = { ...curTextPaintOpts, outlineColor: color };
                                        setCurTextPaintOpts(newState);

                                        if (onTextPaintOptsChange) onTextPaintOptsChange(newState);
                                    }} />
                                </SubMenuItem>
                                <SubMenuItem>

                                    <TextField
                                        label="Size"
                                        size="small"
                                        id="text-paint-opts-size-controlled"
                                        type="number"
                                        autoComplete='off'
                                        value={curTextPaintOpts.size}
                                        fullWidth={false}
                                        variant='outlined'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val;

                                            if (isNaN(Number(event.target.value))) {
                                                val = 0;
                                            } else {
                                                val = Number(event.target.value);
                                            }

                                            if (val < 0) val = 0;

                                            let newOpts = { ...curTextPaintOpts, size: val }
                                            if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                            setCurTextPaintOpts(s => ({ ...s, size: isNaN(Number(event.target.value)) || event.target.value === "" ? null : val }));
                                        }}
                                        onBlur={(e) => {
                                            if (!curTextPaintOpts.size)
                                                setCurTextPaintOpts(s => ({ ...s, size: 0 }));
                                        }}
                                    />
                                </SubMenuItem>


                                <SubMenuItem>
                                    <TextField
                                        label="Depth"
                                        size="small"
                                        id="text-paint-opts-height-controlled"
                                        type="number"
                                        autoComplete='off'
                                        value={curTextPaintOpts.height}
                                        fullWidth={false}
                                        variant='outlined'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val;

                                            if (isNaN(Number(event.target.value))) {
                                                val = 0;
                                            } else {
                                                val = Number(event.target.value);
                                            }

                                            if (val < 0) val = 0;

                                            let newOpts = { ...curTextPaintOpts, height: val }
                                            if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                            setCurTextPaintOpts(s => ({ ...s, height: isNaN(Number(event.target.value)) || event.target.value === "" ? null : val }));
                                        }}
                                        onBlur={(e) => {
                                            if (!curTextPaintOpts.height)
                                                setCurTextPaintOpts(s => ({ ...s, height: 0 }));
                                        }}
                                    />
                                </SubMenuItem>
                                <SubMenuItem>
                                    <TextField
                                        label="Hover"
                                        size="small"
                                        id="text-paint-opts-hover-controlled"
                                        type="number"
                                        autoComplete='off'
                                        value={curTextPaintOpts.hover}
                                        fullWidth={false}
                                        variant='outlined'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val;

                                            if (isNaN(Number(event.target.value))) {
                                                val = 0;
                                            } else {
                                                val = Number(event.target.value);
                                            }

                                            if (val < 0) val = 0;

                                            let newOpts = { ...curTextPaintOpts, hover: val }
                                            if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                            setCurTextPaintOpts(s => ({ ...s, hover: isNaN(Number(event.target.value)) || event.target.value === "" ? null : val }));
                                        }}
                                        onBlur={(e) => {
                                            if (!curTextPaintOpts.hover)
                                                setCurTextPaintOpts(s => ({ ...s, hover: 0 }));
                                        }}
                                    />
                                </SubMenuItem>
                                <SubMenuItem title="Mirror Text">
                                    <MenuButton
                                        sx={{ flexFlow: 'row', justifySelf: 'end', mr: 0, p: 0, mt: 0, mb: 0 }}
                                        icon={curTextPaintOpts.mirror ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                                        onClick={() => {
                                            let val = { ...curTextPaintOpts, mirror: !curTextPaintOpts.mirror }
                                            if (onTextPaintOptsChange) onTextPaintOptsChange(val);
                                            setCurTextPaintOpts(val);
                                        }}>
                                        Mirror
                                    </MenuButton>
                                </SubMenuItem>
                                {/* <SubMenuItem>
                                    <FormControlLabel
                                        sx={{ flexFlow: 'row-reverse', mr: 0, mt: 1, mb: curTextPaintOpts.mirror ? 1 : 0, }}
                                        control={
                                            <Checkbox value={curTextPaintOpts.mirror}
                                                sx={{ pr: 0, pb: 0, pt: 0 }}
                                                onChange={(e) => {
                                                    let val = { ...curTextPaintOpts, mirror: e.target.checked }
                                                    if (onTextPaintOptsChange) onTextPaintOptsChange(val);
                                                    setCurTextPaintOpts(val);
                                                }}
                                            />}
                                        label="Mirror"
                                    />
                                </SubMenuItem> */}

                                {/* <Box sx={{ width: '100%', mt: 1, mb: 1, display: 'flex', flexFlow: 'column', alignItems: 'end' }}>
                                        Scale
                                        <Box sx={{ width: '100%', display: 'flex', flexFlow: 'row' }}>
                                            <TextField
                                                label="X"
                                                sx={{ p: 0, mr: 0, mt: 1, }}
                                                size="small"
                                                id="text-paint-opts-height-controlled"
                                                type="number"
                                                autoComplete='off'
                                                value={curTextPaintOpts.scale[0]}
                                                fullWidth={false}
                                                variant='outlined'
                                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                    let val;

                                                    if (isNaN(Number(event.target.value))) {
                                                        val = 0;
                                                    } else {
                                                        val = Number(event.target.value);
                                                    }
                                                    if(val < 0) val = 0;

                                                    let scale = curTextPaintOpts.scale;
                                                    scale[0] = val;

                                                    let newOpts = { ...curTextPaintOpts, scale: scale }
                                                    if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                                    if(scale[0] === 0) scale[0] = null;

                                                    setCurTextPaintOpts(s => ({ ...s, scale: scale }));
                                                }}
                                            />
                                            <TextField
                                                label="Y"
                                                sx={{ p: 0, mr: 0, mt: 1, }}
                                                size="small"
                                                id="text-paint-opts-height-controlled"
                                                type="number"
                                                autoComplete='off'
                                                value={curTextPaintOpts.scale[1]}
                                                fullWidth={false}
                                                variant='outlined'
                                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                    let val;

                                                    if (isNaN(Number(event.target.value))) {
                                                        val = 0;
                                                    } else {
                                                        val = Number(event.target.value);
                                                    }

                                                    if(val < 0) val = 0;

                                                    let scale = curTextPaintOpts.scale;
                                                    scale[1] = val;

                                                    let newOpts = { ...curTextPaintOpts, scale: scale }
                                                    if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                                    if(scale[1] === 0) scale[1] = null;

                                                    setCurTextPaintOpts(s => ({ ...s, scale: scale }));
                                                }}
                                            />
                                            <TextField
                                                label="Z"
                                                sx={{ p: 0, mr: 0, mt: 1, }}
                                                size="small"
                                                id="text-paint-opts-height-controlled"
                                                type="number"
                                                autoComplete='off'
                                                value={curTextPaintOpts.scale[2]}
                                                fullWidth={false}
                                                variant='outlined'
                                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                    let val;

                                                    if (isNaN(Number(event.target.value))) {
                                                        val = 0;
                                                    } else {
                                                        val = Number(event.target.value);
                                                    }

                                                    if(val < 0) val = 0;

                                                    let scale = curTextPaintOpts.scale;
                                                    scale[2] = val;

                                                    let newOpts = { ...curTextPaintOpts, scale: scale }
                                                    if (onTextPaintOptsChange) onTextPaintOptsChange(newOpts);

                                                    if(scale[2] === 0) scale[2] = null;

                                                    setCurTextPaintOpts(s => ({ ...s, scale: scale }));
                                                }}
                                            />
                                        </Box>
                                    </Box> */}

                            </>
                        }
                    </SubMenu>
                </SubMenu>
                <MenuButton
                    icon={editingTileJSONData ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    onClick={() => {
                        setEdittingTileJSONData(!editingTileJSONData);
                    }}>
                    Edit Tile Data
                </MenuButton>
            </SettingsMenu>

            <Toast open={tilePaintTipOpen} onClose={() => setTilePaintTipOpen(false)}>
                <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                    Right click a tile to change it to the selected tile type.
                </Typography>
                <Typography variant='subtitle2' sx={{ textAlign: 'left' }}>
                    Tip: Drag the mouse while right clicking to paint faster!
                </Typography>
            </Toast>

            <Toast open={textPaintTipOpen} onClose={() => setTextPaintTipOpen(false)}>
                <Typography variant="subtitle1" sx={{ textAlign: 'left', }}>
                    Enter a text value in the text box then right click a tile to add it on top.
                </Typography>
                <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                    Leave the text box blank to erase.
                </Typography>
                <Typography variant='subtitle2' sx={{ textAlign: 'left' }}>
                    Tip: Drag the mouse while right clicking to paint faster!
                </Typography>
            </Toast>
            <Toast open={tileJSONDataTipOpen} onClose={() => setTileJSONDataTipOpen(false)}>
                <Typography variant="subtitle1" sx={{ textAlign: 'left', mb: .25 }}>
                    Right click on tile to view and edit it's custom data.
                </Typography>
            </Toast>
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
                    <JSONEditor
                        metadata={curTileJSONData}
                        onChange={(e) => {
                            setCurTileJSONData(e);
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTileJSONModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                        if (onTileJSONDataInput && curTileJSONData) onTileJSONDataInput(JSON.stringify(curTileJSONData));

                        setTileJSONModalOpen(false);
                    }}>Save</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={createTypeModalOpen} onClose={(e, reason) => {
                if (reason === 'backdropClick') {
                    return;
                }

                setCreateTypeModalOpen(false);
            }} sx={{
                textAlign: 'left', pl: 2, pr: 2, "& label": {
                    "::after": {
                        color: 'transparent',
                        display: 'block'
                    }
                }
            }}>
                <DialogTitle>New Tile Type</DialogTitle>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                    <List sx={{
                        '& *': {
                            "& label": {
                                "::after": {
                                    color: 'transparent',
                                    display: 'none'
                                }
                            }
                        },
                    }}>
                        <ListItem>
                            <TextField
                                label="Name"
                                size="small"
                                id="tyle-type-name-controlled"
                                type="text"
                                autoComplete='off'
                                value={createType.name}
                                fullWidth={true}
                                variant='standard'
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setCreateType(s => ({ ...s, name: event.target.value }));
                                    // if (onMapSizeChanged) onMapSizeChanged(val);
                                }}
                            />
                        </ListItem>
                        <ListItem sx={{ display: 'flex', flexFlow: 'column', alignItems: 'start' }}>
                            <span style={{ fontSize: '1rem', transform: 'scale(0.75)', lineHeight: '1.4375em', letterSpacing: '0.00938em', display: 'flex', alignSelf: 'start', marginLeft: '-1.5px' }}>Color</span>
                            <ColorPicker color={createType.color} onChange={(color) => {
                                setCreateType(s => ({ ...s, color: color }))
                            }} />
                        </ListItem>
                        <ListItem>
                            <TextField
                                label="Scale"
                                size="small"
                                id="tyle-type-scale-controlled"
                                type="number"
                                inputProps={{

                                    step: "0.01"
                                }}
                                autoComplete='off'
                                value={createType.scale}
                                fullWidth={true}
                                variant='standard'
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    let val = null;
                                    val = Number.parseFloat(event.target.value);

                                    if (val !== null && val < 0) val = 0;

                                    setCreateType(s => ({ ...s, scale: val }));
                                    // if (onMapSizeChanged) onMapSizeChanged(val);
                                }}
                            />
                        </ListItem>
                        <ListItem>
                            <Grid container columnSpacing={10} rowSpacing={4} gridAutoRows={2} alignItems="stretch">
                                <Grid item>
                                    <TextField
                                        label="Extrude Steps"
                                        size="small"
                                        id="tyle-type-steps-controlled"
                                        type="number"
                                        inputProps={{

                                            step: "0.01"
                                        }}
                                        autoComplete='off'
                                        value={createType.geomOpts.steps}
                                        fullWidth={true}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val = null;
                                            val = Number.parseFloat(event.target.value);

                                            if (val !== null && val < 0) val = 0;

                                            setCreateType(s => ({ ...s, geomOpts: { ...s.geomOpts, steps: val } }));
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                </Grid>
                                <Grid item>
                                    <TextField
                                        label="Extrude Depth"
                                        size="small"
                                        id="tyle-type-depth-controlled"
                                        type="number"
                                        inputProps={{

                                            step: "0.01"
                                        }}
                                        autoComplete='off'
                                        value={createType.geomOpts.depth}
                                        fullWidth={true}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val = null;
                                            val = Number.parseFloat(event.target.value);
                                            if (val !== null && val < 0) val = 0;

                                            setCreateType(s => ({ ...s, geomOpts: { ...s.geomOpts, depth: val } }));
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                </Grid>
                                <Grid item>
                                    <FormControlLabel control={<Checkbox value={createType.geomOpts.bevelEnabled} onChange={(e) => setCreateType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelEnabled: e.target.checked } }))} defaultChecked />} label="Bevel Enabled" />
                                </Grid>
                                {createType.geomOpts.bevelEnabled && <>
                                    <Grid item>
                                        <TextField
                                            label="Bevel Thickness"
                                            size="small"
                                            id="tyle-type-bevel-thick-controlled"
                                            type="number"
                                            inputProps={{

                                                step: "0.01"
                                            }}
                                            autoComplete='off'
                                            value={createType.geomOpts.bevelThickness}
                                            fullWidth={true}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;

                                                setCreateType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelThickness: val } }));
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <TextField
                                            label="Bevel Size"
                                            size="small"
                                            id="tyle-type-bevel-size-controlled"
                                            type="number"
                                            inputProps={{

                                                step: "0.01"
                                            }}
                                            autoComplete='off'
                                            value={createType.geomOpts.bevelSize}
                                            fullWidth={true}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;

                                                setCreateType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelSize: val } }));
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <TextField
                                            label="Bevel Segments"
                                            size="small"
                                            id="tyle-type-bevel-segs-controlled"
                                            type="number"
                                            inputProps={{

                                                step: "0.01"
                                            }}
                                            autoComplete='off'
                                            value={createType.geomOpts.bevelSegments}
                                            fullWidth={true}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;

                                                setCreateType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelSegments: val } }));
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Grid>
                                </>}
                            </Grid>
                        </ListItem>
                        <ListItem sx={{ display: 'flex', flexFlow: 'column', alignItems: 'start' }}>
                            <span style={{ fontSize: '1rem', transform: 'scale(0.75)', lineHeight: '1.4375em', letterSpacing: '0.00938em', display: 'flex', alignSelf: 'start', marginLeft: '-1.5px' }}>Base Custom Data</span>
                            <JSONEditor
                                metadata={createType.customData}
                                // width={250}
                                onChange={(e) => {
                                    if (e.error) return;

                                    setCreateType(s => ({ ...s, customData: e }));
                                }}
                            />
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateTypeModalOpen(false)}>Cancel</Button>
                    <Button
                        disabled={!createType.name || createType.name.length < 1 || !createType.color || createType.color.length < 1}
                        onClick={() => {
                            if (onTileTypeCreated) onTileTypeCreated(createType);
                            setCurTileType(createType.name);
                            setCreateTypeModalOpen(false);
                        }}>Save</Button>
                </DialogActions>
            </Dialog>
            {editType && <Dialog open={editTypeModalOpen} onClose={(e, reason) => {
                if (reason === 'backdropClick') {
                    return;
                }

                setEditTypeModalOpen(false);
            }} sx={{
                textAlign: 'left', pl: 2, pr: 2, "& label": {
                    "::after": {
                        color: 'transparent',
                        display: 'block'
                    }
                }
            }}>
                <DialogTitle>Edit Tile Type</DialogTitle>
                <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
                    <List sx={{
                        '& *': {
                            "& label": {
                                "::after": {
                                    color: 'transparent',
                                    display: 'none'
                                }
                            }
                        },
                    }}>
                        <ListItem>
                            <TextField
                                label="Name"
                                size="small"
                                id="tyle-type-name-controlled"
                                type="text"
                                autoComplete='off'
                                value={editType.name}
                                fullWidth={true}
                                variant='standard'
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setEditType(s => ({ ...s, name: event.target.value }));
                                    // if (onMapSizeChanged) onMapSizeChanged(val);
                                }}
                            />
                        </ListItem>
                        <ListItem sx={{ display: 'flex', flexFlow: 'column', alignItems: 'start' }}>
                            <span style={{ fontSize: '1rem', transform: 'scale(0.75)', lineHeight: '1.4375em', letterSpacing: '0.00938em', display: 'flex', alignSelf: 'start', marginLeft: '-1.5px' }}>Color</span>
                            <ColorPicker color={editType.color} onChange={(color) => {
                                setEditType(s => ({ ...s, color: color }))
                            }} />
                        </ListItem>
                        <ListItem>
                            <TextField
                                label="Scale"
                                size="small"
                                id="tyle-type-scale-controlled"
                                type="number"
                                inputProps={{

                                    step: "0.01"
                                }}
                                autoComplete='off'
                                value={editType.scale}
                                fullWidth={true}
                                variant='standard'
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    let val = null;
                                    val = Number.parseFloat(event.target.value);

                                    if (val !== null && val < 0) val = 0;

                                    setEditType(s => ({ ...s, scale: val }));
                                    // if (onMapSizeChanged) onMapSizeChanged(val);
                                }}
                            />
                        </ListItem>
                        <ListItem>
                            <Grid container columnSpacing={10} rowSpacing={4} gridAutoRows={2} alignItems="stretch">
                                <Grid item>
                                    <TextField
                                        label="Extrude Steps"
                                        size="small"
                                        id="tyle-type-steps-controlled"
                                        type="number"
                                        inputProps={{

                                            step: "0.01"
                                        }}
                                        autoComplete='off'
                                        value={editType.geomOpts.steps}
                                        fullWidth={true}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val = null;
                                            val = Number.parseFloat(event.target.value);

                                            if (val !== null && val < 0) val = 0;

                                            setEditType(s => ({ ...s, geomOpts: { ...s.geomOpts, steps: val } }));
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                </Grid>
                                <Grid item>
                                    <TextField
                                        label="Extrude Depth"
                                        size="small"
                                        id="tyle-type-depth-controlled"
                                        type="number"
                                        inputProps={{

                                            step: "0.01"
                                        }}
                                        autoComplete='off'
                                        value={editType.geomOpts.depth}
                                        fullWidth={true}
                                        variant='standard'
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                            let val = null;
                                            val = Number.parseFloat(event.target.value);
                                            if (val !== null && val < 0) val = 0;

                                            setEditType(s => ({ ...s, geomOpts: { ...s.geomOpts, depth: val } }));
                                            // if (onMapSizeChanged) onMapSizeChanged(val);
                                        }}
                                    />
                                </Grid>
                                <Grid item>
                                    <FormControlLabel control={<Checkbox value={editType.geomOpts.bevelEnabled} onChange={(e) => setEditType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelEnabled: e.target.checked } }))} defaultChecked />} label="Bevel Enabled" />
                                </Grid>
                                {editType.geomOpts.bevelEnabled && <>
                                    <Grid item>
                                        <TextField
                                            label="Bevel Thickness"
                                            size="small"
                                            id="tyle-type-bevel-thick-controlled"
                                            type="number"
                                            inputProps={{

                                                step: "0.01"
                                            }}
                                            autoComplete='off'
                                            value={editType.geomOpts.bevelThickness}
                                            fullWidth={true}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;

                                                setEditType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelThickness: val } }));
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <TextField
                                            label="Bevel Size"
                                            size="small"
                                            id="tyle-type-bevel-size-controlled"
                                            type="number"
                                            inputProps={{

                                                step: "0.01"
                                            }}
                                            autoComplete='off'
                                            value={editType.geomOpts.bevelSize}
                                            fullWidth={true}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;

                                                setEditType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelSize: val } }));
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <TextField
                                            label="Bevel Segments"
                                            size="small"
                                            id="tyle-type-bevel-segs-controlled"
                                            type="number"
                                            inputProps={{

                                                step: "0.01"
                                            }}
                                            autoComplete='off'
                                            value={editType.geomOpts.bevelSegments}
                                            fullWidth={true}
                                            variant='standard'
                                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                                let val = null;
                                                val = Number.parseFloat(event.target.value);

                                                if (val !== null && val < 0) val = 0;

                                                setEditType(s => ({ ...s, geomOpts: { ...s.geomOpts, bevelSegments: val } }));
                                                // if (onMapSizeChanged) onMapSizeChanged(val);
                                            }}
                                        />
                                    </Grid>
                                </>}
                            </Grid>
                        </ListItem>
                        <ListItem sx={{ display: 'flex', flexFlow: 'column', alignItems: 'start' }}>
                            <span style={{ fontSize: '1rem', transform: 'scale(0.75)', lineHeight: '1.4375em', letterSpacing: '0.00938em', display: 'flex', alignSelf: 'start', marginLeft: '-1.5px' }}>Base Custom Data</span>
                            <JSONEditor
                                metadata={editType.customData}
                                // width={250}
                                onChange={(e) => {
                                    if (e.error) return;

                                    setEditType(s => ({ ...s, customData: e }));
                                }}
                            />
                        </ListItem>
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditTypeModalOpen(false)}>Cancel</Button>
                    <Button
                        disabled={!editType.name || editType.name.length < 1 || !editType.color || editType.color.length < 1}
                        onClick={() => {
                            if (onTileTypeEdited) onTileTypeEdited(editType);
                            setCurTileType(editType.name);
                            setEditTypeModalOpen(false);
                        }}>Save</Button>
                </DialogActions>
            </Dialog>}
        </>)
}