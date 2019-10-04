import TM from '../tm';
import { Vector3, Shape, BufferGeometry, ShapeGeometry, Geometry, MeshPhongMaterial, ExtrudeGeometry, Object3D, Line } from 'three';
import { GridInterface } from './Grid';
import { GridSettings, ExtrudeSettings, TileSettings, GridJSONData, MapSettings } from '../utils/Interfaces';
import Cell from './Cell';
import Tile from './Tile';
/*
	Graph of squares. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	Interface:
	type
	size - number of cells (in radius); only used if the map is generated
	cellSize
	cells - a hash so we can have sparse maps
	numCells
	extrudeSettings
	autogenerated
	cellShape
	cellGeo
	cellShapeGeo

	@author Corey Birnbaum https://github.com/vonWolfehaus/
 */
export default class SqrGrid implements GridInterface {

  gridShape: string;
  gridSize: number;
  cellSize: number;
  cells: { [key: string]: Cell };
  numCells: number;
  extrudeSettings: ExtrudeSettings;
  cellShape: Shape;
  cellGeo: BufferGeometry;
  cellShapeGeo: ShapeGeometry;
  autogenerated: boolean;

  private _fullCellSize: number;
  private _hashDelimeter: string;
  private _directions: Cell[];
  private _diagonals: Cell[];
  private _list: Cell[];
  private _vec3: Vector3;
  private _cel: Cell;
  private _geoCache: Geometry[];
  private _matCache: MeshPhongMaterial[];

  constructor(config: GridSettings) {
    config = config || {};
    /*  ______________________________________________
      GRID INTERFACE:
    */
    this.gridShape = TM.SQR;
    this.gridSize = 5; // only used for generated maps
    this.cellSize = typeof config.cellSize === 'undefined' ? 10 : config.cellSize;
    this.cells = {};
    this.numCells = 0;

    this.extrudeSettings = null;
    this.autogenerated = false;

    // create base shape used for building geometry
    const verts = [];
    verts.push(new Vector3());
    verts.push(new Vector3(-this.cellSize, this.cellSize));
    verts.push(new Vector3(this.cellSize, this.cellSize));
    verts.push(new Vector3(this.cellSize, -this.cellSize));
    // copy the verts into a shape for the geometry to use
    this.cellShape = new Shape();
    this.cellShape.moveTo(-this.cellSize, -this.cellSize);
    this.cellShape.lineTo(-this.cellSize, this.cellSize);
    this.cellShape.lineTo(this.cellSize, this.cellSize);
    this.cellShape.lineTo(this.cellSize, -this.cellSize);
    this.cellShape.lineTo(-this.cellSize, -this.cellSize);

    this.cellGeo = new BufferGeometry();
    (this.cellGeo as any).vertices = verts;
    (this.cellGeo as any).verticesNeedUpdate = true;

    this.cellShapeGeo = new ShapeGeometry(this.cellShape);

    /*  ______________________________________________
      PRIVATE
    */

    this._fullCellSize = this.cellSize * 2;
    this._hashDelimeter = '.';
    // pre-computed permutations
    this._directions = [new TM.Cell(+1, 0, 0), new TM.Cell(0, -1, 0),
    new TM.Cell(-1, 0, 0), new TM.Cell(0, +1, 0)];
    this._diagonals = [new TM.Cell(-1, -1, 0), new TM.Cell(-1, +1, 0),
    new TM.Cell(+1, +1, 0), new TM.Cell(+1, -1, 0)];
    // cached objects
    this._list = [];
    this._vec3 = new Vector3();
    this._cel = new TM.Cell();
    this._geoCache = [];
    this._matCache = [];
    this.generateGrid(config);
  }
  /*
		________________________________________________________________________
		High-leves that the Board interfaces with (all grids implement)
	 */

  cellToPixel(cell: Cell): Vector3 {
    this._vec3.x = cell.q * this._fullCellSize;
    this._vec3.y = cell.h;
    this._vec3.z = cell.r * this._fullCellSize;
    return this._vec3;
  }

  pixelToCell(pos: Vector3): Cell {
    const q = Math.round(pos.x / this._fullCellSize);
    const r = Math.round(pos.z / this._fullCellSize);
    return this._cel.set(q, r, 0);
  }

  getCellAt(pos: Vector3): Cell {
    const q = Math.round(pos.x / this._fullCellSize);
    const r = Math.round(pos.z / this._fullCellSize);
    this._cel.set(q,0,r);
    return this.cells[this.cellToHash(this._cel)];
  }

  getNeighbors(cell: Cell, diagonal: boolean, filter: Function): Cell[] {
    // always returns an array
    let i, n;
    const l = this._directions.length;
    this._list.length = 0;
    for (i = 0; i < l; i++) {
      this._cel.copy(cell);
      this._cel.add(this._directions[i]);
      n = this.cells[this.cellToHash(this._cel)];
      if (!n || (filter && !filter(cell, n))) {
        continue;
      }
      this._list.push(n);
    }
    if (diagonal) {
      for (i = 0; i < l; i++) {
        this._cel.copy(cell);
        this._cel.add(this._diagonals[i]);
        n = this.cells[this.cellToHash(this._cel)];
        if (!n || (filter && !filter(cell, n))) {
          continue;
        }
        this._list.push(n);
      }
    }
    return this._list;
  }

  getRandomCell(): Cell {
    let c, i = 0;
    const x = TM.Tools.randomInt(0, this.numCells);
    for (c in this.cells) {
      if (i === x) {
        return this.cells[c];
      }
      i++;
    }
    return this.cells[c];
  }

  cellToHash(cell: Cell): string {
    return cell.q + this._hashDelimeter + cell.r; // s is not used in a square grid
  }

  distance(cellA: Cell, cellB: Cell): number {
    let d = Math.max(Math.abs(cellA.q - cellB.q), Math.abs(cellA.r - cellB.r));
    d += cellB.h - cellA.h; // include vertical size
    return d;
  }

  clearPath(): void {
    let i, c;
    for (i in this.cells) {
      c = this.cells[i];
      c._calcCost = 0;
      c._priority = 0;
      c._parent = null;
      c._visited = false;
    }
  }

  traverse(cb: Function): void {
    let i;
    for (i in this.cells) {
      cb(this.cells[i]);
    }
  }

  generateTile(cell: Cell, scale: number, material: MeshPhongMaterial): Tile {
    let height = Math.abs(cell.h);
    if (height < 1) height = 1;

    let geo = this._geoCache[height];
    if (!geo) {
      this.extrudeSettings.amount = height;
      geo = new ExtrudeGeometry(this.cellShape, this.extrudeSettings);
      this._geoCache[height] = geo;
    }

    /*mat = this._matCache[c.matConfig.mat_cache_id];
    if (!mat) { // MaterialLoader? we currently only support basic stuff though. maybe later
      mat.map = Loader.loadTexture(c.matConfig.imgURL);
      delete c.matConfig.imgURL;
      mat = new c.matConfig.type](c.matConfig);
      this._matCache[c.matConfig.mat_cache_id] = mat;
    }*/

    const t = new Tile({
      scale: scale,
      cell: cell,
      geometry: geo,
      material: material
    });

    cell.tile = t;

    return t;
  }

  generateTiles(config?: MapSettings): Tile[] {
    config = config || {};
    const tiles = [];
    let settings = {
      tileScale: 0.95,
      extrudeSettings: {
        amount: 1,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.5,
        bevelThickness: 0.5
      } as ExtrudeSettings
    } as MapSettings;
    if(config)
      settings = TM.Tools.merge(settings, config) as MapSettings;

    /*if (!settings.material) {
      settings.material = new MeshPhongMaterial({
        color: TM.Tools.randomizeRGB('30, 30, 30', 10)
      });
    }*/

    this.autogenerated = true;
    this.extrudeSettings = settings.extrudeSettings;

    let i, t, c;
    for (i in this.cells) {
      c = this.cells[i];
      t = this.generateTile(c, settings.tileScale, null);
      t.position.copy(this.cellToPixel(c));
      t.position.y = 0;
      tiles.push(t);
    }
    return tiles;
  }

  // create a flat, square-shaped grid
  generateGrid(config: GridSettings): void {
    config = config || {};
    this.gridSize = typeof config.gridSize === 'undefined' ? this.gridSize : config.gridSize;
    let x, y, c;
    const half = Math.ceil(this.gridSize / 2);
    for (x = -half; x < half; x++) {
      for (y = -half; y < half; y++) {
        c = new TM.Cell(x, y + 1);
        this.add(c);
      }
    }
  }

  generateOverlay(size: number, overlayObj: Object3D, overlayMat: MeshPhongMaterial): void {
    let x, y;
    const half = Math.ceil(size / 2);
    for (x = -half; x < half; x++) {
      for (y = -half; y < half; y++) {
        this._cel.set(x, y, undefined); // define the cell
        const line = new Line(this.cellGeo, overlayMat);
        line.position.copy(this.cellToPixel(this._cel));
        line.rotation.x = 90 * TM.DEG_TO_RAD;
        overlayObj.add(line);
      }
    }
  }

  add(cell: Cell): Cell {
    const h = this.cellToHash(cell);
    if (this.cells[h]) {
      // console.warn('A cell already exists there');
      return;
    }
    this.cells[h] = cell;
    this.numCells++;

    return cell;
  }

  remove(cell: Cell): void {
    const h = this.cellToHash(cell);
    if (this.cells[h]) {
      delete this.cells[h];
      this.numCells--;
    }
  }

  dispose(): void {
    this.cells = null;
    this.numCells = 0;
    this.cellShape = null;
    this.cellGeo.dispose();
    this.cellGeo = null;
    this.cellShapeGeo.dispose();
    this.cellShapeGeo = null;
    this._list = null;
    this._vec3 = null;
    this._geoCache = null;
    this._matCache = null;
  }

  /*
    Load a grid from a parsed json object.
    json = {
      extrudeSettings,
      size,
      cellSize,
      autogenerated,
      cells: [],
      materials: [
        {
          cache_id: 0,
          type: 'MeshLambertMaterial',
          color, ambient, emissive, reflectivity, refractionRatio, wrapAround,
          imgURL: url
        }
        {
          cacheId: 1, ...
        }
        ...
      ]
    }
  */
  load(url: string, callback: Function, scope: any): void {
    TM.Tools.getJSON({
      url: url,
      callback(json: GridJSONData) {
        this.fromJSON(json);
        callback.call(scope || null, json);
      },
      cache: false,
      scope: this
    });
  }

  fromJSON(json: GridJSONData): void {
    let i, c;
    const cells = json.cells;

    this.cells = {};
    this.numCells = 0;

    this.gridSize = json.size;
    this.cellSize = json.cellSize;
    this._fullCellSize = this.cellSize * 2;
    this.extrudeSettings = json.extrudeSettings;
    this.autogenerated = json.autogenerated;

    for (i = 0; i < cells.length; i++) {
      c = new TM.Cell();
      c.copy(cells[i]);
      this.add(c);
    }
  }

  toJSON(): GridJSONData {
    const json = {
      size: this.gridSize,
      cellSize: this.cellSize,
      extrudeSettings: this.extrudeSettings,
      autogenerated: this.autogenerated
    } as GridJSONData
    const cells = [];
    let c, k;

    for (k in this.cells) {
      c = this.cells[k];
      cells.push({
        q: c.q,
        r: c.r,
        s: c.s,
        h: c.h,
        walkable: c.walkable,
        userData: c.userData
      } as Cell);
    }
    json.cells = cells;

    return json;
  }
}