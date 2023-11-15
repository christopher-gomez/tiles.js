import {
  BufferGeometry,
  BufferGeometryLoader,
  Geometry,
  Group,
  Material,
  MaterialLoader,
  Mesh,
  MeshPhongMaterial,
  Object3D,
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

export default class GroupEntity extends Group implements IEntity {
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

  private childrenBaseColors: Array<Array<number>> = [];

  private _customData: { [key: string]: any } = {};

  // public get customData() {
  //     return this._customData;
  // }

  public getCustomData() {
    return this._customData;
  }

  public setCustomData(key: string, val: any) {
    this._customData[key] = val;

    this._tile?.cell?.grid?.map?.view?.saveScene();
  }

  constructor(
    public entityName: string,
    group?: Group,
    opts?: EntityOptionParams
  ) {
    super();

    if (group) {
      let i = 0;
      for (const obj of group.children) {
        group.remove(obj);
        const clone = obj.clone(true);
        this.add(clone);
        clone.userData.structure = this;

        if (obj instanceof Mesh && clone instanceof Mesh) {
          if (Array.isArray(obj.material)) {
            let j = 0;
            const newMats = [];
            this.childrenBaseColors[i] = [];
            for (const mat of obj.material) {
              const matClone = (mat as MeshPhongMaterial).clone();

              newMats.push(matClone);

              this.childrenBaseColors[i][j] = matClone.color.getHex();
              j++;
            }

            clone.material = newMats;
          } else {
            clone.material = (clone.material as MeshPhongMaterial).clone();
            this.childrenBaseColors[i] = [
              (clone.material as MeshPhongMaterial).color.getHex(),
            ];
          }
        }

        i++;
      }
    }

    let defaults = {
      heightOffset: 1,
      placementType: EntityPlacementType.CENTER,
    } as EntityOptionParams;

    defaults = Tools.merge(defaults, opts ?? {}) as EntityOptionParams;

    this.heightOffset = defaults.heightOffset;
    this._placementType = defaults.placementType;
    this.highlightColor = defaults.highlightColor ?? this.highlightColor;
    this.baseColor = defaults.baseColor ?? this.baseColor;

    // if ((this.material as MeshPhongMaterial).color) {
    //     if (opts.baseColor) {
    //         (this.material as MeshPhongMaterial).color.setHex(opts.baseColor);
    //         this.baseColor = opts.baseColor;
    //     } else
    //         this.baseColor = (this.material as MeshPhongMaterial).color.getHex();
    // }
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
    for (const obj of this.children) {
      this.remove(obj);
    }
  }

  override toJSON(): EntityJSONData {
    // let geomJSON;

    // if (this.geometry instanceof Geometry) {
    //     this.geometry = new BufferGeometry().fromGeometry(this.geometry);
    //     this.geometry.computeVertexNormals();
    // }

    // geomJSON = this.geometry.toJSON();

    return null;

    // return {
    //     entityName: this.entityName,
    //     heightOffset: this.heightOffset,
    //     placementType: this.placementType,
    //     placementVert: this.placementVertex,
    //     placementEdge: this.placementEdge,
    //     position: this.position.toArray(),
    //     customData: this.getCustomData(),
    //     geometryJSON: geomJSON,
    //     materialJSON: Array.isArray(this.material) ? this.material.map(m => m.toJSON()) : this.material.toJSON(),
    //     baseColor: this.baseColor,
    //     highlightColor: this.highlightColor
    // } as EntityJSONData
  }

  private static bufferGeomLoader = new BufferGeometryLoader();
  private static matLoader = new MaterialLoader();

  fromJSON(data: EntityJSONData) {
    // this.entityName = data.entityName;
    // this.heightOffset = data.heightOffset;
    // this._placementType = data.placementType;
    // this._placementVert = data.placementVert;
    // this._placementEdge = data.placementEdge;
    // this._customData = data.customData;
    // let geom = MeshEntity.bufferGeomLoader.parse(data.geometryJSON);
    // let mat: Material | Material[];
    // if (Array.isArray(data.materialJSON)) {
    //     mat = data.materialJSON.map(j => MeshEntity.matLoader.parse(j));
    // } else {
    //     mat = MeshEntity.matLoader.parse(data.materialJSON);
    // }
    // this.geometry = geom;
    // this.material = mat;
    // this.geometry.computeBoundingBox();
    // this.position.set(data.position[0], data.position[1], data.position[2]);
    // (this.material as MeshPhongMaterial).color.setHex(data.baseColor ?? this.baseColor);
    // this.baseColor = (this.material as MeshPhongMaterial).color.getHex();
    // this.highlightColor = data.highlightColor ?? this.highlightColor;
  }

  public setColor(color: string | number) {
    if (!this.children || this.children.length === 0) return;

    for (const obj of this.children) {
      if (obj instanceof Mesh) {
        const mObj = obj as Mesh;
        if (typeof color === "string")
          (mObj.material as MeshPhongMaterial).color.set(color);
        else (mObj.material as MeshPhongMaterial).color.setHex(color);
      }
    }
  }

  public toggleWireframe(active: boolean) {
    if (!this.children || this.children.length === 0) return;

    for (const obj of this.children) {
      if (obj instanceof Mesh) {
        const mObj = obj as Mesh;
        (mObj.material as MeshPhongMaterial).wireframe = active;
      }
    }
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
              for (const obj of this.children) {
                if (obj instanceof Mesh) {
                  const mObj = obj as Mesh;

                  if (Array.isArray(mObj.material)) {
                    for (const mat of mObj.material) {
                      let curHex = Tools.lerpHex(
                        (mat as MeshPhongMaterial).color.getHex(),
                        color ?? this.highlightColor,
                        dt
                      );
                      (mat as MeshPhongMaterial).color.setHex(curHex);
                    }
                  } else {
                    let curHex = Tools.lerpHex(
                      (mObj.material as MeshPhongMaterial).color.getHex(),
                      color ?? this.highlightColor,
                      dt
                    );
                    (mObj.material as MeshPhongMaterial).color.setHex(curHex);
                  }
                }
              }
            },
            onStart,
            onComplete
          ),
          "entity-" + this.id + "-highlight",
          true
        );
      } else {
        if (onStart) onStart();

        for (const obj of this.children) {
          if (obj instanceof Mesh) {
            const mObj = obj as Mesh;

            if (Array.isArray(mObj.material)) {
              for (const mat of mObj.material) {
                (mat as MeshPhongMaterial).color.setHex(
                  color ?? this.highlightColor
                );
              }
            } else {
              (mObj.material as MeshPhongMaterial).color.setHex(
                color ?? this.highlightColor
              );
            }
          }
        }

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
              let i = 0;
              for (const obj of this.children) {
                if (obj instanceof Mesh) {
                  const mObj = obj as Mesh;

                  if (Array.isArray(mObj.material)) {
                    let j = 0;
                    for (const mat of mObj.material) {
                      let curHex = Tools.lerpHex(
                        (mat as MeshPhongMaterial).color.getHex(),
                        color ?? this.childrenBaseColors[i][j],
                        dt
                      );
                      (mat as MeshPhongMaterial).color.setHex(curHex);
                      j++;
                    }
                  } else {
                    let curHex = Tools.lerpHex(
                      (mObj.material as MeshPhongMaterial).color.getHex(),
                      color ?? this.childrenBaseColors[i][0],
                      dt
                    );
                    (mObj.material as MeshPhongMaterial).color.setHex(curHex);
                  }
                }

                i++;
              }
            },
            onStart,
            onComplete
          ),
          "entity-" + this.id + "-highlight",
          true
        );
      } else {
        if (onStart) onStart();
        let i = 0;

        for (const obj of this.children) {
          if (obj instanceof Mesh) {
            const mObj = obj as Mesh;
            if (Array.isArray(mObj.material)) {
              let j = 0;

              for (const mat of mObj.material) {
                (mat as MeshPhongMaterial).color.setHex(
                  color ?? this.childrenBaseColors[i][j]
                );
                j++;
              }
            } else {
              (mObj.material as MeshPhongMaterial).color.setHex(
                color ?? this.childrenBaseColors[i][0]
              );
            }

            i++;
          }
        }
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
}
