/* eslint-disable */
import React from "react";
import "../styles/sandbox.css";
import Box from "@mui/material/Box";
import {
  AxesHelper,
  Box3,
  BoxGeometry,
  BoxHelper,
  BufferGeometry,
  ClampToEdgeWrapping,
  Color,
  CubeTextureLoader,
  ExtrudeBufferGeometry,
  ExtrudeGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  NearestFilter,
  RepeatWrapping,
  Scene,
  ShapeBufferGeometry,
  ShapeGeometry,
  Sprite,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";

import Controller, {
  ControllerEvent,
  ZoomDirection,
} from "../../lib/scene/Controller";
import Map from "../../lib/map/Map";
import View from "../../lib/scene/View";
import Engine from "../../lib/Engine";
import Tile from "../../lib/map/Tile";
import { InputType } from "../../lib/utils/MouseCaster";
import MeshEntity, { EntityPlacementType } from "../../lib/env/MeshEntity";
import Tools from "../../lib/utils/Tools";
import { SceneJSONData } from "../../lib/utils/Interfaces";
import SceneContainer from "../SceneContainer";
import CatanBase from "../../Assets/Catan.json";
import {
  Typography,
  useTheme,
  Button,
  IconButton,
  Slide,
  Fab,
  List,
  ListItem,
  Input,
} from "@mui/material";
import Modal from "../UI/Modal";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TopBar from "../UI/TopBar";
import AvatarTabs from "../UI/AvatarTabs";
import BottomBar from "../UI/BottomBar";
import {
  GameState,
  IPlayerJSONData,
  NewGameFlowState,
  Player,
  Resources,
  TurnState,
  settlementPlacementValidator,
  roadPlacementValidator,
  zoomInAndOut,
  hasPorts,
  getTilePortData,
  TilePortData,
  addWater,
  addHills,
  addMountains,
  addFarms,
  addClay,
  addForest,
  addDesert,
  addPort,
} from "./CatanHelpers";
import Toast from "../UI/Toast";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import {
  ActionsMenu,
  BuildingTray,
  LighthouseInfoBubble,
  ResourceDisplay,
  ResourceTrader,
} from "./Components/CatanUIComponents";
import IconButtonTray from "../UI/IconButtonTray";
import CloseIcon from "@mui/icons-material/Close";
import HighlightHUD from "./Components/HighlightHUD";
import HexTile from "../../lib/map/HexTile";
import { IEntity } from "../../lib/env/Entity";
import cloudRight from "../../Assets/Textures/clouds/bluecloud_rt.jpg";
import cloudLeft from "../../Assets/Textures/clouds/bluecloud_lf.jpg";
import cloudUp from "../../Assets/Textures/clouds/bluecloud_up.jpg";
import cloudDown from "../../Assets/Textures/clouds/bluecloud_dn.jpg";
import cloudFwd from "../../Assets/Textures/clouds/bluecloud_ft.jpg";
import cloudBack from "../../Assets/Textures/clouds/bluecloud_bk.jpg";
import Cloud from "./Environment/Cloud";
import StarryNightBG from "../UI/StarryNightBG";
import RoutesView from "../UI/RoutesView";

const playerColors = [0xffffff, 0xca6c18, 0x005c95, 0xd12026];

interface IStateJSONData {
  isNetwork: boolean;
  players: IPlayerJSONData[];
  localPlayerID: number;
  localPlayerIndex: number;
  activePlayerID: number;
  activePlayerIndex: number;
  gameState: GameState;
  newGameFlowState: NewGameFlowState;
  turnState: TurnState;
  diceRolled: boolean;
  diceVal: number;
}

const Catan = ({
  scene,
  controller,
  map,
  isNetwork,
  localSaveState,
  setIsLoading,
}: {
  scene?: View;
  controller?: Controller;
  map?: Map;
  isNetwork?: boolean;
  localSaveState?: IStateJSONData;
  setIsLoading?: (active: boolean) => void;
}) => {
  const theme = useTheme();

  // #region state
  const [localPlayerID, setLocalPlayerID] = React.useState<number>(undefined);
  const [localPlayerIndex, setLocalPlayerIndex] =
    React.useState<number>(undefined);
  const [activePlayerID, setActivePlayerID] = React.useState<number>(undefined);
  const [activePlayerIndex, setActivePlayerIndex] =
    React.useState<number>(undefined);

  const [players, setPlayers] = React.useState<Player[]>([new Player(0)]);
  const [gameState, setGameState] = React.useState<GameState>(undefined);
  const [newGameFlowState, setNewGameFlowState] =
    React.useState<NewGameFlowState>(undefined);
  const [turnState, setTurnState] = React.useState<TurnState>(undefined);
  const [diceRolled, setDiceRolled] = React.useState<boolean>(undefined);
  const [diceVal, setCurDiceVal] = React.useState<number>(undefined);

  const [displayDebugHighlight, setDisplayDebugHighlight] =
    React.useState(false);

  const [showBeginTurnUI, setShowBeginTurnUI] = React.useState<{
    val: boolean;
    onComplete?: () => void;
  }>({ val: false, onComplete: null });
  const [showGainedLongestRoadUI, setShowGainedLongestRoadUI] = React.useState<{
    player: Player;
    val: boolean;
  }>({ player: null, val: false });
  const [showLostLongestRoadUI, setShowLostLongestRoadUI] = React.useState<{
    player: Player;
    val: boolean;
  }>({ player: null, val: false });

  const [seenUpdatedTurnState, setSeenUpdatedTurnState] = React.useState(false);

  const [modalOpen, setModalOpen] = React.useState(false);

  const [loadingSaveState, setLoadingSaveState] =
    React.useState<boolean>(undefined);
  const [awardingResources, setAwardingResources] = React.useState(false);

  const [entityOnPointer, setEntityOnPointer] = React.useState(false);
  const [diceRolledThisTurn, setDiceRolledThisTurn] = React.useState(false);

  const [isBanking, setIsBanking] = React.useState(false);
  const [isBankTradeValid, setIsBankTradeValid] = React.useState(false);
  const [offeringBankResources, setOfferingBankResources] =
    React.useState<Array<{ name: string; amount: number }>>(undefined);
  const [receivingBankResources, setReceivingBankResources] =
    React.useState<Array<{ name: string; amount: number }>>(undefined);

  // #endregion

  // #region refs
  const pointerEntity: React.MutableRefObject<MeshEntity> = React.useRef(null);
  const settlementOnPointer = React.useRef(false);
  const roadOnPointer = React.useRef(false);
  const cityOnPointer = React.useRef(false);
  const robberRef = React.useRef<MeshEntity>(null);

  const entityPointerUpCB = React.useRef<() => void>(undefined);
  const localPlayerIDRef = React.useRef<number>(0);
  const activePlayerIDRef = React.useRef<number>(0);

  const gameStateRef = React.useRef<GameState>();
  const activePlayerIndexRef = React.useRef(-1);
  const localPlayerIndexRef = React.useRef(-1);

  // #endregion

  // #region effects

  // save game state
  React.useEffect(() => {
    saveState();
  });

  React.useEffect(() => {
    map.canInteract = !modalOpen;
  }, [modalOpen]);

  // const zoomToActivePlayerRandomSettlement = (event: KeyboardEvent) => {

  //     if (event.keyCode !== 13) return;

  //     if (!scene || !controller || !playersRef.current || playersRef.current.length === 0 || activePlayerIndexRef.current === undefined || activePlayerIndexRef.current === -1 || playersRef.current[activePlayerIndexRef.current].settlements.length === 0) return;

  //     let randInt = Tools.randomInt(0, playersRef.current[activePlayerIndexRef.current].settlements.length - 1);
  //     let e = playersRef.current[activePlayerIndexRef.current].settlements[randInt];

  //     if (e) {
  //         zoomInAndOut(scene, e.parentTile.getVertexWorldPosition(e.placementVertex));
  //     }
  // }

  const [portInfoState, setPortInfoState] = React.useState({
    toggled: false,
    position: { x: 0, y: 0 },
    resourceType: Resources.LUMBER,
    amountNeeded: 2,
  });

  React.useEffect(() => {
    controller.addKeyDownListener("Space", onSpaceDown);
    controller.addKeyDownListener("ControlLeft", onCtrlDown);
    controller.addKeyDownListener("Home", onHomeDown);

    controller.addOnEntityMouseInputListener(
      InputType.LEFT_DOWN,
      onOwnedEntityLeftDown
    );
    controller.addOnAnyMouseInputListener(
      InputType.LEFT_UP,
      onOwnedEntityPlaced
    );
    // controller.addOnAnyMouseInputListener(InputType.LEFT_UP, onOwnedEntityCanvasLeftUp);

    map.entities = {
      settlement: () =>
        Tools.createCubeEntity(5, {
          baseColor: playerColors[localPlayerIndexRef.current],
          highlightColor: 0xd3d3d3,
        }),
      road: () =>
        Tools.createRectEntity(8, 2, 2, {
          baseColor: playerColors[localPlayerIndexRef.current],
          highlightColor: 0xd3d3d3,
        }),
      city: () => {
        const entity = Tools.createRectEntity(5, 10, 3, {
          baseColor: playerColors[localPlayerIndexRef.current],
          highlightColor: 0xd3d3d3,
        });
        return entity;
      },
      robber: () => {
        const entity = Tools.createCylinderEntity(4, 5, 20, {
          baseColor: 0xffffff,
          highlightColor: 0xd3d3d3,
        });
        entity.rotation.x = -90 * Engine.DEG_TO_RAD;
        entity.setPlacementType(EntityPlacementType.CENTER);
        entity.setCustomData("type", "robber");
        entity.setCustomData("tilePos", [0, 0, 0]);
        entity.setCustomData("hasMoved", false);
        return entity;
      },
    };

    // if (center.textMesh.length === 0) {
    //     for (let i = 0; i < 6; i++) {
    //         MeshText.CreateText(i.toString(), (obj) => {
    //             center.addTextMesh(obj);

    //             obj.group.position.copy(center.mesh.worldToLocal(center.getEdgeWorldPosition(i)));
    //         });
    //     }
    // } else {
    //     center.textMesh.forEach((t, i) => {
    //         let edge = Number.parseInt(t.text);
    //         t.group.position.copy(center.mesh.worldToLocal(center.getEdgeWorldPosition(edge)));
    //     });
    // }

    // window.addEventListener('keydown', zoomToActivePlayerRandomSettlement);

    let points = HexTile.baseTileShapePath
      .getPoints()
      .map((x) => x.multiplyScalar(0.97));

    const awaitEnvLoad = async () => {
      addWater(
        new ExtrudeBufferGeometry(HexTile.baseTileShapePath, {
          bevelEnabled: false,
          depth: 1,
        }),
        scene.map.nonInteractableTiles,
        scene.map,
        scene
      );
      console.log("done with water");

      await addHills(
        scene.map.tiles.filter((x) => x.type.name === "Plain"),
        points,
        scene
      );
      console.log("done with hills");

      await addMountains(
        scene.map.tiles.filter((x) => x.type.name === "Mountain"),
        points,
        scene
      );
      console.log("done with mts");

      await addFarms(
        scene.map.tiles.filter((x) => x.type.name === "Grain"),
        points,
        scene
      );
      console.log("done with farms");

      await addClay(
        scene.map.tiles.filter((x) => x.type.name === "Brick"),
        points,
        scene
      );
      console.log("done with clay");

      await addForest(
        scene.map.tiles.filter((x) => x.type.name === "Forest"),
        points,
        scene
      );
      console.log("done with forest");

      await addDesert(
        scene.map.tiles.filter((x) => x.type.name === "Desert"),
        points,
        scene
      );
      console.log("done with desert");

      await addPort(
        scene.map.tiles.filter((x) => "ports" in x.getCustomData()),
        scene,
        setPortInfoState
      );

      console.log("done with ports");

      const { group: northGroup, update: northUpdate } = Cloud();
      const { group: eastGroup, update: eastUpdate } = Cloud({
        minX: -300,
        maxX: -700,
      });
      const { group: westGroup, update: westUpdate } = Cloud({
        minX: 300,
        maxX: 700,
      });

      console.log("done with clouds");
      scene.container.add(northGroup, eastGroup, westGroup);
      scene.animationManager.addOnAnimateListener((dt) => {
        northUpdate(dt, scene.camera, false);
        eastUpdate(dt, scene.camera, false);
        westUpdate(dt, scene.camera, false);
      });

      let furthestNorth: Mesh = null;
      let furthestSouth: Mesh = null;
      let furthestEast: Mesh = null;
      let furthestWest: Mesh = null;

      scene.map.nonInteractableTiles.forEach((tile) => {
        const mesh = tile.mesh;
        const position = mesh.position;

        // Check North (increasing z)
        if (furthestNorth === null || position.z > furthestNorth.position.z) {
          furthestNorth = mesh;
        }

        // Check South (decreasing z)
        if (furthestSouth === null || position.z < furthestSouth.position.z) {
          furthestSouth = mesh;
        }

        // Check East (increasing x)
        if (furthestEast === null || position.x > furthestEast.position.x) {
          furthestEast = mesh;
        }

        // Check West (decreasing x)
        if (furthestWest === null || position.x < furthestWest.position.x) {
          furthestWest = mesh;
        }
      });

      //   console.log("Furthest North Tile: ", furthestNorth);
      //   console.log("Furthest South Tile: ", furthestSouth);
      //   console.log("Furthest East Tile: ", furthestEast);
      //   console.log("Furthest West Tile: ", furthestWest);

      if (furthestNorth)
        northGroup.position
          .copy(furthestNorth.position.clone().multiplyScalar(1.2))
          .setY(-5);

      if (furthestEast)
        eastGroup.position
          .copy(furthestEast.position.clone().multiplyScalar(2.75))
          .setY(0);
      eastGroup.rotation.y = Math.PI / 3;

      if (furthestWest)
        westGroup.position
          .copy(furthestWest.position.clone().multiplyScalar(2.75))
          .setY(0);
      westGroup.rotation.y = -Math.PI / 3;

      //   const _composer = new EffectComposer(
      //     scene.renderer as THREE.WebGLRenderer
      //   );

      // Render Pass (render the scene)
      //   const renderPass = new RenderPass(scene.container, scene.camera);
      //   _composer.addPass(renderPass);

      // Bloom Pass (add bloom effect)
      //   const bloomPass = new BloomPass(1.5, 25, 5, 256);
      //   _composer.addPass(bloomPass);

      // SSAO Pass (add ambient occlusion)
      //   const ssaoPass = new SSAOPass(scene.container, scene.camera);
      //   _composer.addPass(ssaoPass);

      // Depth of Field Pass (add depth of field)
      //   const bokehPass = new BokehPass(scene.container, scene.camera, {
      //     focus: 0.5,
      //     aperture: 0.02,
      //     maxblur: 0.01,
      //   });
      //   _composer.addPass(bokehPass);

      //   scene.animationManager.render = false;

      //   scene.animationManager.addOnAnimateListener(() => {
      //     _composer.render();
      //   });

      controller.addEventListener(ControllerEvent.PAN, () => {
        if (!portInfoState.toggled) return;

        setPortInfoState((s) => ({
          ...s,
          toggled: false,
          position: { x: 0, y: 0 },
        }));
      });

      controller.addEventListener(ControllerEvent.ROTATE, () => {
        if (!portInfoState.toggled) return;

        setPortInfoState((s) => ({
          ...s,
          toggled: false,
          position: { x: 0, y: 0 },
        }));
      });

      controller.addEventListener(ControllerEvent.TOGGLE_ACTIVE, () => {
        if (!portInfoState.toggled) return;

        setPortInfoState((s) => ({
          ...s,
          toggled: false,
          position: { x: 0, y: 0 },
        }));
      });

      controller.addEventListener(ControllerEvent.ZOOM, () => {
        if (!portInfoState.toggled) return;

        setPortInfoState((s) => ({
          ...s,
          toggled: false,
          position: { x: 0, y: 0 },
        }));
      });

      setIsLoading(false);
    };

    awaitEnvLoad();

    if (!isNetwork) {
      if (localSaveState) {
        const robber = map.entitiesOnMap.find(
          (e) => e.getCustomData()["type"] === "robber"
        );
        robberRef.current = robber;
        (robber.material as MeshPhongMaterial).color.setHex(0xffffff);
        setLoadingSaveState(true);
      } else {
        let center = map.getTileAtPosition(new Vector3(0, 0, 0));
        const robber = map.entities["robber"]();
        robberRef.current = robber;
        map.setEntityOnTile(robber, center);

        setGameState(GameState.NEW_GAME);
      }
    }

    // controller.addOnTileMouseInputListener(InputType.MOUSE_OVER, (args: { data: Tile, mousePos: Vector3 }) => {
    //     if (pointerEntity.current && !controller.panning) {
    //         controller.zoomToDistance(controller.config.maxDistance / 2, 1000);
    //         controller.panCameraTo(args.data, 1000);
    //     }
    // })

    return () => {
      controller.dispose();
      scene.dispose();
      // window.removeEventListener('keydown', zoomToActivePlayerRandomSettlement);
    };
  }, []);

  React.useEffect(() => {
    if (turnState === undefined) return;

    if (turnState === TurnState.BUILD_TRADE) {
      controller.addOnEntityMouseInputListener(
        InputType.LEFT_DOWN,
        onRobberLeftDown
      );
      controller.addOnAnyMouseInputListener(InputType.LEFT_UP, onRobberPlaced);
      // controller.addOnCanvasMouseInputListener(InputType.LEFT_UP, onRobberCanvasLeftUp);
    } else {
      controller.removeOnEntityMouseInputListener(
        InputType.LEFT_DOWN,
        onRobberLeftDown
      );
      controller.removeOnAnyMouseInputListener(
        InputType.LEFT_UP,
        onRobberPlaced
      );
      // controller.removeOnCanvasMouseInputListener(InputType.LEFT_UP, onRobberCanvasLeftUp);
    }

    // setToastState(s => ({ ...s, showToast: false }));
    setSeenUpdatedTurnState(true);

    window.setTimeout(() => {
      setSeenUpdatedTurnState(false);
    }, 250);
  }, [turnState]);

  React.useEffect(() => {
    if (loadingSaveState === undefined) return;

    if (loadingSaveState) {
      if (localSaveState) {
        const _players = localSaveState.players
          .map((d, i) => {
            let p = new Player(i);
            p.fromJSON(d);
            return p;
          })
          .sort((a, b) => a.turnOrder - b.turnOrder);

        map.entitiesOnMap.forEach((e) => {
          const owner = e.getCustomData().owner;

          const player = _players.find((p) => p.id === owner);
          if (player) {
            const type = e.getCustomData().type;

            switch (type) {
              case "road":
                player.addRoad(e, false);
                break;
              case "settlement":
                player.addSettlement(e, false);
                break;
              case "city":
                player.addCity(e, false);
                break;
            }
          }
        });

        setPlayers(_players);
        playersRef.current = _players;
        setLocalPlayerID(localSaveState.localPlayerID);
        localPlayerIDRef.current = localSaveState.localPlayerID;
        setLocalPlayerIndex(localSaveState.localPlayerIndex);
        localPlayerIndexRef.current = localSaveState.localPlayerIndex;
        setActivePlayerID(localSaveState.activePlayerID);
        setActivePlayerIndex(localSaveState.activePlayerIndex);
        activePlayerIndexRef.current = localSaveState.activePlayerIndex;
        activePlayerIDRef.current = localSaveState.activePlayerID;
        setGameState(localSaveState.gameState);
        setNewGameFlowState(localSaveState.newGameFlowState);
        setTurnState(localSaveState.turnState);
        setDiceRolled(localSaveState.diceRolled);
        setCurDiceVal(localSaveState.diceVal);

        window.setTimeout(() => {
          setLoadingSaveState(false);
        }, 250);
      }
    } else {
      setShowBeginTurnUI({
        val: true,
        onComplete: () => {
          setTurnState(localSaveState.turnState);
        },
      });
    }
  }, [loadingSaveState]);

  React.useEffect(() => {
    if (showBeginTurnUI.val) {
      setDiceRolledThisTurn(false);
      robberRef.current.setCustomData("hasMoved", false);
    }
  }, [showBeginTurnUI]);

  React.useEffect(() => {
    if (loadingSaveState) return;

    gameStateRef.current = gameState;

    switch (gameState) {
      case GameState.NEW_GAME:
        if (!isNetwork) {
          setNewGameFlowState(NewGameFlowState.PLAYER_SELECT);
        } else {
          // load players from network
        }
        break;
      case GameState.PLAY:
        setActivePlayerIndex(0);
        if (players.length === 1)
          setShowBeginTurnUI({ val: true, onComplete: null });
        break;
      default:
        break;
    }
  }, [gameState]);

  React.useEffect(() => {
    if (loadingSaveState) return;

    if (activePlayerIndex === undefined) return;

    if (!isNetwork) {
      setLocalPlayerIndex(activePlayerIndex);
    }

    activePlayerIndexRef.current = activePlayerIndex;

    let prevIndex = activePlayerIndex - 1;
    if (prevIndex < 0) prevIndex = players.length - 1;
    if (prevIndex <= players.length - 1)
      players[prevIndex].allEntities?.forEach((e) =>
        e.setCustomData("justPlaced", false)
      );

    setActivePlayerID(players[activePlayerIndex].id);

    setShowBeginTurnUI({
      val: true,
      onComplete: () => {
        const nextTurnState =
          newGameFlowState === NewGameFlowState.BUILD
            ? TurnState.BUILD_TRADE
            : TurnState.ROLL;

        if (nextTurnState === turnState) {
          setSeenUpdatedTurnState(true);

          window.setTimeout(() => {
            setSeenUpdatedTurnState(false);
          }, 260);
        }

        setTurnState(nextTurnState);
      },
    });
  }, [activePlayerIndex]);

  React.useEffect(() => {
    if (loadingSaveState || activePlayerID === undefined) return;

    activePlayerIDRef.current = activePlayerID;
  }, [activePlayerID]);

  React.useEffect(() => {
    if (
      loadingSaveState ||
      localPlayerIndex === undefined ||
      players === undefined ||
      players.length < localPlayerIndex
    )
      return;

    localPlayerIndexRef.current = localPlayerIndex;

    setLocalPlayerID(players[localPlayerIndex].id);
  }, [localPlayerIndex]);

  React.useEffect(() => {
    if (loadingSaveState || localPlayerID === undefined) return;

    localPlayerIDRef.current = localPlayerID;
  }, [localPlayerID]);

  React.useEffect(() => {
    if (loadingSaveState) return;

    if (!players || players.length === 0) return;

    if (newGameFlowState === NewGameFlowState.DETERMINE_ORDER) {
      setNewGameFlowState(NewGameFlowState.DISPLAY_ORDER);
    }

    playersRef.current = players;
  }, [players]);

  React.useEffect(() => {
    if (loadingSaveState || newGameFlowState === undefined) return;

    switch (newGameFlowState) {
      case NewGameFlowState.PLAYER_SELECT:
        break;
      case NewGameFlowState.EXPLAIN_ORDER:
        if (players.length === 1)
          setNewGameFlowState(NewGameFlowState.DETERMINE_ORDER);
        break;
      case NewGameFlowState.DETERMINE_ORDER:
        setActivePlayerIndex(0);
        if (players.length === 1) setNewGameFlowState(NewGameFlowState.BUILD);
        break;
      case NewGameFlowState.DISPLAY_ORDER:
        break;
      case NewGameFlowState.BUILD:
        setActivePlayerIndex(0);
        break;
      case NewGameFlowState.COMPLETE:
        break;
    }
  }, [newGameFlowState]);

  React.useEffect(() => {
    if (loadingSaveState) return;

    if (diceRolled) {
      const die1 = Tools.randomInt(1, 6);
      const die2 = Tools.randomInt(1, 6);
      const val = die1 + die2;

      setCurDiceVal(val);
      setDiceRolledThisTurn(true);
      players[activePlayerIndex].diceRoll = val;

      if (newGameFlowState === NewGameFlowState.COMPLETE) {
        const hits = map.tiles.filter(
          (t) => Number.parseInt(t.getCustomData().diceValue) === val
        );

        if (val !== 7)
          awardResources(hits, () => setTurnState(TurnState.BUILD_TRADE));

        if (val === 7) {
          window.setTimeout(() => {
            setTurnState(TurnState.BUILD_TRADE);
          }, 500);
          scene.panCameraTo(robberRef.current.parentTile, 500, () => {
            scene.zoomMax(ZoomDirection.OUT, 500, null, () => {
              robberRef.current.highlight(true, 1000, 0x0084cc);
              window.setTimeout(() => {
                robberRef.current.highlight(false, 1000);
              }, 1000);
            });
          });
        }
      }

      window.setTimeout(() => {
        setDiceRolled(false);

        window.setTimeout(() => {
          if (newGameFlowState !== NewGameFlowState.COMPLETE) {
            if (activePlayerIndex === players.length - 1) {
              let sorted = players.sort((a, b) => b.diceRoll - a.diceRoll);
              sorted.forEach((p, i) => {
                p.turnOrder = i;
              });

              sorted = sorted.sort((a, b) => a.turnOrder - b.turnOrder);

              setPlayers([...sorted]);
            } else {
              let next = activePlayerIndex + 1;
              if (next > players.length - 1) next = 0;

              setActivePlayerIndex(next);
            }
          }
        }, 500);
      }, 1000);
    }
  }, [diceRolled]);

  // #endregion

  // #region Controller CBs

  const onCtrlDown = () => {
    setDisplayDebugHighlight((s) => !s);
  };

  const onHomeDown = () => {
    console.log("on home");
    if (!playersRef.current) return;

    const settlements = playersRef.current[0].settlements;

    if (settlements.length > 0) {
      onSpaceDown(undefined, () => {
        console.log("on comp");
        panThroughSettlements(settlements);
      });
    }
  };

  const returnSaveState = () => {
    let data: IStateJSONData = {
      isNetwork: isNetwork,
      players: players.map((p) => p.toJSON()),
      localPlayerID: localPlayerID,
      localPlayerIndex: localPlayerIndex,
      activePlayerID: activePlayerID,
      activePlayerIndex: activePlayerIndex,
      gameState: gameState,
      newGameFlowState: newGameFlowState,
      turnState: turnState,
      diceRolled: diceRolled,
      diceVal: diceVal,
    };

    return data;
  };

  const saveState = () => {
    if (
      loadingSaveState ||
      newGameFlowState === undefined ||
      newGameFlowState === NewGameFlowState.PLAYER_SELECT
    )
      return;

    if (!isNetwork)
      localStorage.setItem("CatanGameState", JSON.stringify(returnSaveState()));
  };

  // #region Camera Input Control
  const onSpaceDown = async (onStart?: () => void, onComplete?: () => void) => {
    if (modalOpen) return;

    if (scene) {
      controller.active = false;
      console.log(controller.currentAzimuthAngle);
      await scene.panCameraTo(
        new Vector3(0, 0, 0),
        1000,
        () => {
          scene.zoomMax(ZoomDirection.OUT, 500);
          scene.rotateHorizontalTo(
            controller.currentAzimuthAngle < 0 ? -180 : 180,
            500,
            undefined,
            () => {
              controller.toggleRotation(false);
            }
          );
          if (onStart) onStart();
        },
        () => {
          controller.toggleRotation(true);
          controller.active = true;
          if (onComplete) onComplete();
        }
      );
    }
  };

  // #endregion

  // #region Entity Mouse Input Control

  // #region Robber Controls
  const toggleRobberOnPointer = (robber: MeshEntity) => {
    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
      settlementOnPointer.current = false;
      roadOnPointer.current = false;
      cityOnPointer.current = false;
    }
    console.log("toggleRobberOnPointer");

    controller.edgeSnapping = false;
    controller.vertexSnapping = false;

    map.removeEntityFromTile(robber, false);
    pointerEntity.current = controller.setPointerEntity(robber);
    robber.ignoreRay = true;
  };

  const onRobberLeftDown = (args: { data: MeshEntity; mousePos: Vector3 }) => {
    if (
      !args.data ||
      args.data.getCustomData().type !== "robber" ||
      pointerEntity.current ||
      turnState !== TurnState.BUILD_TRADE ||
      localPlayerIndex !== activePlayerIndex ||
      players[activePlayerIndex].diceRoll !== 7
    )
      return;
    console.log("onRobberLeftDown");

    scene.panCameraTo(new Vector3(0, 0, 0), 500, () => {
      scene.zoomMax(ZoomDirection.OUT, 500, undefined, () => {
        controller.canClickPan = false;
        toggleRobberOnPointer(args.data);
      });
    });
  };

  const onRobberCanvasLeftUp = (args: {
    data: MeshEntity | Tile | null;
    mousePos: Vector3;
  }) => {
    if (
      !map ||
      !pointerEntity.current ||
      pointerEntity.current.getCustomData()["type"] !== "robber"
    )
      return;
    console.log("onRobberCanvasLeftUp");

    // if (!args.data || !(args.data instanceof Tile)) {
    pointerEntity.current.highlight(false);
    pointerEntity.current.toggleWireframe(false);
    pointerEntity.current.setColor(pointerEntity.current.baseColor);
    map.setEntityOnTile(
      pointerEntity.current,
      map.getTileAtPosition(
        new Vector3().fromArray(
          pointerEntity.current.getCustomData()["tilePos"] as number[]
        )
      ),
      true
    );
    freePointerEntity();
    controller.canClickPan = true;
    // }
  };

  const onRobberPlaced = (args: {
    data: Tile | IEntity | Sprite | null;
    mousePos: Vector3;
  }) => {
    if (
      !pointerEntity.current ||
      pointerEntity.current.getCustomData()["type"] !== "robber"
    )
      return;

    console.log("onRobberPlaced");

    let tile: Tile;
    if (args.data && args.data instanceof Tile) {
      tile = args.data;
    } else if (scene.map.highlightedTile) {
      tile = scene.map.highlightedTile;
    }

    if (tile && controller.setPointerEntityOnTile(tile)) {
      pointerEntity.current.setCustomData(
        "tilePos",
        tile.mesh.position.toArray()
      );
      pointerEntity.current.setCustomData("hasMoved", true);
      freePointerEntity();
    } else {
      pointerEntity.current.highlight(false);
      pointerEntity.current.toggleWireframe(false);
      pointerEntity.current.setColor(pointerEntity.current.baseColor);
      map.setEntityOnTile(
        pointerEntity.current,
        map.getTileAtPosition(
          new Vector3().fromArray(
            pointerEntity.current.getCustomData()["tilePos"] as number[]
          )
        ),
        true
      );
      freePointerEntity();
    }
    controller.canClickPan = true;
  };
  // #endregion

  // #region Building Controls

  const playersRef = React.useRef<Player[]>(players);

  const toggleOwnedEntityOnPointer = (entity: MeshEntity) => {
    if (
      !controller ||
      playersRef.current === undefined ||
      playersRef.current.length === 0 ||
      localPlayerIndexRef.current === -1 ||
      activePlayerIndexRef.current === -1 ||
      playersRef.current[localPlayerIndexRef.current].id !==
        playersRef.current[activePlayerIndexRef.current].id ||
      entity.getCustomData()["owner"] === undefined ||
      entity.getCustomData()["owner"] !== localPlayerIDRef.current ||
      entity.getCustomData()["justPlaced"] === false
    )
      return;

    console.log("toggleOwnedEntityOnPointer");

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
      settlementOnPointer.current = false;
      roadOnPointer.current = false;
      cityOnPointer.current = false;
    }

    map.removeEntityFromTile(entity, false);

    if (
      entity.getCustomData("type") === "settlement" ||
      entity.getCustomData("type") === "city"
    ) {
      if (gameStateRef.current === GameState.NEW_GAME) {
        const entsToRemove: Array<MeshEntity> = [];
        playersRef.current[localPlayerIndexRef.current].allEntities.forEach(
          (e) => {
            if (e.id === entity.id) return;

            if (e.getCustomData("justPlaced")) {
              entsToRemove.push(e);
            }
          }
        );
        entsToRemove.forEach((e) => {
          playersRef.current[localPlayerIndexRef.current].removeEntity(e);
          map.removeEntityFromTile(e, true);
        });
      }

      playersRef.current[localPlayerIndexRef.current].removeSettlement(entity);
      controller.onEntityPlacementValidator = settlementPlacementValidator(
        playersRef.current,
        localPlayerIndexRef.current,
        gameStateRef.current
      );

      controller.edgeSnapping = false;
      controller.vertexSnapping = true;

      settlementOnPointer.current = true;
    } else if (entity.getCustomData("type") === "road") {
      playersRef.current[localPlayerIndexRef.current].removeRoad(entity);
      controller.onEntityPlacementValidator = roadPlacementValidator(
        playersRef.current,
        localPlayerIndexRef.current,
        gameStateRef.current
      );

      controller.vertexSnapping = false;
      controller.edgeSnapping = true;

      roadOnPointer.current = true;
    }

    entity.setCustomData("tilePos", entity.parentTile.mesh.position.toArray());
    entity.setCustomData(
      "placementIndex",
      entity.placementType === EntityPlacementType.EDGE
        ? entity.placementEdge
        : entity.placementVertex
    );

    pointerEntity.current = controller.setPointerEntity(entity);
    controller.canClickPan = false;
    entity.ignoreRay = true;
    setEntityOnPointer(true);
  };

  const onOwnedEntityLeftDown = (args: {
    data: MeshEntity;
    mousePos: Vector3;
  }) => {
    if (pointerEntity.current) return;
    console.log("onOwnedEntityLeftDown");

    toggleOwnedEntityOnPointer(args.data);
  };

  const onOwnedEntityCanvasLeftUp = (args: {
    data: IEntity | Tile | Sprite | null;
    mousePos: Vector3;
  }) => {
    if (
      !map ||
      !pointerEntity.current ||
      pointerEntity.current.getCustomData("owner") !== localPlayerIDRef.current
    )
      return;

    console.log("onOwnedEntityCanvasLeftUp");

    // if (!args.data || !(args.data instanceof Tile)) {
    pointerEntity.current.highlight(false);
    pointerEntity.current.toggleWireframe(false);
    pointerEntity.current.setColor(pointerEntity.current.baseColor);
    pointerEntity.current.setPlacementIndex(
      pointerEntity.current.getCustomData("placementIndex")
    );
    map.setEntityOnTile(
      pointerEntity.current,
      map.getTileAtPosition(
        new Vector3().fromArray(
          pointerEntity.current.getCustomData()["tilePos"] as number[]
        )
      ),
      true
    );
    freePointerEntity();
    controller.canClickPan = true;
    // }
  };

  const onOwnedEntityPlaced = (args: {
    data: IEntity | Tile | Sprite | null;
    mousePos: Vector3;
  }) => {
    if (
      !pointerEntity.current ||
      pointerEntity.current.getCustomData()["type"] !== "robber"
    )
      return;
    console.log("onOwnedEntityPlaced");

    let tile: Tile;
    if (args.data && args.data instanceof Tile) {
      tile = args.data;
    } else if (scene.map.highlightedTile) {
      tile = scene.map.highlightedTile;
    }

    if (tile && controller.setPointerEntityOnTile(tile)) {
      pointerEntity.current.setCustomData(
        "tilePos",
        tile.mesh.position.toArray()
      );
      freePointerEntity();
      controller.canClickPan = true;
    }
  };

  const toggleBuildingOnPointer = () => {
    if (!controller) return;

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
      settlementOnPointer.current = false;
      roadOnPointer.current = false;
      cityOnPointer.current = false;
    }

    controller.onEntityPlacementValidator = settlementPlacementValidator(
      players,
      localPlayerIndex,
      gameState
    );

    controller.edgeSnapping = false;
    controller.vertexSnapping = true;

    settlementOnPointer.current = true;
    pointerEntity.current = controller.setPointerEntity("settlement");
    setEntityOnPointer(true);
  };

  const toggleRoadOnPointer = () => {
    if (!controller) return;

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
      settlementOnPointer.current = false;
      roadOnPointer.current = false;
      cityOnPointer.current = false;
    }

    controller.onEntityPlacementValidator = roadPlacementValidator(
      players,
      localPlayerIndex,
      gameState
    );

    controller.vertexSnapping = false;
    controller.edgeSnapping = true;

    roadOnPointer.current = true;
    pointerEntity.current = controller.setPointerEntity("road");
    setEntityOnPointer(true);
  };

  const onSettlementPlaced = (onComplete: () => void) => {
    players[activePlayerIndex].addSettlement(
      pointerEntity.current,
      newGameFlowState === NewGameFlowState.COMPLETE
    );

    onComplete();
  };

  const onRoadPlaced = (onComplete: () => void) => {
    players[activePlayerIndex].addRoad(
      pointerEntity.current,
      newGameFlowState === NewGameFlowState.COMPLETE
    );

    if (gameState === GameState.PLAY) {
      players.forEach((p) =>
        p.roads.forEach((e) =>
          e.highlight(
            false,
            0,
            undefined,
            () => (e.canInteract = false),
            undefined,
            true
          )
        )
      );

      let longestRoadPlayer: Player = players.find((p) => p.hasLongestRoad);
      let previousLongestRoadPlayer = longestRoadPlayer;
      let longestRoads: MeshEntity[] = [];

      if (longestRoadPlayer)
        longestRoads = longestRoadPlayer.getLongestContinuousRoad();

      for (const player of players.filter((p) => !p.hasLongestRoad)) {
        let roads = player.getLongestContinuousRoad();

        if (roads.length >= 5) {
          if (roads.length > longestRoads.length) {
            longestRoadPlayer = player;
            longestRoads = roads;

            if (previousLongestRoadPlayer)
              previousLongestRoadPlayer.hasLongestRoad = false;
          } else if (roads.length === longestRoads.length) {
            longestRoadPlayer = null;

            if (previousLongestRoadPlayer)
              previousLongestRoadPlayer.hasLongestRoad = false;
          }
        }
      }

      if (
        previousLongestRoadPlayer &&
        previousLongestRoadPlayer.hasLongestRoad === false &&
        !longestRoadPlayer
      ) {
        onComplete();
      }

      if (
        longestRoadPlayer &&
        (!previousLongestRoadPlayer ||
          previousLongestRoadPlayer.id !== longestRoadPlayer.id)
      ) {
        longestRoadPlayer.hasLongestRoad = true;

        longestRoads.forEach((r, i) =>
          r.highlight(
            true,
            3000,
            0x0084cc,
            () => {
              r.canInteract = false;
              if (i === longestRoads.length - 1) {
                setSeenUpdatedTurnState(true);
                setShowGainedLongestRoadUI({
                  player: longestRoadPlayer,
                  val: true,
                });
              }
            },
            () => {},
            true
          )
        );

        window.setTimeout(() => {
          longestRoads.forEach((r, i) =>
            r.highlight(
              false,
              3000,
              undefined,
              () => {
                if (i === longestRoads.length - 1) {
                  setShowGainedLongestRoadUI((s) => ({ ...s, val: false }));
                  onComplete();
                }
              },
              () => (r.canInteract = true),
              true
            )
          );
          players.forEach((p) =>
            p.roads.forEach((r) => (r.canInteract = true))
          );
        }, 3500);
      }

      if (
        previousLongestRoadPlayer &&
        !previousLongestRoadPlayer.hasLongestRoad
      ) {
        setSeenUpdatedTurnState(true);
        setShowLostLongestRoadUI({
          player: previousLongestRoadPlayer,
          val: true,
        });

        window.setTimeout(() => {
          setShowLostLongestRoadUI({ player: null, val: false });
          players.forEach((p) =>
            p.roads.forEach((r) => (r.canInteract = true))
          );
        }, 1000);
      }

      if (!longestRoadPlayer && !previousLongestRoadPlayer) {
        onComplete();
      }
    } else if (gameState === GameState.NEW_GAME) {
      onComplete();
    }
  };

  const onBuildPlaced = (args: {
    data: Tile | IEntity | Sprite | null;
    mousePos: Vector3;
  }) => {
    if (!controller || !pointerEntity.current) return;
    console.log("onBuildPlaced");

    controller.onEntityPlacementValidator = undefined;

    let tile;
    if (args.data && args.data instanceof Tile) {
      tile = args.data;
    } else if (scene.map.highlightedTile) {
      tile = scene.map.highlightedTile;
    }

    if (tile && controller.setPointerEntityOnTile(tile)) {
      const onComplete = () => {
        setPlayers([...players]);
      };

      pointerEntity.current?.setCustomData("justPlaced", true);

      if (settlementOnPointer.current) {
        onSettlementPlaced(onComplete);
      } else if (roadOnPointer.current) {
        onRoadPlaced(onComplete);
      } else if (cityOnPointer.current) {
        players[localPlayerIndex].addCity(
          pointerEntity.current,
          newGameFlowState === NewGameFlowState.COMPLETE
        );
      }

      freePointerEntity();
    } else {
      freePointerEntity();
    }
  };

  const onBuildLeftUp = (args: {
    data: MeshEntity | Tile | null;
    mousePos: Vector3;
  }) => {
    if (!pointerEntity.current) return;

    console.log("onBuildLeftUp");

    if (!args.data || !(args.data instanceof Tile)) {
      if (
        !args.data &&
        pointerEntity.current &&
        pointerEntity.current.getCustomData()["tilePos"]
      ) {
        if (
          pointerEntity.current.getCustomData()["owner"] ===
          localPlayerIDRef.current
        ) {
          onOwnedEntityCanvasLeftUp(args);
          return;
        } else if (pointerEntity.current.getCustomData()["type"] === "robber") {
          onRobberCanvasLeftUp(args);
          return;
        }
      }

      if (
        args.data instanceof MeshEntity &&
        args.data.getCustomData()["owner"] === localPlayerIDRef.current
      ) {
        onOwnedEntityCanvasLeftUp(args);
        return;
      }

      freePointerEntity();
    }
  };

  // #endregion

  const awardResources = async (tiles: Tile[], onComplete?: () => void) => {
    setAwardingResources(true);

    const awardResource = (tile: Tile, e: MeshEntity) => {
      const player = players.find((p) => p.id === e.getCustomData().owner);

      if (player) {
        console.log(
          "Awarding resource: " +
            tile.getCustomData().resource +
            " to player: " +
            player.id
        );

        switch (tile.getCustomData().resource) {
          case Resources.LUMBER:
            player.lumber = player.lumber + 1;
            break;
          case Resources.GRAIN:
            player.grain = player.grain + 1;
            break;
          case Resources.WOOL:
            player.wool = player.wool + 1;
            break;
          case Resources.BRICK:
            player.brick = player.brick + 1;
            break;
          case Resources.ORE:
            player.ore = player.ore + 1;
            break;
        }

        saveState();
      }
    };

    onSpaceDown(
      () => {
        tiles.forEach((t) => {
          if (t.entities.find((e) => e.getCustomData()["type"] === "robber")) {
            return;
          }

          t.highlight(true, 1000);
        });
      },
      async () => {
        window.setTimeout(async () => {
          tiles.forEach((t) => {
            if (
              t.entities.find((e) => e.getCustomData()["type"] === "robber")
            ) {
              return;
            }

            t.unhighlight(1000);
          });
        }, 1000);

        for (const t of tiles) {
          if (t.entities.find((e) => e.getCustomData()["type"] === "robber")) {
            continue;
          }

          console.log(
            "awarding ents on tile: " + t.mapPosition.toArray().toString()
          );

          let ents = [
            ...t.entities.filter(
              (e) => e.placementType === EntityPlacementType.VERTEX
            ),
            ...t.sharedVertEntities.map((e) => e.entity),
          ];

          if (newGameFlowState !== NewGameFlowState.COMPLETE)
            ents = ents.filter((e) => e.getCustomData().index === 1);

          for (const e of ents) {
            awardResource(t, e);
          }

          console.log(
            "done awarding resources from tile: " +
              t.mapPosition.toArray().toString()
          );
        }

        console.log(
          "[AwardResources] Showing entities that earned resources to respective players"
        );

        const _onComplete = () => {
          setAwardingResources(false);
          setPlayers([...players]);
          if (onComplete) onComplete();
        };

        if (isNetwork) {
          const activeID = localPlayerIDRef.current;
          const ents: MeshEntity[] = [];
          for (const t of tiles) {
            if (
              t.entities.find((e) => e.getCustomData()["type"] === "robber")
            ) {
              continue;
            }

            let _ents = [
              ...t.entities.filter(
                (e) =>
                  e.getCustomData()["owner"] === activeID &&
                  e.placementType === EntityPlacementType.VERTEX
              ),
              ...t.sharedVertEntities.map((e) => e.entity),
            ];

            _ents.forEach((e) => ents.push(e));
          }

          panThroughSettlements(ents, 1000, () => {
            _onComplete();
          });
        } else if (gameState === GameState.PLAY) {
          console.log("[AwardResources] Panning through ents");

          const activeID = activePlayerIDRef.current;

          console.log("activeID: " + activeID);
          const ents: MeshEntity[] = [];
          for (const t of tiles) {
            if (
              t.entities.find((e) => e.getCustomData()["type"] === "robber")
            ) {
              continue;
            }

            let _ents = [
              ...t.entities.filter(
                (e) =>
                  e.getCustomData()["owner"] === activeID &&
                  e.placementType === EntityPlacementType.VERTEX
              ),
              ...t.sharedVertEntities.map((e) => e.entity),
            ];

            _ents.forEach((e) => ents.push(e));
          }

          if (ents.length === 0) {
            window.setTimeout(() => {
              _onComplete();
            }, 1000);
          } else
            panThroughSettlements(ents, 1000, () => {
              _onComplete();
            });
        } else {
          window.setTimeout(async () => {
            _onComplete();
          }, 1000);
        }
      }
    );
  };

  const panThroughSettlements = async (
    settlements: MeshEntity[],
    holdDuration = 1000,
    onComplete?: () => void
  ) => {
    console.log("panning through settlements: ");
    console.log(settlements);

    controller.active = false;
    controller.toggleRotation(false);

    await zoomInAndOut(
      scene,
      settlements.map((v) =>
        v.parentTile.getVertexWorldPosition(v.placementVertex)
      ),
      holdDuration,
      () => {
        console.log("toggling rot");
        console.log(controller.currentAzimuthAngle);
        controller.toggleRotation(true);
        controller.active = true;
        if (onComplete) onComplete();
      }
    );
  };

  const freePointerEntity = () => {
    if (entityPointerUpCB.current) entityPointerUpCB.current();

    entityPointerUpCB.current = null;

    if (pointerEntity.current) {
      controller.removeEntityFromPointer();
      controller.onEntityPlacementValidator = undefined;
    }

    settlementOnPointer.current = false;
    roadOnPointer.current = false;
    cityOnPointer.current = false;

    pointerEntity.current = null;
    setEntityOnPointer(false);
  };

  // #endregion

  // #endregion

  // #region render logic

  // #region Bottom Bar UI

  let canPlaceSettlement = false;
  let canPlaceRoad = false;
  let canPlaceCity = false;
  if (
    localPlayerID === activePlayerID &&
    (newGameFlowState === NewGameFlowState.BUILD ||
      turnState === TurnState.BUILD_TRADE)
  ) {
    canPlaceSettlement =
      newGameFlowState === NewGameFlowState.BUILD
        ? players[activePlayerIndex].settlements.length === 0 ||
          (players[activePlayerIndex].settlements.length === 1 &&
            players[activePlayerIndex].roads.length === 1 &&
            !players[activePlayerIndex].allEntities.find(
              (e) => e.getCustomData()["justPlaced"] === true
            ))
        : players[activePlayerIndex].canBuildSettlement();
    canPlaceRoad =
      newGameFlowState === NewGameFlowState.BUILD
        ? (players[activePlayerIndex].settlements.length === 1 &&
            !canPlaceSettlement &&
            players[activePlayerIndex].roads.length === 0) ||
          (players[activePlayerIndex].settlements.length === 2 &&
            !canPlaceSettlement &&
            players[activePlayerIndex].roads.length === 1)
        : players[activePlayerIndex].canBuildRoad();
    canPlaceCity =
      newGameFlowState === NewGameFlowState.COMPLETE &&
      players[activePlayerIndex].canBuildCity();
  }

  let bottomBarUI;
  let canBuild =
    !entityOnPointer &&
    localPlayerID === activePlayerID &&
    ((newGameFlowState === NewGameFlowState.BUILD &&
      (players[activePlayerIndex].settlements.length < 2 ||
        players[activePlayerIndex].roads.length < 2)) ||
      turnState === TurnState.BUILD_TRADE);
  let canTrade =
    !entityOnPointer &&
    localPlayerID === activePlayerID &&
    newGameFlowState === NewGameFlowState.COMPLETE &&
    turnState === TurnState.BUILD_TRADE;

  let canEndTurn =
    !entityOnPointer &&
    activePlayerID === localPlayerID &&
    (newGameFlowState === NewGameFlowState.DETERMINE_ORDER ||
      (newGameFlowState === NewGameFlowState.BUILD &&
        !canPlaceSettlement &&
        !canPlaceRoad) ||
      (newGameFlowState === NewGameFlowState.COMPLETE &&
        turnState === TurnState.BUILD_TRADE));
  let canViewRoll =
    !entityOnPointer &&
    (turnState === TurnState.ROLL ||
      newGameFlowState === NewGameFlowState.DETERMINE_ORDER);
  let canRoll = canViewRoll && activePlayerID === localPlayerID;

  if (
    !modalOpen &&
    activePlayerIndex !== undefined &&
    localPlayerIndex !== undefined
  ) {
    bottomBarUI = (
      <>
        {/* {(newGameFlowState === NewGameFlowState.DETERMINE_ORDER ||
          (newGameFlowState === NewGameFlowState.BUILD &&
            players[activePlayerIndex].roads.length ===
              players[activePlayerIndex].settlements.length) ||
          gameState === GameState.PLAY) && (
          <Box
            sx={{
              display: "flex",
              flexFlow: "column",
              transition: "all 1s linear",
            }}
          >
            {turnState === TurnState.ROLL && (
              <Slide
                direction="up"
                in={diceRolled}
                mountOnEnter
                unmountOnExit
                container={fabRef.current}
              >
                <Typography
                  variant="h1"
                  sx={{
                    textShadow:
                      "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black",
                  }}
                >
                  {diceVal}
                </Typography>
              </Slide>
            )}
            {activePlayerID === localPlayerID && (
              <Fab
                disabled={
                  (newGameFlowState === NewGameFlowState.BUILD &&
                    (canPlaceSettlement || canPlaceRoad)) ||
                  ((gameState !== GameState.PLAY ||
                    turnState === TurnState.ROLL) &&
                    (diceRolled || diceRolledThisTurn || awardingResources))
                }
                ref={fabRef}
                aria-label={"fab"}
                
                size="large"
                variant={"extended"}
                sx={{ "&>*": { mr: 0.5 }, pointerEvents: "auto" }}
              >
                {newGameFlowState !== NewGameFlowState.BUILD &&
                  (newGameFlowState == NewGameFlowState.DETERMINE_ORDER ||
                    turnState === TurnState.ROLL) && (
                    <>
                      <CasinoIcon />
                      <Box />
                    </>
                  )}
                <Typography>
                  {newGameFlowState !== NewGameFlowState.BUILD &&
                  (newGameFlowState === NewGameFlowState.DETERMINE_ORDER ||
                    turnState === TurnState.ROLL)
                    ? "Roll"
                    : "End Turn"}
                </Typography>
              </Fab>
            )}
          </Box>
        )} */}
        {(canViewRoll || canRoll || canBuild || canTrade || canEndTurn) && (
          // <Box sx={{
          //     backgroundColor: `rgba(0,0,0,.2)`,
          //     borderRadius: '0 2em 0 0',
          //     color: 'white',
          //     position: 'fixed',
          //     left: 0,
          //     bottom: 0,
          //     display: 'flex',
          //     flexFlow: 'column',
          //     pointerEvents: "all",
          // }}>
          //     {localPlayerID === activePlayerID && (newGameFlowState === NewGameFlowState.COMPLETE && turnState === TurnState.BUILD_TRADE) &&
          //         <IconButtonTray
          //             actions={[
          //                 { icon: <AccountBalanceIcon />, title: 'Buy/Sell', onClick: () => setIsBanking(true) }
          //             ]}
          //             tips={[{ title: 'Maritime Trade' }]}
          //         />
          //     }
          <ActionsMenu
            canEndTurn={canEndTurn}
            diceRollProps={{
              diceRolled,
              diceVal,
              onClick: () => {
                if (
                  newGameFlowState !== NewGameFlowState.BUILD &&
                  (newGameFlowState === NewGameFlowState.DETERMINE_ORDER ||
                    turnState === TurnState.ROLL)
                ) {
                  if (!diceRolled) setDiceRolled(true);
                }
              },
            }}
            onEndTurn={() => {
              if (newGameFlowState === NewGameFlowState.BUILD) {
                let check = true;

                for (const player of players) {
                  if (
                    player.settlements.length < 2 ||
                    player.roads.length < 2
                  ) {
                    check = false;
                    break;
                  }
                }

                const onCheckTrue = () => {
                  map.canInteract = false;

                  const lastSettlements = map.entitiesOnMap.filter(
                    (e) => e.getCustomData().index === 1
                  );
                  const tiles: Tile[] = [];
                  for (const settlement of lastSettlements) {
                    let neighs = settlement.parentTile.getVertexNeighbors(
                      settlement.placementVertex
                    );

                    if (
                      tiles.findIndex(
                        (t) => t.mesh.id === settlement.parentTile.mesh.id
                      ) === -1
                    )
                      tiles.push(settlement.parentTile);

                    neighs
                      .map((t) => t.tile)
                      .forEach((t) => {
                        if (
                          tiles.findIndex((_t) => _t.mesh.id === t.mesh.id) ===
                          -1
                        )
                          tiles.push(t);
                      });
                  }

                  awardResources(tiles, () =>
                    setNewGameFlowState(NewGameFlowState.COMPLETE)
                  );
                };

                if (check) {
                  // Award resources, begin game
                  // window.setTimeout(() => {
                  onCheckTrue();
                  // }, 500);
                } else {
                  // if (players[activePlayerIndex].settlements.length !== players[activePlayerIndex].roads.length) {
                  //     setPlayers([...players]);
                  //     freePointerEntity();
                  //     return;
                  // } else {
                  //     setPlayers([...players]);
                  // }

                  let shouldReverse = true;

                  for (const player of players) {
                    if (
                      player.roads.length < 1 ||
                      player.settlements.length < 1
                    ) {
                      shouldReverse = false;
                      break;
                    }
                  }

                  let nextPlayer = activePlayerIndex + (shouldReverse ? -1 : 1);
                  if (nextPlayer > players.length - 1) nextPlayer = 0;
                  if (nextPlayer < 0) nextPlayer = players.length - 1;

                  setPlayers([...players]);
                  setActivePlayerIndex(nextPlayer);

                  if (players.length === 1)
                    setShowBeginTurnUI({ val: true, onComplete: null });
                }
              } else {
                let nextPlayer = activePlayerIndex + 1;
                if (nextPlayer > players.length - 1) {
                  nextPlayer = 0;
                }

                setActivePlayerIndex(nextPlayer);

                if (players.length === 1)
                  setShowBeginTurnUI({
                    val: true,
                    onComplete: () => setTurnState(TurnState.ROLL),
                  });
              }
            }}
            fabState={
              canViewRoll
                ? canRoll
                  ? "Roll"
                  : "Roll Spectate"
                : canBuild || canTrade || canEndTurn
                ? "Actions"
                : "None"
            }
            canBuild={
              canBuild && (canPlaceSettlement || canPlaceRoad || canPlaceCity)
            }
            canTrade={canTrade}
            canDCard={false}
            buildTrayProps={{
              canBuildSettlement: canPlaceSettlement,
              availableSettlements:
                players[activePlayerIndex].availableSettlements,
              settlementCost:
                newGameFlowState !== NewGameFlowState.COMPLETE ? null : (
                  <ResourceDisplay brick={1} lumber={1} wool={1} grain={1} />
                ),
              canBuildRoad: canPlaceRoad,
              availableRoads: players[activePlayerIndex].availableRoads,
              roadCost:
                newGameFlowState !== NewGameFlowState.COMPLETE ? null : (
                  <ResourceDisplay brick={1} lumber={1} />
                ),
              canBuildCity: canPlaceCity,
              availableCities: players[activePlayerIndex].availableCities,
              cityCost:
                newGameFlowState !== NewGameFlowState.COMPLETE ? null : (
                  <ResourceDisplay grain={2} ore={3} />
                ),
              onSettlementDragged: (cb) => {
                controller.removeOnAnyMouseInputListener(
                  InputType.LEFT_UP,
                  onBuildPlaced
                );
                // controller.removeOnCanvasMouseInputListener(InputType.LEFT_UP, onBuildLeftUp);
                controller.addOnAnyMouseInputListener(
                  InputType.LEFT_UP,
                  onBuildPlaced
                );
                // controller.addOnCanvasMouseInputListener(InputType.LEFT_UP, onBuildLeftUp);
                entityPointerUpCB.current = cb;
                toggleBuildingOnPointer();
              },
              onRoadDragged: (cb) => {
                controller.removeOnAnyMouseInputListener(
                  InputType.LEFT_UP,
                  onBuildPlaced
                );
                // controller.removeOnCanvasMouseInputListener(InputType.LEFT_UP, onBuildLeftUp);
                controller.addOnAnyMouseInputListener(
                  InputType.LEFT_UP,
                  onBuildPlaced
                );
                // controller.addOnCanvasMouseInputListener(InputType.LEFT_UP, onBuildLeftUp);
                entityPointerUpCB.current = cb;

                toggleRoadOnPointer();
              },
              onCityDragged: (cb) => {},
            }}
          />
        )}
      </>
    );
  }
  // #endregion

  // #region Alert UI

  // #region Modal Logic
  const showModal =
    newGameFlowState === NewGameFlowState.PLAYER_SELECT ||
    newGameFlowState === NewGameFlowState.EXPLAIN_ORDER ||
    newGameFlowState === NewGameFlowState.DISPLAY_ORDER ||
    (newGameFlowState === NewGameFlowState.COMPLETE &&
      gameState === GameState.NEW_GAME) ||
    showBeginTurnUI.val ||
    isBanking;

  let modalTitle = "";
  let modalBody = <></>;
  let modalActions = new Array<JSX.Element>();

  if (newGameFlowState === NewGameFlowState.PLAYER_SELECT) {
    modalTitle = "Player Select";
    modalBody = (
      <>
        <Box sx={{ width: "100%" }}>
          Select the number of players in this game.
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexFlow: "row",
            justifyContent: "center",
            alignItems: "center",
            mt: 2,
          }}
        >
          <IconButton
            disabled={players.length === 1}
            size="large"
            aria-label="less"
            onClick={() => {
              const _players = [...players];
              _players.splice(players.length - 1, 1);
              setPlayers(_players);
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          {players.length}
          <IconButton
            disabled={players.length === 4}
            size="large"
            aria-label="more"
            onClick={() => {
              const player = new Player(players.length);
              setPlayers((s) => [...s, player]);
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </>
    );
    modalActions = [
      <Button
        onClick={() => {
          setNewGameFlowState(NewGameFlowState.EXPLAIN_ORDER);
        }}
      >
        OK
      </Button>,
    ];
  } else if (newGameFlowState === NewGameFlowState.EXPLAIN_ORDER) {
    modalTitle = "Turn Order";
    modalBody = (
      <Box sx={{ width: "100%" }}>
        We will now roll the dice to determine the turn order. Each player will
        then set 2 roads and 2 settlements in that order to begin the game.
      </Box>
    );
    modalActions = [
      <Button
        onClick={() => {
          setNewGameFlowState(NewGameFlowState.DETERMINE_ORDER);
        }}
      >
        OK
      </Button>,
    ];
  } else if (newGameFlowState === NewGameFlowState.DISPLAY_ORDER) {
    modalTitle = "Turn Order";
    modalBody = (
      <>
        <Box sx={{ width: "100%" }}>The turn order is:</Box>
        <List>
          {players.map((p, i) => (
            <ListItem>
              {i + 1}. Player {p.id}
            </ListItem>
          ))}
        </List>
      </>
    );
    modalActions = [
      <Button
        onClick={() => {
          setNewGameFlowState(NewGameFlowState.BUILD);
        }}
      >
        OK
      </Button>,
    ];
  } else if (
    newGameFlowState === NewGameFlowState.COMPLETE &&
    gameState === GameState.NEW_GAME
  ) {
    modalTitle = "Begin!";
    modalBody = <Box>Game Beginning</Box>;
    modalActions = [
      <Button
        onClick={() => {
          setGameState(GameState.PLAY);
        }}
      >
        Ok
      </Button>,
    ];
  } else if (showBeginTurnUI.val) {
    modalTitle = "Player " + players[activePlayerIndex].id + " Begin Turn!";
    modalBody = (
      <Box sx={{ width: "100%" }}>
        {gameState === GameState.NEW_GAME &&
        newGameFlowState === NewGameFlowState.BUILD
          ? "Drag a settlement onto an intersection and then a road adjacent to that settlement from your build tray in the bottom left corner. Choose your teritorry wisely..."
          : ""}
      </Box>
    );
    modalActions = [
      <Button
        onClick={() => {
          if (showBeginTurnUI.onComplete) showBeginTurnUI.onComplete();

          setShowBeginTurnUI({ val: false, onComplete: null });
        }}
      >
        Ok
      </Button>,
    ];
  } else if (isBanking) {
    modalTitle = "Maritime Trade";

    let specials: Array<{
      resourceOffered: {
        name: string;
        amountNeeded: number;
      };
      resourceReceived: {
        name: string;
        amountReceived: number;
      };
    }> = [];

    let allProperties = [
      ...players[localPlayerIndex].settlements,
      ...players[localPlayerIndex].cities,
    ];

    for (const prop of allProperties) {
      if (hasPorts(prop.parentTile)) {
        const ports = getTilePortData(prop.parentTile) as {
          [port: number]: TilePortData;
        };

        for (const port in ports) {
          let portType = ports[port].type;
          if (!specials.find((x) => x.resourceReceived.name === portType)) {
            specials.push({
              resourceOffered: {
                name: portType,
                amountNeeded: ports[port].from,
              },
              resourceReceived: { name: "Any", amountReceived: ports[port].to },
            });
          }
        }
      }
    }

    modalBody = (
      <ResourceTrader
        brick={players[activePlayerIndex].brick}
        lumber={players[activePlayerIndex].lumber}
        wool={players[activePlayerIndex].wool}
        grain={players[activePlayerIndex].grain}
        ore={players[activePlayerIndex].ore}
        isBank
        onValid={(finalResoruces) => {
          setOfferingBankResources(finalResoruces.resourcesOffering);
          setReceivingBankResources(finalResoruces.resourcesReceiving);
          setIsBankTradeValid(true);
        }}
        onInValid={() => {
          setOfferingBankResources([]);
          setReceivingBankResources([]);
          setIsBankTradeValid(false);
        }}
        specialDeal={specials}
      />
    );
    modalActions = [
      <Button
        disabled={!isBankTradeValid}
        onClick={() => {
          players[activePlayerIndex].tradeResources(
            offeringBankResources,
            receivingBankResources
          );
          setIsBanking(false);
        }}
      >
        Trade
      </Button>,
      <Button
        onClick={() => {
          setOfferingBankResources([]);
          setReceivingBankResources([]);
          setIsBanking(false);
        }}
      >
        Cancel
      </Button>,
    ];
  }
  // #endregion

  // #region Toast Logic

  const [toastState, setToastState] = React.useState<{
    showToast: boolean;
    toastBody: JSX.Element | JSX.Element[];
    toastAction: React.ReactNode;
    toastSeverity: "info" | "warning" | "success" | "error";
  }>({
    showToast: false,
    toastBody: null,
    toastAction: null,
    toastSeverity: "info",
  });

  React.useEffect(() => {
    const gainedLongestRoad =
      showGainedLongestRoadUI.val &&
      localPlayerID === showGainedLongestRoadUI.player.id;

    const lostLongestRoad =
      showLostLongestRoadUI.val &&
      localPlayerID === showLostLongestRoadUI.player.id;

    const observedLongestRoadChange =
      showGainedLongestRoadUI.val &&
      showLostLongestRoadUI.val &&
      showGainedLongestRoadUI.player.id !== localPlayerID &&
      showLostLongestRoadUI.player.id !== localPlayerID;

    const showToast =
      !modalOpen &&
      (gainedLongestRoad ||
        lostLongestRoad ||
        observedLongestRoadChange ||
        !seenUpdatedTurnState);

    if (modalOpen && toastState.showToast) {
      setToastState((s) => ({ ...s, showToast: false }));
      return;
    }

    if (showToast !== toastState.showToast) {
      let defaultToastAction = (
        <IconButton
          size="medium"
          aria-label="close"
          color="inherit"
          sx={{ padding: "0 !important", paddingLeft: "8px !important" }}
          onClick={() => {
            setSeenUpdatedTurnState(true);
            setToastState((s) => ({ ...s, showToast: false }));
          }}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
      );
      let toastBody = toastState.toastBody;
      let toastAction = toastState.toastAction;
      let toastSeverity = toastState.toastSeverity;
      if (gainedLongestRoad) {
        toastBody = (
          <>
            <Typography>Congratulations!</Typography>
            <Typography variant="body2">
              You've built the longest road! Protect it!
            </Typography>
          </>
        );
        toastAction = null;
        toastSeverity = "success";
      } else if (lostLongestRoad) {
        toastBody = (
          <>
            <Typography>Bad Luck!</Typography>
            <Typography variant="body2">
              <>
                {showGainedLongestRoadUI.player
                  ? "Player " +
                    showGainedLongestRoadUI.player.id +
                    " now has the longest road. "
                  : "You've lost the longest road. "}
                Try to build more!
              </>
            </Typography>
          </>
        );
        toastAction = null;
        toastSeverity = "error";
      } else if (observedLongestRoadChange) {
        toastBody = (
          <>
            <Typography>
              {showGainedLongestRoadUI.player && showLostLongestRoadUI.player
                ? "Player " +
                  showGainedLongestRoadUI.player.id +
                  " just took the longest road from Player " +
                  showLostLongestRoadUI.player.id +
                  "!"
                : showGainedLongestRoadUI.player
                ? "Player " +
                  showGainedLongestRoadUI.player.id +
                  " just built the longest road!"
                : showLostLongestRoadUI.player
                ? "Player " +
                  showLostLongestRoadUI.player.id +
                  " just lost the longest road!"
                : "The longest road has been lost!"}
            </Typography>
            <Typography variant="body2">
              {(showGainedLongestRoadUI.player &&
                showLostLongestRoadUI.player) ||
              (showGainedLongestRoadUI.player && !showLostLongestRoadUI.player)
                ? "Try to build a longer road than them!"
                : !showGainedLongestRoadUI.player &&
                  showLostLongestRoadUI.player
                ? "It's up for the taking, try to build more!"
                : "How'd that happen?"}
            </Typography>
          </>
        );
        toastSeverity = "info";
        toastAction = defaultToastAction;
      } else if (!seenUpdatedTurnState) {
        toastBody = (
          <>
            <Typography>
              {turnState === TurnState.ROLL
                ? "Roll Phase!"
                : newGameFlowState === NewGameFlowState.BUILD
                ? "Build Phase!"
                : "Build/Trade Phase!"}
            </Typography>
          </>
        );
        toastSeverity = "info";
        toastAction = defaultToastAction;
      }

      setToastState({
        showToast: showToast,
        toastBody: toastBody,
        toastAction: toastAction,
        toastSeverity: toastSeverity,
      });
    }
  }, [
    showGainedLongestRoadUI.val,
    showLostLongestRoadUI.val,
    seenUpdatedTurnState,
    modalOpen,
  ]);

  // #endregion

  let alertUI;
  if (gameState !== undefined) {
    alertUI = (
      <>
        <Modal
          open={showModal}
          title={modalTitle}
          sx={{ pb: 0 }}
          onClose={() => {
            setModalOpen(false);
          }}
          onOpen={() => {
            setModalOpen(true);
          }}
          actions={modalActions}
        >
          {modalBody}
        </Modal>
      </>
    );
  }
  // #endregion

  // #region Player Info Upper Right Corner UI
  let allGamePlayersInfoUI;
  if (
    players !== undefined &&
    players.length > 0 &&
    !modalOpen &&
    activePlayerIndex !== undefined &&
    localPlayerIndex !== undefined
  ) {
    allGamePlayersInfoUI = (
      <TopBar>
        <Box
          sx={{
            display: "flex",
            flexFlow: "column",
            pt: 1,
            pointerEvents: "all",
          }}
        >
          <AvatarTabs names={players.map((p) => p.id.toString())} />
          <Box
            sx={{
              mt: 2,
              mb: 2,
              display: "flex",
              flexFlow: "column",
              alignItems: "end",
            }}
          >
            Current Player Turn
            <Box sx={{ mt: 0.5 }}>
              <AvatarTabs names={[players[activePlayerIndex].id.toString()]} />
            </Box>
          </Box>
          <Toast
            open={toastState.showToast}
            vertical="bottom"
            horizontal="right"
            actionButton={toastState.toastAction}
            severity={toastState.toastSeverity}
            sx={{ position: "unset !important" }}
            slideDirection="left"
          >
            {toastState.toastBody}
          </Toast>
        </Box>
      </TopBar>
    );
  }
  // #endregion

  return loadingSaveState ? null : (
    <>
      <HighlightHUD
        modalOpen={false}
        players={players}
        localPlayerIndex={localPlayerIndex}
        controller={controller}
        scene={scene}
        displayDebugHighlightData={displayDebugHighlight}
      />

      {players !== undefined &&
        players.length > 0 &&
        activePlayerIndex !== undefined &&
        localPlayerIndex !== undefined && (
          <TopBar>
            <Box
              sx={{
                display: "flex",
                flexFlow: "column",
                pt: 1,
                pointerEvents: "all",
              }}
            >
              <AvatarTabs names={players.map((p) => p.id.toString())} />
              <Box
                sx={{
                  mt: 2,
                  mb: 2,
                  display: "flex",
                  flexFlow: "column",
                  alignItems: "end",
                }}
              >
                Current Player Turn
                <Box sx={{ mt: 0.5 }}>
                  <AvatarTabs
                    names={[players[activePlayerIndex].id.toString()]}
                  />
                </Box>
              </Box>
              <Toast
                open={toastState.showToast}
                vertical="bottom"
                horizontal="right"
                actionButton={toastState.toastAction}
                severity={toastState.toastSeverity}
                sx={{ position: "unset !important" }}
                slideDirection="left"
              >
                {toastState.toastBody}
              </Toast>
            </Box>
          </TopBar>
        )}
      {bottomBarUI}
      {alertUI}
      <LighthouseInfoBubble
        showBubble={portInfoState.toggled}
        position={portInfoState.position}
        resourceType={portInfoState.resourceType}
        amountNeeded={portInfoState.amountNeeded}
      />
    </>
  );
  // #endregion
};

export default () => {
  const [loadScene, setLoadScene] = React.useState(undefined);
  const [resumeModalOpen, setResumeModalOpen] =
    React.useState<boolean>(undefined);

  const [ignoreCache, setIgnoreCache] = React.useState<boolean>(undefined);
  const [loadedState, setLoadedState] =
    React.useState<IStateJSONData>(undefined);

  // No Cache Scene
  const [scene, setScene] = React.useState<Scene>(null);

  // Resume Screen
  const [bgLoaded, setBgLoaded] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem("CatanGameState")) {
      setResumeModalOpen(true);
    } else {
      setLoadScene(true);
    }
  }, [bgLoaded]);

  React.useEffect(() => {
    if (resumeModalOpen === undefined) return;

    if (!resumeModalOpen) {
      if (ignoreCache || loadedState) {
        setLoadScene(true);
      }
    }
  }, [resumeModalOpen]);

  React.useEffect(() => {
    if (ignoreCache === undefined) return;

    if (!ignoreCache) {
      setLoadedState(
        JSON.parse(localStorage.getItem("CatanGameState")) as IStateJSONData
      );
    } else {
      setResumeModalOpen(false);
    }
  }, [ignoreCache]);

  React.useEffect(() => {
    if (loadedState) {
      setResumeModalOpen(false);
    }
  }, [loadedState]);

  React.useEffect(() => {
    if (loadScene === undefined || loadScene === false || scene) return;

    const _scene = new Scene();

    // Load the cubemap textures (assuming the path to your textures is 'textures/cubemap/')
    const loader = new CubeTextureLoader();
    const texture = loader.load([
      cloudFwd,
      cloudBack,
      cloudUp,
      cloudDown,
      cloudRight,
      cloudLeft,
    ]);

    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    // Set the scene background to the cubemap texture
    _scene.background = texture;

    const geometry = new BoxGeometry(0.1, 0.1, 0.1, 1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);

    // Add the cube to the scene
    _scene.add(cube);

    setScene(_scene);
  }, [loadScene]);

  const [shouldRenderBG, setShouldRenderBG] = React.useState(true);

  return (
    <div className="App">
      <StarryNightBG
        onLoad={() => setBgLoaded(true)}
        unLoad={!shouldRenderBG}
      />
      {bgLoaded && (
        <>
          {resumeModalOpen !== undefined && resumeModalOpen === true && (
            <RoutesView
              containerBlur={true}
              title="Catan"
              defaultDescription="Adventure awaits."
              loading={false}
              routes={[
                {
                  description: "Resume your adventure.",
                  label: "Resume",
                  onClick: () => {
                    setIgnoreCache(false);
                  },
                },
                {
                  description: "Start a new journey.",
                  label: "New Game",
                  onClick: () => {
                    setIgnoreCache(true);
                  },
                },
              ]}
            />
          )}
          {/* <Modal
            overlayEffect={false}
            open={resumeModalOpen === undefined ? false : resumeModalOpen}
            title="Resume Game?"
            actions={[
              <Button
                onClick={() => {
                  setIgnoreCache(true);
                }}
              >
                No
              </Button>,
              <Button
                onClick={() => {
                  setIgnoreCache(false);
                }}
              >
                Yes
              </Button>,
            ]}
          >
            <Box>Previous game data detected...</Box>
            <Box>Resume?</Box>
          </Modal> */}
          {scene && (
            <SceneContainer
              sceneName="Catan"
              view={CatanBase as SceneJSONData}
              scene={scene}
              nestChildrenWithinCanvas
              ignoreCache={ignoreCache}
              fps
              revealOnLoad={false}
              onBeginLoad={(isLoading) => {
                if (isLoading) setShouldRenderBG(!isLoading);
              }}
            >
              <Catan localSaveState={loadedState} />
            </SceneContainer>
          )}
        </>
      )}
    </div>
  );
};
