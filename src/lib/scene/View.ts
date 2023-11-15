import {
  ViewSettings,
  ControllerSettings,
  ViewController,
  ViewSettingsParams,
  ControllerSettingsParams,
  SceneJSONData,
} from "../utils/Interfaces";
import {
  WebGLRenderer,
  DirectionalLight,
  Scene,
  AmbientLight,
  PerspectiveCamera,
  Mesh,
  Vector3,
  Vector2,
  Object3D,
  SphereGeometry,
  MeshBasicMaterial,
  AxesHelper,
  DirectionalLightHelper,
  SpotLight,
  SpotLightHelper,
  PointLight,
  PointLightHelper,
  Geometry,
  BufferGeometry,
  BufferGeometryLoader,
  MaterialLoader,
  Material,
  Line,
  ToneMapping,
  CineonToneMapping,
  ACESFilmicToneMapping,
  Box3,
  Sphere,
} from "three";
import Tile from "../map/Tile";
import Cell from "../grid/Cell";
import Controller, { ControllerEvent, ZoomDirection } from "./Controller";
import MouseCaster from "../utils/MouseCaster";
import Tools from "../utils/Tools";
import Map from "../map/Map";
import AnimationManager from "../utils/AnimationManager";
import Animation from "../utils/Animation";
import EventEmitter from "../utils/EventEmitter";
import ResizeObserver from "resize-observer-polyfill";
import MeshEntity from "../env/MeshEntity";
import Engine from "../Engine";
import SpriteEntity from "../env/SpriteEntity";

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
  public settings: ViewSettings = {
    sceneName: "scene",
    element: document.body,
    alpha: true,
    antialias: true,
    clearColor: Tools.rgbToHex(Tools.randomizeRGB("0, 105, 148", 13)),
    sortObjects: false,
    cameraPosition: new Vector3(0, 0, 0), // {x, y, z}
    cameraFov: 25,
    cameraNear: 1,
    cameraFar: 1000,
    sceneMarginSize: 20,
    entities: {},
  } as ViewSettings;

  public controller: Controller;
  public animationManager: AnimationManager;
  // public hotEdges: boolean;

  private _onLoaded: () => void;

  private _cameraFocusedTile: Tile;

  get currentDistance() {
    if (!this.controller) return 0;

    return this.controller.currentDistance;
  }

  set currentDistance(val) {
    if (!this.controller) return;

    this.controller.currentDistance = val;
  }

  get currentPolarAngle() {
    if (!this.controller) return 0;

    return this.controller.currentPolarAngle;
  }

  set currentPolarAngle(val) {
    if (!this.controller) return;
    this.controller.currentPolarAngle = val;
  }

  get currentAzimuthAngle() {
    if (!this.controller) return 0;

    return this.controller.currentAzimuthAngle;
  }

  set currentAzimuthAngle(val) {
    if (!this.controller) return;

    this.controller.currentAzimuthAngle = val;
  }

  entities: { [name: string]: () => MeshEntity } = {};

  private _boundingBox: Box3;

  public get boundingBox(): Box3 {
    if (!this._boundingBox && this.container) {
      this._boundingBox = new Box3().setFromObject(this.container);
    }

    if (!this._boundingBox) return new Box3();

    return this._boundingBox;
  }

  constructor(
    map?: Map | SceneJSONData,
    config?: ViewSettingsParams,
    controllerConfig?: ControllerSettingsParams,
    onLoad?: () => void
  ) {
    super();
    if (onLoad) this._onLoaded = onLoad;
    if (map !== undefined && map instanceof Map) {
      this._initSceneSettings(config);
      this.addMap(map);
      this._initControls(controllerConfig);
    } else if (map !== undefined && !(map instanceof Map)) {
      map.viewData = Tools.merge(
        map.viewData ?? {},
        config ?? {}
      ) as ViewSettings;
      // map.controllerData = Tools.merge(map.controllerData ?? {}, controllerConfig ?? {}) as ControllerSettings;
      this.fromJSON(map);
    } else {
      this._initSceneSettings(config);
      this._initControls(controllerConfig);
    }

    // const axesHelper = new AxesHelper(15);
    // axesHelper.position.set(0, 10, 0);
    // this.add(axesHelper);
  }

  set onLoaded(callback: () => void) {
    this._onLoaded = callback;
  }

  get cameraFocusedTile(): Tile {
    return this._cameraFocusedTile;
  }

  add(mesh: Object3D, position?: Vector3): void {
    this.container.add(mesh);

    if (position) mesh.position.set(position.x, position.y, position.z);
  }

  public addMap(map: Map): void {
    if (this.map) {
      this.container.remove(this.map.group);
      this.map.dispose();
    }

    this.map = map;
    this.map.setView(this);
    this.container.add(map.group);
    this.map.addEventListener("mapCreated", () => {
      this.map.group.add(this.spotlight);
      this.spotlight.position.set(0, 200, 0);
      this.spotlight.lookAt(this.map.tileGroup.position);
      this.saveScene();
      this.triggerEvent("mapCreated");
      if (this._onLoaded !== undefined) this._onLoaded();
    });

    this.map.createMap();
  }

  private _attachedToElement = false;

  attachTo(element: HTMLElement): void {
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    element.appendChild(this.renderer.domElement);
    this._attachedToElement = true;
  }

  dispose(): void {
    cancelAnimationFrame(this.controllerUpdateID);
    this.controller?.dispose();
    this.animationManager?.dispose();
    this.map?.dispose();
    this.map = null;
    this.animationManager = null;
    this.container = null;
    this.camera = null;
    this.controller = null;
  }

  private _panCamAnim: Animation;
  panCameraTo(
    tile: Tile | Cell | Vector3,
    durationMs: number = 500,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    ease = Animation.easeInQuad
  ): void {
    let to: Vector3;

    if (!tile) return;

    if (tile instanceof Cell) {
      tile = tile.tile;
      if (!tile) return;
      to = tile.mapPosition.clone();
    } else if (tile instanceof Vector3) {
      to = tile.clone();
    } else to = tile.mapPosition.clone();

    this._panCamAnim?.stop(true);

    this._panCamAnim = this.animationManager.addAnimation(
      new Animation(
        durationMs,
        (dt): void => {
          // if (to.clone().set(Math.floor(to.x), Math.floor(to.y), Math.floor(to.z)).distanceTo(this.controller.target.clone().set(Math.floor(this.controller.target.x), Math.floor(this.controller.target.y), Math.floor(this.controller.target.z))) === 0) this.animationManager.stopAnimation(ControllerEvent.PAN, false);

          this.controller.target = this.controller.target.lerp(to, dt);
        },
        () => {
          console.log("pan start");

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

          this.triggerEvent(ControllerEvent.PAN, {
            target: this.controller.target.clone(),
            currentDistance: this.currentDistance,
            currentPolarAngle: this.currentPolarAngle,
            currentAzimuthAngle: this.currentAzimuthAngle,
            type: ControllerEvent.PAN,
          });

          console.log("pan complete");

          if (onComplete) onComplete();
        },
        () => {
          console.log("pan cancelled");
        },
        ease
      ),
      ControllerEvent.PAN,
      true
    );
  }

  // panInDirection(direction: Vector2): void {
  // 	this.controller.panInDirection(direction);
  // }

  curZoomAnim: Animation;

  private zoomTo: number;
  private angleTo: number;

  zoom(
    dir: ZoomDirection,
    amt = this.controller.config.zoomDelta,
    dur = 50,
    onStart: () => void = undefined,
    onComplete: (success) => void = undefined,
    onCancel: () => void = undefined,
    cancelCurrentZoom: boolean = true,
    targetDistance?: number,
    ease = Animation.easeInQuad
  ): boolean {
    if (dir === ZoomDirection.IN) {
      if (this.currentDistance <= this.controller.config.minDistance) {
        if (onComplete) onComplete(false);
        return false;
      }
    } else {
      if (this.currentDistance >= this.controller.config.maxDistance) {
        if (onComplete) onComplete(false);
        return false;
      }
    }

    const shouldChangeAngle = this.controller.isRightDown === false;

    const calcParams = () => {
      let fromDistance = this.currentDistance;
      if (targetDistance !== undefined)
        amt = Math.abs(fromDistance - targetDistance);

      let zoomRange =
        this.controller.config.maxDistance - this.controller.config.minDistance;
      let zoomDelta = amt;
      let zoomTo = Tools.clamp(
        this.currentDistance +
          (dir === ZoomDirection.IN ? -zoomDelta : zoomDelta),
        this.controller.config.minDistance,
        this.controller.config.maxDistance
      );

      let distancePercentage =
        (this.controller.config.maxDistance - zoomTo) / zoomRange;

      // Use the percentage to find the corresponding angle between minPolarAngle and maxPolarAngle
      let angleRange =
        this.controller.config.maxPolarAngle -
        this.controller.config.minPolarAngle;
      let angleTo =
        this.controller.config.minPolarAngle + distancePercentage * angleRange;

      this.zoomTo = zoomTo;

      if (shouldChangeAngle) this.angleTo = angleTo;
      return { zoomTo, angleTo };
    };

    // if (this._curVertRotAnim && cancelCurrentZoom) this._curVertRotAnim.stop();
    if (this.curZoomAnim && cancelCurrentZoom) this.curZoomAnim.stop();
    else if (
      this.curZoomAnim &&
      !this.curZoomAnim.complete &&
      !cancelCurrentZoom
    ) {
      // this.curZoomAnim.paused = true;
      calcParams();

      // Calculate the new duration
      const newDurationMs = this.curZoomAnim.durationMs + dur;

      // Calculate the new progress based on the new duration and original progress
      const newProgress =
        (this.curZoomAnim.progress * this.curZoomAnim.durationMs) /
        newDurationMs;
      this.curZoomAnim.progress = newProgress;
      return true;
    }

    let startRan = false;
    let shouldRot = shouldChangeAngle;
    this.curZoomAnim = this.animationManager.addAnimation(
      new Animation(
        dur,
        (dt, { zoomTo, angleTo }) => {
          this.currentDistance = Tools.lerp(
            this.currentDistance,
            this.zoomTo,
            dt
          );

          if (shouldRot)
            this.currentPolarAngle = Tools.lerp(
              this.currentPolarAngle,
              this.angleTo,
              dt
            );

          if (
            Tools.isEqualWithinThreshold(
              Tools.removeDecimals(this.zoomTo, 0),
              Tools.removeDecimals(this.currentDistance, 0),
              0
            )
          ) {
            this.curZoomAnim.stop(false);
          }
        },
        () => {
          if (onStart) onStart();
          startRan = true;

          return calcParams();
        },
        () => {
          this.curZoomAnim = null;
          // Assuming you have a camera instance named 'camera'
          this.camera.updateProjectionMatrix(); // Update the camera's projection matrix with the new values
          this.triggerEvent(ControllerEvent.ZOOM, {
            target: this.controller.target.clone(),
            currentDistance: this.currentDistance,
            currentPolarAngle: this.currentPolarAngle,
            currentAzimuthAngle: this.currentAzimuthAngle,
            type: dir.toString(),
          });

          if (onComplete) onComplete(true);
        },
        () => {
          this.curZoomAnim = null;
          if (onCancel) onCancel();
        },
        ease
      ),
      ControllerEvent.ZOOM,
      cancelCurrentZoom
    );

    return true;
  }

  public zoomMax(
    dir: ZoomDirection,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined,
    ease = Animation.easeInQuad
  ) {
    this.zoomToDistance(
      dir === ZoomDirection.IN
        ? this.controller.config.minDistance
        : this.controller.config.maxDistance,
      dur,
      onStart,
      onComplete,
      onCancel,
      ease
    );
  }

  public zoomToDistance(
    distance: number,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined,
    ease = Animation.easeInQuad
  ) {
    this.zoom(
      distance < this.currentDistance ? ZoomDirection.IN : ZoomDirection.OUT,
      this.controller.config.zoomDelta,
      dur,
      () => {
        if (onStart) onStart();
      },
      (success) => {
        if (onComplete) onComplete();
      },
      onCancel,
      true,
      distance,
      ease
    );
  }

  private _curHorRotAnim: Animation;

  rotateHorizontalTo(
    angle: number,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined,
    cancelCurrentRotate = true
  ) {
    if (this._curHorRotAnim && cancelCurrentRotate) this._curHorRotAnim.stop();

    this._curHorRotAnim = this.animationManager.addAnimation(
      new Animation(
        dur,
        (dt) => {
          const step = Tools.lerp(this.currentAzimuthAngle, angle, dt);
          this.currentAzimuthAngle = step;

          if (
            Tools.isEqualWithinThreshold(
              Tools.removeDecimals(angle, 0),
              Tools.removeDecimals(this.currentAzimuthAngle, 0),
              0
            )
          ) {
            this._curHorRotAnim?.stop(false);
          }
        },
        () => {
          if (onStart) onStart();
        },
        () => {
          this._curHorRotAnim = null;
          this.triggerEvent(ControllerEvent.ROTATE, {
            target: this.controller.target.clone(),
            currentDistance: this.currentDistance,
            currentPolarAngle: this.currentPolarAngle,
            currentAzimuthAngle: this.currentAzimuthAngle,
            type: "HORIZONTAL",
          });
          if (onComplete) onComplete();
        },
        () => {
          this._curHorRotAnim = null;
          if (onCancel) onCancel();
        },
        Animation.easeLinear
      ),
      ControllerEvent.ROTATE,
      cancelCurrentRotate
    );
  }

  private _curVertRotAnim: Animation;

  rotateVerticalTo(
    angle: number,
    dur = 1000,
    onStart: () => void = undefined,
    onComplete: () => void = undefined,
    onCancel: () => void = undefined,
    cancelCurrentRotate = true
  ) {
    if (this._curVertRotAnim && cancelCurrentRotate)
      this._curVertRotAnim.stop();

    this._curVertRotAnim = this.animationManager.addAnimation(
      new Animation(
        dur,
        (dt) => {
          const step = Tools.lerp(this.currentPolarAngle, angle, dt);
          this.currentPolarAngle = step;
        },
        () => {
          if (onStart) onStart();
        },
        () => {
          this._curVertRotAnim = null;
          this.triggerEvent(ControllerEvent.ROTATE, {
            target: this.controller.target.clone(),
            currentDistance: this.currentDistance,
            currentPolarAngle: this.currentPolarAngle,
            currentAzimuthAngle: this.currentAzimuthAngle,
            type: "VERTICAL",
          });
          if (onComplete) onComplete();
        },
        () => {
          this._curVertRotAnim = null;
          if (onCancel) onCancel();
        },
        Animation.easeLinear
      ),
      ControllerEvent.ROTATE,
      cancelCurrentRotate
    );
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

  updateControlSettings(settings: ControllerSettingsParams): void {
    this.controller.updateControlSettings(settings);
  }

  // Need to finish
  updateSettings(settings: ViewSettings): void {
    // update settings here
    // then update controls
    // this.updateControlSettings(settings.cameraControlSettings);
  }

  public spotlight: SpotLight;
  public directionalLights: DirectionalLight[];
  // private _initialIntensities = [];

  // private _directionalLightHelpers: Object3D[] = [];

  public ambientLight: AmbientLight;
  private _initSceneSettings(config?: ViewSettingsParams): void {
    config = config || ({} as ViewSettings);
    if (
      config &&
      config.cameraPosition &&
      Array.isArray(config.cameraPosition)
    ) {
      config.cameraPosition = new Vector3().fromArray(config.cameraPosition);
    }

    this.settings = Tools.merge(this.settings, config) as ViewSettings;
    if (!this.renderer) this.renderer = new WebGLRenderer();

    // this.renderer.setClearColor(this.settings.clearColor);

    // this.renderer.toneMapping = ACESFilmicToneMapping
    // this.renderer.toneMappingExposure = .5;
    // this.renderer.sortObjects = this.settings.sortObjects;
    // this.renderer.autoClearDepth = false;

    this.width = this.settings.element.clientWidth;
    this.height = this.settings.element.clientHeight;

    if (!this.container) {
      if (this.settings.scene) {
        this.container = this.settings.scene;
      } else this.container = new Scene();
    }
    // this.container.fog = this.settings.fog;

    if (!this.ambientLight) {
      this.ambientLight = new AmbientLight(0xdddddd);
      this.ambientLight.position.set(0, 0, 0);
      this.ambientLight.intensity = 0;
      this.container.add(this.ambientLight);
    }

    if (!this.spotlight) {
      let light = new SpotLight(0xffffff);
      light.intensity = 1;
      light.penumbra = 0.25;
      // light.decay = 100;
      light.angle = 50 * Engine.DEG_TO_RAD;
      this.spotlight = light;

      this.spotlight.shadow.mapSize.width = 1024;
      this.spotlight.shadow.mapSize.height = 1024;

      this.spotlight.shadow.camera.near = this.settings.cameraNear;
      this.spotlight.shadow.camera.far = this.settings.cameraFar;
      this.spotlight.shadow.camera.fov = this.settings.cameraFov;
      // this._directionalLightHelpers.push(new SpotLightHelper(light, 'white'));
      // this.container.add(light);
    }

    if (!this.directionalLights) {
      this.directionalLights = [];
      const dirLight1 = new DirectionalLight(0xffffff, 0);
      dirLight1.position.set(0, 50, 70);
      // dirLight1.intensity = .8;
      this.directionalLights.push(dirLight1);
      this.container.add(dirLight1);
      const dirLight2 = new DirectionalLight(0xffffff, 0);
      dirLight2.position.set(0, 50, -70);
      // dirLight2.intensity = .8;
      this.directionalLights.push(dirLight2);
      this.container.add(dirLight2);
      //

      // this.directionalLights.forEach((x, i) => this.container.add(new DirectionalLightHelper(x, 10, i % 2 === 0 ? 'red' : 'blue')));
    }

    // if (!this.settings.lightPosition) {

    // } else {
    // 	const p = this.settings.lightPosition;
    // 	this.settings.light.position.set(p.x, p.y, p.z);
    // 	this.settings.light.intensity = 1;
    // }
    // this._directionalLightHelpers.push(new DirectionalLightHelper(this.settings.light as DirectionalLight, 10, 'white'));

    // this.container.add(this.settings.light);
    // this.container.add(...this._directionalLightHelpers);

    if (!this.camera) {
      this.camera = new PerspectiveCamera(
        this.settings.cameraFov,
        this.width / this.height,
        this.settings.cameraNear,
        this.settings.cameraFar
      );
      // this.camera.add(this.directionalLight);
      // this.container.add(this.camera);
    } else {
      this.camera.fov = this.settings.cameraFov;
      this.camera.aspect = this.width / this.height;
      this.camera.near = this.settings.cameraNear;
      this.camera.far = this.settings.cameraFar;
    }

    // this.camera.lookAt(new Vector3(0, 1, 0));

    if (this.settings.cameraPosition) {
      this.camera.position.copy(this.settings.cameraPosition);
    }

    this.camera.updateProjectionMatrix();

    if (this._observer) {
      this._observer.unobserve(this._observed);
    } else {
      this._observer = new ResizeObserver(this.onWindowResize.bind(this));
    }

    this._observed = this.settings.element.parentElement;
    this._observer.observe(this._observed);

    if (!this._attachedToElement) this.attachTo(this.settings.element);

    if (!this.animationManager) this._initAnimationManager();
    // this.settings.element.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  private _observed: HTMLElement;
  private _observer: ResizeObserver;

  private _initControls(config?: ControllerSettingsParams): void {
    if (!this.controller) this.controller = new Controller(this, config);
    else this.controller.init(this, config);
  }

  private _initAnimationManager(): void {
    const onAnimate = (): void => {
      //   this.controller?.update();
      // Adjust the intensity of the directional light based on distance

      const updateDirectionalLightIntensity = (i, inView) => {
        const directionalLight = this.directionalLights[i];

        if (!inView) {
          directionalLight.intensity = 0;
          return;
        }

        // Calculate the normalized distance factor between maxDistance and minDistance
        const normalizedDistance =
          (this.controller.config.maxDistance -
            this.controller.currentDistance) /
          (this.controller.config.maxDistance -
            this.controller.config.minDistance);

        // Calculate the intensity based on the normalized distance
        const intensity = normalizedDistance;

        // Clamp the intensity to the range [0, 1]
        directionalLight.intensity = Math.max(0.1, Math.min(intensity, 1));
      };

      const updateSpotlightIntensity = (inView) => {
        if (!inView) {
          this.spotlight.intensity = 1;
          return;
        }

        // Calculate the normalized distance factor between minDistance and maxDistance
        const normalizedDistance =
          (this.controller.currentDistance -
            this.controller.config.minDistance) /
          (this.controller.config.maxDistance -
            this.controller.config.minDistance);

        // Calculate the intensity based on the normalized distance
        const intensity = normalizedDistance;

        // Clamp the intensity to the range [0, 1]
        this.spotlight.intensity = Math.max(0, Math.min(intensity, 1));
      };

      if (
        this.controller !== undefined &&
        this.camera !== undefined &&
        this.map?.tiles !== undefined &&
        this.map.tiles.length > 0
      ) {
        let tilesInView = true;
        if (
          !this.map?.tiles?.some(
            (x) => x.mesh && Tools.isMeshInView(x.mesh, this.camera)
          )
        ) {
          tilesInView = false;
        }

        this.directionalLights?.forEach((_, i) =>
          updateDirectionalLightIntensity(i, tilesInView)
        );

        if (this.spotlight) updateSpotlightIntensity(tilesInView);
      }
    };

    this.animationManager = new AnimationManager(
      this.renderer,
      this.container,
      this.camera,
      onAnimate
    );

    const updateController = () => {
      this.controllerUpdateID = requestAnimationFrame(updateController);
      this.controller?.update();
    };

    updateController();
  }

  private controllerUpdateID;

  private _resizeID: number;
  private onWindowResize(): void {
    window.clearTimeout(this._resizeID);

    this.animationManager?.setAnimationLoopPaused(true);
    this.width = this.settings.element.clientWidth;
    this.height = this.settings.element.clientHeight;
    if (this.camera != null) {
      (this.camera as PerspectiveCamera).aspect = this.width / this.height;
      (this.camera as PerspectiveCamera).updateProjectionMatrix();
    }
    this.renderer?.setSize(this.width, this.height);

    this._resizeID = window.setTimeout(() => {
      this.animationManager?.setAnimationLoopPaused(false);
    }, 100);
  }

  public toJSON(): SceneJSONData {
    const { element, ...others } = this.settings;
    let data = {
      ...others,
      cameraPosition: this.camera?.position.toArray(),
      element: null,
      scene: null,
      // lightPosition: others.lightPosition ? others.lightPosition.toArray() : undefined
    } as ViewSettingsParams;
    return {
      viewData: data as ViewSettings,
      controllerData: this.controller?.toJSON(),
      mapData: this.map?.toJSON(),
      sprites: this.sprites.map((x) => x.toJSON()),
      miscObjs: this.miscObjects.map((x) => {
        let geometryJSON;
        let materialJSON;
        let type;
        if (x instanceof Line || x instanceof Mesh) {
          if (x.geometry instanceof Geometry) {
            x.geometry = new BufferGeometry().fromGeometry(x.geometry);
            x.geometry.computeVertexNormals();
          }

          geometryJSON = x.geometry.toJSON();

          materialJSON = Array.isArray(x.material)
            ? x.material.map((m) => m.toJSON())
            : x.material.toJSON();

          if (x instanceof Line) type = "Line";
          else type = "Mesh";
        }

        return { geometryJSON, materialJSON, type };
      }),
    };
  }

  reset() {
    if (this.renderer) this.renderer.dispose();
    if (this._observer) this._observer.disconnect();
    // if (this.container) this.container.dispose();
  }

  private static bufferGeomLoader = new BufferGeometryLoader();
  private static matLoader = new MaterialLoader();

  public fromJSON(data: SceneJSONData) {
    let settings = {
      ...data.viewData,
      cameraPosition: Array.isArray(data.viewData.cameraPosition)
        ? new Vector3().fromArray(data.viewData.cameraPosition)
        : data.viewData.cameraPosition,
      entities: data.viewData.entities ?? {},
      element:
        data.viewData.element !== undefined && data.viewData.element !== null
          ? data.viewData.element
          : this.settings.element,
    } as ViewSettingsParams;

    this.settings = Tools.merge(this.settings, settings) as ViewSettings;
    let map;
    if (data.mapData) {
      map = new Map(data.mapData, undefined, undefined, this);
    }

    this._initSceneSettings();

    if (map) {
      this.addMap(map);
    }

    if (!this.controller) this._initControls(data.controllerData);

    this.controller.fromJSON(data.controllerData);

    // if (data.sprites) {
    // 	for (const s of data.sprites) {
    // 		SpriteEntity.loadSprite(s, (_) => {
    // 			this.addSpriteEntity(_, (__) => {
    // 				__.sprite.position.fromArray(s.position);
    // 				__.sprite.rotation.fromArray(s.rotation);
    // 				__.sprite.scale.fromArray(s.scale);
    // 				this.saveScene();
    // 			});
    // 		});
    // 	}
    // }

    // if (data.miscObjs) {
    // 	for (const o of data.miscObjs) {
    // 		let geom = View.bufferGeomLoader.parse(o.geometryJSON);

    // 		let mat: Material | Material[];
    // 		if (Array.isArray(o.materialJSON)) {
    // 			mat = o.materialJSON.map(j => View.matLoader.parse(j));
    // 		} else {
    // 			mat = View.matLoader.parse(o.materialJSON);
    // 		}

    // 		let obj;
    // 		if (o.type === 'Mesh')
    // 			obj = new Mesh(geom, mat);
    // 		else
    // 			obj = new Line(geom, mat);

    // 		this.addMiscObject(obj);
    // 	}
    // }
  }

  public saveScene() {
    let json = this.toJSON();

    localStorage.setItem(this.settings.sceneName, JSON.stringify(json));
  }

  private sprites: SpriteEntity[] = [];

  public addSpriteEntity(
    sprite: SpriteEntity,
    onComplete?: (sprite: SpriteEntity) => void
  ) {
    if (this.sprites.includes(sprite)) return;

    this.container.add(sprite.sprite);
    this.sprites.push(sprite);
    this.saveScene();

    if (onComplete) onComplete(sprite);
  }

  private miscObjects: Object3D[] = [];

  public addMiscObject(obj: Object3D) {
    if (this.miscObjects.includes(obj)) return;

    this.container.add(obj);
    this.miscObjects.push(obj);
    this.saveScene();
  }
}
