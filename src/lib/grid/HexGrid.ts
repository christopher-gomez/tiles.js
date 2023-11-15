import Engine from "../Engine";
import {
  Shape,
  BufferGeometry,
  ShapeGeometry,
  Vector3,
  Object3D,
  Material,
  Line,
  ShapeBufferGeometry,
  ExtrudeGeometryOptions,
} from "three";
import Grid from "./Grid";
import { GridSettings, GridSettingsParams } from "../utils/Interfaces";
import Cell from "./Cell";
import Tile from "../map/Tile";
import Tools from "../utils/Tools";
import HexCell from "./HexCell";
// import SqrCell from './SqrCell';
import HexTile from "../map/HexTile";
// import SqrTile from '../map/SqrTile';

/*
  Graph of hexagons. Handles grid cell management (placement math for eg pathfinding, range, etc) and grid conversion math.
  [Cube/axial coordinate system](http://www.redblobgames.com/grids/hexagons/), "flat top" version only. Since this is 3D, just rotate your camera for pointy top maps.
 */
// 'utils/Loader', 'graphs/Hex', 'utils/Tools'
export default class HexGrid extends Grid {
  constructor(config?: GridSettingsParams) {
    let settings = {
      gridShape: Engine.GridShapes.FLAT_TOP_HEX,
      gridRadius: 10,
      cellRadius: 10,
      cellShape: Engine.TileShapes.HEX,
    } as GridSettings;

    if (config) settings = Engine.Tools.merge(settings, config) as GridSettings;

    if (
      settings.gridShape === Engine.GridShapes.FLAT_TOP_HEX ||
      settings.gridShape === Engine.GridShapes.POINT_TOP_HEX
    ) {
      // no-op
    }
    // else settings.gridShape = Engine.GridShapes.FLAT_TOP_HEX;

    if (settings.cellShape !== Engine.TileShapes.HEX)
      settings.cellShape = Engine.TileShapes.HEX;

    super(settings as GridSettingsParams);
  }
  /*  ________________________________________________________________________
    High-level functions that the map interfaces with (all grids implement)
   */

  // grid cell (Hex in cube coordinate space) to position in pixels/world
  cellToPixel(cell: Cell): Vector3 {
    // this._vec3.x = cell.q * cell.width * 0.75;
    // this._vec3.y = cell.h;
    // this._vec3.z = -((cell.s - cell.r) * cell.length * 0.5);
    // return this._vec3;
    return this._hexToPixel(cell);
  }

  pixelToCell(pos: Vector3): Cell {
    // convert a position in world space ("pixels") to cell coordinates
    const q = pos.x * (HexGrid.TWO_THIRDS / this.cellRadius);
    const r = (-pos.x / 3 + (Engine.SQRT3 / 3) * pos.z) / this.cellRadius;
    this._cel.set(q, r, -q - r);
    return this._cubeRound(this._cel);
  }

  getCellAt(pos: Vector3): Cell {
    // get the Cell (if any) at the passed world position
    const q = pos.x * (HexGrid.TWO_THIRDS / this.cellRadius);
    const r = (-pos.x / 3 + (Engine.SQRT3 / 3) * pos.z) / this.cellRadius;
    this._cel.set(q, r, -q - r);
    this._cubeRound(this._cel);
    if (!this.cells || !(this.cellToHash(this._cel) in this.cells)) return null;

    return this.cells[this.cellToHash(this._cel)];
  }

  cellToHash(cell: Cell): string {
    let hash =
      cell.q + this._hashDelimeter + cell.r + this._hashDelimeter + cell.s;
    return hash;
  }

  distance(cellA: Cell, cellB: Cell): number {
    let d = Math.max(
      Math.abs(cellA.q - cellB.q),
      Math.abs(cellA.r - cellB.r),
      Math.abs(cellA.s - cellB.s)
    );
    d += cellB.h - cellA.h; // include vertical height
    return d;
  }

  // create a flat grid IN VIRTUAL SPACE (NO TILES JUST COORDINATES)
  generateGrid(config?: GridSettingsParams): void {
    super._setGridProps(config);
    // this._setCellWidthLengthAndFullSize();

    if (config.isLoad && config.gridJSON) {
      this.fromJSON(config.gridJSON);
      return;
    }

    let c;
    if (
      this.gridShape === Engine.GridShapes.RECT ||
      this.gridShape === Engine.GridShapes.SQUARE
    ) {
      let radius = this.gridRadius;

      if (this.gridShape === Engine.GridShapes.SQUARE) radius /= 2;

      for (let q = -radius; q < radius; q++) {
        const rOffset = q >> 1; // or r>>1
        for (let r = -rOffset; r < this.gridRadius - rOffset; r++) {
          this.createCell(new Vector3(q, r, -q - r));
        }
      }
    } else if (this.cellShape === Engine.TileShapes.HEX) {
      let x, y, z;
      for (x = -this.gridRadius; x < this.gridRadius + 1; x++) {
        for (y = -this.gridRadius; y < this.gridRadius + 1; y++) {
          z = -x - y;
          if (
            Math.abs(x) <= this.gridRadius &&
            Math.abs(y) <= this.gridRadius &&
            Math.abs(z) <= this.gridRadius
          ) {
            this.createCell(new Vector3(x, y, z));
          }
        }
      }
    }
  }

  public createCell(pos: Vector3, generateTile = false) {
    let c = new HexCell(this.cellRadius, pos.x, pos.y, pos.z, 0, this);
    this.add(c);

    if (generateTile) {
      const t = this.generateTile(c);

      const p = this.cellToPixel(c);

      p.y = 0;
      t.setPosition(p);

      return t;
    }
  }

  generateOverlay(
    size: number,
    overlayObj: Object3D,
    overlayMat: Material
  ): void {
    let x, y, z;
    const geo = HexTile.baseTileShapePath.createPointsGeometry(6);

    for (x = -size; x < size + 1; x++) {
      for (y = -size; y < size + 1; y++) {
        z = -x - y;
        if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
          this._cel.set(x, y, z); // define the cell
          const line = new Line(geo, overlayMat);
          line.position.copy(this.cellToPixel(this._cel));
          line.rotation.x = -90 * Engine.DEG_TO_RAD;

          overlayObj.add(line);
        }
      }
    }

    overlayObj.position.y = -3;
  }

  generateNonPlayableTiles(size: number): Tile[] {
    let x, y, z;

    const tiles: Tile[] = [];
    for (x = -size; x < size + 1; x++) {
      for (y = -size; y < size + 1; y++) {
        z = -x - y;
        if (Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) {
          this._cel.set(x, y, z); // define the cell

          if (this.cellToHash(this._cel) in this.cells) {
            continue;
          }

          let c = new HexCell(this._cellRadius).copy(this._cel);
          c.grid = this;
          const t = this.generateTile(
            c,
            {
              name: "Default",
              color: Engine.Tools.randomizeRGB("0, 0, 0", 13),
              scale: 1,
              geomOpts: {
                steps: 1,
                depth: 0.1,
                bevelEnabled: false,
                bevelThickness: 0,
                bevelSize: 0,
                bevelSegments: 0,
                curveSegments: 1
              } as ExtrudeGeometryOptions,
            },
            false
          );
          t.mesh.position.copy(this.cellToPixel(this._cel));
          t.mesh.name = "Non-Interactable "+this.cellToHash(this._cel);
          tiles.push(t);
        }
      }
    }

    return tiles;
  }

  /*  ________________________________________________________________________
    Hexagon-specific conversion math
    Mostly commented out because they're inlined whenever possible to increase performance.
    They're still here for reference.
   */

  /*_pixelToAxial: function(pos) {
    var q, r; // = x, y
    q = pos.x * ((2/3) / this.cellSize);
    r = ((-pos.x / 3) + (Engine.SQRT3/3) * pos.y) / this.cellSize;
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

  _hexToPixel(h: Cell): Vector3 {
    this._vec3.x = this.cellRadius * 1.5 * h.q;
    this._vec3.y = h.h;
    this._vec3.z = this.cellRadius * Engine.SQRT3 * (h.r + h.q * 0.5);

    return this._vec3;
  }

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
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    return this._cel.set(rx, ry, rz);
  }

  /*_cubeDistance: function(a, b) {
    return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
  }*/

  dispose(): void {
    super.dispose();
    // if (this.cellShape === Engine.TileShapes.HEX) {
    //   HexCell.dispose();
    // } else {
    //   SqrCell.dispose();
    // }
  }
}
