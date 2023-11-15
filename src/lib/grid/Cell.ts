import { BufferGeometry, ExtrudeBufferGeometry, ExtrudeGeometryOptions, Material, Shape, ShapeBufferGeometry, Vector3 } from 'three';
import Engine, { EngineTileShapes } from '../Engine';
import Tile from '../map/Tile';
import Grid from './Grid';
import { CellJSONData, TileJSONData, TileType } from '../utils/Interfaces';
import HexCell from './HexCell';
import SqrCell from './SqrCell';
// import { ExtrudeSettings } from '../utils/Interfaces';

export enum CellNeighborDirections {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
  NORTH_EAST = 'NORTH_EAST',
  NORTH_WEST = 'NORTH_WEST',
  SOUTH_EAST = 'SOUTH_EAST',
  SOUTH_WEST = 'SOUTH_WEST'
}

// Coordinate data for a cell
export default abstract class Cell {

  private _q: number;
  private _r: number;
  private _s: number;

  public get q(): number {
    return this._q;
  }

  public get r(): number {
    return this._r;
  }

  public get s(): number {
    return this._s;
  }

  public get h(): number {
    // if(this.tile) return this.tile.terrainInfo.elevation;
    // else 
    return 1;
  }

  public tile: Tile;
  public userData: {};
  public walkable: boolean;

  public _calcCost: number;
  public _priority: number;
  public _visited: boolean;
  public _parent: Cell;
  public uniqueID: string;

  protected static _directions: Cell[];
  public abstract get directions(): Cell[];

  public static get directions() {
    return this._directions;
  }

  protected static _diagonals: Cell[];
  public abstract get diagonals(): Cell[];

  public static get diagonals() {
    return this._diagonals;
  }

  protected static _neighborDirToGridDir: { [key: string]: Vector3 };
  public static get neighborDirToGridDir() {
    return this._neighborDirToGridDir;
  }


  private static _radius;
  public static get radius() {
    return Cell._radius;
  }

  public abstract get neighborDirToGridDir(): { [key: string]: Vector3 };


  protected _cellWidth: number;
  protected _cellLength: number;
  protected _cellPerimeter: number;

  public readonly radius: number;

  public get width() {
    return this._cellWidth;
  }

  public get length() {
    return this._cellLength;
  }

  public get perimeter() {
    return this._cellPerimeter;
  }

  private _vec: Vector3 = new Vector3();
  public get gridPosition(): Vector3 {
    return this._vec.set(this.q, this.r, this.s);
  }

  public get pixelPosition(): Vector3 {
    if (!this.grid) return this._vec.set(0, 0, 0);
    else return this.grid.cellToPixel(this);
  }

  public abstract get shape(): EngineTileShapes;

  constructor(radius: number, q?: number, r?: number, s?: number, h?: number, public grid?: Grid) {
    this._q = q || 0; // x grid coordinate (using different letters so that it won't be confused with pixel/world coordinates)
    this._r = r || 0; // y grid coordinate
    this._s = s || 0; // z grid coordinate

    this.tile = null; // optional link to the visual representation's class instance
    this.userData = {}; // populate with any extra data needed in your game
    this.walkable = true; // if true, pathfinder will use as a through node

    this.radius = radius;
    Cell._radius = radius;

    // rest of these are used by the pathfinder and overwritten at runtime, so don't touch
    this._calcCost = 0;
    this._priority = 0;
    this._visited = false;
    this._parent = null;
    this.uniqueID = Engine.LinkedList.generateID();
    // this._geoCache = [];
    // this._matCache = [];
    this._setCellWidthLengthAndFullSize();
  }

  set(q: number, r: number, s: number): Cell {
    this._q = q;
    this._r = r;
    this._s = s;
    return this;
  }

  copy(cell: Cell): Cell {
    this._q = cell.q;
    this._r = cell.r;
    this._s = cell.s;
    this.tile = cell.tile || null;
    this.userData = cell.userData || {};
    this.walkable = cell.walkable;
    return this;
  }

  add(cell: Cell): Cell {
    this._q += cell.q;
    this._r += cell.r;
    this._s += cell.s;
    return this;
  }

  equals(cell: Cell): boolean {
    return this.q === cell.q && this.r === cell.r && this.s === cell.s;
  }

  resetPath(): void {
    this._calcCost = 0;
    this._priority = 0;
    this._parent = null;
    this._visited = false;
  }

  public createTile(data?: TileType | TileJSONData, isPlayable = true): Tile {
    if (!this.directions)
      this._setCellDirections();

    const tile = this._createTile(data, isPlayable);

    // if (data) tile.fromJSON(data);

    return tile;
  }

  protected abstract _createTile(data?: TileType | TileJSONData, isPlayable?: boolean): Tile;

  protected abstract _setCellDirections();

  protected abstract _setCellWidthLengthAndFullSize();

  toJSON(): CellJSONData {
    let data = {
      q: this.q,
      r: this.r,
      s: this.s,
      h: this.h,
      userData: this.userData,
      walkable: this.walkable
    } as CellJSONData

    if (this.tile) {
      data.tileData = this.tile.toJSON();
    }

    return data;
  }

  public toString() {
    return '(' + this.q + ',' + this.r + ',' + this.s + ')';
  }

  public static dispose() {
    this._directions = null;
    this._diagonals = null;
    this._neighborDirToGridDir = null;
    this._radius = null;
  }
}