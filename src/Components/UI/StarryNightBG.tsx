import React from "react";
import ThreeCanvas from "../../Components/UI/ThreeCanvas";
import * as THREE from "three";
import {
  CreateCloudsScene,
  CreateStarField,
  createStarScene,
} from "../../Components/Catan/Environment/Sky";
import AnimationManager from "../../lib/utils/AnimationManager";

type UpdateFunction = (dt: number) => void;
type OnLoadFunction = (
  scene: THREE.Scene | Array<THREE.Scene>,
  camera: THREE.Camera,
  renderer: THREE.Renderer,
  animationManager: AnimationManager
) => void;

export default ({
  onLoad,
  unLoad,
  fps,
  cameraMoves = true,
  onUpdate,
}: {
  onLoad?: (
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  onUpdate?: (
    dt: number,
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  unLoad?: boolean;
  fps?: boolean;
  cameraMoves?: boolean;
}) => {
  const [scene, setScene] = React.useState<THREE.Scene | Array<THREE.Scene>>(
    null
  );
  const [camera, setCamera] = React.useState<THREE.Camera>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const docMoveRef =
    React.useRef<Array<{ event: string; function: (event: any) => void }>>(
      null
    );

  const [updateRef, setUpdateRef] = React.useState<
    UpdateFunction | Array<UpdateFunction>
  >(null);
  const [onLoadedRef, setOnLoadedRef] = React.useState<
    OnLoadFunction | Array<OnLoadFunction>
  >(null);

  const toggleCameraRotationRef =
    React.useRef<(canRotate: boolean) => void>(null);

  React.useEffect(() => {
    if (toggleCameraRotationRef.current)
      toggleCameraRotationRef.current(cameraMoves);
  }, [cameraMoves]);

  React.useEffect(() => {
    const load = async () => {
      if (containerRef.current && !scene && !camera) {
        const {
          scene: cloudScene,
          camera: cloudCam,
          documentEvents: cloudEvents,
          update: cloudUpdate,
          onLoad: cloudLoad,
          toggleCameraRotation,
        } = await CreateCloudsScene(containerRef.current, 0xffffff, 30);

        toggleCameraRotationRef.current = toggleCameraRotation;

        toggleCameraRotation(cameraMoves);
        const {
          scene: starScene,
          update: starUpdate,
          onLoad: starLoad,
        } = createStarScene(cloudCam, 0x0077ff, 0xffffff, 100);

        starScene.renderOrder = 0;
        cloudScene.renderOrder = 1;

        docMoveRef.current = cloudEvents;
        setUpdateRef([starUpdate, cloudUpdate]);
        setOnLoadedRef([starLoad, cloudLoad]);
        setScene([starScene, cloudScene]);
        setCamera(cloudCam);
      }
    };

    load();

    return () => {
      if (docMoveRef.current) {
        docMoveRef.current.forEach((e) =>
          document.removeEventListener(e.event, e.function)
        );
      }
    };
  }, [containerRef]);

  const [shouldNotRender, setShouldNotRender] = React.useState(false);

  React.useEffect(() => {
    if (unLoad === undefined) return;

    setTimeout(
      () => {
        setShouldNotRender(unLoad);
      },
      unLoad ? 1100 : 0
    );
  }, [unLoad]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: unLoad ? 0 : 1,
        transition: "all 1s",
        pointerEvents: !unLoad ? "inherit" : "none",
      }}
      ref={containerRef}
    >
      {!shouldNotRender &&
        scene !== null &&
        camera !== null &&
        updateRef !== null &&
        onLoadedRef !== null && (
          <ThreeCanvas
            fps={fps}
            scene={scene}
            camera={camera}
            onAnimate={(dt, scene, camera, renderer, animationManager) => {
              if (updateRef && Array.isArray(updateRef)) {
                (updateRef as Array<UpdateFunction>).forEach((update) =>
                  update(dt)
                );
              } else if (updateRef) {
                (updateRef as UpdateFunction)(dt);
              }

              if (onUpdate)
                onUpdate(dt, scene, camera, renderer, animationManager);
            }}
            onLoaded={(scene, camera, renderer, am) => {
              if (onLoadedRef && Array.isArray(onLoadedRef)) {
                (onLoadedRef as Array<OnLoadFunction>).forEach((onLoad) =>
                  onLoad(scene, camera, renderer, am)
                );
              } else if (onLoadedRef) {
                (onLoadedRef as OnLoadFunction)(scene, camera, renderer, am);
              }

              if (onLoad !== undefined) onLoad(scene, camera, renderer, am);
            }}
            transparent={true}
            render={true}
          />
        )}
    </div>
  );
};
