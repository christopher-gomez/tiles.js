import TM from '../tm';
import { OrbitControls } from '../lib/OrbitControls';
import { SceneSettings, CameraControlSettings } from './Interfaces';
import { WebGLRenderer, DirectionalLight, Scene as TScene, AmbientLight, Camera, PerspectiveCamera, Mesh, Object3D, Vector2, MOUSE } from 'three';
/*
	Sets up and manages a THREEjs container, camera, and light, making it easy to get going.
	Also provides camera control.

	Assumes full screen.
 */
// 'utils/Tools'
export default class Scene {

  public width: number;
  public height: number;
  public renderer: WebGLRenderer;
  //public orthoZoom: number;
  public container: TScene;
  public camera: Camera;
  public controlled: boolean;
  public controls: OrbitControls;
  public settings: SceneSettings;

  // Edge Scrolling margins
  private w1: number;
  private w2: number;
  private h1: number;
  private h2: number;
  private hotEdges: boolean;

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
        minDistance: 25,
        maxDistance: 1250,
        zoomSpeed: 3,
        hotEdges: true,
        autoRotate: false,
      } as CameraControlSettings,
    } as SceneSettings;

    if (sceneConfig.cameraControlSettings !== undefined){
      sceneSettings.cameraControlSettings = TM.Tools.merge(sceneSettings.cameraControlSettings, sceneConfig.cameraControlSettings) as CameraControlSettings;
    }

    sceneSettings = TM.Tools.merge(sceneSettings, sceneConfig) as SceneSettings;
    this.settings = sceneSettings;

    this.renderer = new WebGLRenderer({
      alpha: sceneSettings.alpha,
      antialias: sceneSettings.antialias
    });
    this.renderer.setClearColor(sceneSettings.clearColor, 1);
    this.renderer.sortObjects = sceneSettings.sortObjects;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this._initSceneSettings();

    this.container = new TScene();
    this.container.fog = sceneSettings.fog;

    this.container.add(new AmbientLight(0xdddddd));

    if (!sceneSettings.lightPosition) {
      sceneSettings.light.position.set(-1, 1, -1).normalize();
    }
    this.container.add(sceneSettings.light);

    this.controlled = sceneSettings.cameraControlSettings.controlled;
    if (this.controlled) {
      this._initControls();
    }

    if (sceneSettings.cameraPosition) {
      this.camera.position.copy(sceneSettings.cameraPosition);
    }

    const self = this;

    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    window.addEventListener('mousemove', this.checkEdge.bind(this), false)

    this.attachTo(sceneSettings.element);
  }

  dispose(): void {
    window.removeEventListener('mousemove', this.checkEdge, false);
    window.removeEventListener('resize', this.onWindowResize, false);
    this.controls.dispose();
  }

  onWindowResize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    /*if (self.camera.type === 'OrthographicCamera') {
      const width = self.width / self.orthoZoom;
      const height = self.height / self.orthoZoom;
      (self.camera as OrthographicCamera).left = width / -2;
      (self.camera as OrthographicCamera).right = width / 2;
      (self.camera as OrthographicCamera).top = height / 2;
      (self.camera as OrthographicCamera).bottom = height / -2;
    }
    else {*/
    (this.camera as PerspectiveCamera).aspect = this.width / this.height;
    //}
    (this.camera as PerspectiveCamera).updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  toggleControls(): void {
    if (this.controlled) {
      this.controlled = false;
      this.controls.dispose();
      delete this.controls;
    } else {
      this._initControls();
    }
  }

  updateSettings(settings: SceneSettings): void {
    this.w1 = settings.sceneMarginSize / window.innerWidth | this.settings.sceneMarginSize / window.innerWidth;
    this.h1 = settings.sceneMarginSize / window.innerHeight | this.settings.sceneMarginSize / window.innerHeight
    this.w2 = 1 - settings.sceneMarginSize / window.innerWidth | 1 - this.settings.sceneMarginSize / window.innerWidth;
    this.h2 = 1 - settings.sceneMarginSize / window.innerHeight | this.settings.sceneMarginSize / window.innerHeight;

    this.updateControls(this.settings.cameraControlSettings);
  }

  updateControls(settings: CameraControlSettings): void {
    if (this.controlled) {
      this.controls.minDistance = settings.minDistance || this.controls.minDistance;
      this.controls.maxDistance = settings.maxDistance || this.controls.maxDistance;
      this.controls.zoomSpeed = settings.zoomSpeed || this.controls.zoomSpeed;
      this.hotEdges = settings.hotEdges || this.hotEdges;
      if (settings.autoRotate === true) {
        this.controls.autoRotate = true;
      } else {
        this.controls.autoRotate = this.settings.cameraControlSettings.autoRotate;
      }
      //this.controls.enableDamping = true;
      //this.controls.enableRotate = false;
      this.controls.screenSpacePanning = false;
      this.controls.minPolarAngle = Math.PI / 6;
      this.controls.maxPolarAngle = Math.PI / 3;
      //this.controls.maxAzimuthAngle = 0;
      //this.controls.minAzimuthAngle = 0;
    }
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

  remove(mesh: Mesh): void {
    this.container.remove(mesh);
  }

  private _panning = false;
  private _panningLeft = false;
  private _panningRight = false;
  private _panningUp = false;
  private _panningDown = false;

  checkEdge(event: MouseEvent): void {
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

  private pan(left: boolean, right: boolean, top: boolean, bottom: boolean): void {
    if (left && top) {
      this.controls.pan(15, 15);
    } else if (left && bottom) {
      this.controls.pan(15, -15);
    } else if (right && top) {
      this.controls.pan(-15, 15);
    } else if (right && bottom) {
      this.controls.pan(-15, -15);
    } else if (right) {
      this.controls.pan(-15, 0);
    } else if(left){
      this.controls.pan(15, 0);
    } else if (top) {
      this.controls.pan(0, 15);
    } else {
      this.controls.pan(0, -15);
    }
    this.controls.update();
  }

  render(): void {
    if (this.controlled) this.controls.update();
    if (this.controlled && this.hotEdges && this._panning) {
      this.pan(this._panningLeft, this._panningRight, this._panningUp, this._panningDown);
    }
    this.renderer.render(this.container, this.camera);
  }

  /*updateOrthoZoom(): void {
    if (this.orthoZoom <= 0) {
      this.orthoZoom = 0;
      return;
    }
    const width = this.width / this.orthoZoom;
    const height = this.height / this.orthoZoom;
    (this.camera as OrthographicCamera).left = width / -2;
    (this.camera as OrthographicCamera).right = width / 2;
    (this.camera as OrthographicCamera).top = height / 2;
    (this.camera as OrthographicCamera).bottom = height / -2;
    (this.camera as OrthographicCamera).updateProjectionMatrix();
  }*/

  focusOn(obj: Object3D): void {
    this.camera.lookAt(obj.position);
  }

  private _initSceneSettings(): void {
    this.w1 = this.settings.sceneMarginSize / window.innerWidth;
    this.h1 = this.settings.sceneMarginSize / window.innerHeight;
    this.w2 = 1 - this.settings.sceneMarginSize / window.innerWidth;
    this.h2 = 1 - this.settings.sceneMarginSize / window.innerHeight;

    //this.orthoZoom = this.settings.orthoZoom;

    /*if (this.settings.cameraType === 'OrthographicCamera') {
      const width = window.innerWidth / this.orthoZoom;
      const height = window.innerHeight / this.orthoZoom;
      this.camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 5000);
    }
    else {*/
      this.camera = new PerspectiveCamera(50, this.width / this.height, 1, 5000);
    //}
  }

  private _initControls(): void {
    this.controlled = true;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = this.settings.cameraControlSettings.minDistance;
    this.controls.maxDistance = this.settings.cameraControlSettings.maxDistance;
    this.controls.zoomSpeed = this.settings.cameraControlSettings.zoomSpeed;
    this.hotEdges = this.settings.cameraControlSettings.hotEdges;
    this.controls.autoRotate = this.settings.cameraControlSettings.autoRotate;
    //this.controls.enableDamping = true;
    //this.controls.enableRotate = false;
    this.controls.screenSpacePanning = false;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 3;
    //this.controls.maxAzimuthAngle = 0;
    //this.controls.minAzimuthAngle = 0;
    this.controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };
  }
}