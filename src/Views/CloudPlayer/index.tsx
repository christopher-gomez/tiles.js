/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import {
  BoxBufferGeometry,
  Camera,
  Geometry,
  Mesh,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import StarryNightBG from "../../Components/UI/StarryNightBG";
import RoutesView from "../../Components/UI/RoutesView";
import LoadSpinner from "../../Components/UI/LoadSpinner";
import AnimationManager from "../../lib/utils/AnimationManager";
import {
  SpotifyAudioAnalysisResponse,
  findCurrentPropertyFromTime,
} from "../../Spotify";
import SpotifyPlayer, {
  ISpotifyPlayer,
  ISpotifyState,
  PLAYER_CONTROLS_ZINDEX as PLAYER_CONTROLS_ZINDEX,
} from "../../Spotify/PlayerComponent";
import MeshText from "../../lib/env/MeshText";
import Dropdown from "../../Components/UI/Dropdown";
import Cards from "./Cards";
import Shader from "./Shader";
import "./index.css";
import VideoCrossfader from "./VideoCrossfader";
import Capsules from "./Capsules";
import TextCarousel from "../../Components/UI/TextCarousel";
import ThreeCanvas from "../../Components/UI/ThreeCanvas";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import { DotScreenShader } from "three/examples/jsm/shaders/DotScreenShader";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

export default () => {
  const [authenticateOpen, setAuthenticateOpen] =
    React.useState<boolean>(undefined);

  const [authCode, setAuthCode] = React.useState(null);
  const authCodeRef = useRef(authCode);

  const [bgLoaded, setBgLoaded] = React.useState(false);

  const handleRefreshToken = async () => {
    try {
      const response = await fetch(
        "https://spotilize.uc.r.appspot.com/spotify/access_token/refresh",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: localStorage.getItem("refresh_token"),
            app: "CloudPlayer",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // setToken(data.access_token); // Assume the token is returned in the access_token property
        return data.access_token;
      } else {
        localStorage.removeItem("refresh_token");
        setAuthenticateOpen(true);
        throw new Error("Could not refresh");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAuthorize = async () => {
    try {
      const response = await fetch(
        "https://spotilize.uc.r.appspot.com/spotify/authorize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: authCodeRef.current,
            app: "CloudPlayer",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.statusText}`);
      }

      const data = await response.json();
      setAuthenticateOpen(false);

      localStorage.setItem("refresh_token", data.refresh_token);

      // setToken(data.access_token); // Assume the token is returned in the access_token property
      return data.access_token;
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const [tokenFunc, setTokenFunc] = useState<() => Promise<string>>(null);

  React.useEffect(() => {
    const handleAuthMessage = (event) => {
      if (
        event.origin === window.location.origin &&
        event.data.type === "auth_code"
      ) {
        setAuthCode(event.data.code);
      }
    };

    // const onKeyDown = (e) => {
    //   if (e.key === "Escape" && playerStateRef.current?.firstPlay) {
    //     setShouldRenderMenus(!shouldRenderMenusRef.current);
    //   }
    // };

    window.addEventListener("message", handleAuthMessage);
    // window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("message", handleAuthMessage);
      // window.removeEventListener("keydown", onKeyDown);

      popupRef.current?.close();
      popupRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (authCode !== null) {
      authCodeRef.current = authCode;
      setAuthenticateOpen(false);
      // handleAuthorize();
      setTokenFunc(() => handleAuthorize);
    }
  }, [authCode]);

  React.useEffect(() => {
    if (localStorage.getItem("refresh_token")) {
      setAuthenticateOpen(false);
      // handleRefreshToken();
      setTokenFunc(() => handleRefreshToken);
    } else {
      console.log("authenticating");
      setAuthenticateOpen(true);
    }
  }, [bgLoaded]);

  const popupRef = React.useRef<Window>(null);

  const handleLogin = () => {
    if (popupRef.current) return;

    const clientId = "67632b17d7c243c5a1f28d736537addd";
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/spotifyAuthSuccess`
    );

    const scopes = encodeURIComponent(
      "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state " +
        "playlist-read-private playlist-read-collaborative user-library-read " +
        "user-read-playback-position user-read-recently-played user-top-read"
    );
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;

    const popup = window.open(authUrl, "Spotify Login", "width=600,height=800");
    popupRef.current = popup;
  };

  // const [token, setToken] = useState(null);
  // const tokenRef = React.useRef(token);

  // useEffect(() => {
  //   tokenRef.current = token;

  //   // if (token) fetchUserLibrary();
  // }, [token]);

  // const [userLib, setUserLib] = useState<{
  //   items: Array<{ added_at: string; track: any }>;
  //   offset: number;
  // }>(null);

  // const [userPlaylists, setUserPlaylists] = useState<{
  //   items: {
  //     id: string;
  //     name: string;
  //     uri: string;
  //     tracks: {
  //       href: string;
  //       total: number;
  //     };
  //   }[];
  //   limit: number;
  //   next?: string;
  //   offset: number;
  //   previous?: string;
  //   total: number;
  // }>(null);

  // const fetchUserLibrary = async () => {
  //   const data = await getUserLibrary(token);

  //   setUserLib({ offset: data.offset, items: data.items });

  //   const playlists = await getUserPlaylists(token);
  //   setUserPlaylists(playlists);
  // };

  const [playerReady, setPlayerReady] = React.useState(false);

  useEffect(() => {
    console.log("player ready", playerReady);
  }, [playerReady]);
  const [playerState, setPlayerState] = React.useState<ISpotifyState>(null);
  // const [currentTrackInfo, setCurrentTrackInfo] = React.useState(null);
  // const [currentTrackAnalysis, setCurrentTrackAnalysis] = React.useState(null);
  const playerStateRef = React.useRef(playerState);
  const [player, setPlayer] = useState<ISpotifyPlayer>(null);
  const playerRef = useRef<ISpotifyPlayer>(null);
  useEffect(() => {
    if (player) playerRef.current = player;
  }, [player]);

  // const fetchTrackInfo = async () => {
  //   if (
  //     tokenRef.current &&
  //     playerStateRef.current?.track?.uri !== currentTrackInfo?.uri
  //   ) {
  //     try {
  //       const info = await getTrackInfo(
  //         playerStateRef.current.track.uri,
  //         tokenRef.current
  //       );
  //       setCurrentTrackInfo(info);

  //       const analysis = await getTrackAudioAnalysis(
  //         playerStateRef.current.track.uri,
  //         tokenRef.current
  //       );

  //       setCurrentTrackAnalysis(analysis);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   }
  // };

  const [hasChangedTokenFuncs, setHasChangedTokenFuncs] = useState(false);

  useEffect(() => {
    playerStateRef.current = playerState;
    // fetchTrackInfo();
  }, [playerState]);

  useEffect(() => {
    if (playerReady && !hasChangedTokenFuncs) {
      setHasChangedTokenFuncs(true);
      setTokenFunc(() => handleRefreshToken);
    }
  }, [playerReady]);

  const [shouldRenderControls, setShouldRenderControls] = React.useState(true);
  const [shouldRenderMenus, setShouldRenderMenus] = React.useState(false);
  const shouldRenderMenusRef = React.useRef(shouldRenderMenus);

  useEffect(() => {
    shouldRenderMenusRef.current = shouldRenderMenus;
    setShouldRenderControls(!shouldRenderMenus);
  }, [shouldRenderMenus]);

  const [animManager, setAnimManager] = React.useState<AnimationManager>(null);

  useEffect(() => {
    if (animManager) {
      setBgLoaded(true);
    }
  }, [animManager]);

  // const [curMenu, setCurMenu] = React.useState(0);

  // type menuType = {
  //   title?: string;
  //   content?: JSX.Element;
  //   body?: string;
  //   image?: string;
  //   actions?: Array<JSX.Element>;
  //   overrideAlign?: boolean;
  //   constrainWidth?: boolean;
  // };

  // const menus: Array<menuType> = [];
  // const _menus: Array<menuType> = [
  //   // menu 1 (main)
  //   {
  //     overrideAlign: true,
  //     content: (
  //       <div
  //         style={{ display: "flex", flexFlow: "column", alignItems: "center" }}
  //       >
  //         <button
  //           onClick={() => setShouldRenderMenus(false)}
  //           style={{
  //             position: "absolute",
  //             top: "1em",
  //             left: "1em",
  //             background: "transparent",
  //             borderRadius: "50%",
  //             border: "none",
  //             padding: 0,
  //           }}
  //         >
  //           <CloseIcon />
  //         </button>
  //         <br />
  //         <RouteMenuButton
  //           style={{ minWidth: 200, maxWidth: 200 }}
  //           onClick={() => {
  //             if (playerState.track) setCurMenu(0);
  //           }}
  //         >
  //           Now Playing
  //         </RouteMenuButton>
  //         <RouteMenuButton
  //           style={{ minWidth: 200, maxWidth: 200 }}
  //           onClick={() => {
  //             setCurMenu(2);
  //           }}
  //         >
  //           Now Playing Analysis
  //         </RouteMenuButton>
  //         <RouteMenuButton
  //           style={{ minWidth: 200, maxWidth: 200 }}
  //           onClick={() => {
  //             setCurMenu(3);
  //           }}
  //         >
  //           Liked Songs
  //         </RouteMenuButton>
  //         <RouteMenuButton
  //           style={{ minWidth: 200, maxWidth: 200 }}
  //           onClick={() => {
  //             setCurMenu(4);
  //           }}
  //         >
  //           Playlists
  //         </RouteMenuButton>
  //       </div>
  //     ),
  //   },
  // ];

  // // menu 0
  // if (playerState?.track) {
  //   menus.push({
  //     title: playerState.track.trackTitle,
  //     overrideAlign: true,
  //     body: playerState.track.trackTitle,
  //     image: currentTrackInfo?.album?.images[0]?.url ?? undefined,
  //     content: (
  //       <button
  //         onClick={() => setCurMenu(1)}
  //         style={{
  //           position: "absolute",
  //           top: "1em",
  //           left: "1em",
  //           background: "transparent",
  //           borderRadius: "50%",
  //           border: "none",
  //           color: "white",
  //         }}
  //       >
  //         <Back />
  //       </button>
  //     ),
  //   });

  //   if (currentTrackAnalysis) {
  //     // menu 2
  //     _menus.push({
  //       title: "Analysis",
  //       overrideAlign: true,
  //       constrainWidth: false,
  //       body: playerState.track.trackTitle,
  //       content: (
  //         <>
  //           <button
  //             onClick={() => setCurMenu(1)}
  //             style={{
  //               position: "absolute",
  //               top: "1em",
  //               left: "1em",
  //               background: "transparent",
  //               borderRadius: "50%",
  //               border: "none",
  //               color: "black",
  //             }}
  //           >
  //             <Back />
  //           </button>
  //           <div>
  //             <pre id="json-output">
  //               {JSON.stringify(currentTrackAnalysis, null, 2)}
  //             </pre>
  //           </div>
  //         </>
  //       ),
  //     });
  //   }
  // }

  // if (userLib) {
  //   // menu 3
  //   _menus.push({
  //     title: "Liked Songs",
  //     overrideAlign: true,
  //     content: (
  //       <>
  //         <button
  //           onClick={() => setCurMenu(1)}
  //           style={{
  //             position: "absolute",
  //             top: "1em",
  //             left: "1em",
  //             background: "transparent",
  //             borderRadius: "50%",
  //             border: "none",
  //           }}
  //         >
  //           <Back />
  //         </button>
  //         <div
  //           style={{
  //             display: "flex",
  //             flexFlow: "column",
  //             alignItems: "center",
  //           }}
  //         >
  //           {userLib?.items?.map((item, i) => (
  //             <RouteMenuButton
  //               style={{ minWidth: 200, maxWidth: 200 }}
  //               onClick={() => {
  //                 if (item.track) playTrack(item.track.uri, token);
  //               }}
  //               key={"liked-track-" + i}
  //             >
  //               {item.track?.name}
  //             </RouteMenuButton>
  //           ))}
  //         </div>
  //       </>
  //     ),
  //   });
  // }

  // if (userPlaylists) {
  //   // menu 4
  //   _menus.push({
  //     title: "Playlists",
  //     overrideAlign: true,
  //     constrainWidth: true,
  //     content: (
  //       <>
  //         <button
  //           onClick={() => setCurMenu(1)}
  //           style={{
  //             position: "absolute",
  //             top: "1em",
  //             left: "1em",
  //             background: "transparent",
  //             borderRadius: "50%",
  //             border: "none",
  //           }}
  //         >
  //           <Back />
  //         </button>
  //         <div
  //           style={{
  //             display: "flex",
  //             flexFlow: "column",
  //             alignItems: "center",
  //           }}
  //         >
  //           {userPlaylists?.items?.map((item, i) => (
  //             <RouteMenuButton
  //               style={{ minWidth: 200, maxWidth: 200 }}
  //               onClick={() => {
  //                 if (item.name) playPlaylist(item.uri, token);
  //               }}
  //               key={"user-playlist-" + i}
  //             >
  //               <>
  //                 {item.name}
  //                 <br />
  //                 Total Songs: {item.tracks.total}
  //               </>
  //             </RouteMenuButton>
  //           ))}
  //         </div>
  //       </>
  //     ),
  //   });
  // }

  // menus.push(..._menus);

  const [beatLights, setBeatLights] = useState<
    Array<{
      obj: Mesh<Geometry, MeshPhongMaterial>;
      title: string;
      onAnimate: (dt: number, camera: Camera, isMoving: boolean) => void;
    }>
  >([]);

  // useEffect(() => {
  //   if (beatLights && beatLights.length > 0) {
  //     setBgLoaded(true);
  //   }
  // }, [beatLights]);

  const analysisFeatureLight = useRef(
    new Map<
      "bars" | "beats" | "sections" | "segments" | "tatums",
      Mesh<Geometry, MeshPhongMaterial>
    >()
  );

  const analysisFeatures: Array<
    "bars" | "beats" | "sections" | "segments" | "tatums"
  > = ["tatums", "beats", "segments", "bars", "sections"];

  const createLight = (scene?: Scene, recreate = false) => {
    console.log("Create light");
    const lights: Array<{
      obj: Mesh<Geometry, MeshPhongMaterial>;
      title: string;
      onAnimate: (dt: number, camera: Camera, isMoving: boolean) => void;
    }> = [];

    analysisFeatures.forEach((prop, i) => {
      if (analysisFeatureLight.current.has(prop) && recreate === false) return;

      const light = new Mesh(
        new SphereGeometry(5, 64, 64),
        new MeshPhongMaterial({
          color: "white",
          emissive: "red",
          emissiveIntensity: 0,
        })
      );
      light.rotation.x = Math.PI / 2;
      light.position.setY(5);
      light.name = prop + " Light";

      if (scene) {
        scene.add(light);
        light.position.setX(-20 + i * 10);
      }

      analysisFeatureLight.current.set(prop, light);

      MeshText.CreateText(
        prop,
        (t) => {
          analysisFeatureLight.current.get(prop).add(t.group);
          t.group.rotation.x = -Math.PI / 2;
          t.group.rotation.y = -Math.PI;
          // t.textMesh1.rotation.x = -Math.PI / 2;
          // t.group.rotation.x = 360 * Engine.DEG_TO_RAD;
          // t.group.rotation.y = 90 * Engine.DEG_TO_RAD;
          // // t.group.rotation.y = Math.PI / 2;
          // t.group.rotation.z = 270 * Engine.DEG_TO_RAD;
          // t.group.scale.setX(-1);
          t.group.position.setY(0);
          t.group.position.setZ(-10);
          t.group.scale.set(-0.060625, 0.060625, 0.060625);
        },
        { size: 20, height: 10, mirror: false }
      );

      lights.push({ obj: light, title: prop, onAnimate: onBeatUpdate });
    });

    setBeatLights(lights);

    if (!scene) setBgLoaded(true);
  };

  const [currentAnalysis, setCurrentAnalysis] =
    useState<SpotifyAudioAnalysisResponse>(null);
  const currentAnalysisRef = useRef<SpotifyAudioAnalysisResponse>(null);

  useEffect(() => {
    if (currentAnalysis) currentAnalysisRef.current = currentAnalysis;
  }, [currentAnalysis]);
  const animatedFeatures = useRef(
    new Map<"bars" | "beats" | "sections" | "segments" | "tatums", number[]>()
  );

  let curFrame = useRef(0);

  const bgLoadedRef = useRef(bgLoaded);
  useEffect(() => {
    bgLoadedRef.current = bgLoaded;
  }, [bgLoaded]);

  const onBeatUpdate = async (
    dt: number,
    camera: Camera,
    isMoving: boolean,
    onPropUpdate?: (
      prop: string,
      state: {
        current: {
          start: number;
          duration: number;
          confidence: number;
        };
        index: number;
        arr: any;
      }
    ) => void
  ) => {
    if (!bgLoadedRef.current) return;

    if (analysisFeatureLight.current && isMoving) {
      analysisFeatureLight.current.forEach((v) => {
        v.position.setZ(camera.position.z - 50);
      });
    } else if (analysisFeatureLight.current && isMoving === false) {
      // beatLight.current.forEach((v) => {
      //   v.position.setZ(-10);
      // });
    }

    if (
      playerRef.current &&
      playerStateRef.current &&
      playerStateRef.current.isPaused === false &&
      playerStateRef.current.track &&
      currentAnalysisRef.current &&
      currentAnalysisRef.current.track.uri === playerStateRef.current.track?.uri
    ) {
      const currentFrame = curFrame.current;
      const state = await playerRef.current.getCurrentState();
      const currentTimeS = state.position / 1000;

      if (curFrame.current < currentFrame) return;
      else curFrame.current++;

      analysisFeatures.forEach((prop) => {
        const { current, index, arr } = findCurrentPropertyFromTime(
          currentAnalysisRef.current,
          prop,
          currentTimeS
        );

        if (current) {
          if (!animatedFeatures.current.has(prop)) {
            animatedFeatures.current.set(prop, []);
          }

          if (!animatedFeatures.current.get(prop).includes(index)) {
            animatedFeatures.current.get(prop).push(index);
            if (onPropUpdate) onPropUpdate(prop, { current, index, arr });

            // console.log("Current Beat:", JSON.stringify(current, null, 2));

            if (analysisFeatureLight.current.has(prop)) {
              if (prop === "beats" || prop === "tatums") {
                const target =
                  analysisFeatureLight.current.get(prop).material
                    .emissiveIntensity > 0
                    ? 0
                    : 2;

                // console.log(beatLight.current.get(prop));
                analysisFeatureLight.current.get(
                  prop
                ).material.emissiveIntensity = target;
                // animManager.addAnimation(
                //   new Animation(
                //     currentBeat.duration * 1000,
                //     (t) => {
                //       // if (t < 0.5) {
                //       //   // Fade in during the first half of the beat duration
                //       //   const lerpFactor = Tools.lerp(0, 1, t * 2); // t * 2 to make the lerp go from 0 to 1 in half the time
                //       //   // lightRef.current.color.lerp(new Color(0xffffff), lerpFactor);
                //       //   beatLight.current.material.emissiveIntensity =
                //       //     Tools.lerp(
                //       //       beatLight.current.material.emissiveIntensity,
                //       //       target,
                //       //       lerpFactor
                //       //     );
                //       // } else if (t < 1) {
                //       //   // Fade out during the second half of the beat duration
                //       //   const lerpFactor = Tools.lerp(1, 0, (t - 0.5) * 2); // (t - 0.5) * 2 to make the lerp go from 1 to 0 in half the time
                //       //   beatLight.current.material.emissiveIntensity =
                //       //     Tools.lerp(
                //       //       beatLight.current.material.emissiveIntensity,
                //       //       0,
                //       //       lerpFactor
                //       //     );
                //       // }

                //       beatLight.current.material.emissiveIntensity =
                //         Tools.lerp(
                //           beatLight.current.material.emissiveIntensity,
                //           target,
                //           t
                //         );
                //     },
                //     () =>
                //       console.log(
                //         "lerp start for",
                //         currentAnalysis.current.beats.indexOf(currentBeat)
                //       ),
                //     () =>
                //       console.log(
                //         "lerp end for",
                //         currentAnalysis.current.beats.indexOf(currentBeat)
                //       ),
                //     () =>
                //       console.log(
                //         "lerp cancelled for",
                //         currentAnalysis.current.beats.indexOf(currentBeat)
                //       ),
                //     Animation.easeLinear
                //   ),
                //   "lightBeat",
                //   true
                // );
              }

              if (
                prop === "bars" ||
                prop === "sections" ||
                prop === "segments"
              ) {
                const generateRandomColor = () => {
                  const randomInt = (min, max) =>
                    Math.floor(Math.random() * (max - min + 1) + min);

                  const r = randomInt(0, 255);
                  const g = randomInt(0, 255);
                  const b = randomInt(0, 255);

                  return (r << 16) + (g << 8) + b;
                };
                const target = generateRandomColor();
                analysisFeatureLight.current.get(
                  prop
                ).material.emissiveIntensity = 2;
                analysisFeatureLight.current
                  .get(prop)
                  .material.emissive.setHex(target);
              }
            }
          }
        }
      });
    } else {
      analysisFeatureLight.current.forEach((v) => {
        v.material.emissiveIntensity = 0;
      });
    }
  };

  const [visualizer, setVisualizer] = useState<
    "card" | "cloud" | "shader" | "video" | "capsules"
  >("card");
  const envTypeChangedTORef = useRef(null);
  const [canLoadView, setCanLoadView] = useState(false);

  useEffect(() => {
    clearTimeout(envTypeChangedTORef.current);

    setBgLoaded(false);
    setCanLoadView(false);

    envTypeChangedTORef.current = window.setTimeout(() => {
      if (visualizer === "card") {
        createLight(undefined, true);
      } else {
        setCanLoadView(true);
        setBeatLights(undefined);
      }

      if (visualizer === "video" || visualizer === "capsules")
        setBgLoaded(true);
    }, 1000);

    return () => {
      window.clearTimeout(envTypeChangedTORef.current);
    };
  }, [visualizer]);

  const envTypes: Array<"card" | "cloud" | "shader" | "video" | "capsules"> = [
    "card",
    "cloud",
    "shader",
    "video",
    "capsules",
  ];

  const _envToggles: Array<{ label: string; onClick: () => void }> =
    envTypes.map((env) => ({
      label: env.toUpperCase(),
      onClick: () => setVisualizer(env),
    }));

  const envToggles = _envToggles.filter(
    (t) => t.label !== visualizer.toUpperCase()
  );

  const composerRef = useRef<EffectComposer>(null);

  const [displayPlayerControls, setDisplayPlayerControls] = useState(true);

  return (
    <div className="App" style={{ zIndex: PLAYER_CONTROLS_ZINDEX + 1 }}>
      {visualizer === "card" &&
        bgLoaded &&
        beatLights &&
        beatLights.length === analysisFeatures.length && (
          <Cards objs={beatLights} />
        )}
      {visualizer === "cloud" && canLoadView && (
        <>
          <Capsules trackAnalysis={currentAnalysis} player={player} />
          <StarryNightBG
            onLoad={(_scene, _camera, _renderer, animationManager) => {
              setAnimManager(animationManager);
              createLight((_scene as Scene[])[1], true);
            }}
            onUpdate={async (dt, scene, camera) => {
              onBeatUpdate(dt, camera, true);
            }}
            fps={true}
            cameraMoves={playerReady && !shouldRenderMenus}
          />
        </>
      )}
      {visualizer === "shader" && canLoadView && (
        <Shader
          onLoad={() => setBgLoaded(true)}
          currentAnalysis={currentAnalysis}
          player={player}
        />
      )}
      {visualizer === "video" && canLoadView && <VideoCrossfader videos={[]} />}
      {visualizer === "capsules" && canLoadView && (
        <Capsules
          trackAnalysis={currentAnalysis}
          player={player}
          togglePlayerControls={(toggled?: boolean) => {
            if (toggled !== undefined) setDisplayPlayerControls(toggled);
            else setDisplayPlayerControls(!displayPlayerControls);
          }}
        />
      )}
      <>
        <div
          id="cloud-player-top-sticky-buttons"
          style={{
            zIndex: PLAYER_CONTROLS_ZINDEX + 2,
            position: "fixed",
            top: 20,
            left: 10,
            right: 20,
            display: "flex",
            justifyContent: "flex-end",
            pointerEvents: bgLoaded ? "all" : "none",
            opacity: bgLoaded ? 1 : 0,
          }}
        >
          <Dropdown
            toggleText={visualizer.toUpperCase()}
            options={envToggles}
          />
          {/* <TextCarousel texts={envToggles.map(e => e.label)}/> */}
        </div>
        {/* <button
            className="icon-button"
            onClick={() => {
              if (envType === "card") setEnvType("cloud");
              else setEnvType("card");
            }}
          >
            <CloudSyncIcon />
          </button> */}
        {authenticateOpen !== undefined && authenticateOpen === true && (
          <RoutesView
            overlayBlur={true}
            overlayBackground={true}
            containerBackground={true}
            containerBlur={true}
            title="Cloud Player"
            defaultDescription={
              authCode === null
                ? "Login With Spotify to Continue."
                : "Login Success!"
            }
            loading={false}
            routes={
              authCode === null
                ? [
                    {
                      description: "Login With Spotify",
                      label: "Authenticate",
                      onClick: () => {
                        handleLogin();
                      },
                    },
                  ]
                : undefined
            }
          />
        )}
        {authenticateOpen === false && tokenFunc !== null && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              pointerEvents: bgLoaded ? "all" : "none",
              opacity: bgLoaded && playerReady ? 1 : 0,
            }}
          >
            <SpotifyPlayer
              displayControls={displayPlayerControls}
              onPlayer={(p) => {
                if (p !== undefined) {
                  setPlayer(p);
                  console.log("on player");
                }
              }}
              tokenFetch={tokenFunc}
              onPlayerReady={(ready) => {
                console.log("On Player Ready");
                setPlayerReady(ready);
              }}
              onPlayerStateChange={(state) => setPlayerState(state)}
              shouldRenderControls={shouldRenderControls}
              onCurrentTrackAnalyzed={(data) => {
                console.log("on Current Track Analyzed");
                setCurrentAnalysis(data);
                console.log(data);
              }}
            />
          </div>
        )}
        {playerReady && (
          <div
            className="cloud-player container"
            style={{
              zIndex: 1,
              pointerEvents: bgLoaded ? "all" : "none",
              opacity: bgLoaded ? 1 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                position: "absolute",
                top: "2em",
                flexFlow: "column",
              }}
            >
              <div className="track-info-text">
                <div
                  style={{
                    opacity: !shouldRenderMenus && playerState?.track ? 1 : 0,
                    transition: "opacity 2s",
                    color: "white",
                    pointerEvents: shouldRenderMenus ? "none" : "all",
                  }}
                >
                  <small
                    style={{
                      fontWeight: "bolder",
                      marginLeft: "-1em",
                      textDecoration: "underline solid white 1px",
                      textShadow: "none",
                      color: "white",
                    }}
                  >
                    {playerState?.isPaused ? "Paused" : "Now Playing"}
                  </small>
                  <h1
                    style={{
                      marginTop: 0,
                      marginBottom: 0,
                      color: "white",
                    }}
                  >
                    {playerState?.track?.trackTitle}
                  </h1>
                  <h2 style={{ marginTop: 0, color: "white" }}>
                    {playerState?.track?.trackArtist}
                  </h2>
                </div>
              </div>
            </div>

            {/* {shouldRenderMenus && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(0,0,0,.25)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {playerState?.track && (
                    <HoverCardMenu menus={menus} curMenu={curMenu} />
                    // <HoverCard
                    //   canRotate={false}
                    //   open
                    //   mediaWindowStyle="cover"
                    //   orient="horizontal"
                    //   title={playerState.track.trackTitle}
                    //   body={playerState.track.trackArtist}
                    //   image={
                    //     currentTrackInfo?.album?.images[0]?.url ?? undefined
                    //   }
                    //   animationManager={animManager}
                    // />
                  )}
                </div>
              )} */}
          </div>
        )}
      </>
      <LoadSpinner
        loading={
          authenticateOpen === false &&
          (playerReady === false || bgLoaded === false)
        }
        hasBackground={true}
      />
    </div>
  );
};
