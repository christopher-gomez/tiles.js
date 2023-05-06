import Cell from './grid/Cell';
//export { default as Cell } from './grids/Cell';
// export { default as Grid } from './grids/Grid';
import HexGrid from './grid/HexGrid';
//export { default as HexGrid } from './grids/HexGrid';
import SqrGrid from './grid/SqrGrid';
//export { default as SqrGrid } from './grids/SqrGrid';
import Tile from './map/Tile';
//export { default as Tile } from './grids/Tile';
import LinkedList from './lib/LinkedList';
//export { default as LinkedList } from './lib/LinkedList';
import Signal from './lib/Signal';
//export { default as Signal } from './lib/Signal';
import AStarFinder from './pathing/AStarFinder';
//export { default as AStarFinder } from './pathing/AStarFinder';
import PathUtil from './pathing/PathUtil';
//export { default as PathUtil } from './pathing/PathUtil';
import Loader from './utils/Loader';
//export { default as Loader } from './utils/Loader';
import MouseCaster from './utils/MouseCaster';
//export { default as MouseCaster } from './utils/MouseCaster';
import View from './scene/View';
//export { default as Scene } from './utils/Scene';
import SelectionManager from './utils/SelectionManager';
//export { default as SelectionManager } from './utils/SelectionManager';
import Tools from './utils/Tools';
//export { default as Tools } from './utils/Tools';
import Map from './map/Map';
// export { default as map } from './map';

export enum EngineGridShapes {
	FLAT_TOP_HEX,
	POINT_TOP_HEX,
	SQUARE,
	RECT,
	ABSTRACT
}

export enum EngineTileShapes {
	HEX,
	SQUARE
}

export const Engine = {
	VERSION: '1.0.0',

	PI: Math.PI,
	TAU: Math.PI * 2,
	DEG_TO_RAD: 0.0174532925,
	RAD_TO_DEG: 57.2957795,
	SQRT3: Math.sqrt(3), // used often in hex conversions

	Cell,
	HexGrid,
	SqrGrid,
	Tile,
	LinkedList,
	Signal,
	AStarFinder,
	PathUtil,
	Loader,
	MouseCaster,
	View,
	SelectionManager,
	Tools,
	Map,

	// useful enums for type checking. change to whatever fits your game. these are just examples
	TILE: 'tile', // visual representation of a grid cell
	ENT: 'entity', // dynamic things
	STR: 'structure', // static things

	GridShapes: EngineGridShapes,
	TileShapes: EngineTileShapes
}

export type EngineType = typeof Engine;
export type CellType = typeof Cell;
export type HexGridType = typeof HexGrid;
export type SqrGridType = typeof SqrGrid;
export type TileType = typeof Tile;
export type LinkedListType = typeof LinkedList;
export type SignalType = typeof Signal;
export type AStarFinderType = typeof AStarFinder;
export type PathUtilType = typeof PathUtil;
export type LoaderType = typeof Loader;
export type MouseCasterType = typeof MouseCaster;
export type ViewType = typeof View;
export type SelectionManagerType = typeof SelectionManager;
export type ToolsType= typeof Tools;
export type MapType = typeof Map;

export default Engine;