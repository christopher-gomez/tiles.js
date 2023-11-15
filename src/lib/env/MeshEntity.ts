import {
  BufferGeometry,
  BufferGeometryLoader,
  Geometry,
  Material,
  MaterialLoader,
  Mesh,
  MeshPhongMaterial,
  Object3D,
  ShaderMaterial,
} from "three";
import Tile from "../map/Tile";
import { EntityJSONData } from "../utils/Interfaces";
import Tools from "../utils/Tools";
import Animation from "../utils/Animation";
import { IEntity } from "./Entity";

export enum EntityPlacementType {
  EDGE = "EDGE",
  VERTEX = "VERTEX",
  CENTER = "CENTER",
}

export interface EntityOptionParams {
  heightOffset?: number;
  placementType?: EntityPlacementType;
  baseColor?: number;
  highlightColor?: number;
}

export default class MeshEntity extends Mesh implements IEntity {
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

  public highlightColor = 0x0084cc;
  public baseColor = 0xffffff;

  private _customData: { [key: string]: any } = {};

  // public get customData() {
  //     return this._customData;
  // }

  public getCustomData(key?: string) {
    if (key !== undefined && key.trim() !== "") {
      if (this._customData !== undefined && key in this._customData) {
        return this._customData[key];
      } else {
        return null;
      }
    }

    return this._customData;
  }

  public setCustomData(key: string, val: any) {
    this._customData[key] = val;

    this._tile?.cell?.grid?.map?.view?.saveScene();
  }

  constructor(
    public entityName: string,
    geometry?: BufferGeometry | Geometry,
    material?: Material | Material[],
    opts?: EntityOptionParams
  ) {
    if (geometry && geometry instanceof Geometry) {
      geometry = new BufferGeometry().fromGeometry(geometry);
    }

    super(geometry, material);

    this.geometry.computeBoundingBox();

    let defaults = {
      heightOffset: 1,
      placementType: EntityPlacementType.CENTER,
    } as EntityOptionParams;

    defaults = Tools.merge(defaults, opts ?? {}) as EntityOptionParams;

    this.heightOffset = defaults.heightOffset;
    this._placementType = defaults.placementType;
    this.highlightColor = defaults.highlightColor ?? this.highlightColor;
    this.baseColor = defaults.baseColor ?? this.baseColor;

    if ((this.material as MeshPhongMaterial).color) {
      if (opts.baseColor) {
        (this.material as MeshPhongMaterial).color.setHex(opts.baseColor);
        this.baseColor = opts.baseColor;
      } else
        this.baseColor = (this.material as MeshPhongMaterial).color.getHex();
    }

    // (this.material as MeshPhongMaterial).color.setHex(0xffffff);

    this.userData.structure = this;
  }

  setPlacementType(placement: EntityPlacementType, vertexOrEdge?: number) {
    this._placementType = placement;
    this._placementVert =
      placement === EntityPlacementType.VERTEX && vertexOrEdge !== undefined
        ? vertexOrEdge
        : -1;
    this._placementEdge =
      placement === EntityPlacementType.EDGE && vertexOrEdge !== undefined
        ? vertexOrEdge
        : -1;
  }

  setPlacementIndex(vertexOrEdge: number) {
    this._placementVert =
      this._placementType === EntityPlacementType.VERTEX &&
      vertexOrEdge !== undefined
        ? vertexOrEdge
        : -1;
    this._placementEdge =
      this._placementType === EntityPlacementType.EDGE &&
      vertexOrEdge !== undefined
        ? vertexOrEdge
        : -1;
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
    let geomJSON;

    if (this.geometry instanceof Geometry) {
      this.geometry = new BufferGeometry().fromGeometry(this.geometry);
      this.geometry.computeVertexNormals();
    }

    geomJSON = this.geometry.toNonIndexed().toJSON();

    return {
      entityName: this.entityName,
      heightOffset: this.heightOffset,
      placementType: this.placementType,
      placementVert: this.placementVertex,
      placementEdge: this.placementEdge,
      position: this.position.toArray(),
      customData: this.getCustomData(),
      geometryJSON: geomJSON,
      materialJSON: Array.isArray(this.material)
        ? this.material.map((m) => m.toJSON())
        : this.material.toJSON(),
      baseColor: this.baseColor,
      highlightColor: this.highlightColor,
    } as EntityJSONData;
  }

  private static bufferGeomLoader = new BufferGeometryLoader();
  private static matLoader = new MaterialLoader();

  fromJSON(data: EntityJSONData) {
    this.entityName = data.entityName;
    this.heightOffset = data.heightOffset;
    this._placementType = data.placementType;
    this._placementVert = data.placementVert;
    this._placementEdge = data.placementEdge;

    this._customData = data.customData;

    let geom = MeshEntity.bufferGeomLoader.parse(data.geometryJSON);

    let mat: Material | Material[];
    if (Array.isArray(data.materialJSON)) {
      mat = data.materialJSON.map((j) => MeshEntity.matLoader.parse(j));
    } else {
      mat = MeshEntity.matLoader.parse(data.materialJSON);
    }

    this.geometry = geom;
    this.material = mat;

    this.geometry.computeBoundingBox();

    this.position.set(data.position[0], data.position[1], data.position[2]);

    (this.material as MeshPhongMaterial).color.setHex(
      data.baseColor ?? this.baseColor
    );
    this.baseColor = (this.material as MeshPhongMaterial).color.getHex();
    this.highlightColor = data.highlightColor ?? this.highlightColor;
  }

  public setColor(color: string | number) {
    if (!this.material) return;

    if (typeof color === "string")
      (this.material as MeshPhongMaterial).color.set(color);
    else (this.material as MeshPhongMaterial).color.setHex(color);
  }

  public toggleWireframe(active: boolean) {
    if (!this.material) return;

    (this.material as MeshPhongMaterial).wireframe = active;
  }

  public canInteract = true;

  public highlight(
    isHighlighted: boolean,
    durationMs = 0,
    color?: number,
    onStart?: () => void,
    onComplete?: () => void,
    force?: boolean
  ) {
    if (!this.canInteract && (force === undefined || !force)) return;

    this._tile?.cell?.grid?.map?.view?.animationManager?.stopAnimation(
      "entity-" + this.id + "-highlight"
    );

    if (isHighlighted) {
      if (
        durationMs > 0 &&
        this._tile?.cell?.grid?.map?.view?.animationManager
      ) {
        this._tile?.cell?.grid?.map?.view.animationManager.addAnimation(
          new Animation(
            durationMs,
            (dt) => {
              let curHex = Tools.lerpHex(
                (this.material as MeshPhongMaterial).color.getHex(),
                color ?? this.highlightColor,
                dt
              );
              (this.material as MeshPhongMaterial).color.setHex(curHex);
            },
            onStart,
            onComplete
          ),
          "entity-" + this.id + "-highlight",
          true
        );
      } else {
        if (onStart) onStart();
        (this.material as MeshPhongMaterial).color.setHex(
          color ?? this.highlightColor
        );
        if (onComplete) onComplete();
      }
    } else {
      if (
        durationMs > 0 &&
        this._tile?.cell?.grid?.map?.view?.animationManager
      ) {
        this._tile?.cell?.grid?.map?.view.animationManager.addAnimation(
          new Animation(
            durationMs,
            (dt) => {
              let curHex = Tools.lerpHex(
                (this.material as MeshPhongMaterial).color.getHex(),
                color ?? this.baseColor,
                dt
              );
              (this.material as MeshPhongMaterial).color.setHex(curHex);
            },
            onStart,
            onComplete
          ),
          "entity-" + this.id + "-highlight",
          true
        );
      } else {
        if (onStart) onStart();
        (this.material as MeshPhongMaterial).color.setHex(
          color ?? this.baseColor
        );
        if (onComplete) onComplete();
      }
    }
  }

  private _highlightEvents: Array<() => void> = [];
  private _unHighlightEvents: Array<() => void> = [];

  public addHighlightEvent(func: () => void): void {
    this._highlightEvents.push(func);
  }

  public removeHighlightEvent(func: () => void): void {
    if (this._highlightEvents.indexOf(func) !== -1) {
      this._highlightEvents.splice(this._highlightEvents.indexOf(func), 1);
    }
  }

  public clearHighlightEvents(): void {
    this._highlightEvents = [];
  }

  public onHighlight(): void {
    this._highlightEvents.forEach((func) => func());
  }

  public addUnhighlightEvent(func: () => void): void {
    this._unHighlightEvents.push(func);
  }

  public removeUnhighlightEvent(func: () => void): void {
    if (this._unHighlightEvents.indexOf(func) !== -1) {
      this._unHighlightEvents.splice(this._unHighlightEvents.indexOf(func), 1);
    }
  }

  public clearUnhighlightEvents(): void {
    this._unHighlightEvents = [];
  }

  public onUnhighlight(): void {
    this._unHighlightEvents.forEach((func) => func());
  }

  private _clickEvents: Array<() => void> = [];

  public addOnClickEvent(func: () => void): void {
    this._clickEvents.push(func);
  }

  public removeOnClickEvent(func: () => void): void {
    if (this._clickEvents.indexOf(func) !== -1) {
      this._clickEvents.splice(this._clickEvents.indexOf(func), 1);
    }
  }

  public clearOnClickEvents(): void {
    this._clickEvents = [];
  }

  public onClick(): void {
    this._clickEvents.forEach((func) => func());
  }

  public isEntity(): true {
    return true;
  }

  private transMat: ShaderMaterial;
  private origMat: Material | Material[];
  private isTrans = false;
  public setTransparent(toggled: boolean) {
    if (toggled) {
      // if (this.isTrans) return;

      // if (!this.origMat) this.origMat = this.material
      // if (!this.transMat) this.transMat = Tools.createSeeThroughMaterial();
      // this.isTrans = true;
      // this.transMat.uniforms['collisionOccurred'].value = 1;

      // this.material = this.transMat;
      this.toggleWireframe(true);
    } else {
      // if (!this.isTrans) return;

      // this.material = this.origMat;
      // this.isTrans = false;
      this.toggleWireframe(false);
    }
  }
}
