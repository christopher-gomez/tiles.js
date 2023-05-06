import { ViewController, CameraControlSettings, CameraControlSettingsParams } from "../utils/Interfaces"
import { OrbitControls } from "../lib/OrbitControls"
import { BufferAttribute, Euler, MOUSE, Matrix4, Mesh, MeshBasicMaterial, Object3D, Quaternion, SphereGeometry, Vector2, Vector3 } from "three"
import Engine from '../Engine';
import View from "../scene/View";
import Tile from "../map/Tile";
import Cell from "../grid/Cell";
import Animation from '../utils/Animation';
import EventEmitter from "../utils/EventEmitter";
import Tools from "../utils/Tools";
import MouseCaster, { InputType } from "../utils/MouseCaster";
import Entity, { EntityPlacementType } from "../env/Entity";

export class Controller extends EventEmitter implements ViewController {

	public controls: OrbitControls;

	set active(active: boolean) {
		// if (this._view)
		// 	this._view.controlled = active;

		if (!this.controls) return;

		if (this.controls) this.controls.enabled = active;

		this.triggerEvent('active', this.controls.enabled);
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

	public get panDirection(): Vector2 {
		if (this._panDirection) return this._panDirection;
		else {
			this._panDirection = new Vector2();
			return this._panDirection;
		}
	}

	public set panDirection(val: Vector2) {
		this._panDirection = val;
	}

	constructor(private _view: View) {
		super();

		if (!_view) {
			throw new Error('Controller missing View reference');
		}
	}

	init(config?: CameraControlSettings) {
		this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);

		if (config) {
			this._initControls(config);
		} else {
			this.active = false;
		}
	}

	config: CameraControlSettings;
	private _initControls(config: CameraControlSettings): void {
		this.config = config;
		this.active = config.controlled;

		this._view.currentDistance = config.currentDistance;
		this.controls.zoomSpeed = config.zoomAmount;
		// this._view.hotEdges = config.hotEdges;
		this.controls.autoRotate = config.autoRotate;
		// this.controls.enableDamping = config.enableDamping;
		// this.controls.dampingFactor = config.dampingFactor;
		// this.controls.screenSpacePanning = config.screenSpacePanning;
		this._view.currentPolarAngle = config.currentPolarAngle;
		if (config.maxAzimuthAngle)
			this.controls.maxAzimuthAngle = config.maxAzimuthAngle;
		if (config.minAzimuthAngle)
			this.controls.minAzimuthAngle = config.minAzimuthAngle;

		this.controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };

		this._initEvents();
	}

	private _inertiaTimeout;
	private _shouldKeepInertia = false;
	private _inertiaZooming = false;

	private _cameraHighlightFocusTimeout: number;
	private _shouldFocusHighlightedOnZoom = true;
	private _initEvents() {
		this.controls.addEventListener('zoom-in', (e) => {
			if (e.event.deltaY > -2 || !this.active) return;

			if (e.state === 'start') {
				clearTimeout(this._inertiaTimeout);
				if (this._inertiaZooming)
					this._view.animationManager.stopAnimation('zoom');
			}

			if (e.state === 'end') {
				this.zoom(ZoomDirection.IN,
					// this.zooming || (this._view.animationManager.getCurAnimInQueue('zoom') && !this._view.animationManager.getCurAnimInQueue('zoom').complete) ?
					// 	this._curZoomAmt + 5 :
					this.config.zoomAmount,
					// this.zooming || (this._view.animationManager.getCurAnimInQueue('zoom') && !this._view.animationManager.getCurAnimInQueue('zoom').complete) ?
					// 	this._curZoomDur - 10 :
					this._ZOOMDUR,
					() => {
						// clearTimeout(this._inertiaTimeout);
						// if (this._shouldFocusHighlightedOnZoom && this._view.map.highlightedTile && this._view.cameraFocusedTile !== this._view.map.highlightedTile) {
						// 	let tile = this._view.map.highlightedTile;
						// 	this.panCameraTo(tile.position, 2000);
						// 	this._shouldFocusHighlightedOnZoom = false;
						// }
					}, (success) => {
						if (success)
							this._zoomInertia(ZoomDirection.IN, () => {
								// this._cameraHighlightFocusTimeout = window.setTimeout(() => {
								// 	this._shouldFocusHighlightedOnZoom = true;
								// }, 1000);
							});
					}, () => {
						// clearTimeout(this._cameraHighlightFocusTimeout)
						// this._cameraHighlightFocusTimeout = window.setTimeout(() => {
						// 	this._shouldFocusHighlightedOnZoom = true;
						// }, 500);
					});
			}
		});

		this.controls.addEventListener('zoom-out', (e) => {
			if (e.event.deltaY < 2 || !this.active) return;

			if (e.state === 'start') {
				clearTimeout(this._inertiaTimeout);
				if (this._inertiaZooming)
					this._view.animationManager.stopAnimation('zoom');
			}

			if (e.state === 'end') {
				this.zoom(ZoomDirection.OUT,
					// this.zooming || (this._view.animationManager.getCurAnimInQueue('zoom') && !this._view.animationManager.getCurAnimInQueue('zoom').complete) ?
					// 	this._curZoomAmt + 5 :
					this.config.zoomAmount,
					// this.zooming || (this._view.animationManager.getCurAnimInQueue('zoom') && !this._view.animationManager.getCurAnimInQueue('zoom').complete) ?
					// 	this._curZoomDur - 10 :
					this._ZOOMDUR, () => {
						// clearTimeout(this._inertiaTimeout);
						// const centerTile = this._view.map.getTileAtPosition(new Vector3(0, 0, 0));
						// this.panCameraTo(centerTile, 2000);
						// this._shouldFocusHighlightedOnZoom = false;
						// }
					}, (success) => {
						if (success)
							this._zoomInertia(ZoomDirection.OUT, () => {
								// this._cameraHighlightFocusTimeout = window.setTimeout(() => {
								// 	this._shouldFocusHighlightedOnZoom = true;
								// }, 500);
							});
					}, () => {
						// clearTimeout(this._cameraHighlightFocusTimeout)
						// this._cameraHighlightFocusTimeout = window.setTimeout(() => {
						// 	this._shouldFocusHighlightedOnZoom = true;
						// }, 250);
					});
			}
		});

		this._view.renderer.domElement.ownerDocument.addEventListener('keydown', (e) => {
			if (e.code in this._keyListeners) {
				this._keyListeners[e.code].forEach(x => x())
			}
		});

		this._initMouseCaster();
	}

	addKeyListener(callback: (e: KeyboardEvent) => void) {
		this.addEventListener('keyup', callback);
	}

	private _pointerEntity: Entity;
	// togglePointerEntity(type?: string): Mesh | null {
	// 	if (!this._pointerEntity) {
	// 		if (this._view.map.getTileAtPosition(this.mouseCaster.position)) {
	// 			let mesh = this.createEntity(type);
	// 			this.attachEntityToPointer(mesh);
	// 			return mesh;
	// 		}
	// 	} else this.removeEntityFromPointer();

	// 	return null;
	// }

	setPointerEntity(type?: string): Entity | null {
		if (this._pointerEntity) {
			this.removeEntityFromPointer();
		}

		if (this._view.map.getTileAtPosition(this.mouseCaster.position)) {
			let mesh = this.createEntity(type);
			this.attachEntityToPointer(mesh);
			return mesh;
		}

		return null;
	}

	createEntity(type?: string): Entity {
		let mesh: Entity;
		if (!type || !(type in this._view.map.entities)) {
			const geometry = new SphereGeometry(3, 16, 8);
			const material = new MeshBasicMaterial();
			mesh = new Entity("sphere", geometry, material);
		} else {
			mesh = this._view.map.entities[type]();
		}

		if (mesh)
			this._view.add(mesh);

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
	attachEntityToPointer(entity: Entity) {
		this.removeEntityFromPointer();

		this._pointerEntity = entity;
		this.entityOnMap = false;
		this._entityToPointerAnimID = this._view.animationManager.addOnAnimate(() => {
			let tile = this._view.map.highlightedTile;
			if (tile) {

				entity.setMaterialEmmisiveColor('white');
				entity.setMaterialTransparent(false);

				let pos: Vector3;
				let numVerts = tile.tileShape === Engine.TileShapes.HEX ? 6 : 4;
				let min = -1;
				let minDistance;

				if (this.vertexSnapping) {
					for (let i = 0; i < numVerts; i++) {
						let pos = tile.getVertexWorldPosition(i);
						let distance = pos.distanceTo(this.mouseCaster.position);

						if (min === -1 || distance < minDistance) {
							if (tile.entities.find(t => (t.placementVertex === i))) {
								continue;
							}

							if (tile.sharedVertEntities.find(e => e.vertex === i)) {
								continue;
							}

							minDistance = distance;
							min = i;
							this._pointerEntityCurVert = min;
						}
					}

					if (min === -1) {
						entity.setMaterialEmmisiveColor('red');
						entity.setMaterialTransparent(true);
						pos = tile.position.clone().setY(tile.geometry.boundingBox.max.z + 3);
					} else {
						let neighs = tile.getVertexNeighbors(min);
						let maxHeight = Math.max(...neighs.map(n => n.tile.geometry.boundingBox.max.z), tile.geometry.boundingBox.max.z);

						let worldPos = tile.getVertexWorldPosition(min);
						pos = worldPos.clone().setY(maxHeight + entity.heightOffset);

						const start = worldPos;
						const end = worldPos;

						this._rotMat.lookAt(start, end, entity.up);

						this._targetQuat.setFromRotationMatrix(this._rotMat);
						entity.quaternion.set(this._targetQuat.x, this._targetQuat.y, this._targetQuat.z, this._targetQuat.w);
					}

				} else if (this.edgeSnapping) {

					for (let i = 0; i < numVerts; i++) {
						let pos = tile.getEdgeWorldPosition(i);
						let distance = pos.distanceTo(this.mouseCaster.position);

						if (min === -1 || distance < minDistance) {
							if (tile.entities.find(t => (t.placementEdge === i))) {
								continue;
							}

							if (tile.sharedEdgeEntities.find(e => e.edge === i)) {
								continue;
							}

							minDistance = distance;
							min = i;
							this._pointerEntityCurEdge = min;
						}
					}

					if (min === -1) {
						entity.setMaterialEmmisiveColor('red');
						entity.setMaterialTransparent(true);
						pos = tile.position.clone().setY(tile.geometry.boundingBox.max.z + 3);
					} else {
						let neighs = tile.getEdgeNeighbors(min);

						let maxHeight = Math.max(...neighs.map(n => n.tile.geometry.boundingBox.max.z), tile.geometry.boundingBox.max.z);

						pos = tile.getEdgeWorldPosition(min).setY(maxHeight + entity.heightOffset);
						const start = tile.getVertexWorldPosition(min);
						const end = tile.getVertexWorldPosition(min === numVerts - 1 ? 0 : min + 1);

						this._rotMat.lookAt(end, start, entity.up);

						this._targetQuat.setFromRotationMatrix(this._rotMat);
						entity.quaternion.set(this._targetQuat.x, this._targetQuat.y, this._targetQuat.z, this._targetQuat.w);
					}
				}
				else {
					pos = tile.position.clone().setY(tile.geometry.boundingBox.max.z + 1);
				}

				if (this.entityOnMap)
					entity.position.set(pos.x, pos.y, pos.z);
				else {
					this._view.add(entity, pos);
					this.entityOnMap = true;
				}

				this._view.map.hightlightTile(tile);
			} else {
				this._view.remove(entity);
				this._view.map.unHighlightCurrentHighlightedTile();
				this.entityOnMap = false;
			}
		});
	}

	removeEntityFromPointer() {
		if (this._entityToPointerAnimID) {
			this._view.animationManager.cancelOnAnimate(this._entityToPointerAnimID);
			this._entityToPointerAnimID = null;
		}

		if (this._pointerEntity) this._view.remove(this._pointerEntity);
		this._pointerEntity = null;
		this._pointerEntityCurVert = -1;
		this._pointerEntityCurEdge = -1;
	}

	private _pointerEntityCurVert = -1;
	private _pointerEntityCurEdge = -1;

	setPointerEntityOnTile(tile: Tile): boolean {
		const placementType = this.vertexSnapping ? EntityPlacementType.VERTEX : this.edgeSnapping ? EntityPlacementType.EDGE : EntityPlacementType.CENTER;

		let suc = true;
		if (placementType === EntityPlacementType.VERTEX) {
			let sameVert = tile.entities.filter(e => {
				return (e.placementType === EntityPlacementType.VERTEX && e.placementVertex === this._pointerEntityCurVert)
			});

			if (sameVert.length > 0 || this._pointerEntityCurVert === -1) suc = false;
		} else if (placementType === EntityPlacementType.EDGE) {
			let sameEdge = tile.entities.filter(e => {
				return (e.placementType === EntityPlacementType.EDGE && e.placementEdge === this._pointerEntityCurEdge)
			});

			if (sameEdge.length > 0 || this._pointerEntityCurEdge === -1) suc = false;
		} else {

		}

		if (suc && this._entityToPointerAnimID) {
			this._view.animationManager.cancelOnAnimate(this._entityToPointerAnimID);
			this._entityToPointerAnimID = null;
		}

		if (!suc) {
			return false;
		}

		this._pointerEntity.setPlacementType(placementType, placementType === EntityPlacementType.VERTEX ? this._pointerEntityCurVert : placementType === EntityPlacementType.EDGE ? this._pointerEntityCurEdge : -1);
		this._view.map.setEntityOnTile(this._pointerEntity, tile);
		this._view.remove(this._pointerEntity);

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

	public removeKeyDownListener(key: string, callback: () => void): void {
		if (!(key in this._keyListeners)) return;

		const index = this._keyListeners[key].indexOf(callback);

		if (index !== -1) {
			this._keyListeners[key].splice(index, 1);
		}
	}

	public addOnTileMouseInputListener(inputType: InputType, callback: (args: { data: Tile, order?: number }) => void) {
		this.addEventListener('tile-' + inputType.toString(), callback);
	}

	public removeOnTileMouseInputListener(inputType: InputType, callback: (args: { data: Tile, order?: number }) => void) {
		this.removeEventListener('tile-' + inputType.toString(), callback);
	}

	public addOnEntityMouseInputListener(inputType: InputType, callback: (args: { data: Entity, order?: number }) => void) {
		this.addEventListener('entity-' + inputType.toString(), callback);
	}

	public removeOnEntityMouseInputListener(inputType: InputType, callback: (args: { data: Entity, order?: number }) => void) {
		this.removeEventListener('entity-' + inputType.toString(), callback);
	}
	private _initMouseCaster(): void {
		this._mouseCaster = new MouseCaster(this._view.container, this._view.camera, this._view.renderer.domElement, this);
		this._mouseCaster.signal.add((evt: string, eventData: { data: Tile | Mesh | Object3D | MouseEvent | Entity, order?: number }) => {
			if (this.active) {

				const data = eventData.data;

				if (data instanceof Tile) {

					if (evt === InputType.MOUSE_OVER) {
						if (data && this._view.map.canHighlightTiles) {
							// if (!this.panning) {
							// 	(tile as Tile)?.highlight();
							// }

							this._view.map.hightlightTile(data, false, eventData.order == 0 || !this._view.map.highlightedTile || this._view.map.highlightedTile === null);
						}
					}

					if (evt === InputType.MOUSE_OUT) {
						this._view.map.unHighlightCurrentHighlightedTile();
					}

					if (evt === InputType.WHEEL_CLICK) {
						//(tile as Tile).toggle();
						this.panCameraTo(this._view.map.highlightedTile || data, 500, () => {
							// this.renderer.domElement.requestPointerLock();
							this._view.map.unSelectCurrentSelectedTile();
						}, () => {
							// or we can use the mouse's raw coordinates to access the cell directly, just for fun:
							// this._view.map.getTileAtCell(this._view.map.grid.pixelToCell(this._mouseCaster.position))?.select();
							this._view.map.selectTile(data);
							// document.exitPointerLock();
						});
					}

					if (this.registeredEvents.get('tile-' + InputType[evt])) {
						this.registeredEvents.get('tile-' + InputType[evt]).forEach(fnc => fnc({ data: data, order: eventData.order }));
					}
				}

				if (data instanceof Entity) {
					if (evt === InputType.MOUSE_OVER) {
						if (this._view.map.highlightedTile) this._view.map.highlightedTile.unhighlight();
						data?.highlight(true);
					}

					if (evt === InputType.MOUSE_OUT) {
						if (this._view.map.highlightedTile)
							this._view.map.hightlightTile(this._view.map.highlightedTile);
						data?.highlight(false);
					}

					if (this.registeredEvents.get('entity-' + InputType[evt])) {
						this.registeredEvents.get('entity-' + InputType[evt]).forEach(fnc => fnc({ data: data, order: eventData.order }));
					}
				}
			}
		});
	}

	private _ZOOMDUR = 25;
	public zoom(dir: ZoomDirection, amt = this.config.zoomAmount, dur = this._ZOOMDUR, onStart: () => void = undefined, onComplete: (success) => void = undefined, onCancel: () => void = undefined, cancelCurrentZoom: boolean = true, targetDistance?: number): boolean {
		if (dur <= 0) dur = 10;
		let result = this._view.zoom(dir, amt, dur, () => {
			this.zooming = true;
			if (onStart) onStart();
		}, (success) => {
			this.zooming = false;

			if (success) {
				this.triggerEvent('zoom', {
					currentDistance: this._view.currentDistance,
					currentPolarAngle: this._view.currentPolarAngle,
					direction: dir === ZoomDirection.IN ? 'in' : 'out'
				});
			}
			if (onComplete) onComplete(success);
		}, () => {
			this.zooming = false;
			if (onCancel) onCancel();
		}, cancelCurrentZoom, targetDistance);

		return result;
	}

	public zoomMax(dir: ZoomDirection, dur = this._ZOOMDUR, onStart: () => void = undefined, onComplete: () => void = undefined, onCancel: () => void = undefined) {
		this._zoomMax(dir, 0, dur, onStart, onComplete, onCancel)
	}

	private _zoomMax(dir: ZoomDirection, i: number, dur = this._ZOOMDUR, onStart: () => void = undefined, onComplete: () => void = undefined, onCancel: () => void = undefined) {
		this.zoom(dir, this.config.zoomAmount, dur, () => {
			if (i === 0 && onStart) onStart();
		}, (success) => {
			if (!success) {
				if (onComplete)
					onComplete();
			}
			else this._zoomMax(dir, ++i, dur, onStart, onComplete, onCancel);
		}, onCancel, i === 0);
	}

	public zoomToDistance(distance: number, dur = 500, onStart: () => void = undefined, onComplete: () => void = undefined, onCancel: () => void = undefined) {
		this.zoom(distance < this._view.currentDistance ? ZoomDirection.IN : ZoomDirection.OUT, this.config.zoomAmount, dur, () => {
			if (onStart) onStart();
		}, (success) => {
			if (onComplete)
				onComplete();

		}, onCancel, true, distance);
	}

	private _zoomInertia(dir: ZoomDirection, onComplete?: () => void) {
		clearTimeout(this._inertiaTimeout);

		this._shouldKeepInertia = true;
		this._inertiaTimeout = setTimeout(() => {
			this._shouldKeepInertia = false;
			if (onComplete) onComplete();
		}, 250);

		const zoom = (zoomDur, shouldCancel) => {
			if (this._shouldKeepInertia)
				this.zoom(dir, this.config.zoomAmount, zoomDur, () => {
					this._inertiaZooming = true;
				}, (success) => {
					if (this._shouldKeepInertia && success) {
						zoom(zoomDur, true);
					} else {
						this._inertiaZooming = false;
					}
				}, () => {
					this._shouldKeepInertia = false;
					this._inertiaZooming = false;
				}, shouldCancel)
		}

		zoom(this._ZOOMDUR, false);
	}

	update(): void {
		this._mouseCaster?.update();
		this.controls?.update();
	}

	dispose(): void {
		this._mouseCaster?.dispose(this);
		this._mouseCaster = null;
		this.controls?.dispose();
	}

	private _panAnimID: string;
	panInDirection(direction: Vector2): void {
		if (this._panAnimID && direction.x === 0 && direction.y === 0) {
			this._panning = false;
			this._view.animationManager.cancelOnAnimate(this._panAnimID);
		} else {
			this._panning = true;
			this._panAnimID = this._view.animationManager.addOnAnimate(() => {
				if (this._view.map.highlightedTile) {
					this.controls.pan(direction.x, direction.y);
				} else {
					this._panning = false;
					this._view.animationManager.cancelOnAnimate(this._panAnimID);
					this._panAnimID = null;
				}
			})
		}
		// while (this._view.animationManager.animations.length >= 1) this._view.animationManager.cancelAnimation();
		// this.controls.pan(direction.x, direction.y);
	}

	panCameraTo(tile: Tile | Cell | Vector3, durationMs: number = 500, onStart: () => void = undefined, onComplete: () => void = undefined, ease: (t: number) => number = Animation.easeLinear): void {
		this._view.panCameraTo(tile, durationMs,
			() => {
				this._panning = true;
				if (onStart) onStart();
			},
			() => {
				this._panning = false;
				if (onComplete) onComplete();
			});
	}

	toggleControls(): void {
		this.active = !this.active;
	}

	updateControlSettings(settings: CameraControlSettingsParams): void {
		this._view.settings.cameraControlSettings = Engine.Tools.merge(this._view.settings.cameraControlSettings, settings) as CameraControlSettings;

		this.config = this._view.settings.cameraControlSettings;

		if (settings.minDistance !== undefined && settings.minDistance > this._view.currentDistance) {
			this.zoomToDistance(settings.minDistance);
		}

		if (settings.maxDistance !== undefined && settings.maxDistance < this._view.currentDistance) {
			this.zoomToDistance(settings.maxDistance);
		}

		if (settings.currentDistance !== undefined && settings.currentDistance !== this._view.currentDistance && settings.currentDistance < this.config.maxDistance && settings.currentDistance > this.config.minDistance) {
			this.zoomToDistance(settings.currentDistance);
		}

		if(settings.zoomAmount !== undefined) {
			this.controls.zoomSpeed = settings.zoomAmount;
		}

		// // this.controls.minDistance = settings.minDistance || this.controls.minDistance;
		// // this.controls.maxDistance = settings.maxDistance || this.controls.maxDistance;
		// this.controls.zoomSpeed = settings.zoomSpeed || this.controls.zoomSpeed;
		// // settings.hotEdges !== undefined ? this._view.hotEdges = settings.hotEdges : this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
		// if (settings.autoRotate !== undefined) {
		// 	this.toggleHorizontalRotation(settings.autoRotate);
		// 	this.controls.autoRotate = settings.autoRotate;
		// } else {
		// 	this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
		// }
		// settings.enableDamping !== undefined ? this.controls.enableDamping = settings.enableDamping : this.controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
		// this.controls.dampingFactor = settings.dampingFactor || this._view.settings.cameraControlSettings.dampingFactor;
		// settings.screenSpacePanning !== undefined ? this.controls.screenSpacePanning = settings.screenSpacePanning : this.controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
		// if (settings.minPolarAngle)
		// 	this.controls.minPolarAngle = settings.minPolarAngle;
		// if (settings.maxPolarAngle)
		// 	this.controls.maxPolarAngle = settings.maxPolarAngle
		// if (settings.maxAzimuthAngle)
		// 	this.controls.maxAzimuthAngle = settings.maxAzimuthAngle;
		// if (settings.minAzimuthAngle)
		// 	this.controls.minAzimuthAngle = settings.minAzimuthAngle;

	}

	toggleHorizontalRotation(val: boolean): void {
		if (val) {
			this.controls.dispose();
			this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
			this.controls.minDistance = this._view.settings.cameraControlSettings.minDistance;
			this.controls.maxDistance = this._view.settings.cameraControlSettings.maxDistance;
			this.controls.zoomSpeed = this._view.settings.cameraControlSettings.zoomAmount;
			// this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
			this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
			// this.controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
			// this.controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
			this.controls.minPolarAngle = this._view.settings.cameraControlSettings.minPolarAngle;
			this.controls.maxPolarAngle = this._view.settings.cameraControlSettings.maxPolarAngle;
			this.controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };
		} else {
			this.controls.dispose();
			this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
			this.controls.minDistance = this._view.settings.cameraControlSettings.minDistance;
			this.controls.maxDistance = this._view.settings.cameraControlSettings.maxDistance;
			this.controls.zoomSpeed = this._view.settings.cameraControlSettings.zoomAmount;
			// this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
			this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
			// this.controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
			// this.controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
			this.controls.minPolarAngle = this._view.settings.cameraControlSettings.minPolarAngle;
			this.controls.maxPolarAngle = this._view.settings.cameraControlSettings.maxPolarAngle;
			if (this._view.settings.cameraControlSettings.maxAzimuthAngle)
				this.controls.maxAzimuthAngle = this._view.settings.cameraControlSettings.maxAzimuthAngle;
			if (this._view.settings.cameraControlSettings.minAzimuthAngle)
				this.controls.minAzimuthAngle = this._view.settings.cameraControlSettings.minAzimuthAngle;
			this.controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };
		}
	}

	rotateUp(angle: number): void {
		this.controls.rotateUp(angle);
	}


}

export enum ZoomDirection {
	IN,
	OUT
}

export default Controller;