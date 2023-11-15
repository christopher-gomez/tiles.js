/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
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
  Geometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshPhongMaterial,
  NearestFilter,
  PointLight,
  RepeatWrapping,
  Scene,
  ShapeBufferGeometry,
  ShapeGeometry,
  SphereGeometry,
  Sprite,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";

import { RouteMenuButton } from "../Components/UI/RoutesView";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import HoverCard from "../Components/UI/HoverCard";
import {
  SpotifyAudioAnalysisResponse,
  SpotifySearchResponse,
  SpotifyTrackResponse,
  SpotifyUserLibraryResponse,
  SpotifyUserPlaylistsResponse,
  calculatePagination,
  getTrackAudioAnalysis,
  getTrackInfo,
  getUserLibrary,
  getUserPlaylists,
  playPlaylist,
  playTrack,
  searchSpotify,
} from "./";
import Draggable from "react-draggable";
import {
  Accordion,
  Typography,
  AccordionDetails,
  AccordionActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import "./PlayerComponent.css";
import SearchResultsList from "./SearchResultsList";
import AnimationManager from "../lib/utils/AnimationManager";

export const PLAYER_CONTROLS_ZINDEX = 999999;
function formatMS(milliseconds) {
  // Convert milliseconds to total seconds
  const totalSeconds = Math.floor(milliseconds / 1000);

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format the result as a string, adding a leading zero for single-digit minutes and seconds
  const formattedHours = hours > 0 ? `${hours}:` : "";
  const formattedMinutes = minutes < 10 ? `0${minutes}:` : `${minutes}:`;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return formattedHours + formattedMinutes + formattedSeconds;
}

export interface ISpotifyState {
  isPaused: boolean;
  firstPlay: boolean;
  track?: {
    trackTitle: string;
    trackArtist: string;
    trackDuration: number;
    trackPosition: number;
    uri: string;
  };
}

export const CurrentTrackInfoComponent = ({
  trackURI,
  token,
  showArtist = true,
  showTitle = true,
  open = true,
}: {
  open?: boolean;
  trackURI: string;
  showArtist?: boolean;
  showTitle?: boolean;
  token?: string;
}) => {
  const [track, setCurrentTrack] = React.useState<SpotifyTrackResponse>(null);
  const trackRef = useRef(track);

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  const tokenRef = useRef(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const trackURIRef = useRef(trackURI);

  useEffect(() => {
    trackURIRef.current = trackURI;
  }, [trackURI]);

  const [fetching, setFetching] = useState(false);
  const fetchRef = useRef(fetching);
  useEffect(() => {
    fetchRef.current = fetching;
  }, [fetching]);

  const fetchTrackInfo = async () => {
    if (fetchRef.current) return;

    if (
      tokenRef.current &&
      trackURIRef.current &&
      (!trackRef.current || trackURIRef.current !== trackRef.current?.uri)
    ) {
      try {
        setFetching(true);
        const info = await getTrackInfo(trackURIRef.current, tokenRef.current);

        setCurrentTrack(info);
        setFetching(false);
      } catch (err) {
        console.error(err);
        setFetching(false);
      }
    }
  };

  useEffect(() => {
    fetchTrackInfo();
  }, [trackURI]);

  return (
    <>
      {track && (
        <HoverCard
          constrainWidth={false}
          canRotate={false}
          orient="horizontal"
          mediaWindowStyle="cover"
          title={showTitle ? track.name : undefined}
          image={track?.album?.images[0]?.url ?? undefined}
          body={showArtist ? track.artists[0]?.name ?? undefined : undefined}
          open={open}
        />
      )}
    </>
  );
};

interface WebPlaybackTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; uri: string }>;
  uri: string;
  type: string;
  media_type: string;
  is_playable: boolean;
  album: {
    uri: string;
    name: string;
    images: Array<{ url: string }>;
  };
}

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  uri: string;
  duration: number;
  position: number;
}

interface PlayerState {
  track_window: {
    current_track: WebPlaybackTrack;
    previous_tracks: Array<WebPlaybackTrack>;
    next_tracks: Array<WebPlaybackTrack>;
  };
  position: number; // Position in ms
  duration: number; // Duration in ms
  paused: boolean;
  volume: number; // 0.0 to 1.0
  shuffle: boolean;
  repeat_mode: number;
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  context: {
    uri: string;
    metadata: {
      current_item: SpotifyTrack;
    };
  };
  // ... other state info
}

export interface ISpotifyPlayer {
  // Methods
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  getCurrentState: () => Promise<PlayerState | null>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;

  // Events
  on: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback: (data: any) => void) => void;
  activateElement: () => void;
  togglePlay: () => void;

  onSeek: Array<() => void>;

  // Properties
  // ... add any properties here
}

export const SpotifyPlayer = ({
  tokenFetch,
  onPlayerReady,
  onPlayerError,
  onPlayerStateChange,
  shouldRenderControls = true,
  onUserLibraryFetch,
  onCurrentTrackAnalyzed,
  onCurrentTrackFetch,
  onUserPlaylistsFetch,
  onPlayer,
  displayControls = true,
  width = 250,
}: {
  width?: number;
  displayControls?: boolean;
  tokenFetch: () => Promise<string>;
  onPlayerReady?: (ready: boolean) => void;
  onPlayerError?: () => void;
  onPlayerStateChange?: (state: ISpotifyState) => void;
  shouldRenderControls?: boolean;
  onUserLibraryFetch?: (data: SpotifyUserLibraryResponse) => void;
  onCurrentTrackFetch?: (data: SpotifyTrackResponse) => void;
  onUserPlaylistsFetch?: (data: SpotifyUserPlaylistsResponse) => void;
  onCurrentTrackAnalyzed?: (data: SpotifyAudioAnalysisResponse) => void;
  onPlayer?: (player: ISpotifyPlayer) => void;
}) => {
  const [player, setPlayer] = useState<ISpotifyPlayer>(null);
  const playerRef = useRef(player);

  useEffect(() => {
    setFetchingAnalysis(false);
    setFetchingLib(false);
    if (player) {
      playerRef.current = player;
      if (onPlayer) onPlayer(player);
    } else {
      playerRef.current = null;
      if (onPlayerReady) onPlayerReady(false);
    }

    return () => {
      setFirstTrackPlayed(false);
      animMan.current?.clearOnAnimateListeners();
    };
  }, [player]);

  const tokenFuncRef = useRef(tokenFetch);
  useEffect(() => {
    tokenFuncRef.current = tokenFetch;
  }, [tokenFetch]);

  const [gettingPlayer, setGettingPlayer] = useState(false);
  const [playerID, setPlayerID] = useState(null);
  const [playerState, setPlayerState] = useState<ISpotifyState>({
    isPaused: true,
    firstPlay: false,
  });

  const playerStateRef = React.useRef(playerState);

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  const [firstTrackPlayed, setFirstTrackPlayed] = React.useState(false);
  const firstTrackPlayedRef = useRef(firstTrackPlayed);
  const shouldQueryState = React.useRef(true);
  const gettingCurrentState = React.useRef(false);
  const animMan = useRef<AnimationManager>(null);

  const queryState = () => {
    if (gettingCurrentState.current) {
      return;
    }

    if (playerRef.current) {
      gettingCurrentState.current = true;
      playerRef.current.getCurrentState().then((state) => {
        handleStateChange(
          state?.paused ?? true,
          state?.context?.metadata?.current_item?.name ?? undefined,
          state?.context?.metadata?.current_item?.artists[0]?.name ?? undefined,
          state?.context?.metadata?.current_item?.uri ?? undefined,
          state?.duration ?? 0,
          state?.position ?? 0
        );
        gettingCurrentState.current = false;
      });
    }
  };

  useEffect(() => {
    if (firstTrackPlayed) {
      if (!animMan.current) animMan.current = new AnimationManager();

      animMan.current.clearOnAnimateListeners();
      animMan.current.addOnAnimateListener(queryState);
    }

    firstTrackPlayedRef.current = firstTrackPlayed;

    return () => {
      if (firstTrackPlayed) {
        shouldQueryState.current = false;
      }
    };
  }, [firstTrackPlayed]);

  const [nowPlayingAnalysis, setNowPlayingAnalysis] =
    useState<SpotifyAudioAnalysisResponse>(null);
  const nowPlayingAnalysisRef = useRef(nowPlayingAnalysis);
  useEffect(() => {
    nowPlayingAnalysisRef.current = nowPlayingAnalysis;
  }, [nowPlayingAnalysis]);

  const prevTime = useRef(0);

  function checkForSeekEvent(state: ISpotifyState) {
    // Initial setup for last position
    if (
      !playerStateRef.current ||
      !playerStateRef.current.track ||
      !state.track
    ) {
      return;
    }

    prevTime.current = playerStateRef.current.track.trackPosition;

    // Check if the current position is not adjacent to the last known position
    // You can adjust the threshold as per your requirements
    const threshold = 2000; // 2 seconds in milliseconds
    if (Math.abs(prevTime.current - state.track.trackPosition) > threshold) {
      if (playerRef.current) {
        playerRef.current["onSeek"].forEach((f) => f());
      }
    }
  }

  const handleStateChange = (
    paused,
    trackTitle,
    trackArtist,
    trackURI,
    trackDuration,
    trackPosition,
    onComplete?: () => void
  ) => {
    let firstPlay = firstTrackPlayedRef.current;
    if (!paused && !firstTrackPlayedRef.current) {
      setFirstTrackPlayed(true);
      firstPlay = true;
    }

    const newState = {
      isPaused: paused,
      firstPlay: firstPlay,
      track:
        trackTitle === undefined
          ? undefined
          : {
              trackTitle,
              trackArtist,
              uri: trackURI,
              trackDuration,
              trackPosition,
            },
    };

    checkForSeekEvent(newState);

    setPlayerState(newState);
    if (onPlayerStateChange) onPlayerStateChange(newState);

    if (
      playerRef.current &&
      (!nowPlayingAnalysisRef.current ||
        nowPlayingAnalysisRef.current.track.uri !== trackURI)
    ) {
      fetchAnalysis(trackURI, onComplete);
    } else {
      if (onComplete) onComplete();
    }
  };

  const checkTimeoutRef = useRef(null);

  const [stateToken, setStateToken] = useState<string>(null);
  const tokenRef = useRef<string>(stateToken);

  useEffect(() => {
    setFetchingAnalysis(false);
    setFetchingLib(false);
    tokenRef.current = stateToken;
  }, [stateToken]);

  useEffect(() => {
    const checkForPlayer = () => {
      //@ts-ignore
      if (window.Spotify) {
        //@ts-ignore
        const spotifyPlayer = new window.Spotify.Player({
          name: "Cloud Player",
          getOAuthToken: async (cb) => {
            if (tokenFuncRef.current) {
              const token = await tokenFuncRef.current();
              setStateToken(token);
              cb(token);
            }
          },
        });

        // Error handling
        spotifyPlayer.addListener("initialization_error", ({ message }) => {
          console.error(message);
          if (onPlayerError) onPlayerError();
        });
        spotifyPlayer.addListener("authentication_error", ({ message }) => {
          console.error(message);
          if (onPlayerError) onPlayerError();
        });

        // Playback status updates
        spotifyPlayer.addListener("player_state_changed", (state) => {
          handleStateChange(
            state?.paused ?? true,
            state?.context?.metadata?.current_item?.name ?? undefined,
            state?.context?.metadata?.current_item?.artists[0]?.name ??
              undefined,
            state?.context?.metadata?.current_item?.uri ?? undefined,
            state?.duration ?? 0,
            state?.position ?? 0
          );
        });

        // Ready
        spotifyPlayer.addListener("ready", ({ device_id }) => {
          console.log("Ready with Device ID", device_id);
          setPlayerID(device_id);

          //@ts-ignore
          window.spotifyPlayer = spotifyPlayer;

          if (onPlayerReady) onPlayerReady(true);

          fetchUserLibrary();
        });

        spotifyPlayer["onSeek"] = [];
        spotifyPlayer.connect();

        setPlayer(spotifyPlayer);
      } else {
        checkTimeoutRef.current = window.setTimeout(() => {
          checkForPlayer();
        }, 1000);
      }
    };

    if (tokenFetch && !gettingPlayer) {
      tokenFuncRef.current = tokenFetch;
      setGettingPlayer(true);
      checkForPlayer();
    }

    return () => {
      window.clearTimeout(checkTimeoutRef.current);
    };
  }, [tokenFetch]);

  const [playbackTransferred, setPlaybackTransferred] = useState(false);
  const playbackTransferredRef = React.useRef(playbackTransferred);

  useEffect(() => {
    playbackTransferredRef.current = playbackTransferred;
  }, [playbackTransferred]);

  const [requestingTransfer, setRequestingTransfer] = useState(false);

  const transferPlayback = async (onComplete?: () => void) => {
    if (!tokenRef.current) return;

    setRequestingTransfer(true);

    const res = await fetch(
      "https://spotilize.uc.r.appspot.com/spotify/transfer/player",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: tokenRef.current,
          play: true,
          player_id: playerID,
          app: "CloudPlayer",
        }),
      }
    );

    if (res.ok) {
      if (onComplete) onComplete();
    }

    setRequestingTransfer(false);
  };

  const play = () => {
    if (!playbackTransferred) {
      player.activateElement();

      transferPlayback(() => {
        // player.setVolume(0);
        setPlaybackTransferred(true);
      });
    } else {
      player.togglePlay();
    }
  };

  const windowTimeOutRef = React.useRef(null);
  const disconnectPlayer = () => {
    if (playerRef.current) {
      console.log("disconnecting player");
      playerRef.current
        .disconnect()
        .then(() => console.log("disconnected player"));
    }
  };

  const inControls = React.useRef(false);

  const shouldSetOpac = React.useRef(true);

  const detailsOpenRef = React.useRef(false);

  React.useEffect(() => {
    const onDocMouseMove = () => {
      if (shouldSetOpac.current) {
        shouldSetOpac.current = false;
        clearTimeout(windowTimeOutRef.current);
        if (controlsRef.current) controlsRef.current.style.opacity = "1";
        windowTimeOutRef.current = window.setTimeout(() => {
          if (
            controlsRef.current &&
            !inControls.current &&
            playbackTransferredRef.current &&
            !playerStateRef.current.isPaused &&
            !detailsOpenRef.current
          ) {
            controlsRef.current.style.opacity = "0";
          }
          shouldSetOpac.current = true;
        }, 1000);
      }
    };

    window.addEventListener("mousemove", onDocMouseMove);

    //@ts-ignore
    if (window.spotifyPlayer) {
      //@ts-ignore
      window.spotifyPlayer.disconnect();
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      animMan.current?.clearOnAnimateListeners();
      window.removeEventListener("mousemove", onDocMouseMove);
      window.removeEventListener("resize", handleResize);
      setFetchingAnalysis(false);
      disconnectPlayer();
    };
  }, []);

  const controlsRef = React.useRef<HTMLDivElement>(null);

  const [detailsOpen, setDetailsOpen] = React.useState(false);

  useEffect(() => {
    detailsOpenRef.current = detailsOpen;
  }, [detailsOpen]);

  const [canDrag, setCanDrag] = React.useState(true);

  const [playerDetailViewNum, setPlayerDetailViewNum] = React.useState(0);

  const [userLib, setUserLib] = useState<SpotifyUserLibraryResponse>(null);

  const [userPlaylists, setUserPlaylists] =
    useState<SpotifyUserPlaylistsResponse>(null);

  const [fetchingLib, setFetchingLib] = React.useState(false);

  const fetchUserLibrary = async () => {
    if (fetchingLib || !tokenRef.current) return;

    setFetchingLib(true);

    fetchUserTracks(0, true);
    fetchUserPlaylists(0, true);

    setFetchingLib(false);
  };

  const [tracksPagination, setTracksPagination] = useState<{
    currentPage: number;
    totalPages: number;
  }>(null);

  const [playlistPagination, setPlaylistsPagination] = useState<{
    currentPage: number;
    totalPages: number;
  }>(null);

  const fetchUserTracks = async (offset = 0, skipFetchCheck = false) => {
    if ((skipFetchCheck === false && fetchingLib) || !tokenRef.current) return;

    setFetchingLib(true);

    const data = await getUserLibrary(tokenRef.current, offset);

    setUserLib(data);

    setTracksPagination(
      calculatePagination(data.offset, data.limit, data.total)
    );

    if (onUserLibraryFetch) onUserLibraryFetch(data);

    setFetchingLib(false);
  };

  const fetchUserPlaylists = async (offset = 0, skipFetchCheck = false) => {
    if ((skipFetchCheck === false && fetchingLib) || !tokenRef.current) return;

    setFetchingLib(true);

    const data = await getUserPlaylists(tokenRef.current, offset);

    setUserPlaylists(data);
    setPlaylistsPagination(
      calculatePagination(data.offset, data.limit, data.total)
    );

    if (onUserPlaylistsFetch) onUserPlaylistsFetch(data);

    setFetchingLib(false);
  };

  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);

  const fetchingAnalysisRef = useRef(fetchingAnalysis);

  useEffect(() => {
    fetchingAnalysisRef.current = fetchingAnalysis;
  }, [fetchingAnalysis]);

  const fetchAnalysis = async (uri, onComplete?: () => void) => {
    try {
      if (fetchingAnalysisRef.current || !tokenRef.current) {
        console.warn("Cannot fetch analysis, already fetching or no token");
        return;
      }

      fetchingAnalysisRef.current = true;
      setFetchingAnalysis(true);
      const data = await getTrackAudioAnalysis(uri, tokenRef.current);

      if (data !== null) {
        setNowPlayingAnalysis(data);
        if (onCurrentTrackAnalyzed) onCurrentTrackAnalyzed(data);
      }

      setFetchingAnalysis(false);
      fetchingAnalysisRef.current = false;

      if (onComplete) onComplete();

      console.log("Done Fetching Analysis");
    } catch (err) {
      console.error(err);
      setFetchingAnalysis(false);

      if (onComplete) onComplete();
    }
  };

  const [searchResults, setSearchResults] =
    React.useState<SpotifySearchResponse>(null);

  const search = async (query) => {
    const result = await searchSpotify(query, tokenRef.current);

    setSearchResults(result);
    setPlayerDetailViewNum(5);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef(null);

  const [defaultPosition, setDefaultPosition] = useState({ x: 0, y: 0 });

  // Add a resize event listener if you want to keep it centered when resizing the window
  const handleResize = () => {
    const elementWidth = controlsRef.current?.offsetWidth ?? width;
    const x = window.innerWidth / 2 - elementWidth / 2;
    setDefaultPosition({ x, y: 0 });
  };

  return (
    <>
      {player && (
        <div
          // style={{
          //   display: "flex",
          //   height: "100%",
          //   width: "100%",
          //   position: "absolute",
          //   justifyContent: "center",
          //   transition: "opacity 1s",
          //   pointerEvents: "all",
          //   zIndex: PLAYER_CONTROLS_ZINDEX,
          // }}
          className="controls"
        >
          {displayControls && (
            <Draggable
              disabled={!canDrag}
              scale={1}
              bounds="body"
              defaultPosition={defaultPosition}
            >
              <div
                ref={controlsRef}
                onMouseOver={() => (inControls.current = true)}
                onMouseLeave={() => (inControls.current = false)}
                onMouseEnter={() => (inControls.current = true)}
                onMouseOut={() => (inControls.current = false)}
                className={`inner-container ${
                  canDrag ? "draggable-cursor" : ""
                }`}
                style={{
                  transition: "opacity 1s",
                  zIndex: PLAYER_CONTROLS_ZINDEX,
                  position: "absolute",
                  bottom: "5em",
                  opacity:
                    (shouldRenderControls !== undefined &&
                      !shouldRenderControls) ||
                    !playerID ||
                    requestingTransfer ||
                    (!requestingTransfer &&
                      playbackTransferred &&
                      !firstTrackPlayed)
                      ? 0
                      : 1,
                  pointerEvents:
                    (shouldRenderControls !== undefined &&
                      !shouldRenderControls) ||
                    requestingTransfer
                      ? "none"
                      : "inherit",
                  minWidth: width,
                  maxWidth: width,
                }}
              >
                {playbackTransferred &&
                  firstTrackPlayed &&
                  playerState.track && (
                    <div
                      style={{
                        display: "flex",
                        flexFlow: "column",
                        width: "100%",
                        maxWidth: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Accordion
                        onChange={(e, ex) => {
                          if (!ex) setPlayerDetailViewNum(0);
                        }}
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          backgroundColor: "transparent !important",
                          margin: 0,
                          padding: 0,
                          marginBottom: 0,
                        }}
                        aria-controls="panel1a-content"
                        expanded={detailsOpen}
                      >
                        <AccordionActions
                          sx={{
                            backgroundColor: "transparent !important",
                            padding: "0 !important",
                            justifyContent: "space-between !important",
                          }}
                        >
                          <RouteMenuButton
                            noMove={true}
                            onClick={() => setCanDrag(!canDrag)}
                            style={{
                              padding: "2px 12px",
                              margin: "0 8px",
                              display: "flex",
                              color: "white",
                              marginBottom: "6px",
                            }}
                          >
                            <>
                              {canDrag === true && <LockOpenIcon />}
                              {canDrag === false && <LockIcon />}
                            </>
                          </RouteMenuButton>
                          <RouteMenuButton
                            noMove={true}
                            onClick={() => setDetailsOpen(!detailsOpen)}
                            style={{
                              padding: "2px 12px",
                              margin: "0 8px",
                              display: "flex",
                              color: "white",
                              marginBottom: "6px",
                            }}
                          >
                            <>
                              {detailsOpen === true && <ExpandMoreIcon />}
                              {detailsOpen === false && <ExpandLessIcon />}
                            </>
                          </RouteMenuButton>
                        </AccordionActions>
                        <AccordionDetails
                          sx={{
                            backgroundColor: "transparent !important",
                            paddingBottom: 0,
                            display: "flex",
                            flexFlow: "column",
                            justifyItems: "center",
                            alignItems: "center",
                          }}
                        >
                          <>
                            {playerDetailViewNum === 0 && (
                              <CurrentTrackInfoComponent
                                showArtist={false}
                                showTitle={false}
                                token={tokenRef.current}
                                trackURI={playerState.track.uri}
                              />
                            )}
                            {playerDetailViewNum === 1 &&
                              (userLib || userPlaylists) && (
                                <>
                                  <>
                                    <div style={{ position: "relative" }}>
                                      <input
                                        ref={inputRef}
                                        type="text"
                                        id="search"
                                        name="search"
                                        placeholder=" "
                                        autoComplete="off"
                                        onInput={(e) => {
                                          if (typingTimeoutRef.current) {
                                            clearTimeout(
                                              typingTimeoutRef.current
                                            );
                                          }
                                          typingTimeoutRef.current = setTimeout(
                                            () => {
                                              search(
                                                (e.target as HTMLInputElement)
                                                  .value
                                              );
                                            },
                                            1000
                                          );
                                        }}
                                      />
                                      <label htmlFor="search">Search</label>
                                    </div>
                                  </>
                                  {userLib && (
                                    <RouteMenuButton
                                      noMove={true}
                                      onClick={() => {
                                        setPlayerDetailViewNum(2);
                                      }}
                                      style={{
                                        color: "white",
                                        marginBottom: 0,
                                      }}
                                    >
                                      Liked Songs
                                    </RouteMenuButton>
                                  )}
                                  {userPlaylists && (
                                    <RouteMenuButton
                                      noMove={true}
                                      onClick={() => {
                                        setPlayerDetailViewNum(3);
                                      }}
                                      style={{
                                        color: "white",
                                        marginBottom: 0,
                                      }}
                                    >
                                      Playlists
                                    </RouteMenuButton>
                                  )}
                                  {nowPlayingAnalysis && (
                                    <RouteMenuButton
                                      noMove={true}
                                      onClick={() => {
                                        setPlayerDetailViewNum(4);
                                      }}
                                      style={{
                                        color: "white",
                                        marginBottom: 0,
                                      }}
                                    >
                                      Now Playing - Analysis
                                    </RouteMenuButton>
                                  )}
                                  <RouteMenuButton
                                    noMove={true}
                                    onClick={() => {
                                      setPlayerDetailViewNum(0);
                                    }}
                                    style={{ color: "white", marginBottom: 0 }}
                                  >
                                    Now Playing
                                  </RouteMenuButton>
                                </>
                              )}
                            {playerDetailViewNum === 2 && userLib && (
                              <div
                                style={{
                                  display: "flex",
                                  flexFlow: "column",
                                  maxHeight: 200,
                                  maxWidth: "100%",
                                  width: "100%",
                                  overflowY: "scroll",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                }}
                              >
                                <Typography color="white" variant="h5">
                                  Liked Songs
                                  {tracksPagination && (
                                    <span>
                                      <small>
                                        {tracksPagination.currentPage} /{" "}
                                        {tracksPagination.totalPages}
                                      </small>
                                    </span>
                                  )}
                                </Typography>
                                {userLib?.previous && !fetchingLib && (
                                  <RouteMenuButton
                                    noMove={true}
                                    onClick={() => {
                                      fetchUserTracks(
                                        userLib.offset - userLib.limit
                                      );
                                    }}
                                    key={"user-track-prev"}
                                    style={{
                                      color: "white",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      textOverflow: "ellipsis",
                                      maxHeight: 100,
                                      minHeight: 10,
                                      paddingTop: 15,
                                      maxWidth: "40%",
                                      minWidth: "40%",
                                      paddingBottom: 20,
                                      justifyContent: "center",
                                      marginTop: 5,
                                      marginBottom: 5,
                                    }}
                                  >
                                    Less...
                                  </RouteMenuButton>
                                )}
                                {!fetchingLib &&
                                  userLib.items?.map((i) => (
                                    <RouteMenuButton
                                      noMove={true}
                                      onClick={() => {
                                        if (i.track)
                                          playTrack(
                                            i.track.uri,
                                            tokenRef.current
                                          );
                                      }}
                                      key={"liked-track-" + i.track.uri}
                                      style={{
                                        color: "white",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        textAlign: "left",
                                        maxHeight: 100,
                                        minHeight: 10,
                                        paddingTop: 15,
                                        maxWidth: "70%",
                                        minWidth: "70%",
                                        paddingBottom: 20,
                                        marginLeft: 0,
                                        marginRight: 0,
                                        paddingLeft: 20,
                                        justifyContent: "flex-start",
                                        marginTop: 5,
                                        marginBottom: 5,
                                      }}
                                    >
                                      {i.track.name}
                                    </RouteMenuButton>
                                  ))}
                                {userLib?.next && !fetchingLib && (
                                  <RouteMenuButton
                                    noMove={true}
                                    onClick={() => {
                                      fetchUserTracks(
                                        userLib.offset + userLib.limit
                                      );
                                    }}
                                    key={"user-track-next"}
                                    style={{
                                      color: "white",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      textOverflow: "ellipsis",
                                      maxHeight: 100,
                                      minHeight: 10,
                                      paddingTop: 15,
                                      maxWidth: "40%",
                                      minWidth: "40%",
                                      paddingBottom: 20,
                                      justifyContent: "center",
                                      marginTop: 5,
                                      marginBottom: 5,
                                    }}
                                  >
                                    More...
                                  </RouteMenuButton>
                                )}
                              </div>
                            )}
                            {playerDetailViewNum === 3 && userPlaylists && (
                              <div
                                style={{
                                  display: "flex",
                                  flexFlow: "column",
                                  maxHeight: 200,
                                  maxWidth: "100%",
                                  width: "100%",
                                  overflowY: "scroll",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                }}
                              >
                                <Typography color="white" variant="h5">
                                  Playlists
                                  {playlistPagination && (
                                    <span>
                                      {playlistPagination.currentPage} /{" "}
                                      {playlistPagination.totalPages}
                                    </span>
                                  )}
                                </Typography>
                                {userPlaylists?.previous && !fetchingLib && (
                                  <RouteMenuButton
                                    noMove={true}
                                    onClick={() => {
                                      fetchUserPlaylists(
                                        userPlaylists.offset -
                                          userPlaylists.limit
                                      );
                                    }}
                                    key={"user-playlist-prev"}
                                    style={{
                                      color: "white",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      textOverflow: "ellipsis",
                                      maxHeight: 100,
                                      minHeight: 10,
                                      paddingTop: 15,
                                      maxWidth: "40%",
                                      minWidth: "40%",
                                      paddingBottom: 20,
                                      marginTop: 5,
                                      marginBottom: 5,
                                    }}
                                  >
                                    Less...
                                  </RouteMenuButton>
                                )}
                                {!fetchingLib &&
                                  userPlaylists.items?.map((i) => (
                                    <RouteMenuButton
                                      noMove={true}
                                      onClick={() => {
                                        if (i.uri)
                                          playPlaylist(i.uri, tokenRef.current);
                                      }}
                                      key={"user-playlist-" + i.uri}
                                      style={{
                                        color: "white",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        textAlign: "left",
                                        maxHeight: 100,
                                        minHeight: 10,
                                        paddingTop: 15,
                                        maxWidth: "70%",
                                        minWidth: "70%",
                                        paddingBottom: 20,
                                        paddingLeft: 20,
                                        justifyContent: "flex-start",
                                        marginTop: 5,
                                        marginBottom: 5,
                                      }}
                                    >
                                      {i.name}
                                    </RouteMenuButton>
                                  ))}
                                {userPlaylists?.previous && !fetchingLib && (
                                  <RouteMenuButton
                                    noMove={true}
                                    onClick={() => {
                                      fetchUserPlaylists(
                                        userPlaylists.offset +
                                          userPlaylists.limit
                                      );
                                    }}
                                    key={"user-playlist-next"}
                                    style={{
                                      color: "white",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      textOverflow: "ellipsis",
                                      maxHeight: 100,
                                      minHeight: 10,
                                      paddingTop: 15,
                                      maxWidth: "40%",
                                      minWidth: "40%",
                                      paddingBottom: 20,
                                      marginTop: 5,
                                      marginBottom: 5,
                                    }}
                                  >
                                    More...
                                  </RouteMenuButton>
                                )}
                              </div>
                            )}
                            {playerDetailViewNum === 4 &&
                              nowPlayingAnalysis && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexFlow: "column",
                                    maxHeight: 200,
                                    maxWidth: "100%",
                                    width: "100%",
                                    overflowY: "scroll",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography color="white" variant="h5">
                                    Analysis
                                  </Typography>
                                  <Typography
                                    color="white"
                                    sx={{ width: "100%", maxWidth: "100%" }}
                                  >
                                    {JSON.stringify(
                                      nowPlayingAnalysis,
                                      null,
                                      2
                                    )}
                                  </Typography>
                                </div>
                              )}
                            {playerDetailViewNum === 5 && (
                              <div
                                style={{
                                  display: "flex",
                                  flexFlow: "column",
                                  maxHeight: 200,
                                  maxWidth: "100%",
                                  width: "100%",
                                  overflowY: "scroll",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                }}
                              >
                                {searchResults && (
                                  <SearchResultsList
                                    searchResults={searchResults}
                                    onClick={(uri) => {
                                      playTrack(uri, tokenRef.current);
                                    }}
                                  />
                                )}
                              </div>
                            )}
                            {(userLib || userPlaylists) &&
                              playerDetailViewNum !== 1 && (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    margin: 0,
                                    marginTop: "6px",
                                  }}
                                >
                                  <RouteMenuButton
                                    noMove={true}
                                    onClick={() => {
                                      setPlayerDetailViewNum(1);
                                    }}
                                    style={{ color: "white", marginBottom: 0 }}
                                  >
                                    Library
                                  </RouteMenuButton>
                                </div>
                              )}
                          </>
                        </AccordionDetails>
                      </Accordion>
                      {/* <button
                          onClick={() => setArtOpen(!artOpen)}
                          style={{ position: "absolute", right: 12, top: 12 }}
                        >
                          Toggle
                        </button> */}
                      <div id="controls-position-slider">
                        <p>{formatMS(playerState.track.trackPosition)}</p>
                        <input
                          type="range"
                          min={0}
                          max={playerState.track.trackDuration}
                          value={playerState.track.trackPosition}
                          onChange={(e) => {
                            const targetMS = parseInt(e.target.value, 10);
                            if (player) player.seek(targetMS);
                          }}
                        />
                        <p>{formatMS(playerState.track.trackDuration)}</p>
                      </div>
                    </div>
                  )}
                <div id="controls-buttons">
                  <button
                    className="icon-button"
                    onClick={() => player.previousTrack()}
                    style={{
                      opacity:
                        !requestingTransfer && playbackTransferred ? 1 : 0,
                      pointerEvents: playbackTransferred ? "inherit" : "none",
                    }}
                    disabled={!playbackTransferred}
                  >
                    <SkipPreviousIcon />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => play()}
                    style={{
                      opacity: !requestingTransfer ? 1 : 0,
                      pointerEvents: !requestingTransfer ? "inherit" : "none",
                    }}
                    disabled={requestingTransfer}
                  >
                    {playerState.isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => player.nextTrack()}
                    style={{
                      opacity:
                        !requestingTransfer && playbackTransferred ? 1 : 0,
                      pointerEvents: playbackTransferred ? "inherit" : "none",
                    }}
                    disabled={!playbackTransferred}
                  >
                    <SkipNextIcon />
                  </button>
                </div>
              </div>
            </Draggable>
          )}
        </div>
      )}
    </>
  );
};

export default SpotifyPlayer;
