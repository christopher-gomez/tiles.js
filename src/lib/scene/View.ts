import { ViewSettings, CameraControlSettings, ViewController, ViewSettingsParams } from '../utils/Interfaces';
import { WebGLRenderer, DirectionalLight, Scene, AmbientLight, PerspectiveCamera, Mesh, Vector3, Vector2, Object3D, SphereGeometry, MeshBasicMaterial, AxesHelper, DirectionalLightHelper, SpotLight, SpotLightHelper } from 'three';
import Tile from '../map/Tile';
import Cell from '../grid/Cell';
import Controller, { ZoomDirection } from './Controller';
import MouseCaster from '../utils/MouseCaster';
import Tools from '../utils/Tools';
import Map from '../map/Map';
import AnimationManager from '../utils/AnimationManager';
import Animation from '../utils/Animation';
import EventEmitter from '../utils/EventEmitter';
import ResizeObserver from 'resize-observer-polyfill';
import Entity from '../env/Entity';
import Engine from '../Engine';

/*
	Sets up and manages a THREEjs container, camera, and light, making it easy to get going.
	Also provides camera control, mouse control, animation control.

	Assumes full screen.
 */
// 'utils/Tools'
export default class View extends EventEmitter implements ViewController {

	public map: Map;

	public width: number;
	public height: number;
	public renderer: WebGLRenderer;
	public container: Scene;
	public camera: PerspectiveCamera;
	// public controlled: boolean;
	public settings: ViewSettings;
	public controller: Controller;
	public animationManager: AnimationManager;
	// public hotEdges: boolean;

	private _onLoaded: () => void;

	private _cameraFocusedTile: Tile;

	get currentDistance() {
		return this.controller.controls.minDistance;
	}

	set currentDistance(val) {
		this.controller.controls.minDistance = val;
		this.controller.controls.maxDistance = val;
	}

	get currentPolarAngle() {
		return Tools.radToDeg(this.controller.controls.minPolarAngle);
	}

	set currentPolarAngle(val) {
		let rad = Tools.degToRad(val);
		this.controller.controls.minPolarAngle = rad;
		this.controller.controls.maxPolarAngle = rad;
	}

	entities: { [name: string]: () => Entity } = {};

	constructor(map: Map, viewConfig?: ViewSettingsParams) {
		super();

		viewConfig = viewConfig || {} as ViewSettings;
		let clearColor = Tools.rgbToHex(Tools.randomizeRGB('0, 105, 148', 13));

		let sceneSettings = {
			element: document.body,
			alpha: true,
			antialias: true,
			clearColor: clearColor,
			sortObjects: false,
			fog: null,
			light: new DirectionalLight(0xdddddd),
			lightPosition: null,

			sceneMarginSize: 20,
			cameraControlSettings: {
				controlled: true,
				// enableDamping: false,
				// dampingFactor: .05,
				cameraPosition: new Vector3(0, 100, -200), // {x, y, z}
				cameraFov: 25,
				cameraNear: 1,
				cameraFar: 1000,
				currentDistance: 200,
				minDistance: 25,
				maxDistance: 1250,
				zoomAmount: 3,
				// hotEdges: true,
				autoRotate: false,
				screenSpacePanning: false,
				currentPolarAngle: 60,
				minPolarAngle: 60,
				maxPolarAngle: 70,
				minAzimuthAngle: 0,
				maxAzimuthAngle: -Math.PI,
				// horizontalRotation: false,
			} as CameraControlSettings,
		} as ViewSettings;

		if (viewConfig.cameraControlSettings) {
			sceneSettings.cameraControlSettings = Tools.merge(sceneSettings.cameraControlSettings, viewConfig.cameraControlSettings) as CameraControlSettings;
		}

		if (viewConfig)
			sceneSettings = Tools.merge(sceneSettings, viewConfig) as ViewSettings;

		this.settings = sceneSettings;

		this._initSceneSettings(map);

		this.attachTo(sceneSettings.element);
		// const axesHelper = new AxesHelper(15);
		// axesHelper.position.set(0, 10, 0);
		// this.add(axesHelper);
	}

	set onLoaded(callback: () => void) {
		this._onLoaded = callback
	}

	get cameraFocusedTile(): Tile {
		return this._cameraFocusedTile;
	}

	add(mesh: Object3D, position?: Vector3): void {
		this.container.add(mesh);

		if (position)
			mesh.position.set(position.x, position.y, position.z);
	}

	addMap(map: Map): void {
		if (this.map) this.map.dispose();
		this.map = map;
		this.map.setView(this);
		this.container.add(map.group);
		this.settings.light.lookAt(map.group.position)
	}

	attachTo(element: HTMLElement): void {
		// element.style.width = this.width + 'px';
		// element.style.height = this.height + 'px';
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		element.appendChild(this.renderer.domElement);
	}

	dispose(): void {
		this.controller.dispose();
		this.animationManager.dispose();
		this.animationManager = null;
		this.container = null;
		this.camera = null;
		this.controller = null;
	}

	focusOn(tile: Tile | Cell | Vector3, duration: number = 500, onStart: () => void = undefined, onComplete: () => void = undefined): void {
		if (tile instanceof Cell) {
			tile = tile.tile;
		}

		if (tile instanceof Vector3) {
			tile = this.map.getTileAtPosition(tile);
		}

		// if (this.cameraFocusedTile === tile) {
		// 	if (onStart) onStart();
		// 	if (onComplete) onComplete();
		// 	return;
		// }

		const to = tile.position.clone();

		const from = this.controller.controls.target.clone();

		this.animationManager.addAnimation(new Animation(duration,
			(dt): void => {
				this.controller.controls.target = from.lerp(to, dt);

				if (to.clone().set(Math.floor(to.x), Math.floor(to.y), Math.floor(to.z)).distanceTo(this.controller.controls.target.clone().set(Math.floor(this.controller.controls.target.x), Math.floor(this.controller.controls.target.y), Math.floor(this.controller.controls.target.z))) === 0) this.animationManager.stopAnimation('pan', false);
			},
			() => {
				if (onStart) onStart();
			},
			() => {
				if (tile instanceof Tile) {
					this._cameraFocusedTile = tile;
				} else if (tile instanceof Cell) {
					this._cameraFocusedTile = tile.tile;
				} else if (tile instanceof Vector3) {
					let cell = this.map.getCellAtPosition(tile);
					if (cell) {
						this._cameraFocusedTile = this.map.getTileAtCell(cell);
					}
				}
				if (onComplete) onComplete();
			}, undefined, Animation.easeLinear), 'pan', true);
	}

	panCameraTo(tile: Tile | Cell | Vector3, durationMs: number = 500, onStart: () => void = undefined, onComplete: () => void = undefined,): void {
		this.focusOn(tile, durationMs, onStart, onComplete);
	}

	panInDirection(direction: Vector2): void {
		this.controller.panInDirection(direction);
	}

	curZoomAnim: Animation;

	zoom(dir: ZoomDirection, amt = this.settings.cameraControlSettings.zoomAmount, dur = 25, onStart: () => void = undefined, onComplete: (success) => void = undefined, onCancel: () => void = undefined, cancelCurrentZoom: boolean = true, targetDistance?: number): boolean {
		if (dir === ZoomDirection.IN) {
			if (this.currentDistance <= this.settings.cameraControlSettings.minDistance) {
				if (onComplete) onComplete(false);
				return false;
			}

		} else {
			if (this.currentDistance >= this.settings.cameraControlSettings.maxDistance) {
				if (onComplete) onComplete(false);
				return false;
			}
		}

		if (this.curZoomAnim && cancelCurrentZoom) this.curZoomAnim.stop();

		let fromDistance = this.currentDistance;
		if(targetDistance !== undefined) amt = Math.abs(fromDistance - targetDistance);
		let zoomTo = this.currentDistance + (dir === ZoomDirection.IN ? -amt : amt);

		let fromAngle = this.currentPolarAngle;
		let distanceRange = this.settings.cameraControlSettings.maxDistance - this.settings.cameraControlSettings.minDistance;

		let distanceDelta = amt;
		let distanceSteps = distanceRange / distanceDelta;

		let angleRange = this.settings.cameraControlSettings.maxPolarAngle - this.settings.cameraControlSettings.minPolarAngle;
		let angleDelta = angleRange / distanceSteps;

		let angleTo = this.currentPolarAngle + (dir === ZoomDirection.IN ? angleDelta : -angleDelta);
		// if(dir === ZoomDirection.IN) { 
		// 	if(zoomTo < this.settings.cameraControlSettings.minDistance) zoomTo = this.settings.cameraControlSettings.minDistance;
		// 	if(angleTo > this.settings.cameraControlSettings.maxPolarAngle) angleTo = this.settings.cameraControlSettings.maxPolarAngle;
		// } else {
		// 	if(zoomTo > this.settings.cameraControlSettings.maxDistance) zoomTo = this.settings.cameraControlSettings.maxDistance;
		// 	if(angleTo < this.settings.cameraControlSettings.minPolarAngle) angleTo = this.settings.cameraControlSettings.minPolarAngle;
		// }

		this.curZoomAnim = this.animationManager.addAnimation(
			new Animation(
				dur,
				(dt) => {
					this.currentDistance = Tools.lerp(this.currentDistance, zoomTo, dt);

					if ((dir === ZoomDirection.IN ? this.currentPolarAngle  < this.settings.cameraControlSettings.maxPolarAngle : this.currentPolarAngle  > this.settings.cameraControlSettings.minPolarAngle)) {
						this.currentPolarAngle = Tools.lerp(this.currentPolarAngle , angleTo, dt);;
					}

					if (dir === ZoomDirection.IN) {
						if (this.currentDistance < this.settings.cameraControlSettings.minDistance)
							this.currentDistance = this.settings.cameraControlSettings.minDistance;

						if (this.currentPolarAngle > this.settings.cameraControlSettings.maxPolarAngle)
							this.currentPolarAngle = this.settings.cameraControlSettings.maxPolarAngle;
					} else {
						if (this.currentDistance > this.settings.cameraControlSettings.maxDistance)
							this.currentDistance = this.settings.cameraControlSettings.maxDistance;

						if (this.currentPolarAngle < this.settings.cameraControlSettings.minPolarAngle)
							this.currentPolarAngle = this.settings.cameraControlSettings.minPolarAngle;
					}
				},
				() => { if (onStart) onStart(); },
				() => {
					this.curZoomAnim = null;
					this.triggerEvent('zoom', {
						currentDistance: this.currentDistance,
						currentPolarAngle: this.currentPolarAngle,
						direction: dir === ZoomDirection.IN ? 'in' : 'out'
					});
					if (onComplete) onComplete(true);
				}, () => {
					this.curZoomAnim = null;
					if (onCancel) onCancel();
				}, Animation.easeLinear),
			'zoom', cancelCurrentZoom)

		return true;
	}

	remove(mesh: Mesh): void {
		this.container.remove(mesh);
	}

	toggleAnimationLoop(): void {
		this.animationManager.toggleAnimationLoop();
	}

	toggleControls(): void {
		this.controller.toggleControls();
	}

	toggleHorizontalRotation(bool: boolean): void {
		this.controller.toggleHorizontalRotation(bool);
	}

	updateControlSettings(settings: CameraControlSettings): void {
		this.controller.updateControlSettings(settings);
	}

	// Need to finish
	updateSettings(settings: ViewSettings): void {
		// update settings here

		// then update controls
		this.updateControlSettings(settings.cameraControlSettings);
	}

	private _directionalLightHelpers: Object3D[] = [];

	private ambientLight: AmbientLight;
	private _initSceneSettings(map: Map): void {

		this.renderer = new WebGLRenderer({
			alpha: this.settings.alpha,
			antialias: this.settings.antialias
		});
		this.renderer.setClearColor(this.settings.clearColor);
		this.renderer.sortObjects = this.settings.sortObjects;

		this.width = this.settings.element.clientWidth;
		this.height = this.settings.element.clientHeight;

		this.container = new Scene();
		this.container.fog = this.settings.fog;

		this.ambientLight = new AmbientLight(0xdddddd);
		this.ambientLight.position.set(0, 0, 0);
		this.ambientLight.intensity = .1;
		this.container.add(this.ambientLight);

		if (!this.settings.lightPosition) {
			// this.settings.light.position.set(0, 30, -20);
			// this.settings.light.rotateOnAxis(new Vector3(1,0,0), -100 * Engine.DEG_TO_RAD)
			// this.settings.light.lookAt(new Vector3(0,0,0))
			// this.settings.light.intensity = 1;

			let light = new SpotLight(0xffffff);
			light.position.set(0, (map.size * map.size) + 150, 0);
			// light.rotateOnAxis(new Vector3(1,0,0), -10 * Engine.DEG_TO_RAD)
			light.lookAt(new Vector3(0, 0, 0))
			light.intensity = .85;
			light.penumbra = 1;
			// light.decay = 100;
			light.angle = 50 * Engine.DEG_TO_RAD

			// this._directionalLightHelpers.push(new SpotLightHelper(light, 'white'));
			this.container.add(light);
		} else {
			const p = this.settings.lightPosition;
			this.settings.light.position.set(p.x, p.y, p.z);
			this.settings.light.intensity = 1;
		}
		// this._directionalLightHelpers.push(new DirectionalLightHelper(this.settings.light as DirectionalLight, 10, 'white'));

		// this.container.add(this.settings.light);
		// this.container.add(...this._directionalLightHelpers);

		this.camera = new PerspectiveCamera(
			this.settings.cameraControlSettings.cameraFov,
			this.width / this.height,
			this.settings.cameraControlSettings.cameraNear,
			this.settings.cameraControlSettings.cameraFar);

		if (this.settings.cameraControlSettings.cameraPosition) {
			this.camera.position.copy(this.settings.cameraControlSettings.cameraPosition);
		}

		this.addMap(map);

		this._initControls(this.settings.cameraControlSettings);

		this._initAnimationManager();

		new ResizeObserver(this.onWindowResize.bind(this)).observe(this.settings.element.parentElement)

		// this.settings.element.addEventListener('resize', this.onWindowResize.bind(this), false);
	}

	private _initControls(config: CameraControlSettings): void {
		this.controller = new Controller(this);
		this.controller.init(config);
	}

	private _initAnimationManager(): void {
		const onAnimate = (): void => {
			this.controller.update();
		}

		this.animationManager = new AnimationManager(this.renderer, this.container, this.camera, onAnimate);
	}

	private onWindowResize(): void {
		this.width = this.settings.element.clientWidth;
		this.height = this.settings.element.clientHeight;
		if (this.camera != null) {
			(this.camera as PerspectiveCamera).aspect = this.width / this.height;
			(this.camera as PerspectiveCamera).updateProjectionMatrix();
		}
		this.renderer.setSize(this.width, this.height, true);
	}
}
