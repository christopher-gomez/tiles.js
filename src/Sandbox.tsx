/* eslint-disable */
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faCompress } from "@fortawesome/free-solid-svg-icons";
import "./Components/styles/sandbox.css";
import Box from '@mui/material/Box';
import { ExtrudeGeometryOptions, Group, Mesh, Sprite, Vector3 } from "three";
import Controller, { ControllerEvent, ZoomDirection } from "./lib/scene/Controller";
import HexGrid from "./lib/grid/HexGrid";
import Map from "./lib/map/Map";
import View from "./lib/scene/View";
import Engine, { EngineGridShapes, EngineTileShapes } from "./lib/Engine";
import GUI from "./Components/dat";
import UIManager from "./Components/UI/UIManager";
import Tile, { } from "./lib/map/Tile";
import { InputType } from "./lib/utils/MouseCaster";
import MeshEntity, { EntityPlacementType } from "./lib/env/MeshEntity";
import MeshText, { MeshTextFontWeights, MeshTextFonts, MeshTextSettingsParam } from "./lib/env/MeshText";
import Tools from "./lib/utils/Tools";
import { ControllerSettings, ControllerSettingsParams, GridJSONData, SceneJSONData, TileType } from "./lib/utils/Interfaces";
import { CellNeighborDirections } from "./lib/grid/Cell";
import Grid from "./lib/grid/Grid";
import SceneContainer from "./Components/SceneContainer";
import { createShip, drawPortLine, highlightClosestVertex, unHighlightVertex } from "./Components/Catan/CatanHelpers";

enum Entities {
  Road = "Road",
  Building = "Building"
}

const defaultControllerSettings = {
  controlled: true,
  rotationDamping: false,
  currentDistance: 300,
  minDistance: 100,
  maxDistance: 300,
  zoomDelta: 10,
  autoRotate: false,
  currentPolarAngle: 0,
  minPolarAngle: 0,
  maxPolarAngle: 45,
  minAzimuthAngle: Engine.Tools.radToDeg(Math.PI),
  maxAzimuthAngle: Engine.Tools.radToDeg(Math.PI),
  currentAzimuthAngle: Engine.Tools.radToDeg(Math.PI),
  userHorizontalRotation: false,
  userVerticalRotation: false,
} as ControllerSettings;

const Sandbox = ({ scene, controller, map, onLoadCB }: { scene?: View, controller?: Controller, map?: Map, onLoadCB?: (scene: SceneJSONData) => void }) => {
  const pointerEntity: React.MutableRefObject<MeshEntity> = React.useRef(null);

  const buildingOnPointer = React.useRef(false);
  const roadOnPointer = React.useRef(false);

  const [tileTypes, setTileTypes] = React.useState<TileType[]>([]);

  const onSpaceDown = () => {
    if (map) {
      map.addTileToGrid(new Vector3(-3, -2, 1))
    }
  }

  const [highlightedTile, setHighlighedTile] = React.useState<Tile>(null);

  // const shipSet= React.useRef(false);

  // const onCanvasClick = (args: { mousePos: Vector3 }) => {
  //   // drawPortLine(scene, args.data, controller.getClosestVertex(args.data, args.mousePos));
  //   createShip(scene, args.mousePos, (sprite) => {
  //     shipSet.current = (true);
  //     spritePos.current = (sprite.sprite.position);
  //   });

  //   controller.removeOnCanvasMouseInputListener(InputType.RIGHT_CLICK, onCanvasClick);
  // }

  // const spritePos = React.useRef(new Vector3(0, 0, 0));

  // const onSpriteClick = (args: { data: Sprite, mousePos: Vector3 }) => {
  //   console.log('sprite click');
  //   // setSpritePos(args.mousePos);
  // }

  // const onTileVertClick = (args: { data: Tile, mousePos: Vector3 }) => {
  //   if (shipSet.current)
  //     drawPortLine(scene, args.data, spritePos.current, controller.getClosestVertex(args.data, args.mousePos));

  //   // createShip(scene, args.data.getEdgeWorldPosition(controller.getClosestEdge(args.data, args.mousePos)))
  // }

  const onTileHighlight = (args: { data: Tile, mousePos: Vector3 }) => {
    // let diaNeighs = t.getNeighbors(true);

    // console.log(t.cell.directions);
    // console.log(t.cell.diagonals);
    // for (let neigh of diaNeighs) {
    //   neigh.tile.highlight();
    // }

    // t.getNeighbor(CellNeighborDirections.SOUTH)?.tile.highlight();

    setHighlighedTile(args.data);
    // highlightClosestVertex(scene, controller, args.data, args.mousePos);
  }

  // const onTileMove = (args: { data: Tile | MeshEntity, mousePos: Vector3 }) => {
  //   if (scene.map.highlightedTile) {
  //     highlightClosestVertex(scene, controller, scene.map.highlightedTile, args.mousePos);
  //   } else {
  //     unHighlightVertex(scene);
  //   }
  // }

  const onTileUnhighlight = (args: { data: Tile, mousePos: Vector3 }) => {
    setHighlighedTile(null);
    // unHighlightVertex(scene);
  }

  const [curMapSize, setCurMapSize] = React.useState(0);
  const [curMapShape, setCurMapShape] = React.useState<EngineGridShapes>(null);
  const [curTileShape, setCurTileShape] = React.useState<EngineTileShapes>(null);
  const [numEntities, setNumEntities] = React.useState(0);
  const [curTileSize, setCurTileSize] = React.useState(0);
  const [hasOverlay, setHasOverlay] = React.useState(false);
  const [overlayColor, setOverlayColor] = React.useState<string | number>(undefined);
  const [overlayLineColor, setOverlayLineColor] = React.useState<string | number>(undefined);
  const [overlayLineOpacity, setOverlayLineOpacity] = React.useState(1);

  const [cameraControlled, setCameraControlled] = React.useState(true);
  const [cameraMaxZoom, setCameraMaxZoom] = React.useState(0);
  const [cameraMinZoom, setCameraMinZoom] = React.useState(0);
  const [cameraCurZoom, setCameraCurZoom] = React.useState(0);
  const [cameraCurZoomDelta, setCameraCurZoomDelta] = React.useState(0);

  const [cameraAutoRotates, setCameraAutoRotates] = React.useState(false);
  const [userHorizontalRotation, setUserHorizontalRotation] = React.useState(false);
  const [userVerticalRotation, setUserVerticalRotation] = React.useState(false);
  const [cameraMaxAzimuth, setCameraMaxAzimuth] = React.useState(0);
  const [cameraMinAzimuth, setCameraMinAzimuth] = React.useState(0);
  const [cameraCurAzimuth, setCameraCurAzimuth] = React.useState(0);
  const [cameraMinPolar, setCameraMinPolar] = React.useState(0);
  const [cameraMaxPolar, setCameraMaxPolar] = React.useState(0);
  const [cameraCurPolar, setCameraCurPolar] = React.useState(0);

  const onControllerActiveListener = (active) => {
    setCameraControlled(active);
  }

  const onMapCreatedListener = () => {
    setCurMapSize(map.size);
    setCurTileSize(map.grid.cellRadius);
    setTileTypes(Object.values(Tile.tileTypes));
    setHasOverlay(map.settings.hasOverlay);
    setOverlayColor(map.settings.overlayColor);
    setOverlayLineColor(map.settings.overlayLineColor);
    setOverlayLineOpacity(map.settings.overlayLineOpacity);
    curTileTylePaintType.current = (Object.values(Tile.tileTypes)[0])
    if (scene) scene.panCameraTo(new Vector3(0, 0, 0));
  }

  const onControllerZoomListener = (args) => {

    if (zoomStateTimeoutID.current) {
      clearTimeout(zoomStateTimeoutID.current);
    }

    zoomStateTimeoutID.current = window.setTimeout(() => {
      setCameraCurZoom(args.currentDistance);
      setCameraMaxZoom(controller.config.maxDistance);
      setCameraMinZoom(controller.config.minDistance);

      setCameraCurPolar(args.currentPolarAngle);
      setCameraCurAzimuth(args.currentAzimuthAngle);
    }, 100);
  }

  React.useEffect(() => {
    controller.addKeyDownListener("Space", onSpaceDown);

    controller.addOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
    controller.addOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);
    // controller.addOnCanvasMouseInputListener(InputType.MOVE, onTileMove);
    // controller.addOnCanvasMouseInputListener(InputType.RIGHT_CLICK, onCanvasClick);
    // controller.addOnTileMouseInputListener(InputType.RIGHT_CLICK, onTileVertClick);
    // controller.addOnSpriteMouseInputListener(InputType.RIGHT_CLICK, onSpriteClick);

    // controller.addOnSpriteMouseInputListener(InputType.LEFT_CLICK, )

    setCurMapSize(map.size);
    setCurTileSize(map.grid.cellRadius);
    setCurMapShape(map.grid.gridShape);
    setCurTileShape(map.grid.cellShape);
    setNumEntities(map.numEntities);

    setCameraControlled(scene.controller.active);
    setCameraCurZoom(scene.currentDistance);
    setCameraMaxZoom(scene.controller.config.maxDistance)
    setCameraMinZoom(scene.controller.config.minDistance);
    setCameraCurZoomDelta(scene.controller.config.zoomDelta);

    setCameraMinPolar(scene.controller.config.minPolarAngle);
    setCameraMaxPolar(scene.controller.config.maxPolarAngle);
    setCameraCurPolar(scene.currentPolarAngle);

    setCameraMinAzimuth(scene.controller.config.minAzimuthAngle);
    setCameraMaxAzimuth(scene.controller.config.maxAzimuthAngle);
    setCameraCurAzimuth(scene.currentAzimuthAngle);

    setCameraAutoRotates(scene.controller.config.autoRotate);
    setTileTypes(Object.values(Tile.tileTypes));
    setHasOverlay(map.settings.hasOverlay);
    setOverlayColor(map.settings.overlayColor);
    setOverlayLineColor(map.settings.overlayLineColor);
    setOverlayLineOpacity(map.settings.overlayLineOpacity);

    curTileTylePaintType.current = (Object.values(Tile.tileTypes)[0])

    controller.addEventListener(ControllerEvent.TOGGLE_ACTIVE, onControllerActiveListener)

    scene.addEventListener('mapCreated', onMapCreatedListener);

    controller.addEventListener(ControllerEvent.ZOOM, onControllerZoomListener);

    () => {
      controller.removeEventListener(ControllerEvent.TOGGLE_ACTIVE, onControllerActiveListener);
      controller.removeEventListener(ControllerEvent.ZOOM, onControllerZoomListener);
      map.removeEventListener("mapCreated", onMapCreatedListener);
      controller.removeKeyDownListener("space", onSpaceDown);
      controller.removeOnTileMouseInputListener(InputType.MOUSE_OVER, onTileHighlight);
      controller.removeOnTileMouseInputListener(InputType.MOUSE_OUT, onTileUnhighlight);
      // controller.removeOnCanvasMouseInputListener(InputType.MOVE, onTileMove)
      // controller.removeOnTileMouseInputListener(InputType.LEFT_CLICK, onCanvasClick);

    }
  }, [])

  const zoomStateTimeoutID = React.useRef<number>(null);

  const setCurEntitySnapping = () => {

    if (!controller) return;

    if (entityPlacementRef.current === EntityPlacementType.CENTER) {
      controller.vertexSnapping = false;
      controller.edgeSnapping = false;
    } else if (entityPlacementRef.current === EntityPlacementType.EDGE) {
      controller.vertexSnapping = false;
      controller.edgeSnapping = true;
    } else {
      controller.edgeSnapping = false;
      controller.vertexSnapping = true;
    }
  }

  const toggleBuildingOnPointer = () => {

    if (!controller) return;

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
    }

    setCurEntitySnapping();

    pointerEntity.current = controller.setPointerEntity('cube');
  }

  const toggleRoadOnPointer = () => {

    if (!controller) return;

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
    }

    setCurEntitySnapping()

    pointerEntity.current = controller.setPointerEntity('rect');
  }

  const freePointerEntity = () => {

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
    }

    buildingOnPointer.current = false;
    roadOnPointer.current = false;
    pointerEntity.current = null;
  }

  const curTileTylePaintType = React.useRef<TileType>(null);

  const onTileTypePaintClick = (args: { data: Tile, mousePos: Vector3 }) => {
    if (!curTileTylePaintType.current) return;

    args.data.setTileMeshFromType(curTileTylePaintType.current);
  }

  const tileTextPaintValueRef = React.useRef("");
  const curTextPaintOpts = React.useRef<{ mirror: boolean, height: number, hover: number, size: number, faceColor: string, outlineColor: string, scale: number[], font: MeshTextFonts, fontWeight: MeshTextFontWeights }>({ mirror: false, hover: 0, height: 1, size: 25, faceColor: '#ffffff', scale: [1, 1, 1], outlineColor: '#000000', font: MeshTextFonts.gentilis, fontWeight: MeshTextFontWeights.bold });
  const onTileTextPaintClick = (args: { data: Tile, mousePos: Vector3 }) => {
    if (tileTextPaintValueRef.current === "") {
      if (args.data.textMesh) {
        map.removeTextMeshFromTile(args.data);
      }
      return;
    }
    // let tilePos = tile.position.toArray().map(x => Math.floor(x)).toString();
    MeshText.CreateText(tileTextPaintValueRef.current, (obj) => {
      map.addTextMeshToTile(obj, args.data);
    }, curTextPaintOpts.current as MeshTextSettingsParam);
  }

  const onEntityPlaced = (args: { data: Tile, mousePos: Vector3 }) => {
    if (!controller || !pointerEntity.current) return;

    if (controller.setPointerEntityOnTile(args.data)) {
      onEntityTypeSelected(entityNameRef.current);
      setNumEntities(map.numEntities);
    }
  }

  const tileJSONDataClickCB: React.MutableRefObject<Function> = React.useRef(null);
  const tileJSONDataTile: React.MutableRefObject<Tile> = React.useRef(null);

  const onTileJSONDataClick = (args: { data: Tile, mousePos: Vector3 }) => {
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

  const onEntityRemoved = (args: { data: MeshEntity, order?: number }) => {
    if (!map) return;

    if (map.removeEntityFromTile(args.data)) {
      setNumEntities(map.numEntities);
    }
  }

  const previousControllerEnabledState = React.useRef<boolean>(true);

  return (
    <UIManager
      curHighlightedTile={highlightedTile}
      entitiesProps={{
        onBuildToggled: (open) => {
          if (!controller) return;

          controller.removeOnTileMouseInputListener(InputType.RIGHT_CLICK, onEntityPlaced);

          if (open)
            controller.addOnTileMouseInputListener(InputType.RIGHT_CLICK, onEntityPlaced);
          else
            freePointerEntity();
        },
        entityTypes: Object.values(Entities),

        onEntityTypeSelected: onEntityTypeSelected,

        entityPlacementTypes: Object.values(EntityPlacementType),

        onEntityPlacementTypeSelected: onEntityPlacementTypeSelected,

        onRemoveEntitiesToggled: (open) => {
          if (!controller) return;

          controller.removeOnEntityMouseInputListener(InputType.RIGHT_CLICK, onEntityRemoved);

          if (open)
            controller.addOnEntityMouseInputListener(InputType.RIGHT_CLICK, onEntityRemoved);
        },

        numEntitiesOnMap: numEntities
      }}


      onDiceRolled={(val) => {
        if (!map) return;

        const tileMatches: Tile[] = [];
        map.tiles.forEach(tile => {
          if ('diceValue' in tile.getCustomData()) {
            if (tile.getCustomData()['diceValue'] == val) {
              tileMatches.push(tile);
              tile.highlight(true);
            }
          }
        });

        window.setTimeout(() => {
          tileMatches.forEach(t => t.unhighlight());
        }, 3000);
      }}

      designProps={{
        mapRadius: curMapSize,
        tileRadius: curTileSize,
        mapShape: curMapShape,
        tileShape: curTileShape,
        tileTypes: tileTypes.map(t => t.name),
        overlay: hasOverlay,
        overlayColor: overlayColor,
        overlayLineColor: overlayLineColor,
        overlayLineOpacity: overlayLineOpacity,

        onMapSettingsToggled(open) {
          if (open) {
            previousControllerEnabledState.current = controller.active;
            controller.active = false;
          } else {
            controller.active = previousControllerEnabledState.current;
          }
        },

        onOverlayLineColorChanged: (color) => {
          if (!map) return;

          map.setOverlaySettings({ lineColor: color });
          setOverlayLineColor(color);

        },

        onOverlayLineOpacityChanged: (opacity) => {
          if (!map) return;

          map.setOverlaySettings({ lineOpacity: opacity });
          setOverlayLineOpacity(opacity);
        },

        onOverlayColorChanged: (color) => {
          if (!map) return;

          map.setOverlaySettings({ overlayColor: color });
          setOverlayColor(color);
        },

        onOverlayToggled: (active) => {
          if (!map) return;

          map.setOverlayActive(active);
          setHasOverlay(active);
        },

        onTileShapeSelected(val) {
          if (!scene) return;

          let mapShape = curMapShape;
          if (val === EngineTileShapes.HEX && curMapShape === EngineGridShapes.SQUARE || (val === EngineTileShapes.SQUARE && curMapShape === EngineGridShapes.FLAT_TOP_HEX || val === EngineTileShapes.SQUARE && curMapShape === EngineGridShapes.POINT_TOP_HEX)) {
            mapShape = EngineGridShapes.RECT;
            setCurMapShape(mapShape);
          }

          let grid: Grid;
          let curRadius = map.grid.gridRadius;
          let curCellR = map.grid.cellRadius;

          if (val === EngineTileShapes.HEX) {
            grid = new Engine.HexGrid({
              gridShape: mapShape,
              gridRadius: curRadius,
              cellRadius: curCellR,
              cellShape: val
            });
          } else {
            grid = new Engine.SqrGrid({
              gridShape: mapShape,
              gridRadius: curRadius,
              cellRadius: curCellR,
              cellShape: val
            });
          }

          scene.map.setGrid(grid, true);

          setCurTileShape(val);
        },
        onMapShapeSelected: (val) => {
          if (!scene) return;

          let grid: Grid;
          let curRadius = map.grid.gridRadius;
          let curCellR = map.grid.cellRadius;

          if (curTileShape == EngineTileShapes.HEX) {
            grid = new Engine.HexGrid({
              gridShape: val,
              gridRadius: curRadius,
              cellRadius: curCellR,
              cellShape: curTileShape
            });
          } else {
            grid = new Engine.SqrGrid({
              gridShape: val,
              gridRadius: curRadius,
              cellRadius: curCellR,
              cellShape: curTileShape
            });
          }

          scene.map.setGrid(grid, true);

          setCurMapShape(val);
        },

        onMapRadiusChanged: (val) => {

          if (!scene) return;

          let grid: Grid;
          if (curMapShape === EngineGridShapes.FLAT_TOP_HEX || curMapShape === EngineGridShapes.POINT_TOP_HEX) {
            grid = new Engine.HexGrid({
              gridShape: curMapShape,
              gridRadius: val,
              cellRadius: curTileSize,
              cellShape: curTileShape
            });
          } else {
            grid = new Engine.SqrGrid({
              gridShape: curMapShape,
              gridRadius: val,
              cellRadius: curTileSize,
              cellShape: curTileShape,
            });
          }

          scene.map.setGrid(grid, true);
        },

        onTileRadiusChanged: (val) => {

          if (!scene) return;

          let grid: Grid;
          if (curMapShape === EngineGridShapes.FLAT_TOP_HEX || curMapShape === EngineGridShapes.POINT_TOP_HEX) {
            grid = new Engine.HexGrid({
              gridShape: curMapShape,
              gridRadius: curMapSize,
              cellRadius: val,
              cellShape: curTileShape
            });
          } else {
            grid = new Engine.SqrGrid({
              gridShape: curMapShape,
              gridRadius: curMapSize,
              cellRadius: val,
              cellShape: curTileShape,
            });
          }

          scene.map.setGrid(grid, true);
        },

        onTilePaintToggled: (open) => {
          if (!controller) return;

          controller.removeOnTileMouseInputListener(InputType.RIGHT_DOWN, onTileTypePaintClick);

          if (open)
            controller.addOnTileMouseInputListener(InputType.RIGHT_DOWN, onTileTypePaintClick);
        },

        onTilePaintTypeSelected: (type) => {
          let t = tileTypes.find(x => x.name === type);

          if (t) curTileTylePaintType.current = t;
        },

        onTileTypeCreated: (type) => {
          Tile.tileTypes[type.name] = type;

          setTileTypes(s => ([...s, type]));
        },

        onTileTypeEdited: (type) => {
          let i = tileTypes.map(t => t.name).indexOf(type.name);
          if (i !== -1) {
            let types = tileTypes;
            types[i] = type;
            setTileTypes(types);
            Tile.tileTypes[type.name] = type;
            curTileTylePaintType.current = type;

            if (scene) scene.saveScene();

            if (map) {
              let ts = map.tiles.filter(t => t.type.name === type.name);
              ts.forEach(t => t.setTileMeshFromType(curTileTylePaintType.current));
            }
          }
        },

        textPaintOpts: { ...curTextPaintOpts.current },

        onTextPaintOptsChange: (val) => {
          curTextPaintOpts.current = val;
        },

        onTextPaintToggled: (open) => {
          if (!controller) return;

          controller.removeOnTileMouseInputListener(InputType.RIGHT_DOWN, onTileTextPaintClick)

          if (open)
            controller.addOnTileMouseInputListener(InputType.RIGHT_DOWN, onTileTextPaintClick);
        },


        onTextPaintValueInput: (val) => {
          tileTextPaintValueRef.current = val;
        },

        onTileSelectJSONEdit: (open, cb) => {
          if (!controller) return;

          controller.removeOnTileMouseInputListener(InputType.RIGHT_CLICK, onTileJSONDataClick)
          tileJSONDataClickCB.current = null;

          if (open) {
            tileJSONDataClickCB.current = cb;
            controller.addOnTileMouseInputListener(InputType.RIGHT_CLICK, onTileJSONDataClick);
          }
        },
        onModalToggled: (open) => {
          if (!controller) return;
          if (open) controller.active = false;
          else controller.active = true;
        },
        onTileJSONDataInput: (val) => {
          let obj = JSON.parse(val);
          tileJSONDataTile.current.setCustomData(obj);

          if (scene) scene.saveScene();
        }
      }}

      cameraProps={{
        cameraControlled: cameraControlled,
        cameraCurZoom: cameraCurZoom,
        cameraMinZoom: cameraMinZoom,
        cameraMaxZoom: cameraMaxZoom,
        cameraZoomDelta: cameraCurZoomDelta,

        onCameraCurZoomChange: (zoom) => {
          if (!controller) return;

          controller.updateControlSettings({ currentDistance: zoom });
        },

        onCameraMaxZoomChange: (max) => {
          if (!controller) return;

          controller.updateControlSettings({ maxDistance: max });
          setCameraMaxZoom(max);
        },

        onCameraMinZoomChange: (min) => {
          if (!controller) return;

          controller.updateControlSettings({ minDistance: min });
          setCameraMinZoom(min);
        },

        onCameraZoomDeltaChange: (delta) => {
          if (!controller) return;

          controller.updateControlSettings({ zoomDelta: delta });
          setCameraCurZoomDelta(delta);
        },

        onCameraControlledToggled: () => {
          if (!controller) return;

          controller.active = !controller.active;
        },

        cameraMinPolar: cameraMinPolar,
        cameraMaxPolar: cameraMaxPolar,
        cameraCurPolar: cameraCurPolar,
        cameraMinAzimuth: cameraMinAzimuth,
        cameraMaxAzimuth: cameraMaxAzimuth,
        cameraCurAzimuth: cameraCurAzimuth,
        cameraAutoRotates: cameraAutoRotates,
        allowUserHorizontalRotation: userHorizontalRotation,
        allowUserVerticalRotation: userVerticalRotation,

        onCameraCurPolarChange: (angle) => {
          if (!controller) return;

          controller.updateControlSettings({
            currentPolarAngle: angle
          })
        },

        onCameraMaxPolarChange: (angle) => {
          if (!controller) return;

          controller.updateControlSettings({
            maxPolarAngle: angle
          })

          setCameraMaxPolar(angle);
        },

        onCameraMinPolarChange: (angle) => {
          if (!controller) return;

          controller.updateControlSettings({
            minPolarAngle: angle
          })

          setCameraMinPolar(angle);
        },

        onCameraCurAzimuthChange: (angle) => {
          if (!controller) return;

          controller.updateControlSettings({
            currentAzimuthAngle: angle
          })
        },

        onCameraMaxAzimuthChange: (angle) => {
          if (!controller) return;

          controller.updateControlSettings({
            maxAzimuthAngle: angle
          })

          setCameraMaxAzimuth(angle);
        },

        onCameraMinAzimuthChange: (angle) => {
          if (!controller) return;

          controller.updateControlSettings({
            minAzimuthAngle: angle
          })

          setCameraMinAzimuth(angle);
        },

        onCameraAutoRotateToggled: () => {
          if (!controller) return;

          let val = !controller.config.autoRotate;
          controller.updateControlSettings({ autoRotate: val });
          setCameraAutoRotates(val);
        },

        onUserHorizontalRotationChange: (val) => {
          if (!controller) return;

          controller.updateControlSettings({ userHorizontalRotation: val });
          setUserHorizontalRotation(val);
        },

        onUserVerticalRotationChange: (val) => {
          if (!controller) return;

          controller.updateControlSettings({ userVerticalRotation: val });
          setUserVerticalRotation(val);
        }
      }}

      onModalToggled={(open) => {
        if (!controller) return;

        if (open) controller.active = false;
        else controller.active = true;
      }}

      onSaveScene={(sceneName, cb) => {
        if (!scene) return;

        let j = scene.toJSON();
        j.viewData.sceneName = sceneName;

        cb(JSON.stringify(j));
      }}

      onLoadScene={(json) => {
        if (!scene) return;

        let data = json as SceneJSONData;

        data.viewData.sceneName = "Design";
        scene.fromJSON(json as SceneJSONData);
        // if (onLoadCB) onLoadCB(json as SceneJSONData);
      }}
    />
  )
}

export default () => {
  return (
    <div className="App">
      <SceneContainer sceneName="Design" fps>
        <Sandbox />
      </SceneContainer>
    </div>
  );

}
