import React from "react";
import ThreeCanvas from "../Components/UI/ThreeCanvas";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  CreateCloudsScene,
  CreateStarField,
  createStarScene,
} from "../Components/Catan/Environment/Sky";
import AnimationManager from "../lib/utils/AnimationManager";
import RoutesView from "../Components/UI/RoutesView";
import Game from "../Components/SpaceShooter/Engine/Game";


type UpdateFunction = (dt: number) => void;
type OnLoadFunction = (
  scene: THREE.Scene | Array<THREE.Scene>,
  camera: THREE.Camera,
  renderer: THREE.Renderer,
  animationManager: AnimationManager
) => void;

export default () => {
  const [scene, setScene] = React.useState<THREE.Scene | Array<THREE.Scene>>(
    null
  );
  const [camera, setCamera] = React.useState<THREE.Camera>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const docEventsRef =
    React.useRef<Array<{ event: string; function: (event: any) => void }>>(
      null
    );

  const [updateRef, setUpdateRef] = React.useState<
    UpdateFunction | Array<UpdateFunction>
  >(null);
  const [onLoadedRef, setOnLoadedRef] = React.useState<
    OnLoadFunction | Array<OnLoadFunction>
  >(null);

  const onInit = React.useRef<() => void>(null);
  const togglePauseRef = React.useRef<(active: boolean) => void>(null);

  const [isPaused, setIsPaused] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isInit, setIsInit] = React.useState(false);

  React.useEffect(() => {
    const asyncLoad = async () => {
      if (containerRef.current && !scene && !camera) {
        const {
          scene: cloudScene,
          camera: cloudCam,
          documentEvents: cloudEvents,
          togglePause,
          update: cloudUpdate,
          onLoad: shipLoad,
          setInit: shipInit,
        } = await Game(
          containerRef.current,
          (numAvail, total) => {
            if (ammoCountRef.current) {
              ammoCountRef.current.innerText = `${numAvail} / ${total}`;
            }
          },
          (toggled) => {
            setIsPaused(toggled);
          },
          (locked) => {
            setIsLocked(locked);
            setHasFocus(locked);
          }
        );

        const {
          scene: starScene,
          update: starUpdate,
          onLoad: starLoad,
        } = createStarScene(cloudCam);

        starScene.renderOrder = 0;
        cloudScene.renderOrder = 1;

        docEventsRef.current = [...cloudEvents];
        setUpdateRef([starUpdate, cloudUpdate]);
        setOnLoadedRef([starLoad, shipLoad]);
        setScene([starScene, cloudScene]);
        setCamera(cloudCam);
        onInit.current = shipInit;
        togglePauseRef.current = togglePause;
      }
    };

    asyncLoad();

    return () => {
      if (docEventsRef.current) {
        for (const event of docEventsRef.current) {
          document.removeEventListener(event.event, event.function);
        }
      }
    };
  }, [containerRef]);
  const doneLoading =
    scene !== null &&
    camera !== null &&
    updateRef !== null &&
    onInit !== null &&
    onLoadedRef !== null;

  const [showMain, setShowMain] = React.useState(true);
  const [hasFocus, setHasFocus] = React.useState(false);

  const getAmmoCountRef = () => {
    return ammoCountRef.current;
  };

  const ammoCountRef = React.useRef<HTMLHeadingElement>(null);

  return (
    <div
      style={{ height: "100%", width: "100%" }}
      ref={containerRef}
      onClick={() => {
        setHasFocus(true);
      }}
    >
      {showMain && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: isInit ? "none" : "inherit",
            display: isPaused ? "none" : "inherit",
            zIndex: 100,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            opacity: isInit ? 0 : 1,
            transition: "all 1s",
          }}
        >
          <RoutesView
            containerBlur={true}
            loading={!doneLoading}
            defaultDescription="Pew Pew.."
            title="Ship Shooter"
            routes={[
              {
                label: "Play",
                description: "Play the game!",
                onClick: () => {
                  togglePauseRef.current(false);
                  onInit.current();
                  setIsInit(true);

                  window.setTimeout(() => {
                    window.setTimeout(() => {
                      setShowMain(false);
                    }, 1000);
                  }, 0);
                },
              },
            ]}
          />
        </div>
      )}

      {doneLoading && (
        <>
          <ThreeCanvas
            fps={true}
            scene={scene}
            camera={camera}
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
              if (onLoadedRef && Array.isArray(onLoadedRef)) {
                (onLoadedRef as Array<OnLoadFunction>).forEach((onLoad) =>
                  onLoad(scene, camera, renderer, am)
                );
              } else if (onLoadedRef) {
                (onLoadedRef as OnLoadFunction)(scene, camera, renderer, am);
              }
            }}
            transparent={true}
            render={true}
          />
          {
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                opacity: isPaused || !isLocked || !isInit || showMain ? 0 : 1,
                pointerEvents: "none",
                transition: "all 1s",
                zIndex: 100,
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                color: "white",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  color: "white",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    backgroundColor: "rgba(0,0,0,.5)",
                    borderRadius: "1em 0 1em",
                    display: "flex",
                    flexFlow: "column",
                    alignContent: "left",
                    justifyContent: "left",
                    alignItems: "left",
                    justifyItems: "left",
                    padding: "1em",
                  }}
                >
                  <h3 ref={ammoCountRef}>0 / 0</h3>
                </div>
              </div>
            </div>
          }
          {(isPaused || (!isLocked && isInit && !showMain)) && (
            <div
              onClick={(e) => {
                if (!hasFocus) return;

                if (isPaused) togglePauseRef.current(false);
              }}
              className="overlay"
              style={{
                backdropFilter: true ? "blur(20px)" : "blur(0px)",
                backgroundColor: true ? "rgba(0,0,0,.5)" : "rgba(0,0,0,0)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexFlow: "column",
                  alignItems: "center",
                  alignContent: "center",
                  justifyContent: "center",
                  justifyItems: "center",
                  color: "white",
                  backgroundColor: "rgba(0,0,0,.1)",
                  backdropFilter: "blur(1px)",
                  padding: "1em 2em",
                  borderRadius: "1em",
                }}
              >
                <h1>Paused</h1>
                {!hasFocus ? (
                  <h2>Click Anywhere...</h2>
                ) : !isLocked ? (
                  <h2>One More Time...</h2>
                ) : (
                  <h2>Uh Oh...</h2>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
