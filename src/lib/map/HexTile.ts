import { BufferGeometry, ExtrudeBufferGeometry, Line, LineBasicMaterial, Material, MeshPhongMaterial, Shape, ShapeBufferGeometry, Vector3 } from "three";
import Tile from "./Tile";
import Engine from "../Engine";
import HexCell from "../grid/HexCell";
import { TileJSONData, TileType } from "../utils/Interfaces";
import Cell from "../grid/Cell";

export default class HexTile extends Tile {

    constructor(cell: Cell, data?: TileType | TileJSONData) {
        super(cell, data);
    }

    public static get baseTileShapePath(): Shape {
        if (!HexTile._baseTileShapePath) HexTile._createBaseTileShape();

        return HexTile._baseTileShapePath;
    }

    public get baseTileShapePath(): Shape {
        if (!HexTile._baseTileShapePath) HexTile._createBaseTileShape();

        return HexTile._baseTileShapePath;
    }

    protected get geoCache(): Map<TileType, ExtrudeBufferGeometry> {
        if (!HexTile._geoCache) HexTile._geoCache = new Map<TileType, ExtrudeBufferGeometry>();
        return HexTile._geoCache;
    }

    protected get matCache(): { [id: string]: Material; } {
        if (!HexTile._matCache) HexTile._matCache = {};
        return HexTile._matCache;
    }


    protected static _createBaseTileShape() {
        // create base shape used for building geometry
        let i;
        const verts = [];
        // create the skeleton of the hex
        for (i = 0; i < 6; i++) {
            verts.push(this.getVertexPosition(i));
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

    public static getVertexPosition(i: number): Vector3 {
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


    protected addBorder() {
        // if (this.borderLines)
        //     this.mesh.remove(this.borderLines)
        // const geo = HexTile.baseTileShapePath.createPointsGeometry(6);
        // const line = new Line(geo, new LineBasicMaterial({ color: 0xffffff }));
        // // line.rotation.x = -90 * Engine.DEG_TO_RAD;

        // this.borderLines = line;

        // this.mesh.add(line);
        // line.position.copy(this.getVertexWorldPosition(0).setY(1));
        // line.rotation.x = 180 * Engine.DEG_TO_RAD;
    }
}