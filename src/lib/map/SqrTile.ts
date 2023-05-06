import { BufferGeometry, Material, Shape, Vector3 } from "three";
import Tile, { TileTerrain } from "./Tile";
import SqrCell from "../grid/SqrCell";

export default class SqrTile extends Tile {
    public static get baseTileShapePath(): Shape {
        return SqrTile._baseTileShapePath;
    }

    public get baseTileShapePath(): Shape {
        if (!SqrTile._baseTileShapePath) this._createBaseTileShape();

        return SqrTile._baseTileShapePath;
    }

    protected get geoCache(): Map<TileTerrain, BufferGeometry> {
        if (!SqrTile._geoCache) SqrTile._geoCache = new Map<TileTerrain, BufferGeometry>();
        return SqrTile._geoCache;
    }

    protected get matCache(): { [id: string]: Material; } {
        if (!SqrTile._matCache) SqrTile._matCache = {};
        return SqrTile._matCache;
    }

    protected _createBaseTileShape() {
        // create base shape used for building geometry
        const verts = [];
        verts.push(new Vector3());
        verts.push(new Vector3(-SqrCell.radius, SqrCell.radius));
        verts.push(new Vector3(SqrCell.radius, SqrCell.radius));
        verts.push(new Vector3(SqrCell.radius, -SqrCell.radius));
        // copy the verts into a shape for the geometry to use
        SqrTile._baseTileShapePath = new Shape();
        this.baseTileShapePath.moveTo(-SqrCell.radius, -SqrCell.radius);
        this.baseTileShapePath.lineTo(-SqrCell.radius, SqrCell.radius);
        this.baseTileShapePath.lineTo(SqrCell.radius, SqrCell.radius);
        this.baseTileShapePath.lineTo(SqrCell.radius, -SqrCell.radius);
        this.baseTileShapePath.lineTo(-SqrCell.radius, -SqrCell.radius);
    }

    public static override dispose(): void {
        SqrTile._geoCache = null;
        SqrTile._matCache = null;
        SqrTile._baseTileShapePath = null;
        this._geoCache = null;
        this._matCache = null;
        super.dispose();
    }
}