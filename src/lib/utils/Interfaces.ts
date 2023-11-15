import { Geometry, MeshPhongMaterial, Fog, Light, Vector3, Material, Vector2, BufferGeometry, ShapeBufferGeometry, Mesh, ExtrudeGeometryOptions, Scene } from 'three';
import Cell from '../grid/Cell';
import Tile, { } from '../map/Tile';
import Grid from '../grid/Grid';
import { EngineGridShapes, EngineTileShapes } from '../Engine';
import MeshEntity, { EntityPlacementType } from '../env/MeshEntity';
import MeshText, { MeshTextSettings } from '../env/MeshText';
import { SpriteEntityJSONData } from '../env/SpriteEntity';

// Should return TRUE/FALSE
export type heuristic = (origin: Cell, next: Cell) => boolean;

/* CONFIG OBJECT INTERFACES */

export interface TileType {
  name: string,
  color: string,
  scale: number,
  geomOpts: ExtrudeGeometryOptions,
  customData?: { [key: string]: any }
}
// export interface TileSettings {
//   // cell: Cell;
//   // geometry: BufferGeometry;
//   // vertexGeometry: ShapeBufferGeometry,
//   type: TileType;
//   // tileShape: EngineTileShapes;
//   // grid: Grid;
// };

// export interface TileSettingsParams {
//   // cell: Cell;
//   // geometry: BufferGeometry;
//   // vertexGeometry: ShapeBufferGeometry,
//   // material?: Material;
//   // scale?: number;
//   type?: TileType;
//   // tileShape: EngineTileShapes;
//   // grid: Grid;
//   // terrainType?: TileTerrain;
// };

export interface GridSettings {
  gridShape: EngineGridShapes;
  gridRadius: number;
  cellRadius: number;
  cellShape: EngineTileShapes;
  isLoad: boolean;
  gridJSON?: GridJSONData
};

export interface GridSettingsParams {
  gridShape?: EngineGridShapes;
  gridRadius?: number;
  cellRadius?: number;
  cellShape?: EngineTileShapes;
  isLoad?: boolean;
  gridJSON?: GridJSONData;
};

export interface EntityJSONData {
  entityName: string;
  heightOffset: number;
  placementType: EntityPlacementType;
  placementVert: number;
  placementEdge: number;
  position: number[];
  customData: { [key: string]: any };
  geometryJSON: any;
  materialJSON: any | any[];
  baseColor: number;
  highlightColor: number;
}

export interface MeshTextJSONData {
  settings: MeshTextSettings,
  text: string;
  groupScale: number[]
}

export interface TileJSONData {
  // terrainInfo: { type: TileTerrain, elevation: number, moisture: number }
  type: TileType;
  text?: MeshTextJSONData | MeshTextJSONData[];
  entities?: EntityJSONData[];
  customData?: { [name: string]: any }
}

export interface CellJSONData {
  q: number;
  r: number;
  s: number;
  h: number;
  walkable: boolean,
  userData: {}
  tileData?: TileJSONData
}

export interface MapJSONData {
  gridData: GridJSONData;
  settings: MapSettings;
}
export interface GridJSONData {
  gridShape: EngineGridShapes;
  gridRadius: number;
  cellRadius: number;
  cellShape: EngineTileShapes;
  cells: { [key: string]: CellJSONData };
}

export interface MapSettings {
  // tileScale: number;
  entities: { [name: string]: () => Mesh }
  onTileCreated?: (tile: Tile, index: number) => void;
  overlayColor: number | string;
  hasOverlay: boolean;
  overlayLineColor: number | string;
  overlayLineOpacity: number;
}

export interface MapSettingsParams {
  // tileScale?: number;
  entities?: { [name: string]: () => Mesh }
  onTileCreated?: (tile: Tile, index: number) => void;
  overlayColor?: number | string;
  hasOverlay?: boolean;
  overlayLineColor?: number | string;
  overlayLineOpacity?: number;
}

// export interface ExtrudeSettings {
//   amount: number;
//   bevelEnabled: boolean;
//   bevelSegments: number;
//   steps: number;
//   bevelSize: number;
//   bevelThickness: number;
// };

// export interface ExtrudeSettingsParams {
//   amount?: number;
//   bevelEnabled?: boolean;
//   bevelSegments?: number;
//   steps?: number;
//   bevelSize?: number;
//   bevelThickness?: number;
// };

export interface PathfinderSettings {
  allowDiagonal: boolean;
  heuristicFilter: heuristic;
}

export interface PathfinderSettingsParams {
  allowDiagonal?: boolean;
  heuristicFilter?: heuristic;
}

export interface ViewSettings {
  sceneName: string;
  scene: Scene;
  element: HTMLElement;
  alpha: boolean;
  antialias: boolean;
  clearColor: number;
  sortObjects: boolean;
  sceneMarginSize: number;
  cameraPosition: Vector3;
  cameraFov: number;
  cameraNear: number;
  cameraFar: number;
  entities: { [name: string]: () => Mesh }
}
export interface ViewSettingsParams {
  sceneName?: string;
  scene?: Scene;
  element?: HTMLElement;
  alpha?: boolean;
  antialias?: boolean;
  clearColor?: number;
  sortObjects?: boolean;
  cameraPosition?: Vector3 | number[];
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  sceneMarginSize?: number;
  entities?: { [name: string]: () => Mesh }
}

export interface ControllerSettings {
  target: Vector3 | number[];
  controlled: boolean;
  currentDistance: number;
  minDistance: number;
  maxDistance: number;
  zoomDelta: number;
  autoRotate: boolean;
  currentPolarAngle: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  currentAzimuthAngle: number;
  maxAzimuthAngle: number;
  minAzimuthAngle: number;
  rotationDamping: boolean;
  userHorizontalRotation: boolean;
  userVerticalRotation: boolean;
  documentRaycast: boolean;
}

export interface SceneJSONData {
  viewData: ViewSettingsParams;
  controllerData: ControllerSettings;
  mapData: MapJSONData;
  sprites?: SpriteEntityJSONData[]
  miscObjs?: { geometryJSON: any, materialJSON: any, type: 'Mesh' | 'Line' }[]
}

export interface ControllerSettingsParams {
  target?: Vector3 | number[];
  controlled?: boolean;
  currentDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  zoomDelta?: number;
  autoRotate?: boolean;
  currentPolarAngle?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  currentAzimuthAngle?: number;
  maxAzimuthAngle?: number;
  minAzimuthAngle?: number;
  rotationDamping?: boolean;
  userHorizontalRotation?: boolean;
  userVerticalRotation?: boolean;
  documentRaycast?: boolean;
}

/*******************************************/

/*MAP INTERFACES*/
export interface ViewController {
  updateControlSettings(config: ControllerSettings): void;
  toggleControls(): void;
  // panInDirection(direction: Vector2): void;
  panCameraTo(tile: Tile | Cell, durationMs: number, onStart: () => void, onComplete: () => void): void;
}