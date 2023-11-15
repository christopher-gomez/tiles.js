import { BufferGeometry, ExtrudeBufferGeometry, Material, Shape, Vector3 } from "three";
import Tile from "./Tile";
import SqrCell from "../grid/SqrCell";
import { TileType } from "../utils/Interfaces";

export default class SqrTile extends Tile {
    public static get baseTileShapePath(): Shape {
        if (!SqrTile._baseTileShapePath) SqrTile._createBaseTileShape();

        return SqrTile._baseTileShapePath;
    }

    public get baseTileShapePath(): Shape {
        if (!SqrTile._baseTileShapePath) SqrTile._createBaseTileShape();

        return SqrTile._baseTileShapePath;
    }

    protected get geoCache(): Map<TileType, ExtrudeBufferGeometry> {
        if (!SqrTile._geoCache) SqrTile._geoCache = new Map<TileType, ExtrudeBufferGeometry>();
        return SqrTile._geoCache;
    }

    protected get matCache(): { [id: string]: Material; } {
        if (!SqrTile._matCache) SqrTile._matCache = {};
        return SqrTile._matCache;
    }

    protected static _createBaseTileShape() {
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

    protected addBorder() {
        
    }
}