/* eslint-disable */
import React from "react";
import Engine from "./lib/Engine";
import { Link } from "react-router-dom";
import {
  ExtrudeBufferGeometry,
  Group,
  Mesh,
  PlaneBufferGeometry,
  Scene,
  ShaderMaterial,
  Vector3,
} from "three";
import View from "./lib/scene/View";
import Map from "./lib/map/Map";
import { ViewSettingsParams } from "./lib/utils/Interfaces";
import LoadSpinner from "./Components/UI/LoadSpinner";
import { Box, CircularProgress, Typography } from "@mui/material";
import ThreeCard from "./Components/UI/ThreeCard";
import { addPort, addWater } from "./Components/Catan/CatanHelpers";
import HexTile from "./lib/map/HexTile";
import GroupEntity from "./lib/env/GroupEntity";
import {
  createWater,
  updateWaterMaterial,
} from "./Components/Catan/Environment/Water";
import { createLightHouse } from "./Components/Catan/Environment/Port";
import RoutesView from "./Components/UI/RoutesView";
import { InputType } from "./lib/utils/MouseCaster";
import Tools from "./lib/utils/Tools";
import Tile from "./lib/map/Tile";

function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const defaultDescription = "A 3D framework for React.";

const routes = [
  {
    to: "/sandbox",
    label: "Sandbox",
    description: "Explore the library.",
    href: undefined,
  },
  {
    description: "Play Catan.",
    to: "/catan",
    label: "Catan",
    href: undefined,
  },
  {
    to: "/cloudShooter",
    label: "Cloud Shooter",
    description: "Fly in the Clouds.",
    href: undefined,
  },
  {
    to: "/cloudPlayer",
    label: "Cloud Player",
    description: "Chill in the Clouds.",
    href: undefined,
  },
  {
    to: "/cards",
    label: "Cards",
    description: "Explore the Cards.",
    href: undefined,
  },
  {
    to: undefined,
    label: "GitHub",
    description: "Explore the framework.",
    href: "https://github.com/christophgomez/threejs-tilemap",
  },
  {
    to: undefined,
    label: "Documentation",
    description: "Read the Documentation.",
    href: undefined,
  },
];

export default () => {
  const mapRef = React.useRef<Map>(null);
  const sceneRef = React.useRef<View>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const gridSpace = new Engine.HexGrid({
      // gridShape: Engine.GridShapes.FLAT_TOP_HEX,
      cellRadius: 20,
      gridRadius: 3,
    });
    const map = new Engine.Map(gridSpace, { hasOverlay: true });
    mapRef.current = map;
    const scene = new Engine.View(
      map,
      { element: document.getElementById("engine") },
      {
        maxDistance: 400,
        minDistance: 50,
        currentDistance: 400,
        controlled: true,
        userVerticalRotation: true,
        userHorizontalRotation: true,
      },
      async () => {
        setLoading(false);
      }
    );

    sceneRef.current = scene;
    // scene.controller.canClickPan = false;

    scene.controller.active = false;

    scene.controller.addOnTileMouseInputListener(
      InputType.LEFT_CLICK,
      ({ data }) => {
        if (data === null) return;

        if (!data.getCustomData()["highlightState"]) {
          data.setCustomDataVal("highlightState", 0);
        }

        data.getCustomData()["highlightState"]++;
        if (data.getCustomData()["highlightState"] > 2)
          data.getCustomData()["highlightState"] = 0;

        switch (data.getCustomData()["highlightState"]) {
          case 0:
            data.unhighlightAllEdges();
            break;
          case 1:
            data.highlightAllVertices();
            break;
          case 2:
            data.unhighlightAllVertices();
            data.highlightAllEdges();
            break;
        }
      }
    );

    return () => {
      scene?.dispose();
      gridSpace?.dispose();
      map?.dispose();
    };
  }, []);

  const [canvasActive, setCanvasActive] = React.useState(undefined);
  const [hasMoved, setHasMoved] = React.useState(false);
  const [canInteract, setCanInteract] = React.useState(false);

  React.useEffect(() => {
    if (canvasActive === undefined || !sceneRef.current) return;

    sceneRef.current.controller.active = canvasActive;
    if (!canvasActive) {
      sceneRef.current.map.unHighlightCurrentHighlightedTile();
    } else {
      if (sceneRef.current.map.highlightedTile)
        sceneRef.current.map.highlightedTile?.highlight(true);
      else {
        const { obj } =
          sceneRef.current.controller.mouseCaster.castForValidObj();

        if (obj !== null && obj instanceof Tile) {
          sceneRef.current.map.hightlightTile(obj);
        }
      }
    }
  }, [canvasActive]);

  React.useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.controller.active = canInteract;
  }, [canInteract]);

  React.useEffect(() => {
    const onMove = () => {
      if (!hasMoved) setHasMoved(true);
    };

    document.addEventListener("mousemove", onMove);

    return () => {
      document.removeEventListener("mousemove", onMove);
    };
  }, []);

  const [isInitialSlideDone, setSlideDone] = React.useState(false);
  const [pointerInLink, setPointerInLink] = React.useState(false);

  return (
    <div className="App">
      <RoutesView
        containerBackground
        containerBlur
        overlayBlurBackgroundStyle={{
          blurAmount: 20,
          backgroundColor: "rgba(0,0,0,.25)",
        }}
        routes={routes}
        loading={loading}
        defaultDescription={defaultDescription}
        onLinksSlideComplete={() => {
          setSlideDone(true);

          if (!pointerInLink) setCanInteract(true);
        }}
        onInitialIntro={() => {
          // const tile = sceneRef.current.map.getTileAtPosition(
          //   new Vector3(0, 0, 0)
          // );
          // tile.highlight(
          //   true,
          //   1000,
          //   () => {
          //     const neighs = tile.getNeighbors(true);
          //     for (const neigh of neighs) {
          //       // window.setTimeout(() => {
          //       neigh.tile.highlight(true, 1000, undefined, () =>
          //         neigh.tile.unhighlight(1000)
          //       );
          //       // }, 500);
          //     }
          //   },
          //   () => tile.unhighlight(1000)
          // );

          const promises = sceneRef.current.map.tiles.map((tile, i) => {
            const beginDelay = i * 10;
            const endDelay = 250;
            Tools.CreatePromiseRoutine(
              endDelay,
              beginDelay,
              () => {
                tile.highlightAllEdges(0x0084cc);
              },
              () => {
                tile.unhighlightAllEdges();
              }
            );
          });

          Promise.all(promises);
        }}
        onLoadSpinnerToggled={(active) => {
          if (active) setCanInteract(false);
        }}
        onPointerEnterLink={() => {
          setCanvasActive(false);
          setPointerInLink(true);
        }}
        onPointerLeaveLink={() => {
          setPointerInLink(false);
          if (isInitialSlideDone) setCanvasActive(true);
        }}
      />
      <div
        id="engine"
        style={{
          height: "100%",
          width: "100%",
        }}
      ></div>
    </div>
  );
};
