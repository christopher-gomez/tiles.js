import React, { useEffect } from "react";
import ThreeCanvas from "../../Components/UI/ThreeCanvas";
import * as THREE from "three";
import AnimationManager from "../../lib/utils/AnimationManager";

export type UpdateFunction = (dt: number) => void;
export type OnLoadFunction = (
  scene: THREE.Scene | Array<THREE.Scene>,
  camera: THREE.Camera,
  renderer: THREE.Renderer,
  animationManager: AnimationManager
) => void;

export default ({
  scene,
  camera,
  onUpdate,
  onLoaded,
  onDocumentEventListeners,
  fps = true,
  isLoading,
}: {
  scene: THREE.Scene | Array<THREE.Scene>;
  camera: THREE.Camera;
  onUpdate?: UpdateFunction | Array<UpdateFunction>;
  onLoaded: OnLoadFunction | Array<OnLoadFunction>;
  onDocumentEventListeners?: Array<{
    event: string;
    listener: EventListenerOrEventListenerObject;
  }>;
  fps?: boolean;
  isLoading: boolean;
}) => {
  const [_scene, setScene] = React.useState<THREE.Scene | Array<THREE.Scene>>(
    null
  );
  const [_camera, setCamera] = React.useState<THREE.Camera>(null);

  const [updateRef, setUpdateRef] = React.useState<
    UpdateFunction | Array<UpdateFunction>
  >(null);

  const [_onLoaded, setOnLoaded] = React.useState<
    OnLoadFunction | Array<OnLoadFunction>
  >(null);

  useEffect(() => {
    if (scene) setScene(scene);
    if (camera) setCamera(camera);
    if (onUpdate) setUpdateRef(onUpdate);
    if (onLoaded) setOnLoaded(onLoaded);
  }, [scene, camera, onUpdate, onLoaded]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const docEventsRef =
    React.useRef<
      Array<{ event: string; listener: EventListenerOrEventListenerObject }>
    >(null);

  useEffect(() => {
    if (onDocumentEventListeners) {
      onDocumentEventListeners.forEach((e) =>
        document.addEventListener(e.event, e.listener)
      );
      docEventsRef.current = onDocumentEventListeners;
    }

    return () => {
      if (docEventsRef.current) {
        docEventsRef.current.forEach((e) =>
          document.removeEventListener(e.event, e.listener)
        );
      }
    };
  }, [onDocumentEventListeners]);

  const [hasFocus, setHasFocus] = React.useState(false);

  return (
    <div
      style={{ height: "100%", width: "100%" }}
      ref={containerRef}
      onClick={() => {
        setHasFocus(true);
      }}
    >
      {!isLoading && _scene && _camera && _onLoaded && (
        <ThreeCanvas
          fps={fps}
          scene={_scene}
          camera={_camera}
          onAnimate={(dt, scene, camera, renderer) => {
            if (updateRef && Array.isArray(updateRef)) {
              (updateRef as Array<UpdateFunction>).forEach((update) =>
                update(dt)
              );
            } else if (updateRef) {
              (updateRef as UpdateFunction)(dt);
            }
          }}
          onLoaded={(scene, camera, renderer, am) => {
            console.log("on loaded inner inner: " + am);
            if (_onLoaded && Array.isArray(_onLoaded)) {
              (_onLoaded as Array<OnLoadFunction>).forEach((onLoad) =>
                onLoad(scene, camera, renderer, am)
              );
            } else if (_onLoaded) {
              (_onLoaded as OnLoadFunction)(scene, camera, renderer, am);
            }
          }}
          transparent={true}
          render={true}
        />
      )}
    </div>
  );
};
