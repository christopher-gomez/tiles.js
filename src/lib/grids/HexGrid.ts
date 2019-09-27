import TM from '../tm';
import {
  Shape,
  BufferGeometry,
  ShapeGeometry,
  Vector3,
  Geometry,
  MeshPhongMaterial,
  ExtrudeGeometry,
  Object3D,
  Material,
  Line,
} from 'three';
import { GridInterface } from './Grid';
import { GridSettings, ExtrudeSettings, TilemapSettings, GridJSONData } from '../utils/Interfaces';
import Cell from './Cell';
import Tile from './Tile';

/*
	Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
	[Cube/axial coordinate system](http://www.redblobgames.com/grids/hexagons/), "flat top" version only. Since this is 3D, just rotate your camera for pointy top maps.
 */
// 'utils/Loader', 'graphs/Hex', 'utils/Tools'
export default class HexGrid implements GridInterface {

  // Interface
  public type: string;
  public size: number;
  public cellSize: number;

  
  public cells: { [key: string]: Cell };
  public numCells: number;
  public autogenerated: boolean;
  public extrudeSettings: ExtrudeSettings;

  // Hex Specific
  public cellShape: Shape;
  public cellGeo: BufferGeometry;
  public cellShapeGeo: ShapeGeometry;
  public _cellWidth: number;
  public _cellLength: number;
  
  // Internals
  private _hashDelimeter: string;
  private _directions: Cell[];
  private _diagonals: Cell[];
  private _list: Cell[];
  private  _vec3: Vector3;
  private _cel: Cell;
  private _geoCache: Geometry[];
  private _matCache: MeshPhongMaterial[];

  public static get TWO_THIRDS(): number { return 2 / 3};

  constructor(config?: GridSettings) {
    config = config || {} as GridSettings;

    this.type = TM.HEX;
    this.size = typeof config.cellSize === 'undefined' ? 10 : config.gridSize;;
    this.cellSize = typeof config.cellSize === 'undefined' ? 10 : config.cellSize;
    this.cells = {};
    this.numCells = 0;

    this.extrudeSettings = null;
    this.autogenerated = false;

    // create base shape used for building geometry
    let i;
    const verts = [];
    // create the skeleton of the hex
    for (i = 0; i < 6; i++) {
      verts.push(this._createVertex(i));
    }
    // copy the verts into a shape for the geometry to use
    this.cellShape = new Shape();
    this.cellShape.moveTo(verts[0].x, verts[0].y);
    for (i = 1; i < 6; i++) {
      this.cellShape.lineTo(verts[i].x, verts[i].y);
    }
    this.cellShape.lineTo(verts[0].x, verts[0].y);
    this.cellShape.autoClose = true;

    this.cellGeo = new BufferGeometry();
    (this.cellGeo as any).vertices = verts;
    (this.cellGeo as any).verticesNeedUpdate = true;

    this.cellShapeGeo = new ShapeGeometry(this.cellShape);

    /*  ______________________________________________
      PRIVATE
    */

    this._cellWidth = this.cellSize * 2;
    this._cellLength = (TM.SQRT3 * 0.5) * this._cellWidth;
    this._hashDelimeter = '.';
    // pre-computed permutations
    this._directions = [new Cell(+1, -1, 0), new Cell(+1, 0, -1), new Cell(0, +1, -1),
    new Cell(-1, +1, 0), new Cell(-1, 0, +1), new Cell(0, -1, +1)];
    this._diagonals = [new Cell(+2, -1, -1), new Cell(+1, +1, -2), new Cell(-1, +2, -1),
    new Cell(-2, +1, +1), new Cell(-1, -1, +2), new Cell(+1, -2, +1)];
    // cached objects
    this._list = [];
    this._vec3 = new Vector3();
    this._cel = new Cell();
    this._geoCache = [];
    this._matCache = [];
    this.generateGrid(config);
  }
  /*  ________________________________________________________________________
		High-level functions that the Board interfaces with (all grids implement)
	 */

  // grid cell (Hex in cube coordinate space) to position in pixels/world
  cellToPixel(cell: Cell): Vector3 {
    this._vec3.x = cell.q * this._cellWidth * 0.75;
    this._vec3.y = cell.h;
    this._vec3.z = -((cell.s - cell.r) * this._cellLength * 0.5);
    return this._vec3;
  }

  pixelToCell(pos: Vector3): Cell {
    // convert a position in world space ("pixels") to cell coordinates
    const q = pos.x * (HexGrid.TWO_THIRDS / this.cellSize);
    const r = ((-pos.x / 3) + (TM.SQRT3 / 3) * pos.z) / this.cellSize;
    this._cel.set(q, r, -q - r);
    return this._cubeRound(this._cel);
  }

  getCellAt(pos: Vector3): Cell {
    // get the Cell (if any) at the passed world position
    const q = pos.x * (HexGrid.TWO_THIRDS / this.cellSize);
    const r = ((-pos.x / 3) + (TM.SQRT3 / 3) * pos.z) / this.cellSize;
    this._cel.set(q, r, -q - r);
    this._cubeRound(this._cel);
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
    let c;
    let i = 0;
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
    return cell.q + this._hashDelimeter + cell.r + this._hashDelimeter + cell.s;
  }

  distance(cellA: Cell, cellB: Cell): number {
    let d = Math.max(Math.abs(cellA.q - cellB.q), Math.abs(cellA.r - cellB.r), Math.abs(cellA.s - cellB.s));
    d += cellB.h - cellA.h; // include vertical height
    return d;
  }

  clearPath(): void {
    let i, c;
    for (i in this.cells) {
      c = this.cells[i];
      c.resetPath();
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
			mat = new THREE[c.matConfig.type](c.matConfig);
			this._matCache[c.matConfig.mat_cache_id] = mat;
		}*/

    const tile = new Tile({
      //size: this.cellSize,
      scale: scale,
      cell: cell,
      geometry: geo,
      material: material
    });

    cell.tile = tile;

    return tile;
  }

  generateTilemap(config?: TilemapSettings): Tile[] {
    config = config || {} as TilemapSettings;
    const tiles = [];
    let settings = {
      tileScale: 0.95,
      cellSize: this.cellSize,
      material: null as MeshPhongMaterial,
      extrudeSettings: {
        amount: 10,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.5,
        bevelThickness: 0.5
      } as ExtrudeSettings
    } as TilemapSettings;
    settings = TM.Tools.merge(settings, config) as TilemapSettings;

		/*if (!settings.material) {
			settings.material = new THREE.MeshPhongMaterial({
				color: TM.Tools.randomizeRGB('30, 30, 30', 10)
			});
		}*/

    // overwrite with any new dimensions
    this.cellSize = settings.cellSize;
    this._cellWidth = this.cellSize * 2;
    this._cellLength = (TM.SQRT3 * 0.5) * this._cellWidth;

    this.autogenerated = true;
    this.extrudeSettings = settings.extrudeSettings;

    let i, t, c;
    for (i in this.cells) {
      c = this.cells[i];
      t = this.generateTile(c, settings.tileScale, settings.material);
      t.position.copy(this.cellToPixel(c));
      t.position.y = 0;
      tiles.push(t);
    }
    return tiles;
  }

  // create a flat, hexagon-shaped grid IN VIRTUAL SPACE (NO TILES JUST COORDINATES)
  generateGrid(config: GridSettings): void {
    config = config || {} as GridSettings;
    this.size = typeof config.gridSize === 'undefined' ? this.size : config.gridSize;
    let x, y, z, c;
    for (x = -this.size; x < this.size + 1; x++) {
      for (y = -this.size; y < this.size + 1; y++) {
        z = -x - y;
        if (Math.abs(x) <= this.size && Math.abs(y) <= this.size && Math.abs(z) <= this.size) {
          c = new Cell(x, y, z);
          this.add(c);
        }
      }
    }
  }

  generateOverlay(size: number, overlayObj: Object3D, overlayMat: Material): void {
    let x, y, z;
    const geo = this.cellShape.createPointsGeometry(6);
    for (x = -size; x < size + 1; x++) {
      for (y = -size; y < size + 1; y++) {
        z = -x - y;
        if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
          this._cel.set(x, y, z); // define the cell
          const line = new Line(geo, overlayMat);
          line.position.copy(this.cellToPixel(this._cel));
          line.rotation.x = 90 * TM.DEG_TO_RAD;
          overlayObj.add(line);
        }
      }
    }
    overlayObj.position.y = .5;
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
  load(url: string, cb: Function, scope: any): void {
    const self = this;
    TM.Tools.getJSON({
      url: url,
      callback: function (json: GridJSONData) {
        self.fromJSON(json);
        cb.call(scope || null, json);
      },
      cache: false,
      scope: self
    });
  }

  fromJSON(json: GridJSONData): void {
    let i, c;
    const cells =  json.cells;

    this.cells = {};
    this.numCells = 0;

    this.size = json.size;
    this.cellSize = json.cellSize;
    this._cellWidth = this.cellSize * 2;
    this._cellLength = (TM.SQRT3 * 0.5) * this._cellWidth;

    this.extrudeSettings = json.extrudeSettings;
    this.autogenerated = json.autogenerated;
    
    const size = Object.keys(json).length;

    for (i = 0; i < size; i++) {
      c = new Cell();
      c.copy(cells[i]);
      this.add(c);
    }
  }

  toJSON(): GridJSONData {
    const json = {
      size: this.size,
      cellSize: this.cellSize,
      extrudeSettings: this.extrudeSettings,
      autogenerated: this.autogenerated,
      cells: null,
    } as GridJSONData;
    const cells = [] as Cell[];
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

	/*  ________________________________________________________________________
		Hexagon-specific conversion math
		Mostly commented out because they're inlined whenever possible to increase performance.
		They're still here for reference.
	 */

  _createVertex(i: number): Vector3 {
    const angle = (TM.TAU / 6) * i;
    return new Vector3((this.cellSize * Math.cos(angle)), (this.cellSize * Math.sin(angle)), 0);
  }

	/*_pixelToAxial: function(pos) {
		var q, r; // = x, y
		q = pos.x * ((2/3) / this.cellSize);
		r = ((-pos.x / 3) + (TM.SQRT3/3) * pos.y) / this.cellSize;
		this._cel.set(q, r, -q-r);
		return this._cubeRound(this._cel);
	}*/

	/*_axialToCube: function(h) {
		return {
			q: h.q,
			r: h.r,
			s: -h.q - h.r
		};
	}*/

	/*_cubeToAxial: function(cell) {
		return cell; // yep
	}*/

	/*_axialToPixel: function(cell) {
		var x, y; // = q, r
		x = cell.q * this._cellWidth * 0.75;
		y = (cell.s - cell.r) * this._cellLength * 0.5;
		return {x: x, y: -y};
	}*/

	/*_hexToPixel: function(h) {
		var x, y; // = q, r
		x = this.cellSize * 1.5 * h.x;
		y = this.cellSize * TM.SQRT3 * (h.y + (h.x * 0.5));
		return {x: x, y: y};
	}*/

	/*_axialRound: function(h) {
		return this._cubeRound(this.axialToCube(h));
	}*/

  _cubeRound(h: Cell): Cell {
    let rx = Math.round(h.q);
    let ry = Math.round(h.r);
    let rz = Math.round(h.s);

    const xDiff = Math.abs(rx - h.q);
    const yDiff = Math.abs(ry - h.r);
    const zDiff = Math.abs(rz - h.s);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    }
    else if (yDiff > zDiff) {
      ry = -rx - rz;
    }
    else {
      rz = -rx - ry;
    }

    return this._cel.set(rx, ry, rz);
  }

	/*_cubeDistance: function(a, b) {
		return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
	}*/
}