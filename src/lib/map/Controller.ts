import { ViewController, CameraControlSettings } from "../utils/Interfaces"
import { OrbitControls } from "../lib/OrbitControls"
import { MOUSE } from "three"
import Engine from '../Engine';
import View from "./View";
import Tile from "../grids/Tile";
import Cell from "../grids/Cell";
import Animation from '../utils/Animation';

export default class Controller implements ViewController {

  public controls: OrbitControls;

  set active(active: boolean) {
    this._view.controlled = active;
  }

  get active(): boolean {
    return this._view.controlled;
  }

  constructor(private _view: View, config?: CameraControlSettings) {
    if (!_view) {
      throw new Error('Controller missing View reference');
    }
    if (config) {
      this._initControls(config);
    } else {
      this._view.controlled = false;
      this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
    }
  }

  private _initControls(config: CameraControlSettings): void {
    this._view.controlled = config.controlled;
    this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
    this.controls.minDistance = config.minDistance;
    this.controls.maxDistance = config.maxDistance;
    this.controls.zoomSpeed = config.zoomSpeed;
    this._view.hotEdges = config.hotEdges;
    this.controls.autoRotate = config.autoRotate;
    this.controls.enableDamping = config.enableDamping;
    this.controls.dampingFactor = config.dampingFactor;
    this.controls.screenSpacePanning = config.screenSpacePanning;
    this.controls.minPolarAngle = config.minPolarAngle;
    this.controls.maxPolarAngle = config.maxPolarAngle;
    if (!config.horizontalRotation) {
      if (config.maxAzimuthAngle)
        this.controls.maxAzimuthAngle = config.maxAzimuthAngle;
      if (config.minAzimuthAngle)
        this.controls.minAzimuthAngle = config.minAzimuthAngle;
    }

    this.controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };

  }

  update(): void {
    this.controls.update();
  }

  dispose(): void {
    this.controls.dispose();
  }

  panInDirection(left: boolean, right: boolean, top: boolean, bottom: boolean): void {
    if (this._view.animationManager.animations.length >= 1) this._view.animationManager.cancelAnimation();
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
    } else if (left) {
      this.controls.pan(15, 0);
    } else if (top) {
      this.controls.pan(0, 15);
    } else {
      this.controls.pan(0, -15);
    }
    this.controls.update();
  }

  panCameraTo(tile: Tile | Cell, durationMs: number): void {
    if (tile instanceof Cell) {
      tile = tile.tile;
    }
    const from = this.controls.target.clone();
    const to = tile.position.clone();

    this._view.animationManager.addAnimation(new Animation(durationMs, (a): void => {
      this._view.focusOn(tile as Tile);
      this.controls.target = from.lerp(to, a);
      this.controls.update();
    }));

    if (this._view.animationManager.animations.length > 1)
      this._view.animationManager.cancelAnimation();
  }

  toggleControls(): void {
    if (this._view.controlled) {
      this._view.controlled = false;
    } else {
      this._view.controlled = true;
    }
  }

  updateControlSettings(settings: CameraControlSettings): void {
    this._view.settings.cameraControlSettings = Engine.Tools.merge(this._view.settings.cameraControlSettings, settings) as CameraControlSettings;
    this.controls.minDistance = settings.minDistance || this.controls.minDistance;
    this.controls.maxDistance = settings.maxDistance || this.controls.maxDistance;
    this.controls.zoomSpeed = settings.zoomSpeed || this.controls.zoomSpeed;
    settings.hotEdges !== undefined ? this._view.hotEdges = settings.hotEdges : this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
    if (settings.autoRotate !== undefined) {
      this.toggleHorizontalRotation(settings.autoRotate);
      this.controls.autoRotate = settings.autoRotate;
    } else {
      this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
    }
    settings.enableDamping !== undefined ? this.controls.enableDamping = settings.enableDamping : this.controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
    this.controls.dampingFactor = settings.dampingFactor || this._view.settings.cameraControlSettings.dampingFactor;
    settings.screenSpacePanning !== undefined ? this.controls.screenSpacePanning = settings.screenSpacePanning : this.controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
    if (settings.minPolarAngle)
      this.controls.minPolarAngle = settings.minPolarAngle;
    if (settings.maxPolarAngle)
      this.controls.maxPolarAngle = settings.maxPolarAngle
    if (settings.maxAzimuthAngle)
      this.controls.maxAzimuthAngle = settings.maxAzimuthAngle;
    if (settings.minAzimuthAngle)
      this.controls.minAzimuthAngle = settings.minAzimuthAngle;

  }

  toggleHorizontalRotation(bool: boolean): void {
    if (bool) {
      this.controls.dispose();
      this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
      this.controls.minDistance = this._view.settings.cameraControlSettings.minDistance;
      this.controls.maxDistance = this._view.settings.cameraControlSettings.maxDistance;
      this.controls.zoomSpeed = this._view.settings.cameraControlSettings.zoomSpeed;
      this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
      this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
      this.controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
      this.controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
      this.controls.minPolarAngle = this._view.settings.cameraControlSettings.minPolarAngle;
      this.controls.maxPolarAngle = this._view.settings.cameraControlSettings.maxPolarAngle;
      this.controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };
    } else {
      this.controls.dispose();
      this.controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
      this.controls.minDistance = this._view.settings.cameraControlSettings.minDistance;
      this.controls.maxDistance = this._view.settings.cameraControlSettings.maxDistance;
      this.controls.zoomSpeed = this._view.settings.cameraControlSettings.zoomSpeed;
      this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
      this.controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
      this.controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
      this.controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
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