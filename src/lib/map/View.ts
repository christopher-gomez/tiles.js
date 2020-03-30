import { ViewSettings, CameraControlSettings, ViewController } from '../utils/Interfaces';
import { WebGLRenderer, DirectionalLight, Scene, AmbientLight, PerspectiveCamera, Mesh, Vector3, Vector2 } from 'three';
import Tile from '../grids/Tile';
import Cell from '../grids/Cell';
import Controller from './Controller';
import MouseCaster from '../utils/MouseCaster';
import Tools from '../utils/Tools';
import Map from './Map';
import AnimationManager from '../utils/AnimationManager';

/*
	Sets up and manages a THREEjs container, camera, and light, making it easy to get going.
	Also provides camera control, mouse control, animation control.

	Assumes full screen.
 */
// 'utils/Tools'
export default class View implements ViewController {

	public map: Map;

	public width: number;
	public height: number;
	public renderer: WebGLRenderer;
	public container: Scene;
	public camera: PerspectiveCamera;
	public controlled: boolean;
	public settings: ViewSettings;
	public controls: Controller;
	public animationManager: AnimationManager;

	private _selectedTile: Tile;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private _onTileSelected: (tile: Tile) => void
	private _onLoaded: () => void;

	private _mouseCaster: MouseCaster;

	private _hoverTile: Tile;

	// This code should be with the Controller code 
	public hotEdges: boolean;

	constructor(map: Map, viewConfig?: ViewSettings) {
		viewConfig = viewConfig || {} as ViewSettings;
		let sceneSettings = {
			element: document.body,
			alpha: true,
			antialias: true,
			clearColor: 0x6495ED,
			sortObjects: false,
			fog: null,
			light: new DirectionalLight(0xffffff),
			lightPosition: null,
			//cameraType: 'PerspectiveCamera',
			cameraPosition: null, // {x, y, z}
			//orthoZoom: 10,
			sceneMarginSize: 20,
			cameraControlSettings: {
				controlled: true,
				enableDamping: false,
				dampingFactor: .05,
				minDistance: 25,
				maxDistance: 1250,
				zoomSpeed: 3,
				hotEdges: true,
				autoRotate: false,
				screenSpacePanning: false,
				minPolarAngle: Math.PI / 6,
				maxPolarAngle: Math.PI / 3,
				minAzimuthAngle: 0,
				maxAzimuthAngle: -Math.PI,
				horizontalRotation: false,
			} as CameraControlSettings,
		} as ViewSettings;

		if (viewConfig.cameraControlSettings) {
			sceneSettings.cameraControlSettings = Tools.merge(sceneSettings.cameraControlSettings, viewConfig.cameraControlSettings) as CameraControlSettings;
		}

		if (viewConfig)
			sceneSettings = Tools.merge(sceneSettings, viewConfig) as ViewSettings;
		this.settings = sceneSettings;

		this._initSceneSettings();

		this.attachTo(sceneSettings.element);
		this.addMap(map);
		this.animationManager.animate(0);
	}

	set mouseCaster(mouse: MouseCaster) {
		this._mouseCaster = mouse;
	}

	set onLoaded(callback: () => void) {
		this._onLoaded = callback
	}

	set onTileSelected(callback: (tile: Tile) => void) {
		this._onTileSelected = callback
	}

	get selectedTile(): Tile {
		return this._selectedTile
	}

	add(mesh: Mesh): void {
		this.container.add(mesh);
	}

	addMap(map: Map): void {
		this.map = map;
		this.container.add(map.group);
	}

	attachTo(element: HTMLElement): void {
		element.style.width = this.width + 'px';
		element.style.height = this.height + 'px';
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		element.appendChild(this.renderer.domElement);
	}

	dispose(): void {
		window.removeEventListener('resize', this.onWindowResize, false);
		this.controls.dispose();
		this._mouseCaster.dispose(this);
		this.animationManager.dispose();
		this.animationManager = null;
		this.container = null;
		this.camera = null;
		this.controls = null;
		this._mouseCaster = null;
	}

	focusOn(pos: Tile | Vector3): void {
		if (pos instanceof Tile) {
			pos = pos.position;
		}
		this.camera.lookAt(pos);
	}

	panCameraTo(tile: Tile | Cell, durationMs: number): void {
		this.controls.panCameraTo(tile, durationMs);
	}

	panInDirection(direction: Vector2): void {
		this.controls.panInDirection(direction);
	}

	remove(mesh: Mesh): void {
		this.container.remove(mesh);
	}

	toggleAnimationLoop(): void {
		this.animationManager.toggleAnimationLoop();
	}

	toggleControls(): void {
		this.controls.toggleControls();
	}

	toggleHorizontalRotation(bool: boolean): void {
		this.controls.toggleHorizontalRotation(bool);
	}

	updateControlSettings(settings: CameraControlSettings): void {
		this.controls.updateControlSettings(settings);
	}

	// Need to finish
	updateSettings(settings: ViewSettings): void {
		// update settings here

		// then update controls
		this.updateControlSettings(settings.cameraControlSettings);
	}

	private _initSceneSettings(): void {

		this.renderer = new WebGLRenderer({
			alpha: this.settings.alpha,
			antialias: this.settings.antialias
		});
		this.renderer.setClearColor(this.settings.clearColor);
		this.renderer.sortObjects = this.settings.sortObjects;

		this.width = window.innerWidth;
		this.height = window.innerHeight;

		const left = document.createElement('div');
		left.style.cssText = 'position:absolute;left:0;height:100%;width:' + this.settings.sceneMarginSize + 'px;';
		left.addEventListener('mouseover', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(15, 0);
		}, false);
		left.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const top = document.createElement('div');
		top.style.cssText = 'position:absolute;top:0;width:100%;height:' + this.settings.sceneMarginSize + 'px;';
		top.addEventListener('mouseover', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(0, 15);
		}, false);
		top.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const topLeft = document.createElement('div');
		topLeft.style.cssText = 'position:absolute;left:0;top:0;height:' + this.settings.sceneMarginSize + 'px;width:' + this.settings.sceneMarginSize + 'px';
		topLeft.addEventListener('mouseenter', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(15,15);
		}, false);
		topLeft.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const right = document.createElement('div');
		right.style.cssText = 'position:absolute;right:0;height:100%;width:' + this.settings.sceneMarginSize + 'px;';
		right.addEventListener('mouseover', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(-15,0);
		}, false);
		right.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const topRight = document.createElement('div');
		topRight.style.cssText = 'position:absolute;right:0;top:0;height:' + this.settings.sceneMarginSize + 'px;width:' + this.settings.sceneMarginSize + 'px';
		topRight.addEventListener('mouseenter', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(-15,15);
		}, false);
		topRight.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const bottom = document.createElement('div');
		bottom.style.cssText = 'position:absolute;bottom:0;width:100%;height:' + this.settings.sceneMarginSize + 'px;';
		bottom.addEventListener('mouseover', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(0,-15);
		}, false);
		bottom.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const bottomLeft = document.createElement('div');
		bottomLeft.style.cssText = 'position:absolute;left:0;bottom:0;height:' + this.settings.sceneMarginSize + 'px;width:' + this.settings.sceneMarginSize + 'px';
		bottomLeft.addEventListener('mouseenter', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(15,-15);
		}, false);
		bottomLeft.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);

		const bottomRight = document.createElement('div');
		bottomRight.style.cssText = 'position:absolute;right:0;bottom:0;height:' + this.settings.sceneMarginSize + 'px;width:' + this.settings.sceneMarginSize + 'px';
		bottomRight.addEventListener('mouseenter', () => {
			this.controls.panning = true;
			this.controls.panDirection = new Vector2(15,-15);
		}, false);
		bottomRight.addEventListener('mouseleave', () => {
			this.controls.panning = false;
		}, false);
		this.settings.element.appendChild(left);
		this.settings.element.appendChild(top);
		this.settings.element.appendChild(topLeft);
		this.settings.element.appendChild(right);
		this.settings.element.appendChild(topRight);
		this.settings.element.appendChild(bottom);
		this.settings.element.appendChild(bottomLeft);
		this.settings.element.appendChild(bottomRight);

		this.container = new Scene();
		this.container.fog = this.settings.fog;

		this.container.add(new AmbientLight(0xdddddd));

		if (!this.settings.lightPosition) {
			this.settings.light.position.set(1, 1, 3).normalize();
			this.settings.light.intensity = 1.2;
		} else {
			const p = this.settings.lightPosition;
			this.settings.light.position.set(p.x, p.y, p.z).normalize();
			this.settings.light.intensity = 1.2;
		}
		this.container.add(this.settings.light);

		this.camera = new PerspectiveCamera(50, this.width / this.height, 1, 5000);
		if (this.settings.cameraPosition) {
			this.camera.position.copy(this.settings.cameraPosition);
		}

		this._initControls(this.settings.cameraControlSettings);

		this._initMouseCaster();

		this._initAnimationManager();

		this.settings.element.addEventListener('resize', this.onWindowResize.bind(this), false);
	}

	private _initControls(config: CameraControlSettings): void {
		this.controls = new Controller(this, config);
	}

	private _initAnimationManager(): void {
		const onAnimate = (): void => {
			if (this.controlled) {
				if (this.hotEdges && this.controls.panning && this._hoverTile) {
					this.panInDirection(this.controls.panDirection);
				}
			}
			this.controls.update();
			this._mouseCaster.update();
		}
		this.animationManager = new AnimationManager(this.renderer, this.container, this.camera, onAnimate);
	}

	private _initMouseCaster(): void {
		this._mouseCaster = new MouseCaster(this.container, this.camera);
		this._mouseCaster.signal.add((evt: string, tile: Tile | MouseEvent) => {
			if (this.controlled) {
				if (evt === MouseCaster.CLICK) {
					//(tile as Tile).toggle();
					this.controls.panCameraTo(tile as Tile, 2500);
					// or we can use the mouse's raw coordinates to access the cell directly, just for fun:
					const cell = this.map.grid.pixelToCell(this._mouseCaster.position);
					const t = this.map.getTileAtCell(cell);
					if (t) t.toggle();
				}
				if (evt === MouseCaster.OVER) {
					if (tile !== null) {
						(tile as Tile).select();
						this._hoverTile = tile as Tile;
					}
				}
				if (evt === MouseCaster.OUT) {
					if (tile !== null) {
						(tile as Tile).deselect();
						this._hoverTile = null;
					}
				}
			}
		});
	}

	private onWindowResize(): void {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		(this.camera as PerspectiveCamera).aspect = this.width / this.height;
		(this.camera as PerspectiveCamera).updateProjectionMatrix();
		this.renderer.setSize(this.width, this.height, true);
	}
}
