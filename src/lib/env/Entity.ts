import { BufferGeometry, Geometry, Material, Mesh, MeshPhongMaterial, Object3D } from "three";
import Tile from "../map/Tile";
import { EntityJSONData } from "../utils/Interfaces";
import Tools from "../utils/Tools";


export enum EntityPlacementType {
    EDGE = "EDGE",
    VERTEX = "VERTEX",
    CENTER = "CENTER"
}

export interface EntityOptionParams {
    heightOffset?: number;
    placementType?: EntityPlacementType;
}

export default class Entity extends Mesh {

    public ignoreRay = true;

    private _tile: Tile;
    public get parentTile(): Tile {
        return this._tile;
    }

    public heightOffset = 0;

    private _placementType = EntityPlacementType.CENTER;
    public get placementType() {
        return this._placementType;
    }

    private _placementVert = -1;
    public get placementVertex() {
        return this._placementVert;
    }

    private _placementEdge = 1;
    public get placementEdge() {
        return this._placementEdge;
    }

    private _highlightColor = 0x0084cc;
    private _emissiveBaseColor;

    constructor(public entityName: string, geometry?: Geometry | BufferGeometry, material?: Material | Material[], opts?: EntityOptionParams) {

        super(geometry, material);

        this.geometry.computeBoundingBox();

        let defaults = {
            heightOffset: 0,
            placementType: EntityPlacementType.CENTER
        } as EntityOptionParams;

        defaults = Tools.merge(defaults, opts ?? {});

        this.heightOffset = defaults.heightOffset;
        this._placementType = defaults.placementType;

        if ((this.material as MeshPhongMaterial).emissive) {
            this._emissiveBaseColor = (this.material as MeshPhongMaterial).emissive.getHex();
        }
        else {
            this._emissiveBaseColor = null;
        }

        this.userData.structure = this;
    }

    setPlacementType(placement: EntityPlacementType, vertexOrEdge?: number) {
        this._placementType = placement;
        this._placementVert = placement === EntityPlacementType.VERTEX && vertexOrEdge !== undefined ? vertexOrEdge : -1;
        this._placementEdge = placement === EntityPlacementType.EDGE && vertexOrEdge !== undefined ? vertexOrEdge : -1;
    }

    setTile(tile: Tile): void {
        this._tile = tile;
    }

    dispose() {
        this.geometry.dispose();
        this.geometry = null;
        this.material = null;
    }

    override toJSON(): EntityJSONData {
        return {
            entityName: this.entityName,
            heightOffset: this.heightOffset,
            placementType: this.placementType,
            placementVert: this.placementVertex,
            placementEdge: this.placementEdge,
            position: this.position.toArray(),
            rotation: this.rotation.toArray()
        } as EntityJSONData
    }

    fromJSON(data: EntityJSONData) {
        this.entityName = data.entityName;
        this.heightOffset = data.heightOffset;
        this._placementType = data.placementType;
        this._placementVert = data.placementVert;
        this._placementEdge = data.placementEdge;
        this.position.set(data.position[0], data.position[1], data.position[2]);
    }

    public setMaterialEmmisiveColor(color: string) {
        if (!this.material) return;

        (this.material as MeshPhongMaterial).emissive.set(color);
    }

    public setMaterialTransparent(transparent: boolean) {
        if (!this.material) return;

        (this.material as MeshPhongMaterial).wireframe = transparent;
    }

    public highlight(isHighlighted: boolean) {
        if (isHighlighted) {
            (this.material as MeshPhongMaterial)?.emissive.setHex(this._highlightColor);
        } else {
            (this.material as MeshPhongMaterial)?.emissive.setHex(this._emissiveBaseColor);
        }
    }
}