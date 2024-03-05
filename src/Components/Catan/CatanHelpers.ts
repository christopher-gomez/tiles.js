import { BoxBufferGeometry, BufferGeometry, Clock, Color, DepthTexture, DoubleSide, Euler, Geometry, InstancedBufferAttribute, InstancedMesh, Line, LineBasicMaterial, Matrix4, Mesh, MeshDepthMaterial, MeshPhongMaterial, NearestFilter, NoBlending, Object3D, PMREMGenerator, PlaneGeometry, Quaternion, RGBADepthPacking, RepeatWrapping, Scene, ShaderMaterial, Sprite, SpriteMaterial, TextureLoader, UniformsLib, UniformsUtils, UnsignedShortType, Vector, Vector2, Vector3, WebGLRenderTarget } from "three";
import MeshEntity, { EntityPlacementType } from "../../lib/env/MeshEntity";
import Tile from "../../lib/map/Tile";
import View from "../../lib/scene/View";
import { Node, Tree } from "../../lib/utils/UnstructuredTree";
import Controller, { ZoomDirection } from "../../lib/scene/Controller";
// import RedCircle from '../../Assets/red-circle-frame.svg';
import Engine from "../../lib/Engine";
// import { TransformControls } from 'three-addons';
// import TransformControls from 'threejs-transformcontrols';
import Ship from '../../Assets/ship.png';
import Tools from "../../lib/utils/Tools";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import SpriteEntity from "../../lib/env/SpriteEntity";
import { Sky } from 'three/examples/jsm/objects/Sky';
import WaterNormals from '../../Assets/waternormals.jpg';
import Hills from "./Environment/Hills";
import Mountains from "./Environment/Mountains";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Wheat from "./Environment/Wheat";
import Clay from "./Environment/Clay";
import Forest from "./Environment/Forest";
import Desert from "./Environment/Desert";
import Port from "./Environment/Port";
import Water from "./Environment/Water";
import Map from "../../lib/map/Map";

export interface IPlayerJSONData {
    id: number,
    turnOrder: number,
    diceRoll: number,
    lumber: number,
    grain: number,
    wool: number,
    brick: number,
    ore: number
}


export enum GameState {
    NEW_GAME,
    RESUME_GAME,
    PLAY,
    COMPLETE,
}

export enum NewGameFlowState {
    PLAYER_SELECT,
    EXPLAIN_ORDER,
    DETERMINE_ORDER,
    DISPLAY_ORDER,
    BUILD,
    COMPLETE
}

export enum TurnState {
    ROLL,
    BUILD_TRADE
}


export class Player {
    lumber = 10;
    grain = 10;
    wool = 10;
    brick = 10;
    ore = 10;

    roads: MeshEntity[] = [];

    public get availableRoads() {
        return 15 - this.roads.length;
    }

    settlements: MeshEntity[] = [];

    public get availableSettlements() {
        return 5 - this.settlements.length;
    }

    cities: MeshEntity[] = [];

    public get availableCities() {
        return 4 - this.cities.length;
    }

    public get allEntities() {
        return [...this.roads, ...this.settlements, ...this.cities];
    }

    id: number = 0;
    turnOrder: number = 0;

    diceRoll: number = 0;

    hasLongestRoad = false;

    hasLargestArmy = false;

    public get victoryPoints() {
        return (this.settlements.length * 1) + (this.cities.length * 2) + (this.hasLongestRoad ? 2 : 0) + (this.hasLargestArmy ? 2 : 0);
    }

    constructor(id: number) {
        this.id = id;
    }

    toJSON(): IPlayerJSONData {
        return {
            id: this.id,
            turnOrder: this.turnOrder,
            diceRoll: this.diceRoll,
            lumber: this.lumber,
            grain: this.grain,
            wool: this.wool,
            brick: this.brick,
            ore: this.ore
        }
    }

    fromJSON({ id, turnOrder, diceRoll, lumber, grain, wool, brick, ore }: IPlayerJSONData) {
        this.id = id;
        this.turnOrder = turnOrder;
        this.diceRoll = diceRoll;
        this.lumber = lumber;
        this.grain = grain;
        this.wool = wool;
        this.brick = brick;
        this.ore = ore;
    }

    canBuildRoad() {
        return this.brick >= 1 && this.lumber >= 1;
    }

    addRoad(road: MeshEntity, useResources: boolean) {
        if (useResources) {
            this.lumber -= 1;
            this.brick -= 1;
        }

        road.setCustomData('index', this.roads.length);
        road.setCustomData('type', 'road');
        road.setCustomData('owner', this.id);

        this.roads.push(road);
    }

    canBuildSettlement() {
        return this.lumber >= 1 && this.brick >= 1 && this.wool >= 1 && this.grain >= 1;
    }

    addSettlement(settlement: MeshEntity, useResources: boolean) {
        if (useResources) {
            this.lumber -= 1;
            this.brick -= 1;
            this.wool -= 1;
            this.grain -= 1;
        }

        settlement.setCustomData('index', this.settlements.length);
        settlement.setCustomData('type', 'settlement');
        settlement.setCustomData('owner', this.id);

        this.settlements.push(settlement);
    }

    removeSettlement(settlement: MeshEntity) {
        const index = this.settlements.indexOf(settlement);
        if (index !== -1) {
            this.settlements.splice(index, 1);
        }
    }

    removeEntity(entity: MeshEntity) {
        switch(entity.getCustomData('type')) {
            case 'settlement':
                this.removeSettlement(entity)
                break;
            case 'road':
                this.removeRoad(entity);
                break;
            case 'city':
                // this.removeCity(entity)
                break;
        }
    }

    removeRoad(road: MeshEntity) {
        const index = this.roads.indexOf(road);
        if (index !== -1) {
            this.roads.splice(index, 1);
        }
    }

    canBuildCity() {
        return this.ore >= 3 && this.grain >= 2;
    }

    addCity(city: MeshEntity, useResources: boolean) {
        if (useResources) {
            this.ore -= 3;
            this.grain -= 2;
        }

        city.setCustomData('index', this.cities.length);
        city.setCustomData('type', 'city');
        city.setCustomData('owner', this.id);

        this.cities.push(city);
    }

    getLongestContinuousRoad() {

        let roadPath = new Array<MeshEntity>(0);

        for (let i = 0; i < this.roads.length; i++) {
            const curRoad = this.roads[i];

            const getNextRoad = (road: MeshEntity, dir: number, ignore?: Array<MeshEntity>) => {
                if (!ignore) ignore = [];

                const tileOwnedAdjEdgeForwardPredicate = (e: MeshEntity) => (e.placementType === EntityPlacementType.EDGE && (((road.placementEdge === 5 ? e.placementEdge === 0 : e.placementEdge === road.placementEdge + 1))) && e.getCustomData().owner === this.id && ignore.indexOf(e) === -1);

                const tileOwnedAdjEdgeBackwardPredicate = (e: MeshEntity) => (e.placementType === EntityPlacementType.EDGE && (((road.placementEdge === 0 ? e.placementEdge === 5 : e.placementEdge === road.placementEdge - 1))) && e.getCustomData().owner === this.id && ignore.indexOf(e) === -1);

                const sharedTileOwnedAdEdgeForwardPredicate = (e: {
                    entity: MeshEntity;
                    owner: Tile;
                    edge: number;
                    ownerEdge: number;
                }) => ((road.placementEdge === 5 ? e.edge === 0 : e.edge === road.placementEdge + 1) && e.entity.getCustomData().owner === this.id && ignore.indexOf(e.entity) === -1);

                const sharedTileOwnedAdjEdgeBackwardPredicate = (e: {
                    entity: MeshEntity;
                    owner: Tile;
                    edge: number;
                    ownerEdge: number;
                }) => (((road.placementEdge === 0 ? e.edge === 5 : e.edge === road.placementEdge - 1)) && e.entity.getCustomData().owner === this.id && ignore.indexOf(e.entity) === -1);

                let tileAdjForwardRoad = road.parentTile.entities.find(tileOwnedAdjEdgeForwardPredicate);
                let tileAdjBackwardRoad = road.parentTile.entities.find(tileOwnedAdjEdgeBackwardPredicate);
                let sharedTileAdjForwardRoad = road.parentTile.sharedEdgeEntities.find(sharedTileOwnedAdEdgeForwardPredicate);
                let sharedTileAdjBackwardRoad = road.parentTile.sharedEdgeEntities.find(sharedTileOwnedAdjEdgeBackwardPredicate);

                if (dir === 1) {
                    if (tileAdjForwardRoad) {
                        return (tileAdjForwardRoad);
                    } else if (sharedTileAdjForwardRoad) {
                        return (sharedTileAdjForwardRoad.entity);
                    } else {
                        const edgeNeigh = road.parentTile.getEdgeNeighbors(road.placementEdge)[0];

                        if (!edgeNeigh || !edgeNeigh.tile) return undefined;

                        const tileOwnedAdjEdgeForwardPredicate = (e: MeshEntity) => (e.placementType === EntityPlacementType.EDGE && (((edgeNeigh.edge === 5 ? e.placementEdge === 0 : e.placementEdge === edgeNeigh.edge + 1))) && e.getCustomData().owner === this.id && ignore.indexOf(e) === -1);

                        const sharedTileOwnedAdEdgeForwardPredicate = (e: {
                            entity: MeshEntity;
                            owner: Tile;
                            edge: number;
                            ownerEdge: number;
                        }) => ((edgeNeigh.edge === 5 ? e.edge === 0 : e.edge === edgeNeigh.edge + 1) && e.entity.getCustomData().owner === this.id && ignore.indexOf(e.entity) === -1);

                        let tileAdjForwardRoad = edgeNeigh.tile.entities.find(tileOwnedAdjEdgeForwardPredicate);
                        let sharedTileAdjForwardRoad = edgeNeigh.tile.sharedEdgeEntities.find(sharedTileOwnedAdEdgeForwardPredicate);

                        if (tileAdjForwardRoad) {
                            return (tileAdjForwardRoad);
                        } else if (sharedTileAdjForwardRoad) {
                            return (sharedTileAdjForwardRoad.entity);
                        }
                    }
                }

                if (dir === -1) {
                    if (tileAdjBackwardRoad) {
                        return (tileAdjBackwardRoad);
                    } else if (sharedTileAdjBackwardRoad) {
                        return (sharedTileAdjBackwardRoad.entity);
                    } else {
                        const edgeNeigh = road.parentTile.getEdgeNeighbors(road.placementEdge)[0];

                        if (!edgeNeigh || !edgeNeigh.tile) return undefined;

                        const tileOwnedAdjEdgeBackwardPredicate = (e: MeshEntity) => (e.placementType === EntityPlacementType.EDGE && (((edgeNeigh.edge === 0 ? e.placementEdge === 5 : e.placementEdge === edgeNeigh.edge - 1))) && e.getCustomData().owner === this.id && ignore.indexOf(e) === -1);

                        const sharedTileOwnedAdjEdgeBackwardPredicate = (e: {
                            entity: MeshEntity;
                            owner: Tile;
                            edge: number;
                            ownerEdge: number;
                        }) => (((edgeNeigh.edge === 0 ? e.edge === 5 : e.edge === edgeNeigh.edge - 1)) && e.entity.getCustomData().owner === this.id && ignore.indexOf(e.entity) === -1);

                        let tileAdjBackwardRoad = edgeNeigh.tile.entities.find(tileOwnedAdjEdgeBackwardPredicate);
                        let sharedTileAdjBackwardRoad = edgeNeigh.tile.sharedEdgeEntities.find(sharedTileOwnedAdjEdgeBackwardPredicate);

                        if (tileAdjBackwardRoad) {
                            return (tileAdjBackwardRoad);
                        } else if (sharedTileAdjBackwardRoad) {
                            return (sharedTileAdjBackwardRoad.entity);
                        }
                    }
                }

                return undefined;
            }


            const fillTree = (root: Node<MeshEntity>, ignore?: MeshEntity[]) => {
                if (!root.data) {
                    return;
                }

                if (!ignore) ignore = [root.data];

                const forwardRoad = getNextRoad(root.data, 1, ignore);
                if (forwardRoad) {
                    ignore.push(forwardRoad);
                }

                const backwardRoad = getNextRoad(root.data, -1, ignore);
                if (backwardRoad) {
                    ignore.push(backwardRoad)
                }

                root.forward = fillTree(new Node(forwardRoad), ignore);
                root.backward = fillTree(new Node(backwardRoad), ignore);

                return root;
            }

            const getLongestPath = (road: MeshEntity) => {
                const tree = new Tree(road);
                fillTree(tree.root);

                return tree.longestPath(tree.root).map(node => node.data);
            }

            const roads = getLongestPath(curRoad);
            if (roads.length > roadPath.length) roadPath = roads;
        }

        return roadPath;
    }

    tradeResources(offering: Array<{ name: string, amount: number }>, receiving: Array<{ name: string, amount: number }>) {
        for (const r of offering) {
            switch (r.name) {
                case Resources.BRICK:
                    this.brick -= r.amount;
                    break;
                case Resources.LUMBER:
                    this.lumber -= r.amount;
                    break;
                case Resources.WOOL:
                    this.wool -= r.amount;
                    break;
                case Resources.GRAIN:
                    this.grain -= r.amount;
                    break;
                case Resources.ORE:
                    this.ore -= r.amount;
                    break;
            }
        }

        for (const r of receiving) {
            switch (r.name) {
                case Resources.BRICK:
                    this.brick += r.amount;
                    break;
                case Resources.LUMBER:
                    this.lumber += r.amount;
                    break;
                case Resources.WOOL:
                    this.wool += r.amount;
                    break;
                case Resources.GRAIN:
                    this.grain += r.amount;
                    break;
                case Resources.ORE:
                    this.ore += r.amount;
                    break;
            }
        }
    }
}

export enum Resources {
    BRICK = 'Brick',
    LUMBER = 'Lumber',
    WOOL = 'Wool',
    GRAIN = 'Grain',
    ORE = 'Ore',
    WILD = 'Wild'
}

export const settlementPlacementValidator = (players: Array<Player>, localPlayerIndex: number, gameState: GameState) => (tile: Tile, vertOrEdge?: number): boolean => {
    const tileUnOwnedAdjEdgePredicate = (e: MeshEntity) => ((e.placementEdge === vertOrEdge || (vertOrEdge === 0 ? e.placementEdge === 5 : e.placementEdge === vertOrEdge - 1)) && e.getCustomData().owner !== players[localPlayerIndex].id);

    const sharedTileUnOwnedAdjEdgePredicate = (e: {
        entity: MeshEntity;
        owner: Tile;
        edge: number;
        ownerEdge: number;
    }) => ((e.edge === vertOrEdge || (vertOrEdge === 0 ? e.edge === 5 : e.edge === vertOrEdge - 1)) && e.entity.getCustomData().owner !== players[localPlayerIndex].id);

    const tileOwnedAdjEdgePredicate = (e: MeshEntity) => ((e.placementEdge === vertOrEdge || (vertOrEdge === 0 ? e.placementEdge === 5 : e.placementEdge === vertOrEdge - 1)) && e.getCustomData().owner === players[localPlayerIndex].id);

    const sharedTileOwnedAdjEdgePredicate = (e: {
        entity: MeshEntity;
        owner: Tile;
        edge: number;
        ownerEdge: number;
    }) => ((e.edge === vertOrEdge || (vertOrEdge === 0 ? e.edge === 5 : e.edge === vertOrEdge - 1)) && e.entity.getCustomData().owner === players[localPlayerIndex].id);

    let valid = false;
    const tileEdgeEnts = [...tile.entities].filter(e => e.placementType === EntityPlacementType.EDGE);
    const sharedEdgeEnts = [...tile.sharedEdgeEntities];

    if (tileEdgeEnts.length === 0 && sharedEdgeEnts.length === 0 && gameState === GameState.NEW_GAME) {
        valid = true;
    } else {

        // check to see we're at least next to owned edge
        if (tileEdgeEnts.length > 0) {
            if (tileEdgeEnts.find(tileOwnedAdjEdgePredicate)) {
                valid = true;
            } else {
                if (!tileEdgeEnts.find(tileUnOwnedAdjEdgePredicate) && !sharedEdgeEnts.find(sharedTileUnOwnedAdjEdgePredicate) && gameState === GameState.NEW_GAME) {
                    valid = true;
                }
            }
        }

        if (sharedEdgeEnts.length > 0) {
            if (sharedEdgeEnts.find(sharedTileOwnedAdjEdgePredicate)) {
                valid = true;
            } else {
                if (!sharedEdgeEnts.find(sharedTileUnOwnedAdjEdgePredicate) && gameState === GameState.NEW_GAME) {
                    valid = true;
                }
            }
        }

        if (!valid && gameState === GameState.PLAY) {
            const neighs = tile.getVertexNeighbors(vertOrEdge);

            for (const neigh of neighs) {
                const edgeEnt = neigh.tile.entities.find((e: MeshEntity) => (e.placementType === EntityPlacementType.EDGE && (e.placementEdge === neigh.vertex || (neigh.vertex === 0 ? e.placementEdge === 5 : e.placementEdge === neigh.vertex - 1)) && e.getCustomData().owner === players[localPlayerIndex].id));

                if (edgeEnt) {
                    valid = true;
                    break;
                }

                const sharedEdgeEnt = neigh.tile.sharedEdgeEntities.find((e: {
                    entity: MeshEntity;
                    owner: Tile;
                    edge: number;
                    ownerEdge: number;
                }) => ((e.edge === neigh.vertex || (neigh.vertex === 0 ? e.edge === 5 : e.edge === neigh.vertex - 1)) && e.entity.getCustomData().owner === players[localPlayerIndex].id));

                if (sharedEdgeEnt) {
                    valid = true;
                    break;
                }
            }
        }
    }

    // check distance in tile
    if (valid) {
        const vertEnts = tile.entities.filter(e => e.placementType === EntityPlacementType.VERTEX);

        for (const vert of vertEnts) {
            if (vert.placementVertex === (vertOrEdge === 5 ? 0 : vertOrEdge + 1) || vert.placementVertex === (vertOrEdge === 0 ? 5 : vertOrEdge - 1)) {
                valid = false;
                break;
            }
        }

        if (valid) {
            const sharedVertEnts = tile.sharedVertEntities;

            for (const vert of sharedVertEnts) {
                if (vert.vertex === (vertOrEdge === 5 ? 0 : vertOrEdge + 1) || vert.vertex === (vertOrEdge === 0 ? 5 : vertOrEdge - 1)) {
                    valid = false;
                    break;
                }
            }
        }
    }

    // check distance for vertex neighbors
    if (valid) {
        const neighs = tile.getVertexNeighbors(vertOrEdge);

        for (const neigh of neighs) {
            const vertEnts = neigh.tile.entities.filter(e => e.placementType === EntityPlacementType.VERTEX);

            for (const vert of vertEnts) {
                if (vert.placementVertex === (neigh.vertex === 5 ? 0 : neigh.vertex + 1) || vert.placementVertex === (neigh.vertex === 0 ? 5 : neigh.vertex - 1)) {
                    valid = false;
                    break;
                }
            }

            if (!valid) break;

            const sharedVertEnts = neigh.tile.sharedVertEntities;

            for (const vert of sharedVertEnts) {
                if (vert.vertex === (neigh.vertex === 5 ? 0 : neigh.vertex + 1) || vert.vertex === (neigh.vertex === 0 ? 5 : neigh.vertex - 1)) {
                    valid = false;
                    break;
                }
            }

            if (!valid) break;
        }
    }

    return valid;
}

export const roadPlacementValidator = (players: Array<Player>, localPlayerIndex: number, gameState: GameState) => (tile: Tile, vertOrEdge?: number): boolean => {

    const tileOwnedAdjVertPredicate = (e: MeshEntity) => ((e.placementVertex === vertOrEdge || (vertOrEdge === 5 ? e.placementVertex === 0 : e.placementVertex === vertOrEdge + 1)) && e.getCustomData().owner === players[localPlayerIndex].id);

    const tileOwnedAdjEdgePredicate = (e: MeshEntity) => ((e.placementEdge === vertOrEdge || (vertOrEdge === 0 ? e.placementEdge === 5 : e.placementEdge === vertOrEdge - 1) || (vertOrEdge === 5 ? e.placementEdge === 0 : e.placementEdge === vertOrEdge + 1)) && e.getCustomData().owner === players[localPlayerIndex].id);

    const sharedTileOwnedAdjEdgePredicate = (e: {
        entity: MeshEntity;
        owner: Tile;
        edge: number;
        ownerEdge: number;
    }) => ((e.edge === vertOrEdge || (vertOrEdge === 0 ? e.edge === 5 : e.edge === vertOrEdge - 1) || (vertOrEdge === 5 ? e.edge === 0 : e.edge === vertOrEdge + 1)) && e.entity.getCustomData().owner === players[localPlayerIndex].id);

    const sharedTileOwnedAdjVertPredicate = (e: {
        entity: MeshEntity;
        owner: Tile;
        vertex: number;
        ownerVertex: number;
    }) => ((e.vertex === vertOrEdge || (vertOrEdge === 5 ? e.vertex === 0 : e.vertex === vertOrEdge + 1)) && e.entity.getCustomData().owner === players[localPlayerIndex].id);

    let valid = false;

    const tileVertEnts = tile.entities.filter(e => e.placementType === EntityPlacementType.VERTEX);
    const tileSharedVertEnts = tile.sharedVertEntities;
    const tileEdgeEnts = tile.entities.filter(e => e.placementType === EntityPlacementType.EDGE);
    const tileSharedEdgeEnts = tile.sharedEdgeEntities;

    let vertEnt = tileVertEnts.find(tileOwnedAdjVertPredicate);
    let sharedVertEnt = tileSharedVertEnts.find(sharedTileOwnedAdjVertPredicate)

    if (vertEnt) {
        if (gameState !== GameState.NEW_GAME) {
            return true;
        } else {
            if (vertEnt.getCustomData().index === players[localPlayerIndex].roads.length) {
                return true;
            }
        }
    }

    if (sharedVertEnt) {
        if (gameState !== GameState.NEW_GAME) {
            return true;
        } else {
            if (sharedVertEnt.entity.getCustomData().index === players[localPlayerIndex].roads.length) {
                return true;
            }
        }
    }

    if (gameState !== GameState.NEW_GAME) {
        const ownedEdgeEnt = tileEdgeEnts.find(tileOwnedAdjEdgePredicate);
        if (ownedEdgeEnt) return true;

        const ownedSharedEdgeEnt = tileSharedEdgeEnts.find(sharedTileOwnedAdjEdgePredicate);
        if (ownedSharedEdgeEnt) return true;

        const edgeNeighs = tile.getEdgeNeighbors(vertOrEdge);
        let ownedNeighEdge;
        let sharedOwnedNeighEdge;
        for (const neigh of edgeNeighs) {
            const neighEdgeEnts = neigh.tile.entities.filter(e => e.placementType === EntityPlacementType.EDGE);
            vertOrEdge = neigh.edge;
            ownedNeighEdge = neighEdgeEnts.find(tileOwnedAdjEdgePredicate);
            if (ownedNeighEdge) break;
            sharedOwnedNeighEdge = neigh.tile.sharedEdgeEntities.find(sharedTileOwnedAdjEdgePredicate)
            if (sharedOwnedNeighEdge) break;
        }

        if (ownedNeighEdge || sharedOwnedNeighEdge) return true;
    }

    return valid;
}

const zoomPanDur = 1750;
export const zoomInAndOut = async (scene: View, positions: Vector3[], holdTime = 1000, onComplete?: () => void) => {
    const zoomInAndHold = (position: Vector3, holdTime: number, onComplete?: () => void): Promise<void> => {
        console.log('zooming and holding to: ' + position.toArray().toString());
        return new Promise<void>(async res => {
            console.log('in promise')
            scene.panCameraTo(position, zoomPanDur, () => {
                console.log('zooming')
                scene.zoomToDistance(scene.controller.config.maxDistance / 2, zoomPanDur, undefined)
            }, () => {
                console.log('doneee')
                if (holdTime > 0) {
                    window.setTimeout(() => {
                        res();
                        if (onComplete) onComplete();
                    }, holdTime)
                } else {
                    res();

                    if (onComplete) onComplete;
                }
            });
        })
    }

    for (let i = 0; i < positions.length; i++) {
        await zoomInAndHold(positions[i], holdTime, () => {
            if (i === positions.length - 1) {
                console.log('reached end');
                scene.panCameraTo(new Vector3(0, 0, 0), zoomPanDur, () => {
                    scene.zoomMax(ZoomDirection.OUT, zoomPanDur, undefined, () => {

                    });
                }, () => {
                    console.log('on completeeee')
                    if (onComplete) onComplete();
                });
            }
        });
    }

    // scene.panCameraTo(position, zoomPanDur, () => {
    //     scene.zoomMax(ZoomDirection.IN, zoomPanDur, undefined, () => {
    //         window.setTimeout(() => {
    //             scene.panCameraTo(new Vector3(0, 0, 0), zoomPanDur, () => {
    //                 scene.zoomMax(ZoomDirection.OUT, zoomPanDur, undefined, () => {
    //                     if (onComplete) onComplete();
    //                 });
    //             });
    //         }, holdTime);
    //     });
    // });
}

let material;
// let circleSprite: Sprite;
// new TextureLoader().load(RedCircle, (map) => {
//     material = new SpriteMaterial({ map: map });
//     circleSprite = new Sprite(material);
// });


export const highlightClosestVertex = (scene: View, controller: Controller, tile: Tile, pos: Vector3) => {
    let v = controller.getClosestVertex(tile, pos);
    // scene.container.remove(circleSprite);
    // scene.container.add(circleSprite);
    // circleSprite.scale.set(10, 10, 10)
    // circleSprite.position.copy(tile.getEdgeWorldPosition(v)).setY(1);
    // circleSprite.rotation.x = 180 * Engine.DEG_TO_RAD;
    // circleSprite.rotation.y = 180 * Engine.DEG_TO_RAD;
    // circleSprite.rotation.z = 90 * Engine.DEG_TO_RAD;
    // circleSprite.userData['ignoreRay'] = true
}

export const hasPorts = (tile: Tile): boolean => {
    return tile.getCustomData()['ports'] !== undefined
}

export const isHighlightingPort = (tile: Tile, mousePos: Vector3, controller: Controller): boolean => {

    if (!hasPorts(tile)) return false;

    const highlightedVert = controller.getClosestVertex(tile, mousePos);

    const ports = tile.getCustomData()['ports'];
    const portVerts = Object.keys(ports).map(x => Number.parseInt(x));

    return portVerts.includes(highlightedVert);
}

export const getHighlightedPort = (tile: Tile, mousePos: Vector3, controller: Controller): number => {
    if (!isHighlightingPort(tile, mousePos, controller)) return -1;
    else return controller.getClosestVertex(tile, mousePos);
}

export const unHighlightVertex = (scene: View) => {
    // scene.container.remove(circleSprite);
}

const _placementTargetQuat = new Quaternion();
const _placementRotMat = new Matrix4();

export const drawPortLine = (scene: View, tile: Tile, startPos: Vector3, vert: number) => {
    const material = new LineBasicMaterial({ color: 0xffffff });

    const points = [];
    points.push(startPos.clone().addScalar(-3));
    points.push(tile.getVertexWorldPosition(vert));

    const geometry = new BufferGeometry().setFromPoints(points);

    const line = new Line(geometry, material);
    line.position.setY(2);

    scene.addMiscObject(line);
}

export const createShip = (scene: View, mousePos: Vector3, onComplete?: (sprite: SpriteEntity) => void) => {
    SpriteEntity.createSprite(Ship, (sprite) => {
        scene.addSpriteEntity(sprite);

        sprite.sprite.scale.set(10, 10, 10);
        sprite.sprite.position.copy(mousePos);
        sprite.sprite.position.setY(2);

        sprite.onHighlight = () => {
            sprite.sprite.scale.set(15, 15, 15);
        }

        sprite.onUnHighlight = () => {
            sprite.sprite.scale.set(10, 10, 10);
        }

        scene.saveScene();
        if (onComplete) onComplete(sprite);
    });


    // new TextureLoader().load(Ship, (map) => {
    //     material = new SpriteMaterial({ map: map });
    //     let shipSprite = new Sprite(material);
    //     scene.container.add(shipSprite);

    //     // const control = new TransformControls(scene.camera, scene.renderer.domElement);
    //     // control.addEventListener('change', scene.renderer.render(scene.container, scene.camera));

    //     // control.addEventListener('dragging-changed', function (event) {
    //     //     scene.controller.controls.enabled = !event.value;
    //     // });

    //     // control.attach(shipSprite);

    //     // scene.container.add(control);
    //     shipSprite.scale.set(10, 10, 10);
    //     shipSprite.position.copy(mousePos);
    //     shipSprite.position.setY(2);
    // });
}

export const getTileCustomData = (tile: Tile): TileCustomData => {
    const data = tile.getCustomData() as TileCustomData;

    return data;
}

export const getTilePortData = (tile: Tile, vertex: number = undefined): { [port: number]: TilePortData } | TilePortData | null => {
    if (!hasPorts(tile)) return null;

    const portData: { [port: number]: TilePortData } = tile.getCustomData()['ports'];

    if (vertex !== undefined && portData[vertex] !== undefined) {
        return portData[vertex];
    } else if (vertex !== undefined) {
        return null;
    } else {
        return portData;
    }
}

export interface TilePortData {
    type: string, from: number, to: number
}

export interface TileCustomData {
    resource?: Resources,
    diceValue: number,
    ports?: { [port: number]: TilePortData }
}

export const addWater = (tileShapeGeometry: BufferGeometry, containers: Tile[], map: Map, scene?: View): Mesh => {
    return Water(tileShapeGeometry, containers, map, scene);
}

export const addHills = async (containers: Tile[], validContainerPoints: Vector2[], scene: View) => {
    await Hills(containers, validContainerPoints, scene);
}

export const addMountains = async (containers: Tile[], validContainerPoints: Vector2[], scene: View) => {
    await Mountains(containers, validContainerPoints, scene)
}

export const addFarms = async (containers: Tile[], validContainerPoints: Vector2[], scene: View) => {
    await Wheat(containers, validContainerPoints, scene)
}

export const addClay = async (containers: Tile[], validContainerPoints: Vector2[], scene: View) => {
    await Clay(containers, validContainerPoints, scene)
}

export const addForest = async (containers: Tile[], validContainerPoints: Vector2[], scene: View) => {
    await Forest(containers, validContainerPoints, scene)
}

export const addDesert = async (containers: Tile[], validContainerPoints: Vector2[], scene: View) => {
    await Desert(containers, validContainerPoints, scene)
}

export const addPort = async (containers: Tile[], scene: View, toggleBubble: React.Dispatch<React.SetStateAction<{
    toggled: boolean;
    position: {
        x: number;
        y: number;
    };
    resourceType: Resources;
    amountNeeded: number;
}>>) => {
    await Port(containers, scene, toggleBubble);
}