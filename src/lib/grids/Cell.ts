import TM from '../tm';
import Tile from './Tile';

// Coordinate data for a cell
export default class Cell {

  public q: number;
  public r: number;
  public s: number;
  public h: number;
  public tile: Tile;
  public userData: {};
  public walkable: boolean;

  public _calcCost: number;
  public _priority: number;
  public _visited: boolean;
  public _parent: Cell;
  public uniqueID: string;
  
  constructor(q?: number, r?: number, s?: number, h?: number) {
    this.q = q || 0; // x grid coordinate (using different letters so that it won't be confused with pixel/world coordinates)
    this.r = r || 0; // y grid coordinate
    this.s = s || 0; // z grid coordinate
    this.h = h || 1; // 3D height of the cell, used by visual representation and pathfinder, cannot be less than 1
    this.tile = null; // optional link to the visual representation's class instance
    this.userData = {}; // populate with any extra data needed in your game
    this.walkable = true; // if true, pathfinder will use as a through node

    // rest of these are used by the pathfinder and overwritten at runtime, so don't touch
    this._calcCost = 0;
    this._priority = 0;
    this._visited = false;
    this._parent = null;
    this.uniqueID = TM.LinkedList.generateID();
  }
  
  set(q: number, r: number, s: number): Cell {
    this.q = q;
    this.r = r;
    this.s = s;
    return this;
  }

  copy(cell: Cell): Cell {
    this.q = cell.q;
    this.r = cell.r;
    this.s = cell.s;
    this.h = cell.h;
    this.tile = cell.tile || null;
    this.userData = cell.userData || {};
    this.walkable = cell.walkable;
    return this;
  }

  add(cell: Cell): Cell {
    this.q += cell.q;
    this.r += cell.r;
    this.s += cell.s;
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
}