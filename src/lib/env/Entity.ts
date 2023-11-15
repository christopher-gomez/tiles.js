import { BufferGeometry, Geometry, Material } from "three";
import { EntityPlacementType } from "./MeshEntity";
import { EntityJSONData } from "../utils/Interfaces";
import Tile from "../map/Tile";

// Define a base interface for MeshEntity
export interface IEntity {
  get ignoreRay(): boolean;
  entityName: string;
  heightOffset: number;
  placementType: EntityPlacementType;
  placementVertex: number;
  placementEdge: number;
  highlightColor: number;
  baseColor: number;
  getCustomData(): { [key: string]: any };
  setCustomData(key: string, val: any): void;
  toJSON(): EntityJSONData;
  fromJSON(data: EntityJSONData): void;
  setColor(color: string | number): void;
  toggleWireframe(active: boolean): void;
  canInteract: boolean;
  highlight(
    isHighlighted: boolean,
    durationMs?: number,
    color?: number,
    onStart?: () => void,
    onComplete?: () => void,
    force?: boolean
  ): void;
  setPlacementType(placement: EntityPlacementType, vertexOrEdge?: number): void;
  setPlacementIndex(vertexOrEdge: number): void;
  setTile(tile: Tile): void;
  dispose(): void;

  addHighlightEvent(func: () => void): void;
  removeHighlightEvent(func: () => void): void;
  clearHighlightEvents(): void;

  onHighlight(): void;

  addUnhighlightEvent(func: () => void): void;
  removeUnhighlightEvent(func: () => void): void;
  clearUnhighlightEvents(): void;

  onUnhighlight(): void;

  onClick(): void;

  addOnClickEvent(func: () => void): void;
  removeOnClickEvent(func: () => void): void;
  clearOnClickEvents(func: () => void): void;

  isEntity(): true;
}

export function isEntity(obj: any): obj is IEntity {
  return typeof obj.isEntity === "function";
}
