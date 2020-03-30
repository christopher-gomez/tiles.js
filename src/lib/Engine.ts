import Cell from './grids/Cell';
//export { default as Cell } from './grids/Cell';
import Grid from './grids/Grid';
// export { default as Grid } from './grids/Grid';
import HexGrid from './grids/HexGrid';
//export { default as HexGrid } from './grids/HexGrid';
import SqrGrid from './grids/SqrGrid';
//export { default as SqrGrid } from './grids/SqrGrid';
import Tile from './grids/Tile';
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
import View from './map/View';
//export { default as Scene } from './utils/Scene';
import SelectionManager from './utils/SelectionManager';
//export { default as SelectionManager } from './utils/SelectionManager';
import Tools from './utils/Tools';
//export { default as Tools } from './utils/Tools';
import Map from './map/Map';
// export { default as map } from './map';


export const Engine = {
	VERSION: '1.0.0',

	PI: Math.PI,
	TAU: Math.PI * 2,
	DEG_TO_RAD: 0.0174532925,
	RAD_TO_DEG: 57.2957795,
	SQRT3: Math.sqrt(3), // used often in hex conversions

	Cell,
	Grid,
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

	HEX: 'hex',
	SQR: 'square',
	RCT: 'rectangle',
	ABS: 'abstract',
}

export default Engine;