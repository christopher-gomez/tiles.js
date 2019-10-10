import Engine from '../Engine';
import Tile from '../grids/Tile';
import { GridInterface } from '../grids/Grid';
import { Object3D, Vector3, LineBasicMaterial } from 'three';
import AStarFinder from '../pathing/AStarFinder';
import Cell from '../grids/Cell';
import { MapSettings, PathfinderSettings, ExtrudeSettings, heuristic } from '../utils/Interfaces';

export default class Map {

  public grid: GridInterface;
  public pathFinder: AStarFinder;
  public tiles: Tile[];
  public group: Object3D;
  public tileGroup: Object3D;
  public tileOverlay: Object3D;

  dispose(): void {
    delete this.tiles;
    delete this.tileGroup;
    delete this.group;
    delete this.tileOverlay;
    delete this.pathFinder;
  }

  constructor(grid: GridInterface, mapConfig?: MapSettings, finderConfig?: PathfinderSettings) {
    if (!grid) throw new Error('You must pass in a grid system for the map to use.');

    this.tiles = [] as Tile[];
    this.tileGroup = null; // only for tiles

    this.group = new Object3D(); // can hold all entities, also holds tileGroup, never trashed

    this.grid = null;
    this.tileOverlay = null;
    this.pathFinder = new Engine.AStarFinder(finderConfig);
    // need to keep a resource cache around, so this Loader does that, use it instead of THREE.ImageUtils
    Engine.Loader.init();

    this.setGrid(grid);
    this.generateTiles(mapConfig)
  }
  setEntityOnTile(entity: any, tile: Tile): void {
    // snap an entity's position to a tile; merely copies position
    const pos = this.grid.cellToPixel(tile.cell);
    entity.position.copy(pos);
    // adjust for any offset after the entity was set directly onto the tile
    entity.position.y += entity.heightOffset || 0;
    // remove entity from old tile
    if (entity.tile) {
      entity.tile.entity = null;
    }
    // set new situation
    entity.tile = tile;
    tile.entity = entity;
  }

  addTile(tile: Tile): void {
    const i = this.tiles.indexOf(tile);
    if (i === -1) this.tiles.push(tile);
    else return;

    this.snapTileToGrid(tile);
    tile.position.y = 0;

    this.tileGroup.add(tile.mesh);
    this.grid.add(tile.cell);

    tile.cell.tile = tile;
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

  getTileAtCell(cell: Cell): Tile {
    const h = this.grid.cellToHash(cell);
    return cell.tile || (typeof this.grid.cells[h] !== 'undefined' ? this.grid.cells[h].tile : null);
  }

  snapToGrid(pos: Vector3): void {
    const cell = this.grid.pixelToCell(pos);
    pos.copy(this.grid.cellToPixel(cell));
  }

  snapTileToGrid(tile: Tile): Tile {
    if (tile.cell) {
      tile.position.copy(this.grid.cellToPixel(tile.cell));
    }
    else {
      const cell = this.grid.pixelToCell(tile.position);
      tile.position.copy(this.grid.cellToPixel(cell));
    }
    return tile;
  }

  getRandomTile(): Tile {
    const i = Engine.Tools.randomInt(0, this.tiles.length - 1);
    return this.tiles[i];
  }

  findPath(startTile: Tile, endTile: Tile, filter?: heuristic): Cell[][] {
    return this.pathFinder.findPath(startTile.cell, endTile.cell, filter, this.grid);
  }

  setGrid(newGrid: GridInterface): void {
    this.group.remove(this.tileGroup);
    if (this.grid && newGrid !== this.grid) {
      this.removeAllTiles();
      const self = this;
      this.tiles.forEach(function (t) {
        self.grid.remove(t.cell);
        t.dispose();
      });
      this.grid.dispose();
    }
    this.grid = newGrid;
    this.tiles = [];
    this.tileGroup = new Object3D();
    this.group.add(this.tileGroup);
    //this.group.rotateY(90 * Engine.DEG_TO_RAD);
  }

  generateOverlay(size: number): void {
    const mat = new LineBasicMaterial({
      color: 0x000000,
      opacity: 0.9
    });

    if (this.tileOverlay) {
      this.group.remove(this.tileOverlay);
    }

    this.tileOverlay = new Object3D();

    this.grid.generateOverlay(size, this.tileOverlay, mat);

    this.group.add(this.tileOverlay);
  }

  generateTiles(config?: MapSettings): void {
    let settings = {
      tileScale: .965,
      extrudeSettings: {
        amount: 10,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.5,
        bevelThickness: 0.5
      } as ExtrudeSettings
    } as MapSettings;
    if (config)
      settings = Engine.Tools.merge(settings, config) as MapSettings;

    this.reset();

    const tiles = this.tiles = this.grid.generateTiles(settings);

    this.tileGroup = new Object3D();
    for (let i = 0; i < tiles.length; i++) {
      this.tileGroup.add(tiles[i].mesh);
    }

    this.group.add(this.tileGroup);
  }

  reset(): void {
    // removes all tiles from the scene, but leaves the grid intact
    this.removeAllTiles();
    if (this.tileGroup) this.group.remove(this.tileGroup);
  }
}