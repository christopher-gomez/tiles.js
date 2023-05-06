import Engine, { EngineGridShapes } from '../Engine';
import Tile from './Tile';
import { Object3D, Vector3, LineBasicMaterial, Vector2, Box3, Mesh, BoxGeometry, MeshPhongMaterial } from 'three';
import AStarFinder from '../pathing/AStarFinder';
import Cell from '../grid/Cell';
import { MapSettings, PathfinderSettings, heuristic, MapSettingsParams, PathfinderSettingsParams, GridJSONData, GridSettingsParams, GridSettings } from '../utils/Interfaces';
import Grid from '../grid/Grid';
import View from '../scene/View';
import Entity, { EntityPlacementType } from '../env/Entity';
import HexGrid from '../grid/HexGrid';
import SqrGrid from '../grid/SqrGrid';
import Tools from '../utils/Tools';
import EventEmitter from '../utils/EventEmitter';
import HexTile from './HexTile';
import SqrTile from './SqrTile';

export default class Map extends EventEmitter {

	public grid: Grid;
	public pathFinder: AStarFinder;
	public tiles: Tile[];
	public group: Object3D;
	public tileGroup: Object3D;
	public tileOverlay: Object3D;

	private _canHighlightTiles: boolean = true;
	private _highlightedTile: Tile;
	private _selectedTile: Tile;

	private _onTileSelected: (tile: Tile) => void

	get size(): number {
		return this.grid.gridRadius;
	}

	get boundingBox(): Box3 {
		return this._boundingBox;
	}

	set onTileSelected(callback: (tile: Tile) => void) {
		this._onTileSelected = callback
	}

	get selectedTile(): Tile {
		return this._selectedTile
	}

	get highlightedTile(): Tile {
		return this._highlightedTile;
	}

	unHighlightCurrentHighlightedTile() {
		if (this.highlightedTile) {
			this._highlightedTile.unhighlight();
			this._highlightedTile = null;
		}
	}

	hightlightTile(tile: Tile, unhighlightCurrentHighlightedTile: boolean = true, setHighlightColor = true) {
		if (!tile || !(tile instanceof Tile)) return;

		if (unhighlightCurrentHighlightedTile) this.unHighlightCurrentHighlightedTile();

		tile.highlight(setHighlightColor);
		this._highlightedTile = tile;
	}

	setTileHighlighted(tile: Tile, highlighted: boolean) {
		tile.setHighlighted(highlighted);
		if (highlighted) this._highlightedTile = tile;
		else this._highlightedTile = null;
	}

	unSelectCurrentSelectedTile() {
		if (this.selectedTile) {
			this.selectedTile.deselect();
			this._selectedTile = null;
		}
	}

	selectTile(tile: Tile) {
		if (!tile || !(tile instanceof Tile)) return;

		tile.select();
		this._selectedTile = tile;
	}

	setTileSelected(tile: Tile, selected: boolean) {
		tile.setSelected(selected);
		if (selected) this._selectedTile = tile;
		else this._selectedTile = null;
	}

	public get canHighlightTiles() {
		return this._canHighlightTiles;
	}

	public set canHighlightTiles(val) {
		if (!val && this._highlightedTile) this._highlightedTile.unhighlight();
		this._canHighlightTiles = val;
	}

	dispose(): void {
		this.grid.dispose();
		HexTile.dispose();
		SqrTile.dispose();
	}

	public settings: MapSettings = {
		tileScale: .925,
		// material: new MeshPhongMaterial(),
		// canHighlightTiles: true,
		entities: {
			'sphere': Tools.createSphereEntity,
			'cube': Tools.createCubeEntity,
			'rect': Tools.createRectEntity
		},
		onTileCreated: undefined
	}

	public entities: { [name: string]: () => Entity } = {};

	constructor(grid?: Grid | GridJSONData, mapConfig?: MapSettingsParams, finderConfig?: PathfinderSettingsParams) {
		if (!grid) throw new Error('You must pass in a grid system or load file for the map to use.');

		super();

		this.settings = Tools.merge(this.settings, mapConfig || {}) as MapSettings;
		this.entities = Tools.merge(this.entities, this.settings.entities);

		this.tiles = [] as Tile[];
		this.tileGroup = null; // only for tiles

		this.group = new Object3D(); // can hold all entities, also holds tileGroup, never trashed

		this.grid = null;
		this.tileOverlay = null;
		this.pathFinder = new Engine.AStarFinder(finderConfig);
		// need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
		Engine.Loader.init();

		this.setGrid(grid);
	}

	private _numEntities = 0;
	public get numEntities() {
		return this._numEntities;
	}

	setEntityOnTile(entity: Entity, tile: Tile, setPosition = false): boolean {
		let suc = tile.addEntity(entity);

		if (!suc) return false;

		entity.setTile(tile);

		if (setPosition) {
			if (entity.placementType === EntityPlacementType.CENTER) {
				// snap an entity's position to a tile; merely copies position
				const pos = this.grid.cellToPixel(tile.cell);
				entity.position.copy(pos);
			}
		}

		this._numEntities++;

		return true;
	}

	removeEntityFromTile(entity: Entity): boolean {
		if (entity.parentTile.removeEntity(entity)) {
			this._numEntities--;
			return true;
		}

		return false;
	}

	// addTile(tile: Tile): void {
	// 	const i = this.tiles.indexOf(tile);
	// 	if (i === -1) this.tiles.push(tile);
	// 	else return;

	// 	// this.snapTileToGrid(tile);
	// 	tile.position.y = 0;

	// 	this.tileGroup.add(tile.mesh);
	// 	this.grid.add(tile.cell);

	// 	tile.cell.tile = tile;
	// }

	updateTile(tile: Tile, newMesh: Mesh): void {
		// const i = this.tiles.indexOf(tile);
		// if (i !== -1) {
		// 	this.tiles.splice(i, 1);
		// }

		this.tileGroup.remove(tile.mesh);
		tile.mesh = newMesh;

		// if (i !== -1)
		this.tileGroup.add(newMesh);
	}

	removeTile(tile: Tile): void {
		if (!tile) return; // was already removed somewhere
		const i = this.tiles.indexOf(tile);
		this.grid.remove(tile.cell);

		if (i !== -1) this.tiles.splice(i, 1);
		// this.tileGroup.remove(tile.mesh);

		tile.dispose();
	}

	removeAllTiles(): void {
		if (!this.tileGroup) return;
		const tiles = this.tileGroup.children;
		for (let i = 0; i < tiles.length; i++) {
			this.tileGroup.remove(tiles[i]);
		}
	}

	getCellAtPosition(pos: Vector3): Cell {
		return this.grid.getCellAt(pos);
	}

	getTileAtPosition(pos: Vector3): Tile {
		if (!this.getCellAtPosition(pos)) return null;

		return this.getCellAtPosition(pos).tile;
	}

	getTileAtCell(cell: Cell): Tile {
		const h = this.grid.cellToHash(cell);
		return cell.tile || (typeof this.grid.cells[h] !== 'undefined' ? this.grid.cells[h].tile : null);
	}

	snapToGrid(pos: Vector3): void {
		const cell = this.grid.pixelToCell(pos);
		pos.copy(this.grid.cellToPixel(cell));
	}

	// snapTileToGrid(tile: Tile): Tile {
	// 	if (tile.cell) {
	// 		tile.position.copy(this.grid.cellToPixel(tile.cell));
	// 	}
	// 	else {
	// 		const cell = this.grid.pixelToCell(tile.position);
	// 		tile.position.copy(this.grid.cellToPixel(cell));
	// 	}

	// 	return tile;
	// }

	getRandomTile(): Tile {
		const i = Engine.Tools.randomInt(0, this.tiles.length - 1);
		return this.tiles[i];
	}

	findPath(startTile: Tile, endTile: Tile, filter?: heuristic): Cell[][] {
		return this.pathFinder.findPath(startTile.cell, endTile.cell, filter, this.grid);
	}

	setGrid(newGrid: Grid | GridJSONData): void {
		this.group.remove(this.tileGroup);

		if (!(newGrid instanceof Grid)) {
			let config = {
				gridShape: newGrid.gridShape,
				gridRadius: newGrid.gridRadius,
				cellRadius: newGrid.cellRadius,
				cellShape: newGrid.cellShape,
				isLoad: true,
				gridJSON: newGrid
			} as GridSettingsParams;

			newGrid = newGrid.gridShape === EngineGridShapes.FLAT_TOP_HEX || newGrid.gridShape === EngineGridShapes.POINT_TOP_HEX ? new HexGrid(config) : new SqrGrid(config);
		}

		if (this.grid && newGrid !== this.grid) {
			this.removeAllTiles();
			const self = this;
			this.tiles.forEach(function (t) {
				self.grid.remove(t.cell);
				t.dispose();
			});
			this.grid.dispose();
		}

		this.grid = newGrid as Grid;
		this.tiles = [];
		this.tileGroup = new Object3D();
		this.grid.generateGrid(this.grid.config);
		this.generateTiles(this.settings)
		this._boundingBox = new Box3().setFromObject(this.tileGroup);

		this.triggerEvent('created');
	}

	private _boundingBox: Box3;

	private overlayPlane: Mesh;
	generateOverlay(size: number): void {
		const mat = new LineBasicMaterial({
			color: 0x000000,
			opacity: 0.9
		});

		if (this.overlayPlane) this.group.remove(this.overlayPlane);

		this.overlayPlane = new Mesh(new BoxGeometry(size * size, size * size, 1), new MeshPhongMaterial({ color: this.view.settings.clearColor }));
		this.overlayPlane.userData['raycast'] = false;
		this.overlayPlane.position.y = -2;
		this.overlayPlane.rotation.x = -90 * Engine.DEG_TO_RAD;

		this.group.add(this.overlayPlane);

		if (this.tileOverlay) {
			this.group.remove(this.tileOverlay);
		}

		this.tileOverlay = new Object3D();

		this.grid.generateOverlay(size, this.tileOverlay, mat);

		this.group.add(this.tileOverlay);
	}

	private generateTiles(config?: MapSettingsParams, isLoad = false): void {
		if (config)
			this.settings = Engine.Tools.merge(this.settings, config) as MapSettings;

		const tiles = this.tiles = this.grid.generateTiles(this, this.settings);

		this.tileGroup = new Object3D();
		for (let i = 0; i < tiles.length; i++) {
			this.tileGroup.add(tiles[i].mesh);
		}

		this.group.add(this.tileGroup);
		if (this.grid.gridShape === Engine.GridShapes.FLAT_TOP_HEX)
			this.group.rotation.y = -90 * Engine.DEG_TO_RAD;
		// this.canHighlightTiles = settings.canHighlightTiles;
	}

	reset(): void {
		// removes all tiles from the scene, but leaves the grid intact
		this.removeAllTiles();
		if (this.tileGroup) this.group.remove(this.tileGroup);
		this.group = new Object3D();
	}

	private _view: View;
	public get view(): View {
		return this._view;
	}

	public setView(view: View) {
		this._view = view;
	}

	public toJSON(): string {
		let gridJsonData = this.grid.toJSON();

		return JSON.stringify(gridJsonData);
	}
}