import * as React from "react";
import Capsule from "./Capsule";
import Tools from "../../lib/utils/Tools";
import {
  SpotifyAudioAnalysisResponse,
  SpotifyAudioAnalysisSegment,
  findCurrentPropertyFromTime,
} from "../../Spotify";
import {
  ISpotifyPlayer,
  PLAYER_CONTROLS_ZINDEX,
} from "../../Spotify/PlayerComponent";
import FPSCounter from "../../Components/UI/FPSCounter";
import AnimationManager from "../../lib/utils/AnimationManager";
import Dropdown from "../../Components/UI/Dropdown";
import { HoverCardMenu } from "../../Components/UI/HoverCard";
import {
  Box,
  Input,
  MenuItem,
  Select,
  Typography,
  FormControl,
  Slider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function SelectInputCombo() {
  const [selectValue, setSelectValue] = React.useState("");
  const [inputType, setInputType] = React.useState("text");

  const handleSelectChange = (event) => {
    const value = event.target.value;
    setSelectValue(value);
    setInputType(value);
  };

  return (
    <Box
      display="flex"
      p={2}
      alignItems="center"
      gap={2}
      sx={{ zIndex: 99999 }}
    >
      <FormControl variant="standard" sx={{ zIndex: 99999 }}>
        <Select
          value={selectValue}
          onChange={handleSelectChange}
          sx={{ zIndex: 99999 }}
        >
          <MenuItem value="text" sx={{ zIndex: 99999 }}>
            Text
          </MenuItem>
          <MenuItem value="number" sx={{ zIndex: 99999 }}>
            Number
          </MenuItem>
        </Select>
      </FormControl>
      <FormControl variant="standard" sx={{ flex: 1 }}>
        <Input type={inputType} placeholder="Enter value" disableUnderline />
      </FormControl>
    </Box>
  );
}

export default ({
  trackAnalysis,
  player,
  numSegments = 200,
  numBeats = 200,
  numTatums = 200,
  togglePlayerControls,
}: {
  togglePlayerControls?: (toggled?: boolean) => void;
  trackAnalysis?: SpotifyAudioAnalysisResponse;
  player?: ISpotifyPlayer;
  numSegments?: number;
  numBeats?: number;
  numTatums?: number;
}) => {
  const [active, setActive] = React.useState(false);
  const activeRef = React.useRef(active);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const widthRef = React.useRef<number>();
  const heightRef = React.useRef<number>();

  const ctxRef = React.useRef<CanvasRenderingContext2D>(null);

  const [capsules, setCapsules] = React.useState<Array<Capsule>>(undefined);
  const capsulesRef = React.useRef(capsules);

  const maxTimbre = React.useRef(0);
  const minTimbre = React.useRef(0);
  const minLoudness = React.useRef(0);
  const maxLoudness = React.useRef(0);

  const setPlayerEvent = React.useRef(false);
  const analysisFeatures: Array<
    "bars" | "beats" | "sections" | "segments" | "tatums"
  > = ["tatums", "beats", "segments", "bars", "sections"];
  const animatedFeatures = React.useRef(
    new Map<
      "bars" | "beats" | "sections" | "segments" | "tatums",
      Array<{ index: number; time: number }>
    >()
  );

  React.useEffect(() => {
    if (
      trackAnalysis !== undefined &&
      trackAnalysis !== null &&
      player !== undefined &&
      player !== null
    ) {
      if (!setPlayerEvent.current) {
        player["onSeek"].push(async () => {
          const state = await player.getCurrentState();
          const currentTimeS = state.position / 1000;

          animatedFeatures.current.forEach((featuresArray, key) => {
            const filteredArray = featuresArray.filter(
              (feature) => feature.time <= currentTimeS
            );
            animatedFeatures.current.set(key, filteredArray);
          });
        });
        setPlayerEvent.current = true;
      }
      // if (animMan.current)
      //   animMan.current.removeOnAnimateListener(animID.current);

      const allTimbres = trackAnalysis.segments.flatMap((s) => s.timbre);
      const allLoudness = trackAnalysis.segments.flatMap((s) => s.loudness_max);
      minLoudness.current = Math.min(...allLoudness);
      maxLoudness.current = Math.max(...allLoudness);
      minTimbre.current = Math.min(...allTimbres);
      maxTimbre.current = Math.max(...allTimbres);

      // if (animMan.current) {
      //   animID.current = animMan.current.addOnAnimateListener(update);
      // }
    }
  }, [trackAnalysis, player]);

  React.useEffect(() => {
    const onToggle = (e) => {
      // if (e.key === "Escape") {
      //   setShowingInfo(!showingInfoRef.current);
      // }
    };

    window.addEventListener("keydown", onToggle);

    return () => {
      window.removeEventListener("keydown", onToggle);

      if (animMan.current)
        animMan.current.removeOnAnimateListener(animID.current);
    };
  }, []);

  React.useEffect(() => {
    if (capsules !== undefined) {
      capsulesRef.current = capsules;

      setActive(true);
    }
  }, [capsules]);

  const [animationManager, setAnimationManager] =
    React.useState<AnimationManager>(null);
  const animMan = React.useRef<AnimationManager>(null);
  React.useEffect(() => {
    animMan.current = animationManager;
  }, [animationManager]);
  const animID = React.useRef<string>(null);

  React.useEffect(() => {
    if (
      canvasRef.current &&
      trackAnalysis &&
      (capsulesRef.current === undefined ||
        capsulesRef.current === null ||
        capsulesRef.current.length === 0)
    ) {
      ctxRef.current = canvasRef.current.getContext("2d");

      const dpr = window.devicePixelRatio || 1;
      const bsr =
        //@ts-ignore
        ctxRef.current.webkitBackingStorePixelRatio ||
        //@ts-ignore
        ctxRef.current.mozBackingStorePixelRatio ||
        //@ts-ignore
        ctxRef.current.msBackingStorePixelRatio ||
        //@ts-ignore
        ctxRef.current.oBackingStorePixelRatio ||
        //@ts-ignore
        ctxRef.current.backingStorePixelRatio ||
        1;

      const ratio = dpr / bsr;

      canvasRef.current.width = canvasRef.current.offsetWidth * ratio;
      canvasRef.current.height = canvasRef.current.offsetHeight * ratio;
      canvasRef.current.style.width = `${canvasRef.current.offsetWidth}px`;
      canvasRef.current.style.height = `${canvasRef.current.offsetHeight}px`;
      ctxRef.current.setTransform(ratio, 0, 0, ratio, 0, 0);

      heightRef.current = canvasRef.current.height;
      widthRef.current = canvasRef.current.width;

      let capsule: Capsule, x: number, y: number;
      const capsules = [];

      for (let i = 0; i < numBeats; i++) {
        x = Tools.random(0, canvasRef.current.width);
        y = Tools.random(0, canvasRef.current.height);
        capsule = new Capsule(x, y);
        // capsule.energy = 1;
        capsule.data["feature"] = ["beats"];

        // capsule.data["feature"] = ["segments"];
        capsule.data["shouldLerpEnergy"] = true;
        capsules.push(capsule);
      }

      for (let i = 0; i < numTatums; i++) {
        x = Tools.random(0, canvasRef.current.width);
        y = Tools.random(0, canvasRef.current.height);
        capsule = new Capsule(x, y);
        // capsule.energy = 1;
        capsule.data["feature"] = ["tatums"];

        // capsule.data["feature"] = ["segments"];
        capsule.data["shouldLerpEnergy"] = true;
        capsules.push(capsule);
      }

      for (let i = 0; i < numSegments; i++) {
        x = Tools.random(0, canvasRef.current.width);
        y = Tools.random(0, canvasRef.current.height);
        capsule = new Capsule(x, y);

        capsule.data["feature"] = ["segments"];
        // const segmentIndex = Math.floor(i / 12);
        const timbreIndex = i % 12;
        capsule.data["timbre"] = timbreIndex;

        // if (segmentIndex < trackAnalysis.segments.length) {
        //   const segment = trackAnalysis.segments[segmentIndex];
        //   const maxTimbre = Math.max(...segment.timbre);
        //   const minTimbre = Math.min(...segment.timbre);
        //   const normalizedTimbre = segment.timbre.map(
        //     (value) => (value - minTimbre) / (maxTimbre - minTimbre)
        //   );
        // }

        // capsule.data["feature"] = ["segments"];
        capsule.data["shouldLerpEnergy"] = true;
        capsules.push(capsule);
      }
      setCapsules(capsules);

      if (!animMan.current) {
        animMan.current = new AnimationManager();
        animID.current = animMan.current.addOnAnimateListener(update);
      }
    }

    return () => {};
  }, [canvasRef, trackAnalysis]);

  React.useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const [info, setInfo] = React.useState("");

  const [showingInfo, setShowingInfo] = React.useState(false);
  const showingInfoRef = React.useRef(showingInfo);

  React.useEffect(() => {
    showingInfoRef.current = showingInfo;
  }, [showingInfo]);

  const [menuShowing, setMenuShowing] = React.useState(false);
  const menuShowingRef = React.useRef(menuShowing);

  React.useEffect(() => {
    if (togglePlayerControls) togglePlayerControls(!menuShowing);

    menuShowingRef.current = menuShowing;
  }, [menuShowing]);

  const onEscapeDown = (e) => {
    if (e.key === "Escape") {
      setMenuShowing(!menuShowingRef.current);
    }
  };

  React.useEffect(() => {
    window.addEventListener("keydown", onEscapeDown);

    return () => {
      window.removeEventListener("keydown", onEscapeDown);

      if (animMan.current) animMan.current.clearOnAnimateListeners();
    };
  }, []);

  const [beatConfidence, setBeatConfidence] = React.useState(0.5);
  const [segmentConfidence, setSegConfidence] = React.useState(0.5);

  const beatConfidenceRef = React.useRef(beatConfidence);
  const segmentConfidenceRef = React.useRef(segmentConfidence);

  React.useEffect(() => {
    beatConfidenceRef.current = beatConfidence;
    segmentConfidenceRef.current = segmentConfidence;
  }, [beatConfidence, segmentConfidence]);

  const [transparancyModifier, setTransparencyModifier] = React.useState<
    "Constant" | "Dynamic"
  >("Dynamic");
  const [transparencyValue, setTransparencyValue] = React.useState(0.8);

  const transparancyModifierRef = React.useRef(transparancyModifier);
  const transparencyValueRef = React.useRef(transparencyValue);
  React.useEffect(() => {
    transparancyModifierRef.current = transparancyModifier;
    transparencyValueRef.current = transparencyValue;

    if (capsulesRef.current) {
      capsulesRef.current.forEach((c) => {
        if (transparancyModifierRef.current === "Dynamic") {
          c.transparencyMode = "DYNAMIC";
        } else {
          c.transparencyMode = "CONTROLLED";
          c.transparency = transparencyValueRef.current;
        }
      });
    }
  }, [transparancyModifier, transparencyValue]);

  const update = async () => {
    if (activeRef.current && ctxRef.current) {
      let paused = true;
      if (player) {
        paused = (await player.getCurrentState())?.paused;
      }
      if (trackAnalysis && player && !paused) {
        const state = await player.getCurrentState();
        const currentTimeS = state.position / 1000;

        analysisFeatures.forEach((feature) => {
          const { current, index, arr } = findCurrentPropertyFromTime(
            trackAnalysis,
            feature,
            currentTimeS
          );

          if (current) {
            if (!animatedFeatures.current.has(feature)) {
              animatedFeatures.current.set(feature, []);
            }

            if (
              !animatedFeatures.current
                .get(feature)
                .find((f) => f.index === index)
            ) {
              animatedFeatures.current
                .get(feature)
                .push({ index, time: currentTimeS });

              let capsules: Array<Capsule>;
              capsules = capsulesRef.current.filter((v) =>
                (v.data["feature"] as Array<string>).includes(feature)
              );

              if (capsules.length > 0) {
                for (const capsule of capsules) {
                  if (
                    (feature === "beats" || feature === "tatums") &&
                    current.confidence >= beatConfidenceRef.current
                  ) {
                    capsule.data["shouldLerpEnergy"] = false;
                    capsule.energy = Tools.random(
                      feature === "beats" ? 1.5 : 0.5,
                      feature === "beats" ? 2 : 1
                    );
                  }

                  if (
                    feature === "segments" &&
                    current.confidence >= segmentConfidenceRef.current
                  ) {
                    const segment = current as SpotifyAudioAnalysisSegment;

                    capsule.data["shouldLerpEnergy"] = false;

                    // if (transparancyModifierRef.current === "Dynamic") {
                    //   const normalizedLoudnessValue = Tools.normalize(
                    //     segment.loudness_max,
                    //     minLoudness.current,
                    //     maxLoudness.current,
                    //     0,
                    //     1
                    //   );

                    //   // capsule.transparency = normalizedLoudnessValue;
                    // }

                    const normalizedTimbreValue = Tools.normalize(
                      segment.timbre[capsule.data["timbre"]],
                      minTimbre.current,
                      maxTimbre.current,
                      0,
                      current.confidence > 0.35 ? 2.5 : 1
                    );

                    capsule.energy = normalizedTimbreValue;
                  }
                }
              }
            }
          }
        });
      }

      // Clear the canvas
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.offsetWidth * window.devicePixelRatio,
        canvasRef.current.offsetHeight * window.devicePixelRatio
      );

      // Draw the capsules
      let capsule: Capsule;
      for (let j = 0; j < capsulesRef.current.length; j++) {
        capsule = capsulesRef.current[j];

        if (capsule.data["shouldLerpEnergy"]) {
          capsule.energy = Tools.lerpFactor(capsule.energy, 0, 0.05);

          // if (
          //   transparancyModifierRef.current === "Dynamic" &&
          //   capsule.data["feature"].includes("segments")
          // )
          //   capsule.transparency = Tools.lerpFactor(
          //     capsule.transparency,
          //     0,
          //     0.05
          //   );
        } else {
          capsule.data["shouldLerpEnergy"] = true;
        }

        // recycle capsules
        if (capsule.y < -capsule.size * capsule.level * capsule.scale) {
          capsule.reset();
          capsule.x = Tools.random(0, canvasRef.current.width);
          capsule.y =
            canvasRef.current.height +
            capsule.size * capsule.scale * capsule.level;
          // capsule.y = Tools.random(heightRef.current);
        }

        // Move the capsule to new position
        capsule.move();
        capsule.draw(ctxRef.current);
      }
    }

    // setInfo(JSON.stringify(capsulesRef.current, null, 3));
  };

  return (
    <>
      {showingInfo && (
        <div
          style={{
            position: "absolute",
            zIndex: 10000,
            top: 0,
            left: 0,
            background: "rgba(0,0,0,.5)",
            backdropFilter: "blur(10px)",
            width: "100%",
            height: "100%",
            color: "white",
            overflow: "scroll",
            whiteSpace: "break-spaces",
          }}
        >
          {info}
        </div>
      )}
      {menuShowing && (
        <HoverCardMenu
          headerAction={
            <IconButton
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => {
                setMenuShowing(false);
              }}
            >
              <CloseIcon />
            </IconButton>
          }
          height={500}
          open={menuShowing}
          curMenu={0}
          menus={[
            {
              title: "Settings",
              content: (
                <>
                  <Box sx={{ display: "flex", flexFlow: "column" }}>
                    <div style={{ display: "flex", flexFlow: "column" }}>
                      <Typography sx={{ margin: ".5em 0" }}>
                        Visualizer Global Properties
                      </Typography>

                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <Typography
                          sx={{ margin: "0", textAlign: "left" }}
                          variant="body2"
                        >
                          Tatum Capsules
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            flexFlow: "row",
                            padding: 12,
                            justifyContent: "center",
                            justifyItems: "center",
                            alignContent: "center",
                            alignItems: "center",
                          }}
                          className="input-container"
                        >
                          <input
                            type="number"
                            id="num-tatums"
                            name="num-tatums"
                            placeholder=""
                            autoComplete="off"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          />
                          <label htmlFor="num-tatums">Amount</label>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <Typography
                          sx={{ margin: "0", textAlign: "left" }}
                          variant="body2"
                        >
                          Beat Capsules
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            flexFlow: "row",
                            padding: 12,
                            justifyContent: "center",
                            justifyItems: "center",
                            alignContent: "center",
                            alignItems: "center",
                          }}
                          className="input-container"
                        >
                          <input
                            type="number"
                            id="num-beats"
                            name="num-beats"
                            placeholder=""
                            autoComplete="off"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          />
                          <label htmlFor="num-beats">Amount</label>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <Typography
                          sx={{ margin: "0", textAlign: "left" }}
                          variant="body2"
                        >
                          Segment Capsules
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            flexFlow: "row",
                            padding: 12,
                            justifyContent: "center",
                            justifyItems: "center",
                            alignContent: "center",
                            alignItems: "center",
                          }}
                          className="input-container"
                        >
                          <input
                            type="number"
                            id="num-segments"
                            name="num-segments"
                            placeholder=""
                            autoComplete="off"
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          />
                          <label htmlFor="num-segments">Amount</label>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <Typography
                          sx={{ margin: "0", textAlign: "left" }}
                          variant="body2"
                        >
                          Beat Confidence
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            flexFlow: "row",
                            padding: 12,
                            justifyContent: "center",
                            justifyItems: "center",
                            alignContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Slider
                            aria-label="Beat Confidence"
                            valueLabelDisplay="auto"
                            step={0.1}
                            marks
                            min={0}
                            max={1}
                            slotProps={{
                              root: {
                                onMouseDown: (e) => e.stopPropagation(),
                                onTouchStart: (e) => e.stopPropagation(),
                              },
                            }}
                            value={beatConfidence}
                            onChange={(e, v) => setBeatConfidence(v as number)}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <Typography
                          sx={{ margin: "0", textAlign: "left" }}
                          variant="body2"
                        >
                          Segment Confidence
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            flexFlow: "row",
                            padding: 12,
                            justifyContent: "center",
                            justifyItems: "center",
                            alignContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Slider
                            aria-label="Segment Confidence"
                            valueLabelDisplay="auto"
                            step={0.1}
                            marks
                            min={0}
                            max={1}
                            slotProps={{
                              root: {
                                onMouseDown: (e) => e.stopPropagation(),
                                onTouchStart: (e) => e.stopPropagation(),
                              },
                            }}
                            value={segmentConfidence}
                            onChange={(e, v) => setSegConfidence(v as number)}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexFlow: "column" }}>
                        <Typography
                          sx={{ margin: "0", textAlign: "left" }}
                          variant="body2"
                        >
                          Capsule Alpha
                        </Typography>
                        <div
                          style={{
                            display: "flex",
                            flexFlow: "row",
                            alignItems: "center",
                            justifyContent:
                              transparancyModifier === "Dynamic"
                                ? "center"
                                : "normal",
                            padding: "12px",
                          }}
                        >
                          <Dropdown
                            color="black"
                            style={{
                              boxShadow: "none",
                              margin: "0",
                              marginRight:
                                transparancyModifier === "Constant" ? "1em" : 0,
                            }}
                            noBlur={true}
                            toggleText={transparancyModifier}
                            options={[
                              {
                                label: "Dynamic",
                                onClick: () => {
                                  setTransparencyModifier("Dynamic");
                                },
                              },
                              {
                                label: "Constant",
                                onClick: () => {
                                  setTransparencyModifier("Constant");
                                },
                              },
                            ]}
                          />
                          {transparancyModifier === "Constant" && (
                            <Slider
                              aria-label="Transparency"
                              valueLabelDisplay="auto"
                              step={0.1}
                              marks
                              min={0}
                              max={1}
                              value={transparencyValue}
                              slotProps={{
                                root: {
                                  onMouseDown: (e) => e.stopPropagation(),
                                  onTouchStart: (e) => e.stopPropagation(),
                                },
                              }}
                              onChange={(e, v) =>
                                setTransparencyValue(v as number)
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Box>
                </>
              ),
            },
          ]}
        />
      )}
      {animationManager && <FPSCounter animationManager={animationManager} />}
      <canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
    </>
  );
};
