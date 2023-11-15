import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import AnimationManager from "../../lib/utils/AnimationManager";
import FPSCounter from "./FPSCounter";

export default ({
  scene,
  camera,
  renderer,
  cameraSettings,
  onAnimate,
  obj,
  onOpen,
  open,
  onLoaded,
  render,
  children,
  clearColor,
  transparent = false,
  fps = false,
  onCanvas,
}: {
  fps?: boolean;
  scene?: THREE.Scene | Array<THREE.Scene>;
  camera?: THREE.Camera;
  renderer?: THREE.Renderer;
  cameraSettings?: {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
    position?: THREE.Vector3;
  };
  onCanvas?: (canvas: HTMLCanvasElement) => void;
  onAnimate?: (
    dt: number,
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  obj?: THREE.Mesh | THREE.Group | THREE.Object3D;
  onOpen?: (
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  open?: boolean;
  onLoaded?: (
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  render?: boolean;
  children?: JSX.Element;
  clearColor?: number;
  transparent?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | Array<THREE.Scene>>(null);
  const cameraRef = useRef<THREE.Camera>(null);
  const rendererRef = useRef<THREE.Renderer>(null);

  const [isOpen, setIsOpen] = React.useState(false);
  const openRef = useRef(false);

  const shouldRenderRef = useRef(true);

  useEffect(() => {
    if (render === undefined || render === true) {
      shouldRenderRef.current = true;
    } else {
      shouldRenderRef.current = false;
    }
  }, [render]);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const animID = useRef(null);
  useEffect(() => {
    openRef.current = isOpen;

    if (animManager.current) {
      animManager.current.removeOnAnimateListener(animID.current);
      animID.current = null;
    }

    if (isOpen && animManager.current) {
      animID.current = animManager.current.addOnAnimateListener(animate);
      if (onOpen !== undefined && sceneRef.current !== null)
        onOpen(
          sceneRef.current,
          cameraRef.current,
          rendererRef.current,
          animManager.current
        );
    }
  }, [isOpen]);

  // Create an animation loop
  const animate = (timestamp: number) => {
    if (!openRef.current || !sceneRef.current) {
      return;
    }

    if (onAnimate !== undefined)
      onAnimate(
        timestamp,
        sceneRef.current,
        cameraRef.current,
        rendererRef.current,
        animManager.current
      );

    if (shouldRenderRef.current) {
      if (Array.isArray(sceneRef.current)) {
        (rendererRef.current as THREE.WebGLRenderer).autoClear = false;
        (rendererRef.current as THREE.WebGLRenderer).clear();

        sceneRef.current
          .sort((a, b) => a.renderOrder - b.renderOrder)
          .forEach((scene) =>
            rendererRef.current.render(scene, cameraRef.current)
          );
      } else {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }
  };

  const animManager = React.useRef<AnimationManager>(null);

  useEffect(() => {
    if (sceneRef.current !== null || canvasRef.current === null) return;

    if (canvasRef.current) {
      if (onCanvas) onCanvas(canvasRef.current);
    }

    // Create a scene, camera, and renderer

    let _scene: THREE.Scene | Array<THREE.Scene>;

    if (scene) _scene = scene;
    else _scene = new THREE.Scene();
    sceneRef.current = _scene;

    let camSettings = {
      fov: 50,
      aspect: canvasRef.current.offsetWidth / canvasRef.current.offsetHeight,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 0, 10),
    };
    if (cameraSettings !== undefined)
      camSettings = { ...camSettings, ...cameraSettings };

    let _camera: THREE.Camera;

    if (camera) _camera = camera;
    else
      _camera = new THREE.PerspectiveCamera(
        camSettings.fov,
        camSettings.aspect,
        camSettings.near,
        camSettings.far
      );

    cameraRef.current = _camera;

    let _renderer: THREE.Renderer;

    if (renderer) {
      _renderer = renderer;
      document.body.appendChild(_renderer.domElement);
    } else {
      _renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
      });
    }

    (_renderer as THREE.WebGLRenderer).setClearColor(
      transparent ? 0x000000 : clearColor ?? 0xffffff,
      transparent ? 0 : 1
    );

    rendererRef.current = _renderer;

    // _renderer.setSize(bound.width, bound.height, true);

    const am = new AnimationManager(
      _renderer,
      Array.isArray(_scene) ? _scene[0] : _scene,
      _camera,
      undefined,
      false,
      true
    );
    animManager.current = am;

    // Create a cube and add it to the scene
    // const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);

    if (obj !== undefined && !Array.isArray(_scene)) _scene.add(obj);

    if (!scene && !Array.isArray(_scene)) _scene.add(new THREE.AmbientLight());

    if (!camera) _camera.position.copy(camSettings.position);

    if (onLoaded !== undefined) onLoaded(_scene, _camera, _renderer, am);

    if (open === undefined) setIsOpen(true);

    return () => {
      sceneRef.current = null;
      animManager.current?.dispose();
    };
  }, [canvasRef]);

  return (
    <>
      {children === undefined && (
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%" }}
        ></canvas>
      )}
      <>
        {fps && animManager.current && (
          <FPSCounter animationManager={animManager.current} />
        )}
        {children}
      </>
    </>
  );
};
