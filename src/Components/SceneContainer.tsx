import React from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import Map from "../lib/map/Map";
import {
  ControllerSettings,
  ControllerSettingsParams,
  SceneJSONData,
  ViewSettingsParams,
} from "../lib/utils/Interfaces";
import View from "../lib/scene/View";
import Controller from "../lib/scene/Controller";
import Engine, { EngineGridShapes, EngineTileShapes } from "../lib/Engine";
import HexGrid from "../lib/grid/HexGrid";
import "./SceneContainerStyles.css";
import LoadSpinner from "./UI/LoadSpinner";
import AnimationManager from "../lib/utils/AnimationManager";
import FPSCounter from "./UI/FPSCounter";
import { Scene } from "three";
import SqrGrid from "../lib/grid/SqrGrid";

function instanceOfSceneJSONData(object: any): object is SceneJSONData {
  return "viewData" in object;
}

export interface ISceneContainerProps {
  map: Map;
  scene: View;
  controller: Controller;
  canvas: HTMLDivElement;
  setIsLoading: (active: boolean) => void;
}

export default ({
  view,
  scene,
  sceneName,
  children,
  fps,
  nestChildrenWithinCanvas,
  ignoreCache,
  revealOnLoad,
  onBeginLoad,
}: {
  sceneName: string;
  view?: Map | SceneJSONData | ViewSettingsParams;
  scene?: Scene;
  children: JSX.Element | JSX.Element[];
  fps?: boolean;
  nestChildrenWithinCanvas?: boolean;
  ignoreCache?: boolean;
  revealOnLoad?: boolean;
  onBeginLoad?: (isLoading: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [spinnerShowing, setSpinnerShowing] = React.useState(true);

  const canvasRef = React.useRef<HTMLDivElement>(null);

  const mapRef: React.MutableRefObject<Map> = React.useRef(null);
  const sceneRef: React.MutableRefObject<View> = React.useRef(null);
  const controllerRef: React.MutableRefObject<Controller> = React.useRef(null);

  React.useEffect(() => {
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
      mapRef.current?.dispose();
      mapRef.current = null;
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (isLoading) setSpinnerShowing(true);
    else if (revealOnLoad === undefined || revealOnLoad)
      setSpinnerShowing(false);

    if (onBeginLoad !== undefined) onBeginLoad(isLoading);
  }, [isLoading]);

  const loadScene = (
    _sceneName: string,
    _scene?: Map | SceneJSONData | ViewSettingsParams,
    threeScene?: Scene
  ) => {
    setIsLoading(true);
    if (sceneRef.current) {
      sceneRef.current.dispose();
    }

    let params = {
      element: canvasRef.current as HTMLElement,
      sceneName: _sceneName,
      scene: threeScene,
    } as ViewSettingsParams;

    let controllerParams = {} as ControllerSettingsParams;

    if (_scene !== undefined && !(_scene instanceof Map)) {
      if (instanceOfSceneJSONData(_scene)) {
        params = { ..._scene.viewData, ...params };
        controllerParams = { ..._scene.controllerData };
      } else {
        params = { ..._scene, ...params };
      }
    }

    if (localStorage.getItem(_sceneName) && !ignoreCache) {
      sceneRef.current = new Engine.View(
        JSON.parse(localStorage.getItem(_sceneName)) as SceneJSONData,
        params,
        controllerParams
      );
    } else {
      let map;

      if (_scene !== undefined && instanceOfSceneJSONData(_scene)) {
        sceneRef.current = new Engine.View(_scene, params, controllerParams);
      } else {
        if (_scene !== undefined && _scene instanceof Map) {
          map = _scene;
        } else {
          map = new Map(new HexGrid({ cellRadius: 6, gridRadius: 10, gridShape: EngineGridShapes.RECT }));
        }

        sceneRef.current = new Engine.View(map, params, controllerParams);
      }
    }

    mapRef.current = sceneRef.current.map;
    controllerRef.current = sceneRef.current.controller;

    setIsLoading(false);
    // sceneRef.current.onLoaded = () => {
    //     if (revealOnLoad === undefined || revealOnLoad)
    //         setSpinnerShowing(false);
    // }
  };

  React.useEffect(() => {
    if (canvasRef.current !== undefined) {
      loadScene(sceneName, view, scene);
    }
  }, [canvasRef]);

  const [animManager, setAnimManager] = React.useState<AnimationManager>(null);
  React.useEffect(() => {
    if (sceneRef.current !== undefined && !animManager) {
      setAnimManager(sceneRef.current.animationManager);
    }
  }, [sceneRef]);

  return (
    <Box
      sx={{ display: "flex", height: "100%", width: "100%", flexFlow: "row" }}
    >
      {!isLoading &&
        !nestChildrenWithinCanvas &&
        React.Children.map(children, (child) => {
          return React.cloneElement<ISceneContainerProps>(child, {
            map: mapRef.current,
            scene: sceneRef.current,
            controller: controllerRef.current,
            canvas: canvasRef.current,
            setIsLoading: setSpinnerShowing,
            ...child.props,
          });
        })}
      <Box
        component="main"
        sx={{
          p: 0,
          height: "100%",
          width: "100%",
          opacity: isLoading ? 0 : 1,
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        <div id="gui"></div>
        {fps !== undefined && fps && animManager && (
          <FPSCounter
            animationManager={animManager}
            placement={{ vertical: "bottom", horizontal: "right" }}
          />
        )}
        <div
          className="SceneView"
          ref={canvasRef}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          {!isLoading &&
            nestChildrenWithinCanvas &&
            React.Children.map(children, (child) => {
              return React.cloneElement<ISceneContainerProps>(child, {
                map: mapRef.current,
                scene: sceneRef.current,
                controller: controllerRef.current,
                canvas: canvasRef.current,
                setIsLoading: setSpinnerShowing,
                ...child.props,
              });
            })}
        </div>
      </Box>
      <LoadSpinner loading={spinnerShowing} />
    </Box>
  );
};
