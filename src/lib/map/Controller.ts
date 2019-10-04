import { ViewController, CameraControlSettings } from "../utils/Interfaces"
import { OrbitControls } from "../lib/OrbitControls"
import { MOUSE } from "three"
import Engine from '../Engine';
import View from "./View";
import Tile from "../grids/Tile";
import Cell from "../grids/Cell";
import Animation from '../utils/Animation';

export default class Controller implements ViewController {

  public _controls: OrbitControls;
  public animations: Animation[] = [];

  constructor(private _view: View, config?: CameraControlSettings) {
    if (!_view) {
      throw new Error('Controller missing View reference');
    }
    if (config) {
      this.initControls(config);
    }
  }

  initControls(config: CameraControlSettings): void {
    this._view.controlled = config.controlled;
    this._controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
    this._controls.minDistance = config.minDistance;
    this._controls.maxDistance = config.maxDistance;
    this._controls.zoomSpeed = config.zoomSpeed;
    this._view.hotEdges = config.hotEdges;
    this._controls.autoRotate = config.autoRotate;
    this._controls.enableDamping = config.enableDamping;
    this._controls.dampingFactor = config.dampingFactor;
    this._controls.screenSpacePanning = config.screenSpacePanning;
    this._controls.minPolarAngle = config.minPolarAngle;
    this._controls.maxPolarAngle = config.maxPolarAngle;
    if (!config.horizontalRotation) {
      if (config.maxAzimuthAngle)
        this._controls.maxAzimuthAngle = config.maxAzimuthAngle;
      if (config.minAzimuthAngle)
        this._controls.minAzimuthAngle = config.minAzimuthAngle;
    }

    this._controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };

    const onAnimate = (dtS: number): void => {
      const animations = this.animations
      for (let i = 0; i < animations.length; i++) {
        // advance the animation
        const animation = animations[i]
        if (animation) {
          const finished = animation.animate(dtS)
          // if the animation is finished (returned true) remove it
          if (finished) {
            // remove the animation
            animations[i] = animations[animations.length - 1]
            animations[animations.length - 1] = animation
            animations.pop()
          }
        }
      }
    }
    this._view.setOnAnimateCallback(onAnimate.bind(this));
  }

  update(): void {
    this._controls.update();
  }

  dispose(): void {
    this._controls.dispose();
  }

  panInDirection(left: boolean, right: boolean, top: boolean, bottom: boolean): void {
    if (this.animations.length >= 1) this.cancelAnimation();
    if (left && top) {
      this._controls.pan(15, 15);
    } else if (left && bottom) {
      this._controls.pan(15, -15);
    } else if (right && top) {
      this._controls.pan(-15, 15);
    } else if (right && bottom) {
      this._controls.pan(-15, -15);
    } else if (right) {
      this._controls.pan(-15, 0);
    } else if (left) {
      this._controls.pan(15, 0);
    } else if (top) {
      this._controls.pan(0, 15);
    } else {
      this._controls.pan(0, -15);
    }
    this._controls.update();
  }

  private addAnimation(animation: Animation): void {
    this.animations.push(animation);
  }

  cancelAnimation(): void {
    this.animations.shift();
  }

  panCameraTo(tile: Tile | Cell, durationMs: number): void {
    if (tile instanceof Cell) {
      tile = tile.tile;
    }
    const from = this._controls.target.clone();
    const to = tile.position.clone();

    this.addAnimation(new Animation(durationMs, (a): void => {
      this._view.focusOn(tile as Tile);
      this._controls.target = from.lerp(to, a);
      this._controls.update();
    }));

    if (this.animations.length > 1)
      this.cancelAnimation();
  }

  toggleControls(): void {
    if (this._view.controlled) {
      this._view.controlled = false;
      this._controls.dispose();
      delete this._controls;
    } else {
      this.initControls(this._view.settings.cameraControlSettings);
    }
  }

  updateControls(settings: CameraControlSettings): void {
    this._view.settings.cameraControlSettings = Engine.Tools.merge(this._view.settings.cameraControlSettings, settings) as CameraControlSettings;
    this._controls.minDistance = settings.minDistance || this._controls.minDistance;
    this._controls.maxDistance = settings.maxDistance || this._controls.maxDistance;
    this._controls.zoomSpeed = settings.zoomSpeed || this._controls.zoomSpeed;
    settings.hotEdges !== undefined ? this._view.hotEdges = settings.hotEdges : this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
    if (settings.autoRotate !== undefined) {
      this.toggleHorizontalRotation(settings.autoRotate);
      this._controls.autoRotate = settings.autoRotate;
    } else {
      this._controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
    }
    settings.enableDamping !== undefined ? this._controls.enableDamping = settings.enableDamping : this._controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
    this._controls.dampingFactor = settings.dampingFactor || this._view.settings.cameraControlSettings.dampingFactor;
    settings.screenSpacePanning !== undefined ? this._controls.screenSpacePanning = settings.screenSpacePanning : this._controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
    if (settings.minPolarAngle)
      this._controls.minPolarAngle = settings.minPolarAngle;
    if (settings.maxPolarAngle)
      this._controls.maxPolarAngle = settings.maxPolarAngle
    if (settings.maxAzimuthAngle)
      this._controls.maxAzimuthAngle = settings.maxAzimuthAngle;
    if (settings.minAzimuthAngle)
      this._controls.minAzimuthAngle = settings.minAzimuthAngle;

  }

  toggleHorizontalRotation(bool: boolean): void {
    if (bool) {
      this._controls.dispose();
      this._controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
      this._controls.minDistance = this._view.settings.cameraControlSettings.minDistance;
      this._controls.maxDistance = this._view.settings.cameraControlSettings.maxDistance;
      this._controls.zoomSpeed = this._view.settings.cameraControlSettings.zoomSpeed;
      this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
      this._controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
      this._controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
      this._controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
      this._controls.minPolarAngle = this._view.settings.cameraControlSettings.minPolarAngle;
      this._controls.maxPolarAngle = this._view.settings.cameraControlSettings.maxPolarAngle;
      this._controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };
    } else {
      this._controls.dispose();
      this._controls = new OrbitControls(this._view.camera, this._view.renderer.domElement, this._view);
      this._controls.minDistance = this._view.settings.cameraControlSettings.minDistance;
      this._controls.maxDistance = this._view.settings.cameraControlSettings.maxDistance;
      this._controls.zoomSpeed = this._view.settings.cameraControlSettings.zoomSpeed;
      this._view.hotEdges = this._view.settings.cameraControlSettings.hotEdges;
      this._controls.autoRotate = this._view.settings.cameraControlSettings.autoRotate;
      this._controls.enableDamping = this._view.settings.cameraControlSettings.enableDamping;
      this._controls.screenSpacePanning = this._view.settings.cameraControlSettings.screenSpacePanning;
      this._controls.minPolarAngle = this._view.settings.cameraControlSettings.minPolarAngle;
      this._controls.maxPolarAngle = this._view.settings.cameraControlSettings.maxPolarAngle;
      if (this._view.settings.cameraControlSettings.maxAzimuthAngle)
        this._controls.maxAzimuthAngle = this._view.settings.cameraControlSettings.maxAzimuthAngle;
      if (this._view.settings.cameraControlSettings.minAzimuthAngle)
        this._controls.minAzimuthAngle = this._view.settings.cameraControlSettings.minAzimuthAngle;
      this._controls.mouseButtons = { LEFT: MOUSE.RIGHT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.LEFT };
    }
  }

  rotateUp(angle: number): void {
    this._controls.rotateUp(angle);
  }
}