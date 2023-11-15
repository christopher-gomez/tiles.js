import {
  ControllerSettings,
  ControllerSettingsParams,
  ViewController,
} from "../utils/Interfaces";
import { OrbitControls } from "../lib/OrbitControls";
import {
  BufferAttribute,
  Euler,
  MOUSE,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SphereBufferGeometry,
  SphereGeometry,
  Spherical,
  Sprite,
  Vector2,
  Vector3,
} from "three";
import Engine from "../Engine";
import View from "../scene/View";
import Tile from "../map/Tile";
import Cell from "../grid/Cell";
import Animation from "../utils/Animation";
import EventEmitter from "../utils/EventEmitter";
import Tools from "../utils/Tools";
import MouseCaster, { InputType } from "../utils/MouseCaster";
import MeshEntity, { EntityPlacementType } from "../env/MeshEntity";
import SpriteEntity from "../env/SpriteEntity";
import { IEntity, isEntity } from "../env/Entity";

export enum ControllerEvent {
  ZOOM = "ZOOM",
  ROTATE = "ROTATE",
  PAN = "PAN",
  TOGGLE_ACTIVE = "TOGGLE_ACTIVE",
}

export class Controller extends EventEmitter implements ViewController {
  public controls: OrbitControls;

  get isLeftDown() {
    return this._mouseCaster?.leftDown;
  }

  get isRightDown() {
    return this._mouseCaster?.rightDown;
  }

  get isWheelDown() {
    return this._mouseCaster?.wheelDown;
  }

  set active(active: boolean) {
    // if (this._view)
    // 	this._view.controlled = active;

    if (!this.controls) return;

    if (this.controls) this.controls.enabled = active;

    this.triggerEvent(ControllerEvent.TOGGLE_ACTIVE, {
      target: this.target.clone(),
      currentDistance: this.currentDistance,
      currentPolarAngle: this.currentPolarAngle,
      currentAzimuthAngle: this.currentAzimuthAngle,
      type: ControllerEvent.TOGGLE_ACTIVE,
      active: this.active,
    });
  }

  get active(): boolean {
    if (!this._view || !this.controls) return false;

    return this.controls.enabled;
  }

  private _panning = false;

  public get panning() {
    return this._panning;
  }

  public zooming = false;
  private _panDirection: Vector2;

  private _mouseCaster: MouseCaster;

  set mouseCaster(mouse: MouseCaster) {
    this._mouseCaster = mouse;
  }

  get mouseCaster(): MouseCaster {
    return this._mouseCaster;
  }

  get currentDistance() {
    if (!this.controls) return 0;

    return this.controls.minDistance;
  }

  set currentDistance(val) {
    if (!this.controls) return;

    this.controls.minDistance = val;
    this.controls.maxDistance = val;

    this.config.currentDistance = val;
  }

  get currentPolarAngle() {
    if (!this.controls) return 0;

    return Tools.radToDeg(this.controls.getPolarAngle());
  }

  set currentPolarAngle(val) {
    if (!this.controls) return;

    let rad = Tools.degToRad(val);

    this.controls.rotateVerticalTo(rad);

    this.config.currentPolarAngle = val;
  }

  get currentAzimuthAngle() {
    if (!this.controls) return 0;

    return Tools.radToDeg(this.controls.getAzimuthalAngle());
  }

  set currentAzimuthAngle(val) {
    if (!this.controls) return;

    let rad = Tools.degToRad(val);
    this.controls.rotateHorizontalTo(rad);

    this.config.currentAzimuthAngle = val;
  }

  get target() {
    if (!this.controls) return new Vector3(0, 0, 0);

    return this.controls.target;
  }

  set target(val: Vector3) {
    if (!this.controls) return;

    this.controls.target = val;
  }

  get canClickPan() {
    if (!this.controls) return false;

    return this.controls.canPan;
  }

  set canClickPan(val) {
    if (!this.controls) return;

    this.controls.canPan = val;
  }

  constructor(private _view: View, config?: ControllerSettingsParams) {
    super();

    if (!_view) {
      throw new Error("Controller missing View reference");
    }

    this.init(_view, config);
  }

  config: ControllerSettings;
  public init(view: View, config?: ControllerSettingsParams): void {
    let settings = null as ControllerSettings;
    if (!this.config) {
      settings = {
        target: new Vector3(0, 0, 0),
        controlled: true,
        rotationDamping: false,
        currentDistance: 300,
        minDistance: 100,
        maxDistance: 300,
        zoomDelta: 10,
        autoRotate: false,
        currentPolarAngle: 0,
        minPolarAngle: 0,
        maxPolarAngle: 45,
        minAzimuthAngle: Engine.Tools.radToDeg(Math.PI),
        maxAzimuthAngle: Engine.Tools.radToDeg(Math.PI),
        currentAzimuthAngle: Engine.Tools.radToDeg(Math.PI),
        userHorizontalRotation: false,
        userVerticalRotation: false,
        documentRaycast: false,
      } as ControllerSettings;
    }

    if (
      config !== undefined &&
      config.target !== undefined &&
      !(config.target instanceof Vector3)
    ) {
      config.target = new Vector3().fromArray(config.target);
    }

    if (config || settings)
      this.config = Tools.merge(
        settings ?? this.config,
        config ?? {}
      ) as ControllerSettings;

    if (this.controls) {
      this.controls.dispose();
    }

    // if(!this.config.controlled) this.config.target = view.camera.position.clone

    this.controls = new OrbitControls(
      view.camera,
      view.renderer.domElement,
      view,
      this.config
    );
    this.controls.mouseButtons = {
      LEFT: MOUSE.RIGHT,
      MIDDLE: MOUSE.MIDDLE,
      RIGHT: MOUSE.LEFT,
    };

    this._initEvents(view);
  }

  public override addEventListener(
    name: ControllerEvent,
    callback: (args?: {
      target: Vector3;
      currentDistance: number;
      currentPolarAngle: number;
      currentAzimuthAngle: number;
      type: string;
      active: boolean;
    }) => void
  ): void {
    super.addEventListener(name.toString(), callback);
  }

  public override removeEventListener(
    name: ControllerEvent,
    callback?: (args?: any) => void
  ): void {
    super.removeEventListener(name.toString(), callback);
  }

  protected triggerEvent(
    name: ControllerEvent,
    args?: {
      target?: Vector3;
      currentDistance?: number;
      currentPolarAngle?: number;
      currentAzimuthAngle?: number;
      type?: string;
      active?: boolean;
    }
  ): void {
    super.triggerEvent(name, {
      target: this.target.clone(),
      currentDistance: this._view.currentDistance,
      currentPolarAngle: this._view.currentPolarAngle,
      currentAzimuthAngle: this._view.currentAzimuthAngle,
      active: this.active,
      ...args,
    });
  }

  // private _inertiaTimeout;
  private _shouldKeepInertia = false;
  private _inertiaZooming = false;

  private _cameraHighlightFocusTimeout: number;
  private _shouldFocusHighlightedOnZoom = true;
  private _initEvents(view: View) {
    this.controls.addEventListener("pan", () => {
      this.triggerEvent(ControllerEvent.PAN, { type: "PAN" });
    });

    this.controls.addEventListener("rotate-right", (e) => {
      // this._view.saveScene();
    });

    this.controls.addEventListener("rotate-left", (e) => {
      // this._view.saveScene();
    });

    let curFactor = 0.1; // Starting zoom factor
    let cumulativeDelta = 0; // Cumulative delta value
    let curZoomDir = ZoomDirection.NONE; // Current zoom direction

    function resetCumulativeDelta() {
      cumulativeDelta = 0;
    }
    let resetTimeout = null;
    const resetTime = 500;
    let hasReset = false;
    let canScroll = true;
    let cancelCur = false;
    let delayTimeout = null;
    const delayTime = 50; // Adjust this value as needed

    this.controls.addEventListener("zoom-in", (e) => {
      if (e.event.deltaY > -2 || !this.active) return;

      // if (e.state === 'start') {

      if (curZoomDir !== ZoomDirection.IN) {
        resetCumulativeDelta();
        curZoomDir = ZoomDirection.IN;
        this._view.animationManager.stopAnimation(ControllerEvent.ZOOM);
        this._view.animationManager.clearAnimQueue("zoom");
        canScroll = true;
        cancelCur = true;
        hasReset = false;
      } else {
        cancelCur = false;
      }

      if (!hasReset) cumulativeDelta += Math.abs(e.event.deltaY);
      // }

      if (e.state === "end") {
        // if(this._view.animationManager.getCurAnimInQueue('zoom')?.complete === false && hasReset) return;

        if (delayTimeout !== null) {
          clearTimeout(delayTimeout);
        }

        delayTimeout = setTimeout(() => {
          if (canScroll) {
            // this._view.animationManager.stopAnimation(ControllerEvent.ZOOM);
            this.zoom(
              ZoomDirection.IN,
              cumulativeDelta * curFactor,
              this._ZOOMDUR + 1000,
              () => {
                // canScroll = false;
                // console.log('can no longer scroll');
                resetTimeout = setTimeout(() => {
                  // resetCumulativeDelta();
                  resetTimeout = null;
                  hasReset = true;
                }, resetTime);
              },
              (success) => {
                curZoomDir = ZoomDirection.NONE;
                curFactor = 0.1;
                resetCumulativeDelta();
                canScroll = true;
                hasReset = false;
              },
              () => {
                canScroll = true;
                if (resetTimeout !== null) {
                  clearTimeout(resetTimeout);
                  resetTimeout = null;
                }
                // hasReset = false;
              },
              hasReset === true,
              undefined,
              Animation.easeInQuad
            );
          }
          delayTimeout = null;
        }, delayTime);
      }
    });

    this.controls.addEventListener("zoom-out", (e) => {
      if (e.event.deltaY < 2 || !this.active) return;
      // if (e.state === 'start') {
      // 	stoppedCur = this._view.animationManager.stopAnimation(ControllerEvent.ZOOM);
      // }
      // if (e.state === 'start') {

      if (curZoomDir !== ZoomDirection.OUT) {
        resetCumulativeDelta();
        curZoomDir = ZoomDirection.OUT;
        this._view.animationManager.stopAnimation(ControllerEvent.ZOOM);
        this._view.animationManager.clearAnimQueue("zoom");
        canScroll = true;
        cancelCur = true;
        hasReset = false;
      } else {
        cancelCur = false;
      }

      if (!hasReset)
        // Update the cumulative delta value based on the current scroll direction
        cumulativeDelta += Math.abs(e.event.deltaY);
      // }

      if (e.state === "end") {
        // if(this._view.animationManager.getCurAnimInQueue('zoom')?.complete === false && hasReset) return;

        if (delayTimeout !== null) {
          clearTimeout(delayTimeout);
        }
        delayTimeout = setTimeout(() => {
          if (canScroll) {
            this.zoom(
              ZoomDirection.OUT,
              cumulativeDelta * curFactor,
              this._ZOOMDUR + 1000,
              () => {
                // canScroll = false;
                // console.log('can no longer scroll');
                resetTimeout = setTimeout(() => {
                  // resetCumulativeDelta();
                  resetTimeout = null;
                  hasReset = true;
                }, resetTime);
              },
              (success) => {
                curZoomDir = ZoomDirection.NONE;
                curFactor = 0.1;
                resetCumulativeDelta();
                canScroll = true;
                hasReset = false;
              },
              () => {
                canScroll = true;
                if (resetTimeout !== null) {
                  clearTimeout(resetTimeout);
                  resetTimeout = null;
                }
                // hasReset = false;
              },
              hasReset === true,
              undefined,
              Animation.easeInQuad
            );
          }

          delayTimeout = null;
        }, delayTime);
      }
    });

    view.renderer.domElement.ownerDocument.addEventListener(
      "keydown",
      this._onKeyDown.bind(this)
    );

    this._initMouseCaster(view);
  }

  private _onKeyDown(e) {
    if (e.code in this._keyListeners) {
      this._keyListeners[e.code].forEach((x) => x());
    }
  }

  addKeyListener(callback: (e: KeyboardEvent) => void) {
    super.addEventListener("keyup", callback);
  }

  private _pointerEntity: MeshEntity;
  // togglePointerEntity(type?: string): Mesh | null {
  // 	if (!this._pointerEntity) {
  // 		if (this._view.map?.getTileAtPosition(this.mouseCaster.position)) {
  // 			let mesh = this.createEntity(type);
  // 			this.attachEntityToPointer(mesh);
  // 			return mesh;
  // 		}
  // 	} else this.removeEntityFromPointer();

  // 	return null;
  // }

  private _onEntityAttached: Array<() => void> = [];

  public set onEntityAttached(val: () => void) {
    this._onEntityAttached.push(val);
  }

  setPointerEntity(entity: string | MeshEntity): MeshEntity | null {
    if (this._pointerEntity) {
      this.removeEntityFromPointer();
    }

    // if (this.allowEntityOffMap || this._view.map?.getTileAtPosition(this.mouseCaster.position)) {
    if (typeof entity === "string") {
      let mesh = this.createEntity(entity);
      this.attachEntityToPointer(mesh);
      return mesh;
    } else {
      this.attachEntityToPointer(entity);
      return entity;
    }
    // }

    return null;
  }

  createEntity(type?: string): MeshEntity {
    let mesh: MeshEntity;
    if (!type || !(type in this._view.map?.entities)) {
      const geometry = new SphereBufferGeometry(3, 16, 8);
      const material = new MeshBasicMaterial();
      mesh = new MeshEntity("sphere", geometry, material);
    } else {
      mesh = this._view.map?.entities[type]();
    }

    if (mesh) this._view.add(mesh);

	mesh.name = "PointerEntity";

    return mesh;
  }

  private _shouldVertexSnap: boolean = false;
  private _shouldEdgeSnap: boolean = true;

  public get vertexSnapping() {
    return this._shouldVertexSnap;
  }

  public set vertexSnapping(val) {
    if (val) this._shouldEdgeSnap = false;
    this._shouldVertexSnap = val;
  }

  public get edgeSnapping() {
    return this._shouldEdgeSnap;
  }

  public set edgeSnapping(val) {
    if (val) this._shouldVertexSnap = false;
    this._shouldEdgeSnap = val;
  }

  private _entityToPointerAnimID: string;
  private entityOnMap = true;
  private _targetQuat = new Quaternion();
  private _rotMat = new Matrix4();

  // TODO: Fix this functionality, currently I never allow the pointer ent off the map in the mousecaster/controller listener by nnever unhighlighting the last tile if the pointerent is active and the raycast returns no tile
  public allowEntityOffMap = true;

  public onEntityPlacementValidator: (
    tile: Tile,
    vertOrEdge?: number
  ) => boolean;

  getClosestVertex(tile: Tile, pos: Vector3) {
    let _pos: Vector3;
    let numVerts = tile.tileShape === Engine.TileShapes.HEX ? 6 : 4;
    let min = -1;
    let minDistance;

    for (let i = 0; i < numVerts; i++) {
      _pos = tile.getVertexWorldPosition(i);
      let distance = _pos.distanceTo(pos);

      if (min === -1 || distance < minDistance) {
        minDistance = distance;
        min = i;
      }
    }

    return min;
  }

  getClosestEdge(tile: Tile, pos: Vector3) {
    let _pos: Vector3;
    let numVerts = tile.tileShape === Engine.TileShapes.HEX ? 6 : 4;
    let min = -1;
    let minDistance;

    for (let i = 0; i < numVerts; i++) {
      _pos = tile.getEdgeWorldPosition(i);
      let distance = _pos.distanceTo(pos);

      if (min === -1 || distance < minDistance) {
        minDistance = distance;
        min = i;
      }
    }

    return min;
  }

  private readonly entityHeightBuffer = 7;
  private attachEntityToPointer(
    entity: MeshEntity,
    highlightValidPositions = true
  ) {
    if (entity == null || entity === undefined) return;

    console.log("attached entity to pointer");
    console.log("validator: " + this.onEntityPlacementValidator !== undefined);

    this._onEntityAttached.forEach((e) => e());

    this.removeEntityFromPointer();

    this._pointerEntity = entity;
    this.entityOnMap = false;
    const highlights: Array<{
      tile: Tile;
      validPositions: Array<number>;
      invalidPositions: Array<number>;
    }> = [];
    if (highlightValidPositions) {
      if (this.vertexSnapping) {
        this._view?.map?.tiles?.forEach((tile) => {
          let valids = [];
          let invalids = [];
          const numVerts = tile.tileShape === Engine.TileShapes.HEX ? 6 : 4;
          for (let i = 0; i < numVerts; i++) {
            if (tile.entities.find((t) => t.placementVertex === i)) {
              continue;
            }

            if (tile.sharedVertEntities.find((e) => e.vertex === i)) {
              continue;
            }

            if (
              this.onEntityPlacementValidator !== undefined &&
              !this.onEntityPlacementValidator(tile, i)
            ) {
              invalids.push(i);
              continue;
            }

            valids.push(i);
          }

          highlights.push({
            tile: tile,
            validPositions: valids,
            invalidPositions: invalids,
          });

          // validPosition.forEach(i => { tile.highlightVertex(i); tile.getVertexNeighbors(i).forEach(t => t.tile.highlightVertex(t.vertex)); });
          highlights.forEach((i) =>
            i.invalidPositions.forEach((j) => {
              i.tile.highlightVertex(j, "red");
            })
          );
        });
      } else if (this.edgeSnapping) {
        this._view?.map?.tiles?.forEach((tile) => {
          const numVerts = tile.tileShape === Engine.TileShapes.HEX ? 6 : 4;
          let valids = [];
          let invalids = [];
          for (let i = 0; i < numVerts; i++) {
            if (tile.entities.find((t) => t.placementEdge === i)) {
              continue;
            }

            if (tile.sharedEdgeEntities.find((e) => e.edge === i)) {
              continue;
            }

            if (
              this.onEntityPlacementValidator !== undefined &&
              !this.onEntityPlacementValidator(tile, i)
            ) {
              invalids.push(i);
              continue;
            }

            valids.push(i);
          }
          highlights.push({
            tile: tile,
            validPositions: valids,
            invalidPositions: invalids,
          });

          highlights.forEach((i) =>
            i.invalidPositions.forEach((j) => {
              i.tile.highlightEdge(j, "red");
            })
          );

          // validPosition.forEach(i => { tile.highlightEdge(i); tile.getEdgeNeighbors(i).forEach((t) => t.tile.highlightEdge(t.edge)) });
        });
      }
    }

    this._entityToPointerAnimID =
      this._view.animationManager.addOnAnimateListener(() => {
        let tile = this._view.map?.highlightedTile;
        if (this.vertexSnapping)
          highlights.forEach((i) => {
            i.validPositions.forEach((v) => {
              i.tile.highlightVertex(v);
            });
          });

        if (this.edgeSnapping)
          highlights.forEach((i) => {
            i.validPositions.forEach((v) => {
              i.tile.highlightEdge(v);
            });
          });

        if (tile) {
          entity.setColor(entity.baseColor);
          entity.toggleWireframe(false);

          let pos: Vector3;
          const numVerts = tile.tileShape === Engine.TileShapes.HEX ? 6 : 4;
          let min = -1;
          let minDistance;

          if (this.vertexSnapping) {
            for (let i = 0; i < numVerts; i++) {
              pos = tile.getVertexWorldPosition(i);
              let distance = pos.distanceTo(this.mouseCaster.position);

              if (min === -1 || distance < minDistance) {
                if (tile.entities.find((t) => t.placementVertex === i)) {
                  continue;
                }

                if (tile.sharedVertEntities.find((e) => e.vertex === i)) {
                  continue;
                }

                if (
                  this.onEntityPlacementValidator !== undefined &&
                  !this.onEntityPlacementValidator(tile, i)
                ) {
                  continue;
                }

                minDistance = distance;
                min = i;
                this._pointerEntityCurVert = min;
              }
            }

            if (min === -1) {
              entity.setColor("red");
              entity.toggleWireframe(true);
              pos = tile.mapPosition
                .clone()
                .setY(
                  tile.geometry.boundingBox.max.z + this.entityHeightBuffer
                );
              this._pointerEntityCurVert = -1;
            } else {
              tile.unHighlightVertex(min);
              let neighs = tile.getVertexNeighbors(min);
              neighs.forEach((n) => n.tile.unHighlightVertex(n.vertex));
              let maxHeight = Math.max(
                ...neighs.map((n) => n.tile.geometry.boundingBox.max.z),
                tile.geometry.boundingBox.max.z
              );

              let worldPos = tile.getVertexWorldPosition(min);
              pos = worldPos
                .clone()
                .setY(
                  maxHeight + entity.heightOffset + this.entityHeightBuffer
                );

              const start = worldPos;
              const end = worldPos;

              this._rotMat.lookAt(start, end, entity.up);

              this._targetQuat.setFromRotationMatrix(this._rotMat);
              entity.quaternion.set(
                this._targetQuat.x,
                this._targetQuat.y,
                this._targetQuat.z,
                this._targetQuat.w
              );

              // for (let i = 0; i < numVerts; i++) {
              // 	if (i !== min) {
              // 		tile.highlightVertex(i, 'red');
              // 		tile.getVertexNeighbors(i).forEach(n => n.tile.highlightVertex(n.vertex, 'red'))
              // 	}
              // 	else {
              // 		tile.highlightVertex(i, 'blue');
              // 		tile.getVertexNeighbors(i).forEach(n => n.tile.highlightVertex(n.vertex, 'blue'))
              // 	}
              // }
            }
          } else if (this.edgeSnapping) {
            for (let i = 0; i < numVerts; i++) {
              pos = tile.getEdgeWorldPosition(i);
              let distance = pos.distanceTo(this.mouseCaster.position);

              if (min === -1 || distance < minDistance) {
                if (tile.entities.find((t) => t.placementEdge === i)) {
                  continue;
                }

                if (tile.sharedEdgeEntities.find((e) => e.edge === i)) {
                  continue;
                }

                if (
                  this.onEntityPlacementValidator !== undefined &&
                  !this.onEntityPlacementValidator(tile, i)
                ) {
                  continue;
                }

                minDistance = distance;
                min = i;
                this._pointerEntityCurEdge = min;
              }
            }

            if (min === -1) {
              entity.setColor("red");
              entity.toggleWireframe(true);
              pos = tile.mapPosition
                .clone()
                .setY(
                  tile.geometry.boundingBox.max.z + this.entityHeightBuffer
                );
              this._pointerEntityCurEdge = -1;
            } else {
              tile.unHighlightEdge(min);
              let neighs = tile.getEdgeNeighbors(min);
              neighs.forEach((n) => n.tile.unHighlightEdge(n.edge));

              let maxHeight = Math.max(
                ...neighs.map((n) => n.tile.geometry.boundingBox.max.z),
                tile.geometry.boundingBox.max.z
              );

              pos = tile
                .getEdgeWorldPosition(min)
                .setY(
                  maxHeight + entity.heightOffset + this.entityHeightBuffer
                );
              const start = tile.getVertexWorldPosition(min);
              const end = tile.getVertexWorldPosition(
                min === numVerts - 1 ? 0 : min + 1
              );

              this._rotMat.lookAt(end, start, entity.up);

              this._targetQuat.setFromRotationMatrix(this._rotMat);
              entity.quaternion.set(
                this._targetQuat.x,
                this._targetQuat.y,
                this._targetQuat.z,
                this._targetQuat.w
              );
            }
          } else {
            pos = tile.mapPosition
              .clone()
              .setY(
                tile.geometry.boundingBox.max.z +
                  entity.heightOffset +
                  this.entityHeightBuffer
              );
            entity.rotation.x = 180 * Engine.DEG_TO_RAD;
            entity.rotation.y = 180 * Engine.DEG_TO_RAD;
          }

          if (this.entityOnMap) entity.position.set(pos.x, pos.y, pos.z);
          else {
            this._view.add(entity, pos);
            this.entityOnMap = true;
          }

          // this._view.map?.hightlightTile(tile, true, false);
        } else {
          this._pointerEntityCurEdge = -1;
          this._pointerEntityCurVert = -1;
          if (!this.allowEntityOffMap) {
            this._view.remove(entity);
            this._view.map?.unHighlightCurrentHighlightedTile();
            this.entityOnMap = false;
          } else {
            entity.setColor("red");
            entity.toggleWireframe(true);

            if (this.entityOnMap)
              entity.position.copy(
                this.mouseCaster.position.clone().setY(this.entityHeightBuffer)
              );
            else {
              this._view.add(
                entity,
                this.mouseCaster.position.clone().setY(this.entityHeightBuffer)
              );
              this.entityOnMap = true;
            }
          }
        }
      });
  }

  removeEntityFromPointer() {
    if (this._entityToPointerAnimID) {
      this._view.animationManager.removeOnAnimateListener(
        this._entityToPointerAnimID
      );
      this._entityToPointerAnimID = null;
    }

    if (this._pointerEntity) this._view.remove(this._pointerEntity);
    this._pointerEntity = null;
    this._pointerEntityCurVert = -1;
    this._pointerEntityCurEdge = -1;

    this._view.map.tiles.forEach((t) => {
      t.unhighlightAllVertices();
      t.unhighlightAllEdges();
    });
  }

  private _pointerEntityCurVert = -1;
  private _pointerEntityCurEdge = -1;

  setPointerEntityOnTile(tile: Tile): boolean {
    const placementType = this.vertexSnapping
      ? EntityPlacementType.VERTEX
      : this.edgeSnapping
      ? EntityPlacementType.EDGE
      : EntityPlacementType.CENTER;

    let suc = true;
    if (placementType === EntityPlacementType.VERTEX) {
      let sameVert = tile.entities.filter((e) => {
        return (
          e.placementType === EntityPlacementType.VERTEX &&
          e.placementVertex === this._pointerEntityCurVert
        );
      });

      if (
        sameVert.length > 0 ||
        this._pointerEntityCurVert === -1 ||
        (this.onEntityPlacementValidator !== undefined &&
          !this.onEntityPlacementValidator(tile, this._pointerEntityCurVert))
      )
        suc = false;
    } else if (placementType === EntityPlacementType.EDGE) {
      let sameEdge = tile.entities.filter((e) => {
        return (
          e.placementType === EntityPlacementType.EDGE &&
          e.placementEdge === this._pointerEntityCurEdge
        );
      });

      if (
        sameEdge.length > 0 ||
        this._pointerEntityCurEdge === -1 ||
        (this.onEntityPlacementValidator !== undefined &&
          !this.onEntityPlacementValidator(tile, this._pointerEntityCurEdge))
      )
        suc = false;
    } else {
    }

    if (suc && this._entityToPointerAnimID) {
      this._view.animationManager.removeOnAnimateListener(
        this._entityToPointerAnimID
      );
      this._entityToPointerAnimID = null;
    }

    if (!suc) {
      return false;
    }

    this._pointerEntity.setPlacementType(
      placementType,
      placementType === EntityPlacementType.VERTEX
        ? this._pointerEntityCurVert
        : placementType === EntityPlacementType.EDGE
        ? this._pointerEntityCurEdge
        : -1
    );

    if (placementType === EntityPlacementType.EDGE) {
      const neighs = tile.getEdgeNeighbors(this._pointerEntityCurEdge);
      const maxHeight = Math.max(
        ...neighs.map((n) => n.tile.geometry.boundingBox.max.z),
        tile.geometry.boundingBox.max.z
      );

      this._pointerEntity.position.copy(
        tile
          .getEdgeWorldPosition(this._pointerEntityCurEdge)
          .setY(maxHeight + this._pointerEntity.heightOffset)
      );
    } else if (placementType === EntityPlacementType.VERTEX) {
      const neighs = tile.getVertexNeighbors(this._pointerEntityCurVert);
      const maxHeight = Math.max(
        ...neighs.map((n) => n.tile.geometry.boundingBox.max.z),
        tile.geometry.boundingBox.max.z
      );

      this._pointerEntity.position.copy(
        tile
          .getVertexWorldPosition(this._pointerEntityCurVert)
          .setY(maxHeight + this._pointerEntity.heightOffset)
      );
    } else {
      this._pointerEntity.position.setY(
        tile.geometry.boundingBox.max.z + this._pointerEntity.heightOffset
      );
    }

	this._view.remove(this._pointerEntity);
    this._view.map?.setEntityOnTile(this._pointerEntity, tile);

    this._pointerEntity = null;
    this._pointerEntityCurVert = -1;
    this._pointerEntityCurEdge = -1;
    return true;
  }

  private _keyListeners: { [key: string]: Array<() => void> } = {};

  public addKeyDownListener(key: string, callback: () => void) {
    if (!(key in this._keyListeners)) {
      this._keyListeners[key] = [];
    }

    this._keyListeners[key].push(callback);
  }

  public removeKeyDownListener(key: string, callback?: () => void): void {
    if (!(key in this._keyListeners)) return;

    const index = this._keyListeners[key].indexOf(callback);

    if (index !== -1) {
      this._keyListeners[key].splice(index, 1);
    }
  }

  public addOnTileMouseInputListener(
    inputType: InputType,
    callback: (args: { data: Tile; mousePos: Vector3 }) => void
  ) {
    super.addEventListener("tile-" + inputType.toString(), callback);
  }

  public removeOnTileMouseInputListener(
    inputType: InputType,
    callback?: (args: { data: Tile; mousePos: Vector3 }) => void
  ) {
    super.removeEventListener("tile-" + inputType.toString(), callback);
  }

  public addOnEntityMouseInputListener(
    inputType: InputType,
    callback: (args: { data: MeshEntity; mousePos: Vector3 }) => void
  ) {
    super.addEventListener("entity-" + inputType.toString(), callback);
  }

  public removeOnEntityMouseInputListener(
    inputType: InputType,
    callback?: (args: { data: MeshEntity; mousePos: Vector3 }) => void
  ) {
    super.removeEventListener("entity-" + inputType.toString(), callback);
  }

  public addOnCanvasMouseInputListener(
    inputType: InputType,
    callback: (args: { data: IEntity | Tile | null; mousePos: Vector3 }) => void
  ) {
    super.addEventListener("canvas-" + inputType.toString(), callback);
  }

  public removeOnCanvasMouseInputListener(
    inputType: InputType,
    callback?: (args: {
      data: IEntity | Tile | null;
      mousePos: Vector3;
    }) => void
  ) {
    super.removeEventListener("canvas-" + inputType.toString(), callback);
  }

  public addOnSpriteMouseInputListener(
    inputType: InputType,
    callback: (args: { data: Sprite; mousePos: Vector3 }) => void
  ) {
    super.addEventListener("sprite-" + inputType.toString(), callback);
  }

  public removeOnSpriteMouseInputListener(
    inputType: InputType,
    callback?: (args: { data: Sprite; mousePos: Vector3 }) => void
  ) {
    super.removeEventListener("sprite-" + inputType.toString(), callback);
  }

  public addOnSpriteEntityMouseInputListener(
    inputType: InputType,
    callback: (args: { data: Sprite; mousePos: Vector3 }) => void
  ) {
    super.addEventListener("sprite-entity-" + inputType.toString(), callback);
  }

  public removeOnSpriteEntityMouseInputListener(
    inputType: InputType,
    callback?: (args: { data: Sprite; mousePos: Vector3 }) => void
  ) {
    super.removeEventListener(
      "sprite-entity-" + inputType.toString(),
      callback
    );
  }

  public addOnAnyMouseInputListener(
    inputType: InputType,
    callback: (args: {
      data: IEntity | Tile | Sprite | null;
      mousePos: Vector3;
    }) => void
  ) {
    super.addEventListener("generic-" + inputType.toString(), callback);
  }

  public removeOnAnyMouseInputListener(
    inputType: InputType,
    callback: (args: {
      data: IEntity | Tile | Sprite | null;
      mousePos: Vector3;
    }) => void
  ) {
    super.removeEventListener("generic-" + inputType.toString(), callback);
  }

  public removeAllListeners() {
    this.registeredEvents = new Map<string, Array<(args?: any) => void>>();
    this._keyListeners = {};
  }

  private _initMouseCaster(view: View): void {
    this._mouseCaster = new MouseCaster(
      view.container,
      view.camera,
      this.config.documentRaycast
        ? document.documentElement
        : view.renderer.domElement,
      this
    );

    this._mouseCaster.signal.add(
      (
        evt: string,
        eventData: {
          data: Tile | Mesh | Object3D | MouseEvent | MeshEntity | IEntity;
          mousePos: Vector3;
        }
      ) => {
        const data = eventData.data;
        if (this.active && this._view?.map?.canInteract) {
          if (data instanceof Tile) {
            if (evt === InputType.MOUSE_OVER) {
              this._view.map?.hightlightTile(
                data,
                true,
                !this._view?.map?.highlightedTile
              );
            }

            if (evt === InputType.MOUSE_OUT && !this._pointerEntity) {
              this._view.map?.unHighlightCurrentHighlightedTile();
            }

            if (evt === InputType.WHEEL_CLICK) {
              //(tile as Tile).toggle();
              this.panCameraTo(
                this._view?.map?.highlightedTile || data,
                500,
                () => {
                  // this.renderer.domElement.requestPointerLock();
                  // this._view.map?.unSelectCurrentSelectedTile();
                },
                () => {
                  // or we can use the mouse's raw coordinates to access the cell directly, just for fun:
                  // this._view.map?.getTileAtCell(this._view.map?.grid.pixelToCell(this._mouseCaster.position))?.select();
                  // this._view.map?.selectTile(data);
                  // document.exitPointerLock();
                },
                Animation.easeInQuad
              );
            }

            if (this.registeredEvents.get("tile-" + InputType[evt])) {
              this.registeredEvents
                .get("tile-" + InputType[evt])
                .forEach((fnc) =>
                  fnc({ data: data, mousePos: eventData.mousePos })
                );
            }
          } else if (this._view.map?.highlightedTile !== undefined) {
            if (this.registeredEvents.get("tile-" + InputType[evt])) {
              this.registeredEvents
                .get("tile-" + InputType[evt])
                .forEach((fnc) =>
                  fnc({
                    data: this._view.map?.highlightedTile,
                    mousePos: eventData.mousePos,
                  })
                );
            }
          }

          if (data instanceof MeshEntity) {
            if (this._pointerEntity) {
              // switch (evt) {
              // 	case InputType.MOUSE_OVER:
              // 		data?.setTransparent(true);
              // 		break;
              // 	case InputType.MOUSE_OUT:
              // 		data?.setTransparent(false);
              // 		break;
              // }
            } else {
              if (evt === InputType.MOUSE_OVER) {
                if (this._view.map?.highlightedTile)
                  this._view.map?.highlightedTile.unhighlight();

                data?.highlight(true);
              }

              if (evt === InputType.MOUSE_OUT) {
                if (this._view.map?.highlightedTile)
                  this._view.map?.hightlightTile(
                    this._view.map?.highlightedTile
                  );

                data?.highlight(false);
              }

              if (this.registeredEvents.get("entity-" + InputType[evt])) {
                this.registeredEvents
                  .get("entity-" + InputType[evt])
                  .forEach((fnc) =>
                    fnc({ data: data, mousePos: eventData.mousePos })
                  );
              }
            }
          }

          if (
            data !== undefined &&
            data !== null &&
            isEntity(data) &&
            !this._pointerEntity
          ) {
            if (evt === InputType.MOUSE_OVER) {
              data?.onHighlight();
            }

            if (evt === InputType.MOUSE_OUT) {
              data?.onUnhighlight();
            }

			if(evt === InputType.LEFT_CLICK) {
				data?.onClick();
			}
          }

          if (data instanceof SpriteEntity) {
            if (evt === InputType.MOUSE_OVER && data.onHighlight)
              data.onHighlight();
            if (evt === InputType.MOUSE_OUT && data.onUnHighlight)
              data.onUnHighlight();

            if (this.registeredEvents.get("sprite-entity-" + InputType[evt])) {
              this.registeredEvents
                .get("sprite-entity-" + InputType[evt])
                .forEach((fnc) =>
                  fnc({ data: data, mousePos: eventData.mousePos })
                );
            }
          }

          if (data instanceof Sprite) {
            if (this.registeredEvents.get("sprite-" + InputType[evt])) {
              this.registeredEvents
                .get("sprite-" + InputType[evt])
                .forEach((fnc) =>
                  fnc({ data: data, mousePos: eventData.mousePos })
                );
            }
          }
        } else if (this.active) {
          if (this.registeredEvents.get("canvas-" + InputType[evt])) {
            this.registeredEvents
              .get("canvas-" + InputType[evt])
              .forEach((fnc) =>
                fnc({ data: data, mousePos: eventData.mousePos })
              );
          }
        }

        if (this.active) {
          if (this.registeredEvents.get("generic-" + InputType[evt])) {
            this.registeredEvents
              .get("generic-" + InputType[evt])
              .forEach((fnc) =>
                fnc({ data: data, mousePos: eventData.mousePos })
              );
          }
        }
      }
    );
  }

  private _ZOOMDUR = 10;
  public zoom(
    dir: ZoomDirection,
    amt = this.config.zoomDelta,
    dur = this._ZOOMDUR,
    onStart: () => void = undefined,
    onComplete: (success) => void = undefined,
    onCancel: () => void = undefined,
    cancelCurrentZoom: boolean = true,
    targetDistance?: number,
    ease = Animation.easeInQuad
  ): boolean {
    if (!this.active) {
      return;
    }

    if (dur <= 0) dur = 10;
    let result = this._view.zoom(
      dir,
      amt,
      dur,
      () => {
        this.zooming = true;
        if (onStart) onStart();
      },
      (success) => {
        this.zooming = false;

        // this._view.saveScene();
        if (success) {
          this.triggerEvent(ControllerEvent.ZOOM), { type: dir };
        }
        if (onComplete) onComplete(success);
      },
      () => {
        this.zooming = false;
        if (onCancel) onCancel();
      },
      cancelCurrentZoom,
      targetDistance,
      ease
    );

    return result;
  }

  public zoomMax(
    dir: ZoomDirection,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined
  ) {
    this.zoomToDistance(
      dir === ZoomDirection.IN
        ? this.config.minDistance
        : this.config.maxDistance,
      dur,
      onStart,
      onComplete,
      onCancel
    );
  }

  public zoomToDistance(
    distance: number,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined
  ) {
    this.zoom(
      distance < this._view.currentDistance
        ? ZoomDirection.IN
        : ZoomDirection.OUT,
      this.config.zoomDelta,
      dur,
      () => {
        if (onStart) onStart();
      },
      (success) => {
        if (onComplete) onComplete();
      },
      onCancel,
      true,
      distance
    );
  }

  private _zoomInertia(dir: ZoomDirection, onComplete?: (success) => void) {
    const zoomLevels = 1; // Number of intermediate zoom levels
    const maxZoomDuration = this._ZOOMDUR + 1000; // Maximum duration of each zoom level

    const zoomRecursive = (level: number) => {
      if (this._shouldKeepInertia && level > 0) {
        const zoomAmount = (this.config.zoomDelta * 5) / (level * zoomLevels);
        const zoomDuration = maxZoomDuration * (level / zoomLevels);
        this.zoom(
          dir,
          zoomAmount,
          zoomDuration,
          () => {
            this._inertiaZooming = true;
          },
          (success) => {
            if (this._shouldKeepInertia && success) {
              zoomRecursive(level - 1);
            } else {
              this._inertiaZooming = false;
              if (onComplete) onComplete(success);
            }
          },
          () => {
            this._shouldKeepInertia = false;
            this._inertiaZooming = false;
          },
          true,
          undefined,
          Animation.easeInQuad
        );
      } else {
        this._shouldKeepInertia = false;
        this._inertiaZooming = false;
        if (onComplete) onComplete(false);
      }
    };

    zoomRecursive(zoomLevels);
  }

  update(): void {
    this._mouseCaster?.update();
    this.controls?.update();
    // this._view?.camera?.updateProjectionMatrix();
  }

  dispose(): void {
    this.removeAllListeners();
    this._view?.renderer?.domElement?.ownerDocument?.removeEventListener(
      "keydown",
      this._onKeyDown.bind(this)
    );
    this._mouseCaster?.dispose(this);
    this._mouseCaster = null;
    this.controls?.dispose();
    this.controls = null;
  }

  // private _panAnimID: string;
  // panInDirection(direction: Vector2): void {
  // 	if (this._panAnimID && direction.x === 0 && direction.y === 0) {
  // 		this._panning = false;
  // 		this._view.animationManager.cancelOnAnimate(this._panAnimID);
  // 	} else {
  // 		this._panning = true;
  // 		this._panAnimID = this._view.animationManager.addOnAnimate(() => {
  // 			if (this._view.map?.highlightedTile) {
  // 				this.controls.pan(direction.x, direction.y);
  // 			} else {
  // 				this._panning = false;
  // 				this._view.animationManager.cancelOnAnimate(this._panAnimID);
  // 				this._panAnimID = null;
  // 			}
  // 		})
  // 	}
  // 	// while (this._view.animationManager.animations.length >= 1) this._view.animationManager.cancelAnimation();
  // 	// this.controls.pan(direction.x, direction.y);
  // }

  panCameraTo(
    tile: Tile | Cell | Vector3,
    durationMs: number = 500,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    ease: (t: number) => number = Animation.easeInOutQuad
  ): void {
    if (!this.active) return;

    this._view.panCameraTo(
      tile,
      durationMs,
      () => {
        this._panning = true;
        if (onStart) onStart();
      },
      () => {
        this._panning = false;
        // this._view.saveScene();
        this.triggerEvent(ControllerEvent.PAN, {
          target: this.target.clone(),
          currentDistance: this.currentDistance,
          currentPolarAngle: this.currentPolarAngle,
          currentAzimuthAngle: this.currentAzimuthAngle,
          type: ControllerEvent.PAN,
          active: this.active,
        });
        if (onComplete) onComplete();
      },
      ease
    );
  }

  rotateHorizontalTo(
    angle: number,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined,
    cancelCurrentRotate = true
  ) {
    if (!this.active) return;

    this._view.rotateHorizontalTo(
      angle,
      dur,
      () => {
        if (onStart) onStart();
      },
      () => {
        this.triggerEvent(ControllerEvent.ROTATE, {
          target: this.target.clone(),
          currentDistance: this.currentDistance,
          currentPolarAngle: this.currentPolarAngle,
          currentAzimuthAngle: this.currentAzimuthAngle,
          type: "HORIZONTAL",
          active: this.active,
        });
        // this._view.saveScene();

        if (onComplete) onComplete();
      },
      () => {
        // on cancel
        if (onCancel) onCancel();
      },
      cancelCurrentRotate
    );
  }

  rotateVerticalTo(
    angle: number,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined,
    cancelCurrentRotate = true
  ) {
    this._view.rotateVerticalTo(
      angle,
      dur,
      () => {
        if (onStart) onStart();
      },
      () => {
        this.triggerEvent(ControllerEvent.ROTATE, {
          target: this.target.clone(),
          currentDistance: this.currentDistance,
          currentPolarAngle: this.currentPolarAngle,
          currentAzimuthAngle: this.currentAzimuthAngle,
          type: "VERTICAL",
          active: this.active,
        });
        // this._view.saveScene();

        if (onComplete) onComplete();
      },
      () => {
        // on cancel
        if (onCancel) onCancel();
      },
      cancelCurrentRotate
    );
  }

  toggleControls(): void {
    this.active = !this.active;
  }

  updateControlSettings(
    settings: ControllerSettingsParams,
    animated = true
  ): void {
    if (
      settings?.target !== undefined &&
      !(settings?.target instanceof Vector3)
    ) {
      settings.target = new Vector3().fromArray(settings.target);
    }

    this.config = Engine.Tools.merge(
      this.config,
      settings ?? {}
    ) as ControllerSettings;
    if (animated) {
      if (
        settings.minDistance !== undefined &&
        settings.minDistance > this._view.currentDistance
      ) {
        this.zoomToDistance(settings.minDistance, animated ? 1000 : 0);
      }

      if (
        settings.maxDistance !== undefined &&
        settings.maxDistance < this._view.currentDistance
      ) {
        this.zoomToDistance(settings.maxDistance, animated ? 1000 : 0);
      }

      if (
        settings.currentDistance !== undefined &&
        settings.currentDistance !== this._view.currentDistance
      ) {
        this.zoomToDistance(settings.currentDistance, animated ? 1000 : 0);
      }

      if (
        settings.minPolarAngle !== undefined &&
        settings.minPolarAngle !== Tools.radToDeg(this.controls.minPolarAngle)
      ) {
        let prev = Tools.radToDeg(this.controls.minPolarAngle);
        this.controls.minPolarAngle = Tools.degToRad(settings.minPolarAngle);
        if (settings.minPolarAngle > prev)
          this.rotateVerticalTo(settings.minPolarAngle, animated ? 1000 : 0);
      }

      if (
        settings.maxPolarAngle !== undefined &&
        settings.maxPolarAngle !== Tools.radToDeg(this.controls.maxPolarAngle)
      ) {
        let prev = this.controls.maxPolarAngle;
        this.controls.maxPolarAngle = Tools.degToRad(settings.maxPolarAngle);
        if (settings.maxPolarAngle < prev)
          this.rotateVerticalTo(settings.maxPolarAngle, animated ? 1000 : 0);
      }

      if (
        settings.currentPolarAngle !== undefined &&
        settings.currentPolarAngle !==
          Tools.radToDeg(this.controls.getPolarAngle())
      ) {
        this.rotateVerticalTo(settings.currentPolarAngle, animated ? 1000 : 0);
      }

      if (
        settings.minAzimuthAngle !== undefined &&
        settings.minAzimuthAngle !==
          Tools.radToDeg(this.controls.minAzimuthAngle)
      ) {
        let prev = Tools.radToDeg(this.controls.minAzimuthAngle);
        this.controls.minAzimuthAngle = Tools.degToRad(
          settings.minAzimuthAngle
        );
        if (settings.minAzimuthAngle > prev) {
          this.rotateHorizontalTo(
            settings.minAzimuthAngle,
            animated ? 1000 : 0
          );
        }
      }

      if (
        settings.maxAzimuthAngle !== undefined &&
        settings.maxAzimuthAngle !==
          Tools.radToDeg(this.controls.maxAzimuthAngle)
      ) {
        let prev = Tools.radToDeg(this.controls.maxAzimuthAngle);
        this.controls.maxAzimuthAngle = Tools.degToRad(
          settings.maxAzimuthAngle
        );
        if (settings.maxAzimuthAngle < prev) {
          this.rotateHorizontalTo(
            settings.maxAzimuthAngle,
            animated ? 1000 : 0
          );
        }
      }

      if (
        settings.currentAzimuthAngle !== undefined &&
        settings.currentAzimuthAngle !==
          Tools.radToDeg(this.controls.getAzimuthalAngle())
      ) {
        this.rotateHorizontalTo(
          settings.currentAzimuthAngle,
          animated ? 1000 : 0
        );
      }

      if (
        settings.target !== undefined &&
        this.target.distanceTo(settings.target as Vector3) !== 0
      ) {
        this.panCameraTo(settings.target as Vector3, animated ? 1000 : 0);
      }
    }

    this.controls.updateSettings(settings);

    // if (settings.autoRotate !== undefined) {
    // 	this.toggleHorizontalRotation(settings.autoRotate);
    // 	this.controls.autoRotate = settings.autoRotate;
    // } else {
    // 	this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
    // }

    // if (settings.minPolarAngle)
    // 	this.controls.minPolarAngle = settings.minPolarAngle;
    // if (settings.maxPolarAngle)
    // 	this.controls.maxPolarAngle = settings.maxPolarAngle
    // if (settings.maxAzimuthAngle)
    // 	this.controls.maxAzimuthAngle = settings.maxAzimuthAngle;
    // if (settings.minAzimuthAngle)
    // 	this.controls.minAzimuthAngle = settings.minAzimuthAngle;
  }

  public toJSON(): ControllerSettings {
    return {
      ...this.config,
      currentDistance: this.currentDistance,
      currentAzimuthAngle: this.currentAzimuthAngle,
      currentPolarAngle: this.currentPolarAngle,
      target: this.target.toArray(),
    } as ControllerSettings;
  }

  public fromJSON(config: ControllerSettings) {
    this.updateControlSettings(config, false);
  }

  private _curMinRot: number;
  private _curMaxRot: number;
  public toggleRotation(enabled) {
    if (!enabled) {
      this._curMinRot = this.config.minAzimuthAngle;
      this._curMaxRot = this.config.maxAzimuthAngle;
    }

    this.updateControlSettings(
      {
        userHorizontalRotation: enabled,
        minAzimuthAngle: enabled ? this._curMinRot : 180,
        maxAzimuthAngle: enabled ? this._curMaxRot : 180,
        currentAzimuthAngle: 180,
      },
      false
    );
  }
}

export enum ZoomDirection {
  IN = "IN",
  OUT = "OUT",
  NONE = "NONE",
}

export default Controller;
