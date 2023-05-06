import { BufferGeometry, Material, Shape, ShapeBufferGeometry, Vector3 } from "three";
import Tile, { TileTerrain } from "./Tile";
import Engine from "../Engine";
import HexCell from "../grid/HexCell";

export default class HexTile extends Tile {
    public static get baseTileShapePath(): Shape {
        return HexTile._baseTileShapePath;
    }

    public get baseTileShapePath(): Shape {
        if (!HexTile._baseTileShapePath) this._createBaseTileShape();

        return HexTile._baseTileShapePath;
    }

    protected get geoCache(): Map<TileTerrain, BufferGeometry> {
        if (!HexTile._geoCache) HexTile._geoCache = new Map<TileTerrain, BufferGeometry>();
        return HexTile._geoCache;
    }

    protected get matCache(): { [id: string]: Material; } {
        if (!HexTile._matCache) HexTile._matCache = {};
        return HexTile._matCache;
    }


    protected override _createBaseTileShape() {
        // create base shape used for building geometry
        let i;
        const verts = [];
        // create the skeleton of the hex
        for (i = 0; i < 6; i++) {
            verts.push(this._createVertex(i));
        }
        // copy the verts into a shape for the geometry to use
        HexTile._baseTileShapePath = new Shape();
        this.baseTileShapePath.moveTo(verts[0].x, verts[0].y);
        for (i = 1; i < 6; i++) {
            this.baseTileShapePath.lineTo(verts[i].x, verts[i].y);
        }
        this.baseTileShapePath.lineTo(verts[0].x, verts[0].y);
        this.baseTileShapePath.autoClose = true;

        // HexTile._baseTileGeo = new BufferGeometry();
        // (this.baseTileGeo as any).vertices = verts;
        // (this.baseTileGeo as any).verticesNeedUpdate = true;

        // HexTile._baseTileShapeGeo = new ShapeBufferGeometry(this.baseTileShapePath);
        // (this.baseTileShapeGeo as any).vertices = verts;
        // (this.baseTileShapeGeo as any).verticesNeedUpdate = true;
    }

    private _createVertex(i: number): Vector3 {
        const angle = (Engine.TAU / 6) * i;
        return new Vector3((HexCell.radius * Math.cos(angle)), (HexCell.radius * Math.sin(angle)), 0);
    }
    public static override dispose(): void {
        HexTile._geoCache = null;
        HexTile._matCache = null;
        HexTile._baseTileShapePath = null;
        this._geoCache = null;
        this._matCache = null;
        super.dispose();
    }

}