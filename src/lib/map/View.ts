import { SceneSettings, CameraControlSettings, ViewController } from '../utils/Interfaces';
import { WebGLRenderer, DirectionalLight, Scene, AmbientLight, Camera, PerspectiveCamera, Mesh, Vector2, Vector3 } from 'three';
import Tile from '../grids/Tile';
import Cell from '../grids/Cell';
import Controller from './Controller';
import MouseCaster from '../utils/MouseCaster';
import Tools from '../utils/Tools';
import Board from './Board';

/*
	Sets up and manages a THREEjs container, camera, and light, making it easy to get going.
	Also provides camera control.

	Assumes full screen.
 */
// 'utils/Tools'
export default class View implements ViewController {

  public width: number;
  public height: number;
  public renderer: WebGLRenderer;
  //public orthoZoom: number;
  public container: Scene;
  public camera: Camera;
  public controlled: boolean;
  public settings: SceneSettings;
  public controls: Controller;

  private _selectedTile: Tile;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _onAnimate:  (dtS: number) => void = (dtS: number): void => {};
  private _onTileSelected: (tile: Tile) => void
  private _onLoaded: () => void;
  private _lastTimestamp = Date.now();
  private _animationID: number;

  // Edge Scrolling margins
  private w1: number;
  private w2: number;
  private h1: number;
  private h2: number;
  public hotEdges: boolean;

  private _mouseCaster: MouseCaster;

  // This code should be with the Controller code 
  private _panning = false;
  private _panningLeft = false;
  private _panningRight = false;
  private _panningUp = false;
  private _panningDown = false;

  set onAnimate(callback: (dtS: number) => void) {
    if (!callback) {
      throw new Error("Invalid onRender callback")
    }
    this._onAnimate = callback;
  }
  set onTileSelected(callback: (tile: Tile) => void) {
    this._onTileSelected = callback
  }

  set onLoaded(callback: () => void) {
    this._onLoaded = callback
  }
  setOnAnimateCallback(callback: (dtS: number) => void): void {
    this.onAnimate = callback
  }
  get selectedTile(): Tile {
    return this._selectedTile
  }

  set mouseCaster(mouse: MouseCaster) {
    this._mouseCaster = mouse;
  }

  constructor(sceneConfig?: SceneSettings) {
    sceneConfig = sceneConfig || {} as SceneSettings;
    let sceneSettings = {
      element: document.body,
      alpha: true,
      antialias: true,
      clearColor: '#000000',
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
    } as SceneSettings;

    if (sceneConfig.cameraControlSettings !== undefined) {
      sceneSettings.cameraControlSettings = Tools.merge(sceneSettings.cameraControlSettings, sceneConfig.cameraControlSettings) as CameraControlSettings;
    }

    sceneSettings = Tools.merge(sceneSettings, sceneConfig) as SceneSettings;
    this.settings = sceneSettings;

    this._initSceneSettings();

    if (this.settings.cameraControlSettings.controlled) {
      this.initControls(this.settings.cameraControlSettings);
    }

    this.attachTo(sceneSettings.element);
    this.animate(0);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize, false);
    this.controls.dispose();
    window.cancelAnimationFrame(this._animationID);
    delete this.container;
    delete this.camera;
    delete this.controls;
    delete this._mouseCaster;
  }

  onWindowResize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    (this.camera as PerspectiveCamera).aspect = this.width / this.height;
    (this.camera as PerspectiveCamera).updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  attachTo(element: HTMLElement): void {
    element.style.width = this.width + 'px';
    element.style.height = this.height + 'px';
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    element.appendChild(this.renderer.domElement);
  }

  add(mesh: Mesh): void {
    this.container.add(mesh);
  }

  private board: Board;
  addBoard(board: Board): void {
    this.board = board;
    this.container.add(board.group);
  }

  remove(mesh: Mesh): void {
    this.container.remove(mesh);
  }

  private animate(timestamp: number): void {
    const dtS = (timestamp - this._lastTimestamp) / 1000.0;
    this._lastTimestamp = timestamp;
    if (this._mouseCaster) {
      this._mouseCaster.update();
    }
    if (this.controlled) {
      this.controls.update();
      if (this.hotEdges && this._panning) {
        this.panInDirection(this._panningLeft, this._panningRight, this._panningUp, this._panningDown);
      }
    }
    this._onAnimate(dtS);
    this.controls.update();
    this.renderer.render(this.container, this.camera);
    this._animationID = requestAnimationFrame(this.animate.bind(this));
  }

  focusOn(obj: any): void {
    this.camera.lookAt(obj.position);
  }

  getViewCenter(): Vector3 {
    const pos = this._mouseCaster.mouseToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, this.camera);
    return pos;
  }

  getCameraFocusPosition(pos: Vector3): Vector3 {
    return this.getCameraFocusPositionWorld(pos)
  }

  getCameraFocusPositionWorld(pos: Vector3): Vector3 {
    const currentPos = this.camera.position.clone()
    const viewOffset = currentPos.sub(this.getViewCenter());

    return pos.add(viewOffset)
  }

  // Need to finish
  updateSettings(settings: SceneSettings): void {
    this.w1 = settings.sceneMarginSize / window.innerWidth | this.settings.sceneMarginSize / window.innerWidth;
    this.h1 = settings.sceneMarginSize / window.innerHeight | this.settings.sceneMarginSize / window.innerHeight
    this.w2 = 1 - settings.sceneMarginSize / window.innerWidth | 1 - this.settings.sceneMarginSize / window.innerWidth;
    this.h2 = 1 - settings.sceneMarginSize / window.innerHeight | this.settings.sceneMarginSize / window.innerHeight;

    this.updateControls(this.settings.cameraControlSettings);
  }

  toggleControls(): void {
    this.controls.toggleControls();
  }

  updateControls(settings: CameraControlSettings): void {
    this.controls.updateControls(settings);
  }

  toggleHorizontalRotation(bool: boolean): void {
    this.toggleHorizontalRotation(bool);
  }

  initControls(config: CameraControlSettings): void {
    this.controls = new Controller(this, config);
    
  }

  panInDirection(left: boolean, right: boolean, top: boolean, bottom: boolean): void {
    this.controls.panInDirection(left, right, top, bottom);
  }

  panCameraTo(tile: Tile | Cell, durationMs: number): void {
    this.controls.panCameraTo(tile, durationMs);
  }

  private _initSceneSettings(): void {
    this.renderer = new WebGLRenderer({
      alpha: this.settings.alpha,
      antialias: this.settings.antialias
    });
    this.renderer.setClearColor(this.settings.clearColor, 1);
    this.renderer.sortObjects = this.settings.sortObjects;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.w1 = this.settings.sceneMarginSize / window.innerWidth;
    this.h1 = this.settings.sceneMarginSize / window.innerHeight;
    this.w2 = 1 - this.settings.sceneMarginSize / window.innerWidth;
    this.h2 = 1 - this.settings.sceneMarginSize / window.innerHeight;

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

    this._mouseCaster = new MouseCaster(this.container, this.camera);
    const self = this;
    this._mouseCaster.signal.add(function (evt: string, tile: Tile | MouseEvent) {
      if (evt === MouseCaster.CLICK) {
        //(tile as Tile).toggle();
        self.controls.panCameraTo(tile as Tile, 5000);
        // or we can use the mouse's raw coordinates to access the cell directly, just for fun:
        const cell = self.board.grid.pixelToCell(self._mouseCaster.position);
        const t = self.board.getTileAtCell(cell);
        if (t) t.toggle();
      }
      if (evt === MouseCaster.MOVE) {
        self.checkEdge(tile as MouseEvent);
      }
    }, this);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  private checkEdge(event: MouseEvent): void {
    const position = new Vector2(event.clientX, event.clientY);
    const x = (position.x / window.innerWidth), y = position.y / window.innerHeight;
    if ((x > this.w2 || x < this.w1) || (y > this.h2 || y < this.h1)) {
      this._panning = true;
      if (x > this.w2) {
        this._panningRight = true;
      }
      if (x < this.w1) {
        this._panningLeft = true;
      }
      if (y > this.h2) {
        this._panningDown = true;
      }
      if (y < this.h1) {
        this._panningUp = true;
      }
    } else {
      this._panning = false;
      this._panningRight = false;
      this._panningLeft = false;
      this._panningDown = false;
      this._panningUp = false;
    }
  }
}
