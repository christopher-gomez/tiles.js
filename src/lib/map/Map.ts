import Engine, { EngineGridShapes, EngineTileShapes } from "../Engine";
import Tile from "./Tile";
import {
  Object3D,
  Vector3,
  LineBasicMaterial,
  Vector2,
  Box3,
  Mesh,
  BoxGeometry,
  PointLight,
  PointLightHelper,
  MeshPhongMaterial,
  BoxBufferGeometry,
  Frustum,
  Matrix4,
  ShaderMaterial,
  Vector4,
  Color,
} from "three";
import AStarFinder from "../pathing/AStarFinder";
import Cell from "../grid/Cell";
import {
  MapSettings,
  PathfinderSettings,
  heuristic,
  MapSettingsParams,
  PathfinderSettingsParams,
  GridJSONData,
  GridSettingsParams,
  GridSettings,
  MapJSONData,
} from "../utils/Interfaces";
import Grid from "../grid/Grid";
import View from "../scene/View";
import MeshEntity, { EntityPlacementType } from "../env/MeshEntity";
import HexGrid from "../grid/HexGrid";
import SqrGrid from "../grid/SqrGrid";
import Tools from "../utils/Tools";
import EventEmitter from "../utils/EventEmitter";
import HexTile from "./HexTile";
import SqrTile from "./SqrTile";
import MeshText from "../env/MeshText";
import HexCell from "../grid/HexCell";
import SqrCell from "../grid/SqrCell";

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

  private _onTileSelected: (tile: Tile) => void;

  get size(): number {
    return this.grid.gridRadius;
  }

  get boundingBox(): Box3 {
    return this._boundingBox;
  }

  set onTileSelected(callback: (tile: Tile) => void) {
    this._onTileSelected = callback;
  }

  get selectedTile(): Tile {
    return this._selectedTile;
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

  hightlightTile(
    tile: Tile,
    unhighlightCurrentHighlightedTile: boolean = true,
    setHighlightColor = true
  ) {
    if (!tile || !(tile instanceof Tile)) return;

    if (unhighlightCurrentHighlightedTile)
      this.unHighlightCurrentHighlightedTile();

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

  public get canInteract() {
    return this._canHighlightTiles;
  }

  public set canInteract(val) {
    if (!val && this._highlightedTile) this._highlightedTile.unhighlight();
    if (!val && this._selectedTile) this._selectedTile.deselect();

    if (!val) this.entitiesOnMap.forEach((e) => e.highlight(false));

    this._canHighlightTiles = val;
  }

  dispose(): void {
    this.grid.dispose();
    HexTile.dispose();
    SqrTile.dispose();
  }

  public settings: MapSettings = {
    // tileScale: .7,
    // material: new MeshPhongMaterial(),
    // canHighlightTiles: true,
    entities: {
      sphere: Tools.createSphereEntity,
      cube: Tools.createCubeEntity,
      rect: Tools.createRectEntity,
    },
    onTileCreated: undefined,
    overlayColor: Tools.randomizeRGB("0, 105, 148", 13),
    hasOverlay: false,
    overlayLineColor: 0x000000,
    overlayLineOpacity: 0.9,
  };

  public entities: { [name: string]: () => MeshEntity } = {};

  constructor(
    grid?: Grid | MapJSONData,
    mapConfig?: MapSettingsParams,
    finderConfig?: PathfinderSettingsParams,
    view?: View
  ) {
    if (!grid)
      throw new Error(
        "You must pass in a grid system or load file for the map to use."
      );

    super();

    this._init(grid, mapConfig, finderConfig, view);
  }

  private _init(
    grid?: Grid | MapJSONData,
    mapConfig?: MapSettingsParams,
    finderConfig?: PathfinderSettingsParams,
    view?: View
  ) {
    this._view = view;
    this.settings = Tools.merge(this.settings, mapConfig || {}) as MapSettings;
    if (!(grid instanceof Grid))
      this.settings = Tools.merge(this.settings, grid.settings) as MapSettings;

    this.entities = Tools.merge(this.entities, this.settings.entities);

    this.tiles = [] as Tile[];
    this.tileGroup = null; // only for tiles

    this.group = new Object3D(); // can hold all entities, also holds tileGroup, never trashed
    this.group.name = "Map Group";
    this.grid = null;
    this.tileOverlay = null;
    this.pathFinder = new Engine.AStarFinder(finderConfig);
    // need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
    Engine.Loader.init();

    this.setGrid(grid instanceof Grid ? grid : grid.gridData);
  }

  private _entitiesOnMap = new Array<MeshEntity>(0);
  public get entitiesOnMap() {
    return this._entitiesOnMap;
  }

  public get numEntities() {
    return this.entitiesOnMap.length;
  }

  setEntityOnTile(
    entity: MeshEntity,
    tile: Tile,
    setPosition = false,
    save = true
  ): boolean {
    const suc = tile.addEntity(entity);

    if (!suc) {
      return false;
    }

    entity.setTile(tile);
    entity.highlight(false);

    if (setPosition) {
      if (entity.placementType === EntityPlacementType.CENTER) {
        // snap an entity's position to a tile; merely copies position
        const pos = this.grid.cellToPixel(tile.cell);
        entity.position.copy(pos);
      } else if (entity.placementType === EntityPlacementType.VERTEX) {
        const pos = tile.getVertexLocalPosition(entity.placementVertex);
        entity.position.copy(pos);
      } else {
        const pos = tile.getEdgeLocalPosition(entity.placementEdge);
        entity.position.copy(pos);
      }
    }

    if (this.entitiesOnMap.findIndex((e) => e.id === entity.id) === -1) {
      this.entitiesOnMap.push(entity);
    }

    if (save) this._view?.saveScene();

    return true;
  }

  removeEntityFromTile(entity: MeshEntity, dispose = true): boolean {
    if (entity.parentTile.removeEntity(entity, dispose)) {
      const i = this.entitiesOnMap.findIndex((e) => e.id === entity.id);

      if (i !== -1) {
        this.entitiesOnMap.splice(i, 1);
      }

      this._view?.saveScene();
      return true;
    }

    return false;
  }

  public addTextMeshToTile(text: MeshText, tile: Tile) {
    tile.addTextMesh(text);
    this._view?.saveScene();
  }

  public removeTextMeshFromTile(tile: Tile) {
    tile.removeAllTextMesh();
    this._view?.saveScene();
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
    // let pos = new Vector3();
    // if (i !== -1) {
    // 	pos = this.tiles[i].position.clone();
    // }

    this.tileGroup.remove(tile.mesh);
    tile.mesh = newMesh;

    // if (i !== -1)
    this.tileGroup.add(newMesh);
    // tile.position.copy(pos);
    this._view?.saveScene();
  }

  removeTile(tile: Tile): void {
    if (!tile) return; // was already removed somewhere
    const i = this.tiles.indexOf(tile);
    this.grid.remove(tile.cell);

    if (i !== -1) this.tiles.splice(i, 1);
    // this.tileGroup.remove(tile.mesh);

    tile.dispose();
    this._view?.saveScene();
  }

  removeAllTiles(): void {
    if (!this.tileGroup) return;
    const tiles = this.tileGroup.children;
    for (let i = 0; i < tiles.length; i++) {
      this.tileGroup.remove(tiles[i]);
    }
    this._view?.saveScene();
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
    return (
      cell.tile ||
      (typeof this.grid.cells[h] !== "undefined"
        ? this.grid.cells[h].tile
        : null)
    );
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

  addTileToGrid(cellPos: Vector3): void {
    if (!this.getTileAtPosition(cellPos)) {
      const tile = this.grid?.createCell(cellPos, true) as Tile;
      this.tileGroup.add(tile.mesh);
      this.tiles.push(tile);
    }
  }

  getRandomTile(): Tile {
    const i = Engine.Tools.randomInt(0, this.tiles.length - 1);
    return this.tiles[i];
  }

  findPath(startTile: Tile, endTile: Tile, filter?: heuristic): Cell[][] {
    return this.pathFinder.findPath(
      startTile.cell,
      endTile.cell,
      filter,
      this.grid
    );
  }

  setGrid(newGrid: Grid | GridJSONData, createMap = false): void {
    HexGrid.dispose();
    SqrGrid.dispose();
    HexTile.dispose();
    SqrTile.dispose();
    Tile.dispose();

    if (!(newGrid instanceof Grid)) {
      let config = {
        gridShape: newGrid.gridShape,
        gridRadius: newGrid.gridRadius,
        cellRadius: newGrid.cellRadius,
        cellShape: newGrid.cellShape,
        isLoad: true,
        gridJSON: newGrid,
      } as GridSettingsParams;

      newGrid =
        newGrid.cellShape === EngineTileShapes.HEX
          ? new HexGrid(config)
          : new SqrGrid(config);
    }

    this.grid = newGrid as Grid;
    this.grid.generateGrid(this.grid.config);

    if (createMap) this.createMap();
  }

  public createMap() {
    let generateOverlay = this.settings.hasOverlay;

    if (this.tileGroup) {
      this.removeAllTiles();
      this.group.remove(this.tileGroup);
    }

    this.tiles = [];
    this.tileGroup = new Object3D();
    this.tileGroup.name = "Tile Group";
    this.generateTiles(this.settings);

    this._boundingBox = new Box3().setFromObject(this.tileGroup);

    this.setOverlayActive(generateOverlay);

    this._view?.saveScene();
    this.triggerEvent("mapCreated");
  }

  private _boundingBox: Box3;

  public get overlayPlane() {
    return this._overlayPlane;
  }

  private _overlayPlane: Mesh;

  setOverlaySettings({
    overlayColor,
    lineColor,
    lineOpacity,
  }: {
    overlayColor?: string | number;
    lineColor?: string | number;
    lineOpacity?: number;
  }) {
    if (overlayColor !== undefined) this.settings.overlayColor = overlayColor;
    if (lineColor !== undefined) this.settings.overlayLineColor = lineColor;
    if (lineOpacity !== undefined)
      this.settings.overlayLineOpacity = lineOpacity;

    this.setOverlayActive(this.settings.hasOverlay, false);
  }

  public nonInteractableTiles: Tile[] = [];
  setOverlayActive(active: boolean, save = true): void {
    this.settings.hasOverlay = active;

    if (!active) {
      this.group?.remove(this._overlayPlane);
      this.group?.remove(this.tileOverlay);
      this.nonInteractableTiles?.forEach((x) => this.group.remove(x.mesh));

      if (save) this._view?.saveScene();

      return;
    }

    if (this._overlayPlane) this.group?.remove(this._overlayPlane);

    this._overlayPlane = new Mesh(
      new BoxBufferGeometry(this.size * 100, this.size * 100, 1),
      new MeshPhongMaterial({ color: this.settings.overlayColor })
    );
    this._overlayPlane.userData["raycast"] = false;
    this._overlayPlane.userData["ignoreRay"] = true;
    this._overlayPlane.rotation.x = -90 * Engine.DEG_TO_RAD;
    this._overlayPlane.geometry.computeBoundingBox();
    this._overlayPlane.position.setY(
      this.tiles[0].geometry.boundingBox.min.z -
        (this._overlayPlane.geometry.boundingBox.max.z -
          this._overlayPlane.geometry.boundingBox.min.z) -
        1
    );
    // this.overlayPlane.rotation.z = -90 * Engine.DEG_TO_RAD;

    this.group?.add(this._overlayPlane);

    if (this.tileOverlay) {
      this.group?.remove(this.tileOverlay);
    }

    this.tileOverlay = new Object3D();

    const mat = new LineBasicMaterial({
      color: this.settings.overlayLineColor,
      opacity: this.settings.overlayLineOpacity,
      linewidth: 100,
    });

    this.grid.generateOverlay(this.size + 7, this.tileOverlay, mat);
    this.group.add(this.tileOverlay);
    this.tileOverlay.position.setY(
      this.tiles[0].geometry.boundingBox.min.z + 1
    );

    this.nonInteractableTiles = this.grid.generateNonPlayableTiles(
      this.size + 7
    );
    this.nonInteractableTiles.forEach((x, y) => {
      x.mesh.userData["raycast"] = false;
      x.setCustomData({ raycast: false, ignoreRay: true });
      this.group.add(x.mesh);
      x.mesh.position.setY(this.tiles[0].geometry.boundingBox.min.z + 0.5);
    });

    // console.log(this.nonInteractableTiles.length);

    if (save) this._view?.saveScene();
  }

  private createFog() {
    const edgeFogShader = {
      uniforms: {
        mapBounds: { value: new Vector4(-50, 50, -50, 50) }, // Assuming a 100x100 map from -50 to 50 on X and Z
        fogColor: { type: "c", value: new Color(0x000000) }, // Black fog color
        fogIntensity: { type: "f", value: 1.0 }, // Full intensity
      },
      vertexShader: `
				varying vec3 vWorldPosition;
				void main() {
					vec4 worldPosition = modelMatrix * vec4(position, 1.0);
					vWorldPosition = worldPosition.xyz;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
      fragmentShader: `
				uniform vec4 mapBounds;
				uniform vec3 fogColor;
				uniform float fogIntensity;
				varying vec3 vWorldPosition;
				void main() {
					float edgeDistance = min(
						min(vWorldPosition.x - mapBounds.x, mapBounds.y - vWorldPosition.x),
						min(vWorldPosition.z - mapBounds.z, mapBounds.w - vWorldPosition.z)
					);
					float fogFactor = smoothstep(0.0, fogIntensity, -edgeDistance);
					vec3 color = mix(gl_FragColor.rgb, fogColor, fogFactor);
					gl_FragColor = vec4(color, gl_FragColor.a);
				}
			`,
    };

    return new ShaderMaterial(edgeFogShader);
  }

  private generateTiles(config?: MapSettingsParams): void {
    if (config)
      this.settings = Engine.Tools.merge(this.settings, config) as MapSettings;

    const tiles = (this.tiles = this.grid.generateTiles(this, (tile, i) => {
      if (this.settings.onTileCreated) this.settings.onTileCreated(tile, i);
    }));

    if (this.grid.config.gridJSON) {
      for (const i in this.grid.cells) {
        const cell = this.grid.cells[i];
        const tile = cell.tile;
        if (tile && i in this.grid.config.gridJSON.cells) {
          tile.removeAllEntities();
          tile.setEntitiesFromJSON(this.grid.config.gridJSON.cells[i].tileData);
        }
      }
    }

    this.tileGroup = new Object3D();
    this.tileGroup.name = "Tile Group";
    for (let i = 0; i < tiles.length; i++) {
      this.tileGroup.add(tiles[i].mesh);
    }

    this.group.add(this.tileGroup);
    if (this.grid.gridShape === Engine.GridShapes.FLAT_TOP_HEX)
      this.group.rotation.y = -90 * Engine.DEG_TO_RAD;
    else this.group.rotation.y = 0;

    this.group.updateMatrixWorld();
    for (const tile of this.tiles) {
      tile.mesh.frustumCulled = true;
    }

    for (const tile of this.nonInteractableTiles) {
      tile.mesh.frustumCulled = true;
    }
  }

  private _frustumCullUpdate;

  reset(): void {
    // removes all tiles from the scene, but leaves the grid intact
    this.removeAllTiles();
    if (this._overlayPlane) this.group.remove(this._overlayPlane);
    if (this.tileOverlay) this.group.remove(this.tileOverlay);
    if (this.tileGroup) this.group.remove(this.tileGroup);
    this.group = new Object3D();
    this.group.name = "Map Group";
  }

  private _view: View;
  public get view(): View {
    return this._view;
  }

  public setView(view: View) {
    this._view = view;
  }

  public toJSON(): MapJSONData {
    const data: MapJSONData = {
      gridData: this.grid.toJSON(),
      settings: this.settings,
    };

    return data;
  }

  public fromJSON(data: MapJSONData) {
    this.reset();
    this.dispose();
    this._init(data);
  }
}
