import React from "react";
import AnimationManager from "../../lib/utils/AnimationManager";

export default ({
  animationManager,
  color = "white",
  placement = {
    vertical: "top",
    horizontal: "left",
  },
}: {
  animationManager: AnimationManager;
  color?: string;
  placement?: { vertical?: "top" | "bottom"; horizontal?: "left" | "right" };
}) => {
  const fpsAnimID: React.MutableRefObject<string> = React.useRef(null);
  const fpsDisplayRef = React.useRef<HTMLDivElement>(null);

  const averageFrameTime = 100; // Set the number of frames to average over (e.g., 100)

  const frameTimes = React.useRef([]);
  const frameTimeSum = React.useRef(0);

  const [active, setActive] = React.useState(true);

  React.useEffect(() => {
    if (fpsDisplayRef.current !== undefined && !fpsAnimID.current && active) {
      fpsAnimID.current = animationManager.addOnAnimateListener(onAnimation);
    } else if (!active && animationManager && fpsAnimID.current) {
      animationManager.removeOnAnimateListener(fpsAnimID.current);
      fpsDisplayRef.current.innerHTML = "FPS Counter Disabled. Click to Enable.";
      fpsAnimID.current = null;
    }

    return () => {
      animationManager?.removeOnAnimateListener(fpsAnimID.current);
    };
  }, [animationManager, active]);

  const onAnimation = (dtS) => {
    const fps = 1 / dtS;

    // Add the current frame time to the array
    frameTimes.current.push(dtS);
    frameTimeSum.current += dtS;

    // If the array has more frame times than the averageFrameTime, remove the oldest entry
    if (frameTimes.current.length > averageFrameTime) {
      frameTimeSum.current -= frameTimes.current.shift();
    }

    // Calculate the moving average frame rate
    const avgFPS = averageFrameTime / frameTimeSum.current;
    fpsDisplayRef.current.innerHTML = "FPS: " + avgFPS.toFixed(0);
  };

  const _place = { vertical: "top", horizontal: "left", ...placement };
  const placementStyle: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  } = {};
  placementStyle[_place.vertical] = 0;
  placementStyle[_place.horizontal] = 0;
  return (
    <div
      id="fps"
      ref={fpsDisplayRef}
      style={{ color: color, ...placementStyle }}
      onClick={() => setActive(!active)}
    ></div>
  );
};
