import TM from '../tm';
import { OrbitControls } from 'three-orbitcontrols-ts'
import { SceneSettings, CameraControlSettings } from './Interfaces';
import { WebGLRenderer, DirectionalLight, Scene as TScene, AmbientLight, Camera, OrthographicCamera, PerspectiveCamera, Mesh } from 'three';
import Tile from '../grids/Tile';
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
  public orthoZoom: number;
  public container: TScene;
  public camera: Camera;
  public controlled: boolean;
  public controls: OrbitControls;

  constructor(sceneConfig?: SceneSettings, controlConfig?: CameraControlSettings) {
    sceneConfig = sceneConfig || {} as SceneSettings;
    let sceneSettings = {
      element: document.body,
      alpha: true,
      antialias: true,
      clearColor: '#fff',
      sortObjects: false,
      fog: null,
      light: new DirectionalLight(0xffffff),
      lightPosition: null,
      cameraType: 'PerspectiveCamera',
      cameraPosition: null, // {x, y, z}
      orthoZoom: 4
    } as SceneSettings;

    let controlSettings = {
      minDistance: 100,
      maxDistance: 1000,
      zoomSpeed: 2,
      noZoom: false
    } as CameraControlSettings;

    sceneSettings = TM.Tools.merge(sceneSettings, sceneConfig) as SceneSettings;
    if (controlConfig !== undefined) {
      controlSettings = TM.Tools.merge(controlSettings, controlConfig) as CameraControlSettings;
    }

    this.renderer = new WebGLRenderer({
      alpha: sceneSettings.alpha,
      antialias: sceneSettings.antialias
    });
    this.renderer.setClearColor(sceneSettings.clearColor, 0);
    this.renderer.sortObjects = sceneSettings.sortObjects;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.orthoZoom = sceneSettings.orthoZoom;

    this.container = new TScene();
    this.container.fog = sceneSettings.fog;

    this.container.add(new AmbientLight(0xdddddd));

    if (!sceneSettings.lightPosition) {
      sceneSettings.light.position.set(-1, 1, -1).normalize();
    }
    this.container.add(sceneSettings.light);

    if (sceneSettings.cameraType === 'OrthographicCamera') {
      const width = window.innerWidth / this.orthoZoom;
      const height = window.innerHeight / this.orthoZoom;
      this.camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 5000);
    }
    else {
      this.camera = new PerspectiveCamera(50, this.width / this.height, 1, 5000);
    }

    this.controlled = !!controlConfig;
    if (this.controlled) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.minDistance = controlSettings.minDistance;
      this.controls.maxDistance = controlSettings.maxDistance;
      this.controls.zoomSpeed = controlSettings.zoomSpeed;
      this.controls.noZoom = controlSettings.noZoom;
    }

    if (sceneSettings.cameraPosition) {
      this.camera.position.copy(sceneSettings.cameraPosition);
    }

    const self = this;

    window.addEventListener('resize', function onWindowResize(): void {
      self.width = window.innerWidth;
      self.height = window.innerHeight;
      if (self.camera.type === 'OrthographicCamera') {
        const width = self.width / self.orthoZoom;
        const height = self.height / self.orthoZoom;
        (self.camera as OrthographicCamera).left = width / -2;
        (self.camera as OrthographicCamera).right = width / 2;
        (self.camera as OrthographicCamera).top = height / 2;
        (self.camera as OrthographicCamera).bottom = height / -2;
      }
      else {
        (self.camera as PerspectiveCamera).aspect = self.width / self.height;
      }
      (self.camera as PerspectiveCamera).updateProjectionMatrix();
      self.renderer.setSize(self.width, self.height);
    }.bind(this), false);

    this.attachTo(sceneSettings.element);
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

  render(): void {
    if (this.controlled) this.controls.update();
    this.renderer.render(this.container, this.camera);
  }

  updateOrthoZoom(): void {
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
  }

  focusOn(obj: Tile): void {
    this.camera.lookAt(obj.position);
  }
}