/* eslint-disable */
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";
import "./styles/sandbox.css";
import Box from '@mui/material/Box';
import { Group, Mesh, Vector3 } from "three";
import Controller, { ZoomDirection } from "../lib/scene/Controller";
import HexGrid from "../lib/grid/HexGrid";
import Map from "../lib/map/Map";
import View from "../lib/scene/View";
import Engine from "../lib/Engine";
import GUI from "./dat";
import UIManager from "./UI/UIManager";
import Tile, { TileTerrain } from "../lib/map/Tile";
import { InputType } from "../lib/utils/MouseCaster";
import Entity, { EntityPlacementType } from "../lib/env/Entity";
import MeshText, { MeshTextSettingsParam } from "../lib/env/MeshText";
import Tools from "../lib/utils/Tools";
import GridData from '../Assets/Catan_Basic.json';
import { GridJSONData } from "../lib/utils/Interfaces";
import { CellNeighborDirections } from "../lib/grid/Cell";

enum Entities {
  Road = "Road",
  Building = "Building"
}

const params = {
  cameraControl: {
    controlled: true,
    enableDamping: true,
    dampingFactor: 0.05,
    currentDistance: 300,
    minDistance: 100,
    maxDistance: 300,
    zoomSpeed: 10,
    autoRotate: false,
    screenSpacePanning: false,
    currentPolarAngle: 0,
    minPolarAngle: 0,
    maxPolarAngle: 45,
    minAzimuthAngle: Math.PI,
    maxAzimuthAngle: Math.PI,
    horizontalRotation: false,
  },
};

export default () => {
  const [state, setState] = React.useState({
    fullscreen: false,
    showDebugDatControls: false,
    buildOpen: false,
    sideBarOpen: false
  });

  const canvasDiv: React.MutableRefObject<HTMLDivElement> = React.useRef(null);
  // const gridSpace: React.MutableRefObject<HexGrid> = React.useRef(null)
  const map: React.MutableRefObject<Map> = React.useRef(null);
  const scene: React.MutableRefObject<View> = React.useRef(null);
  const controller: React.MutableRefObject<Controller> = React.useRef(null);
  const animationID: React.MutableRefObject<string> = React.useRef(null);
  const gui: React.MutableRefObject<any> = React.useRef(null);

  const pointerEntity: React.MutableRefObject<Entity> = React.useRef(null);

  const buildingOnPointer = React.useRef(false);
  const roadOnPointer = React.useRef(false);

  React.useEffect(() => {
    return () => {
      scene.current?.animationManager.cancelOnAnimate(animationID.current);
      scene.current?.dispose();
      scene.current = null;
      map.current?.dispose();
      map.current = null;
      controller.current?.dispose();
      controller.current = null;
    }
  }, [])

  const onSpaceDown = () => {
    if (scene.current) {
      scene.current.panCameraTo(new Vector3(0, 0, 0), 500, () => {
        controller.current.zoomMax(ZoomDirection.OUT, 10);
      });
    }
  }

  const [highlightedTile, setHighlighedTile] = React.useState<Tile>(null);

  const onTileHighlight = (args: { data: Tile, order: number }) => {
    // let diaNeighs = t.getNeighbors(true);

    // console.log(t.cell.directions);
    // console.log(t.cell.diagonals);
    // for (let neigh of diaNeighs) {
    //   neigh.tile.highlight();
    // }

    // t.getNeighbor(CellNeighborDirections.SOUTH)?.tile.highlight();

    setHighlighedTile(args.data);
  }

  const onTileUnhighlight = (args: { data: Tile, order: number }) => {
    setHighlighedTile(null);
  }

  const [curMapSize, setCurMapSize] = React.useState(0);
  const [numEntities, setNumEntities] = React.useState(0);

  const [cameraControlled, setCameraControlled] = React.useState(true);
  const [cameraMaxZoom, setCameraMaxZoom] = React.useState(0);
  const [cameraMinZoom, setCameraMinZoom] = React.useState(0);
  const [cameraCurZoom, setCameraCurZoom] = React.useState(0);
  const [cameraCurZoomDelta, setCameraCurZoomDelta] = React.useState(0);

  const [initted, setInitted] = React.useState(false);
  React.useEffect(() => {
    const cc = params.cameraControl;

    if (canvasDiv.current && !initted) {
      // this constructs the cells in grid coordinate space
      let grid = new Engine.HexGrid({
        gridShape: Engine.GridShapes.POINT_TOP_HEX,
        gridRadius: 10,
        cellRadius: 6,
      });

      map.current = new Engine.Map(GridData as GridJSONData);

      scene.current = new Engine.View(map.current, {
        element: canvasDiv.current as HTMLElement,

        cameraControlSettings: {
          controlled: cc.controlled,
          // enableDamping: cc.enableDamping,
          // dampingFactor: cc.dampingFactor,
          currentDistance: cc.currentDistance,
          maxDistance: cc.maxDistance,
          minDistance: cc.minDistance,
          // enableZoom: cc.enableZoom,
          zoomAmount: cc.zoomSpeed,
          // hotEdges: cc.hotEdges,
          autoRotate: cc.autoRotate,
          // screenSpacePanning: cc.screenSpacePanning,
          currentPolarAngle: cc.currentPolarAngle,
          minPolarAngle: cc.minPolarAngle,
          maxPolarAngle: cc.maxPolarAngle,
          maxAzimuthAngle: cc.maxAzimuthAngle,
          minAzimuthAngle: cc.minAzimuthAngle,
          // horizontalRotation: cc.horizontalRotation,
          cameraPosition: undefined,

          cameraFov: 20, cameraNear: 1, cameraFar: 1000
        },
      });

      controller.current = scene.current.controller;

      map.current.generateOverlay(45);
      scene.current.focusOn(new Vector3(0, 0, 0));

      const el = document.getElementById("fps");

      const onAnimation = (dtS) => {
        const fps = 1 / dtS;
        el.innerHTML = "FPS: " + fps.toFixed(0);
      };

      animationID.current = scene.current.animationManager.addOnAnimate(
        onAnimation
      );

      setUpDebugGUIControls();

      controller.current.addKeyDownListener("Space", onSpaceDown);

      controller.current.addOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
      controller.current.addOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);

      setCurMapSize(map.current.size);
      setNumEntities(map.current.numEntities);
      setCameraControlled(scene.current.controller.active)
      setCameraCurZoom(scene.current.currentDistance)
      setCameraMaxZoom(scene.current.controller.config.maxDistance)
      setCameraMinZoom(scene.current.controller.config.minDistance);
      setCameraCurZoomDelta(scene.current.controller.config.zoomAmount);

      controller.current.addEventListener('active', (active) => {
        setCameraControlled(active);
      })

      map.current.addEventListener('created', () => {
        setCurMapSize(map.current.size);
      });

      scene.current.controller.addEventListener('zoom', (args) => {
        if (zoomStateTimeoutID.current) {
          clearTimeout(zoomStateTimeoutID.current);
        }

        zoomStateTimeoutID.current = window.setTimeout(() => {
          setCameraCurZoom(args.currentDistance);
          setCameraMaxZoom(controller.current.config.maxDistance);
          setCameraMinZoom(controller.current.config.minDistance);
        }, 100);
      });

      setInitted(true);
    }

    () => {
      
    }
  }, [canvasDiv])

  const zoomStateTimeoutID = React.useRef<number>(null);

  const setCurEntitySnapping = () => {

    if (!controller.current) return;

    if (entityPlacementRef.current === EntityPlacementType.CENTER) {
      controller.current.vertexSnapping = false;
      controller.current.edgeSnapping = false;
    } else if (entityPlacementRef.current === EntityPlacementType.EDGE) {
      controller.current.vertexSnapping = false;
      controller.current.edgeSnapping = true;
    } else {
      controller.current.edgeSnapping = false;
      controller.current.vertexSnapping = true;
    }
  }

  const toggleBuildingOnPointer = () => {

    if (!controller.current) return;

    if (pointerEntity.current) {
      controller.current.removeEntityFromPointer();
    }

    setCurEntitySnapping();

    pointerEntity.current = controller.current.setPointerEntity('cube');
  }

  const toggleRoadOnPointer = () => {

    if (!controller.current) return;

    if (pointerEntity.current) {
      controller.current.removeEntityFromPointer();
    }

    setCurEntitySnapping()

    pointerEntity.current = controller.current.setPointerEntity('rect');
  }

  const freePointerEntity = () => {

    if (pointerEntity.current) {
      controller.current.removeEntityFromPointer();
    }

    buildingOnPointer.current = false;
    roadOnPointer.current = false;
    pointerEntity.current = null;
  }

  const setUpDebugGUIControls = () => {
    if (state.showDebugDatControls && !gui.current) {
      const cc = params.cameraControl;
      gui.current = new GUI(cc, scene.current);
    }
  }

  const toggleFullscreen = () => {
    const elem = document.querySelector(".App");

    if (!document.fullscreenElement) {
      elem
        .requestFullscreen()
        .then(() => {
          setState(s => ({ ...s, fullscreen: true }));
        })
        .catch((err) => {
          alert(
            `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
          );
        });
    } else {
      document.exitFullscreen().then(() => {
        setState(s => ({ ...s, fullscreen: false }));
      });
    }
  }

  let toggle;
  if (!document.fullscreenElement) {
    toggle = <FontAwesomeIcon icon={faExpand} size="4x" />;
  } else {
    toggle = <FontAwesomeIcon icon={faCompress} size="4x" />;
  }

  const terrainTypeRef = React.useRef(TileTerrain.Ocean);

  const onTerrainPaintClick = (args: { data: Tile, order: number }) => {
    args.data.setTerrainType(terrainTypeRef.current);
  }

  const tileDiceValueRef = React.useRef(-1);
  const onTileDiceDataClick = (args: { data: Tile, order: number }) => {
    if (tileDiceValueRef.current === -1) {
      if (args.data.textMesh) {
        args.data.removeTextMesh();
      }

      return;
    }
    // let tilePos = tile.position.toArray().map(x => Math.floor(x)).toString();
    new MeshText(tileDiceValueRef.current.toString(), (obj) => {
      args.data.addTextMesh(obj);

      obj.group.scale.set(.05, .05, .05);
    }, { mirror: false, hover: 0, height: 1, size: 25, color: 0x000000 } as MeshTextSettingsParam);
  }

  const onEntityPlaced = (args: { data: Tile, order: number }) => {
    if (!controller.current || !pointerEntity.current) return;

    if (controller.current.setPointerEntityOnTile(args.data)) {
      onEntityTypeSelected(entityNameRef.current);
      setNumEntities(map.current.numEntities);
    }
  }

  const tileJSONDataClickCB: React.MutableRefObject<Function> = React.useRef(null);
  const tileJSONDataTile: React.MutableRefObject<Tile> = React.useRef(null);
  const onTileJSONDataClick = (args: { data: Tile, order: number }) => {
    if (tileJSONDataClickCB.current) tileJSONDataClickCB.current(args.data);

    tileJSONDataTile.current = args.data;
  }

  const entityNameRef = React.useRef("");

  const onEntityTypeSelected = (entityName) => {
    entityNameRef.current = entityName;
    let entity = Entities[entityName];

    switch (entity) {
      case Entities.Building:
        toggleBuildingOnPointer();
        break;
      case Entities.Road:
        toggleRoadOnPointer();
        break;
    }
  }

  const entityPlacementRef = React.useRef<EntityPlacementType>(EntityPlacementType.CENTER);

  const onEntityPlacementTypeSelected = (placementType) => {
    let placement = EntityPlacementType[placementType];

    entityPlacementRef.current = placement;

    setCurEntitySnapping();
  }

  const onEntityRemoved = (args: { data: Entity, order?: number }) => {
    if (!map.current) return;

    console.log('entity removed');

    if (map.current.removeEntityFromTile(args.data)) {
      setNumEntities(map.current.numEntities);
    }
  }

  return (
    <div className="App">
      {/* {this.state.tileUIState.active && (
          <TileUI {...this.state.tileUIState}
            buttons={[
              { title: 'Build Settlement', action: this.toggleBuildingOnPointer.bind(this) },
              { title: 'Build Road', action: this.toggleRoadOnPointer.bind(this) },
              {
                title: 'Cancel', action: () => {
                  this.setState({ ...this.state, tileUIState: { ...this.state.tileUIState, active: false } }, () => {
                    this.controller.active = true;
                  })
                }
              }]}
          />
        )} */}
      <Box sx={{ display: 'flex', height: '100%', width: '100%', flexFlow: 'row' }}>
        {/* <CssBaseline /> */}
        <UIManager ref={canvasDiv}
          loading={!initted}
          curHighlightedTile={highlightedTile}
          onBuildToggled={(open) => {
            if (!controller.current) return;

            controller.current.removeOnTileMouseInputListener(InputType.RIGHT_CLICK, onEntityPlaced);

            if (open)
              controller.current.addOnTileMouseInputListener(InputType.RIGHT_CLICK, onEntityPlaced);
            else
              freePointerEntity();
          }}

          hasEntityMenu={true}
          hasCameraSettings={true}
          entityTypes={Object.values(Entities)}

          onEntityTypeSelected={onEntityTypeSelected}

          entityPlacementTypes={Object.values(EntityPlacementType)}

          onEntityPlacementTypeSelected={onEntityPlacementTypeSelected}

          onRemoveEntitiesToggled={(open) => {
            if (!controller.current) return;

            controller.current.removeOnEntityMouseInputListener(InputType.RIGHT_CLICK, onEntityRemoved);

            if (open)
              controller.current.addOnEntityMouseInputListener(InputType.RIGHT_CLICK, onEntityRemoved);
          }}

          numEntitiesOnMap={numEntities}

          onDiceRolled={(val) => {
            if (!map.current) return;

            const tileMatches: Tile[] = [];
            map.current.tiles.forEach(tile => {
              if ('diceValue' in tile.customData) {
                if (tile.customData['diceValue'] == val) {
                  tileMatches.push(tile);
                  tile.highlight(true);
                }
              }
            });

            window.setTimeout(() => {
              tileMatches.forEach(t => t.unhighlight());
            }, 3000);
          }}

          // useless parent menu toggle for now
          onDesignToggled={(open) => {
          }}

          mapSize={initted ? curMapSize : 0}

          onMapSizeChanged={(val) => {

            if (!scene.current) return;

            scene.current.map.setGrid(new Engine.HexGrid({
              gridShape: Engine.GridShapes.POINT_TOP_HEX,
              gridRadius: val,
              cellRadius: 6,
            }))
          }}

          onTilePaintToggled={(open) => {
            if (!controller.current) return;

            controller.current.removeOnTileMouseInputListener(InputType.RIGHT_DOWN, onTerrainPaintClick);

            console.log('onTilePaintToggled: ' + open);

            if (open)
              controller.current.addOnTileMouseInputListener(InputType.RIGHT_DOWN, onTerrainPaintClick);
          }}

          onSetPaintTerrainType={(type) => {
            terrainTypeRef.current = type;
          }}

          onTileDiceValueSelected={(open) => {
            if (!controller.current) return;

            controller.current.removeOnTileMouseInputListener(InputType.RIGHT_DOWN, onTileDiceDataClick)

            if (open)
              controller.current.addOnTileMouseInputListener(InputType.RIGHT_DOWN, onTileDiceDataClick);
          }}

          onDiceValueInput={(val) => {
            tileDiceValueRef.current = val;
          }}

          // useless parent menu toggle for now
          onTileDataSelected={(val) => {
          }}

          onTileJSONDataSelected={(open, cb) => {
            if (!controller.current) return;

            controller.current.removeOnTileMouseInputListener(InputType.RIGHT_CLICK, onTileJSONDataClick)
            tileJSONDataClickCB.current = null;

            if (open) {
              tileJSONDataClickCB.current = cb;
              controller.current.addOnTileMouseInputListener(InputType.RIGHT_CLICK, onTileJSONDataClick);
            }
          }}

          cameraControlled={initted ? cameraControlled : undefined}
          cameraCurZoom={initted ? cameraCurZoom : undefined}
          cameraMinZoom={initted ? cameraMinZoom : undefined}
          cameraMaxZoom={initted ? cameraMaxZoom : undefined}
          cameraZoomDelta={initted ? cameraCurZoomDelta : undefined}

          onCameraCurZoomChange={(zoom) => {
            if (!controller.current) return;

            controller.current.updateControlSettings({ currentDistance: zoom });
          }}

          onCameraMaxZoomChange={(max) => {
            if (!controller.current) return;

            controller.current.updateControlSettings({ maxDistance: max });
            setCameraMaxZoom(max);
          }}

          onCameraMinZoomChange={(min) => {
            if (!controller.current) return;

            controller.current.updateControlSettings({ minDistance: min });
            setCameraMinZoom(min);
          }}

          onCameraZoomDeltaChange={(delta) => {
            if(!controller.current) return;

            controller.current.updateControlSettings({zoomAmount: delta});
            setCameraCurZoomDelta(delta);
          }}

          onCameraControlledToggled={() => {
            if (!controller.current) return;

            controller.current.active = !controller.current.active;
          }}

          onModalToggled={(open) => {
            if (!controller.current) return;
            if (open) controller.current.active = false;
            else controller.current.active = true;
          }}

          onTileJSONDataInput={(val) => {
            let obj = JSON.parse(val);
            tileJSONDataTile.current.customData = obj;
          }}

          onSaveMap={(cb) => {
            if (!map.current) return;

            let JSON = map.current.toJSON();

            cb(JSON);
          }}

          onLoadJSON={(json) => {
            if (!scene.current) return;

            scene.current.map.setGrid(json as GridJSONData);
          }}
        />
      </Box>
    </div>
  );

}
