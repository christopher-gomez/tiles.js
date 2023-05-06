import { BufferGeometry, Geometry, Material, Shape, ShapeBufferGeometry, Vector3 } from "three";
import Cell from "./Cell";
import Tile, { TileTerrain } from "../map/Tile";
import Engine from "../Engine";
import { TileJSONData, TileSettingsParams } from "../utils/Interfaces";
import Grid from "./Grid";
import HexTile from "../map/HexTile";

export default class HexCell extends Cell {

    public get neighborDirToGridDir(): { [key: string]: Vector3 } {
        return HexCell._neighborDirToGridDir;
    }

    public get directions(): HexCell[] {
        return HexCell._directions as HexCell[];
    }

    public get diagonals(): HexCell[] {
        return HexCell._diagonals as HexCell[];
    }

    constructor(radius: number, q?: number, r?: number, s?: number, h?: number, public grid?: Grid) {
        super(radius, q, r, s, h, grid)
    }

    protected _setCellDirections() {
        const isFlat = this.grid.gridShape !== Engine.GridShapes.FLAT_TOP_HEX;
        // pre-computed permutations
        HexCell._directions = [new HexCell(this.radius, 0, +1, -1), new HexCell(this.radius, 0, -1, +1)];

        HexCell._diagonals = [new HexCell(this.radius, +1, -1, 0), new HexCell(this.radius, +1, 0, -1),
        new HexCell(this.radius, -1, +1, 0), new HexCell(this.radius, -1, 0, +1)];

        HexCell._neighborDirToGridDir = {
            'NORTH_WEST': new Vector3(1, isFlat ? 0 : -1, isFlat ? -1 : 0),
            'NORTH_EAST': new Vector3(isFlat ? -1 : 1, isFlat ? 1 : 0, isFlat ? 0 : -1),
            'SOUTH_WEST': new Vector3(isFlat ? 1 : -1, isFlat ? -1 : 0, isFlat ? 0 : 1),
            'SOUTH_EAST': new Vector3(-1, isFlat ? 0 : 1, isFlat ? 1 : 0)
        }

        if (!isFlat) {
            HexCell._neighborDirToGridDir = { ...HexCell._neighborDirToGridDir, 'WEST': new Vector3(0, -1, 1), 'EAST': new Vector3(0, 1, -1) }
        } else {
            HexCell._neighborDirToGridDir = { ...HexCell._neighborDirToGridDir, 'NORTH': new Vector3(0, 1, -1), 'SOUTH': new Vector3(0, -1, 1) }

        }

    }

    protected _setCellWidthLengthAndFullSize() {
        this._cellWidth = (.86603 * this.radius * 2);
        this._cellLength = this._cellWidth / 2;
        this._cellPerimeter = (3 * (Math.sqrt(3 * (this.radius * 2)))) / 2
    }

    protected _createTile(scale: number, grid: Grid): Tile {
        const tile = new HexTile({
            //size: this.cellSize,
            scale: scale,
            cell: this,
            tileShape: Engine.TileShapes.HEX,
            grid: grid
        } as TileSettingsParams);

        return tile;
    }
}