import React from "react";
import "../../styles/sandbox.css";
import Box from '@mui/material/Box';
import { Typography, Button, IconButton, useTheme } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import CottageIcon from '@mui/icons-material/Cottage';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import { Player, Resources, TilePortData, getHighlightedPort, getTilePortData, isHighlightingPort } from "../CatanHelpers";
import IconButtonTray from "../../UI/IconButtonTray";
import Tile from "../../../lib/map/Tile";
import MeshEntity, { EntityPlacementType } from "../../../lib/env/MeshEntity";
import Controller from "../../../lib/scene/Controller";
import { InputType } from "../../../lib/utils/MouseCaster";
import { Vector3 } from "three";
import { ResourceDisplay } from "./CatanUIComponents";
import View from "../../../lib/scene/View";

export default ({ modalOpen, players, localPlayerIndex, controller, scene, displayDebugHighlightData }: { modalOpen: boolean, players: Array<Player>, localPlayerIndex: number, controller: Controller, scene: View, displayDebugHighlightData: boolean }) => {
    const theme = useTheme();

    const [highlightedTile, setHighlighedTile] = React.useState<Tile>(null);
    const [highlightedEntity, setHighlightedEntity] = React.useState<MeshEntity>(null);

    const [highlightedPort, setHighlightedPort] = React.useState<{ vertex: number, receiveType: Resources | "Wild", receiveAmount: number, giveAmount: number }>(null);

    React.useEffect(() => {

        controller.removeOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
        controller.removeOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);
        controller.removeOnTileMouseInputListener(InputType.MOUSE_MOVE, onTileHighlight);

        controller.removeOnEntityMouseInputListener(InputType.MOUSE_OVER, onEntityHighlight);
        controller.removeOnEntityMouseInputListener(InputType.MOUSE_OUT, onEntityUnHighlight);


        controller.addOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
        controller.addOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);
        controller.addOnTileMouseInputListener(InputType.MOUSE_MOVE, onTileHighlight);

        controller.addOnEntityMouseInputListener(InputType.MOUSE_OVER, onEntityHighlight);
        controller.addOnEntityMouseInputListener(InputType.MOUSE_OUT, onEntityUnHighlight);

        return () => {
            if (controller) {
                controller.removeOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
                controller.removeOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);
                controller.removeOnTileMouseInputListener(InputType.MOUSE_MOVE, onTileHighlight);

                controller.removeOnEntityMouseInputListener(InputType.MOUSE_OVER, onEntityHighlight);
                controller.removeOnEntityMouseInputListener(InputType.MOUSE_OUT, onEntityUnHighlight);
            }
        }

    }, [controller]);

    React.useEffect(() => {
        return () => {
            if (controller) {
                controller.removeOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
                controller.removeOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);
                controller.removeOnEntityMouseInputListener(InputType.MOUSE_OVER, onEntityHighlight);
                controller.removeOnEntityMouseInputListener(InputType.MOUSE_OUT, onEntityUnHighlight);
            }
        }
    }, [])

    // #region Mouse Highlighting
    const onTileHighlight = (args: { data: Tile, mousePos: Vector3 }) => {
        if (modalOpen) return;

        if (scene.map.highlightedTile) {
            // scene.map.highlightedTile.unHighlightEdge();
            // scene.map.highlightedTile.unHighlightVertex();
            scene.map.highlightedTile.unhighlight();
        }

        if (!args.data) {
            setHighlighedTile(null);
            setHighlightedPort(null)
            return;
        }

        setHighlighedTile(args.data);
        args.data.highlight(true);
        // args.data.unHighlightEdge();
        // args.data.unHighlightVertex();

        const closestVert = controller.getClosestVertex(args.data, args.mousePos);
        const closestEdge = controller.getClosestEdge(args.data, args.mousePos);

        const highlightingVert = args.data.getVertexWorldPosition(closestVert).distanceTo(args.mousePos) <= args.data.getEdgeWorldPosition(closestEdge).distanceTo(args.mousePos);

        if (!highlightingVert) {
            // args.data.highlightEdge(closestEdge);
            setHighlightedPort(null)
        } else {
            // args.data.highlightVertex(closestVert);

            if (isHighlightingPort(args.data, args.mousePos, controller)) {
                let portData = getTilePortData(args.data, closestVert) as TilePortData;

                setHighlightedPort({ vertex: closestVert, receiveType: portData.type === 'Wild' ? portData.type : portData.type as Resources, receiveAmount: portData.to, giveAmount: portData.from })
            }
        }

        // console.log('mouse pos: ' + args.mousePos.toArray());
        // let tile = scene.map.getTileAtPosition(args.data.position);

        // if (tile) {
        //     tile.highlight(true);
        // }
    }

    const onTileUnhighlight = (args: { data: Tile, mousePos: Vector3 }) => {
        setHighlighedTile(null);
        setHighlightedPort(null);
        // args.data.unHighlightVertex();
        // args.data.unHighlightEdge();
    }

    const onEntityHighlight = (args: { data: MeshEntity, mousePos: Vector3 }) => {
        if (modalOpen) return;

        setHighlightedEntity(args.data);
        // args.data.highlight(true);
        // scene.spotlight.intensity = .4;
    }

    const onEntityUnHighlight = (args: { data: MeshEntity, mousePos: Vector3 }) => {
        setHighlightedEntity(null);
        // args.data.highlight(false);
        // scene.spotlight.intensity = .85;
    }
    // #endregion

    // #region Highlight And Entity UI
    if (!modalOpen) {
        return (
            <Box
                sx={{
                    color: 'white',
                    borderRadius: '0 0 2em 0',
                    position: 'fixed',
                    padding: 0,
                    pl: '0 !important',
                    top: 0,
                    left: 0,
                    [theme.breakpoints.up('sm')]: {
                        // left: theme.spacing(8),
                    },
                    pointerEvents: 'none',
                    background: 'rgba(0,0,0,.25)',
                    backdropFilter: 'blur(5px)',
                }}>
                {/* <Box>
                        <Typography>
                            State: {(JSON.stringify(returnSaveState(), null, 2))}
                        </Typography>
                    </Box> */}
                {players !== undefined && players.length > 0 && localPlayerIndex !== undefined &&
                    <>
                        <Box sx={{
                            display: 'flex', flexFlow: 'row', pl: 1, pt: 1, textAlign: 'left', alignItems: 'start', background: 'rgba(0,0,0,.25)',
                            backdropFilter: 'blur(5px)',
                        }}>
                            <Typography>Player {players[localPlayerIndex].id}</Typography>
                        </Box>
                        <ResourceDisplay
                            brick={players[localPlayerIndex].brick}
                            lumber={players[localPlayerIndex].lumber}
                            wool={players[localPlayerIndex].wool}
                            grain={players[localPlayerIndex].grain}
                            ore={players[localPlayerIndex].ore}
                        />
                        <Box sx={{
                            display: 'flex', flexFlow: 'row', p: 1, pb: .5, pr: 2, ">*": { ml: 1 }, textAlign: 'left', background: 'rgba(0,0,0,.25)',
                            backdropFilter: 'blur(5px)',
                        }}>
                            <Box sx={{ display: 'flex', flexFlow: 'column', alignItems: 'center', }}>
                                <Typography>Roads</Typography>
                                <Typography>{players[localPlayerIndex].roads.length}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexFlow: 'column', alignItems: 'center', }}>
                                <Typography>Settlements</Typography>
                                <Typography>{players[localPlayerIndex].settlements.length}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexFlow: 'column', alignItems: 'center', }}>
                                <Typography>Cities</Typography>
                                <Typography>{players[localPlayerIndex].cities.length}</Typography>
                            </Box>
                        </Box>
                    </>
                }
                {displayDebugHighlightData &&
                    <>
                        {highlightedTile &&
                            <Box sx={{ display: 'flex', flexFlow: 'column', p: 1, pb: 1.5, pr: 2, ">*": { mt: 1, ml: 1 }, textAlign: 'left' }}>
                                <Typography>
                                    Map Position: {"(" + highlightedTile.mapPosition.toArray().map(num => Math.sign(num) * Math.round(Math.abs(num))).toString().replaceAll(",", ", ") + ")"}
                                </Typography>
                                <Typography>
                                    Mesh Position: {"(" + highlightedTile.mesh.position.toArray().map(num => Math.sign(num) * Math.round(Math.abs(num))).toString().replaceAll(",", ", ") + ")"}
                                </Typography>
                                <Typography>
                                    Cell Position: {"(" + highlightedTile.cell?.gridPosition.toArray().map(x => Math.round(x)).toString().replaceAll(",", ", ") + ")"}
                                </Typography>
                                <Typography>
                                    Custom Data: {(JSON.stringify(highlightedTile.getCustomData(), null, 2))}
                                </Typography>
                                {/* <Typography>
                                    toJSON(): {JSON.stringify(highlightedTile.toJSON(), null, 2)}
                                </Typography> */}
                                {highlightedTile.entities.length > 0 &&
                                    <Typography>
                                        Entities: {(JSON.stringify(highlightedTile.entities.map(e => ({ name: e.entityName, type: EntityPlacementType[e.placementType].toString(), vert: e.placementVertex, edge: e.placementEdge })), null, 2))}
                                    </Typography>
                                }
                                {highlightedTile.sharedVertEntities.length > 0 &&
                                    <Typography>
                                        Shared Vertex Entities: {(JSON.stringify(highlightedTile.sharedVertEntities.map(e => ({ name: e.entity.entityName, vert: e.vertex, ownerVert: e.ownerVertex })), null, 2))}
                                    </Typography>
                                }
                                {highlightedTile.sharedEdgeEntities.length > 0 &&
                                    <Typography>
                                        Shared Edge Entities: {(JSON.stringify(highlightedTile.sharedEdgeEntities.map(e => ({ name: e.entity.entityName, edge: e.edge, ownerEdge: e.ownerEdge })), null, 2))}
                                    </Typography>
                                }
                                {highlightedPort &&
                                    <>
                                        <Typography>
                                            Port Vertex: {highlightedPort.vertex}
                                        </Typography>
                                        <Typography>
                                            Port Type: {highlightedPort.receiveType.toString()}
                                        </Typography>
                                        <Typography>
                                            Port Receives: {'\n'}{highlightedPort.receiveAmount} for {highlightedPort.giveAmount}
                                        </Typography>
                                    </>
                                }
                            </Box>
                        }
                        {
                            highlightedEntity &&
                            <Box sx={{ display: 'flex', flexFlow: 'column', p: 1, pb: 1.5, pr: 2, ">*": { mt: 1, ml: 1 }, textAlign: 'left' }}>
                                <Typography>
                                    Mesh Position: {"(" + highlightedEntity.position.toArray().map(x => Math.round(x)).toString().replaceAll(",", ", ") + ")"}
                                </Typography>
                                <Typography>
                                    Custom Data: {(JSON.stringify(highlightedEntity.getCustomData(), null, 2))}
                                </Typography>
                                <Typography>Tile: {highlightedEntity.parentTile?.getCustomData()['diceValue']}</Typography>
                                <Typography>Edge: {highlightedEntity.placementEdge}</Typography>
                            </Box>
                        }
                    </>}
            </Box>
        )
    } else return null;
    // #endregion
}