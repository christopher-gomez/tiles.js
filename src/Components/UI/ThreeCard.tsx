import React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ThreeCanvas from "./ThreeCanvas";
import cardBack from "../../Assets/card back black.png";
import "./styles.css";
import Draggable from "react-draggable"; // Import the Draggable component
import AnimationManager from "../../lib/utils/AnimationManager";
import FPSCounter from "./FPSCounter";
import HoverCard from "./HoverCard";
import { SxProps } from "@mui/material";
import { Theme } from "@mui/system";

export default ({
  scene,
  camera,
  renderer,
  cameraSettings,
  onAnimate,
  obj,
  onOpen,
  onLoaded,
  render,
  children,
  clearColor,
  transparent = false,
  fps = false,

  title,
  body,
  actions,
  open,
  setOpen,
  orient = "vertical",
  animationManager,
  mediaWindowStyle = "contain",
  canRotate = true,
  cardContent,
  overrideBodyAlign,
  constrainWidth,
  mediaWindowSX = {},
  backgroundShadow = "dark",
  borderColor = "dark",
  canDrag = false,
}: {
  fps?: boolean;
  scene?: THREE.Scene | Array<THREE.Scene>;
  camera?: THREE.Camera;
  renderer?: THREE.Renderer;
  cameraSettings?: {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
    position?: THREE.Vector3;
  };
  onAnimate?: (
    dt: number,
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  obj?: THREE.Mesh | THREE.Group | THREE.Object3D;
  onOpen?: (
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;

  onLoaded?: (
    scene: THREE.Scene | THREE.Scene[],
    camera: THREE.Camera,
    renderer: THREE.Renderer,
    animationManager: AnimationManager
  ) => void;
  render?: boolean;
  children?: JSX.Element;
  clearColor?: number;
  transparent?: boolean;

  open?: boolean;
  setOpen?: (open: boolean) => void;
  title?: string;
  body?: string;
  actions?: Array<JSX.Element>;
  orient?: "vertical" | "horizontal";
  animationManager?: AnimationManager;
  mediaWindowStyle?: "cover" | "contain";
  canRotate?: boolean;
  cardContent?: JSX.Element;
  overrideBodyAlign?: boolean;
  constrainWidth?: boolean;
  mediaWindowSX?: SxProps<Theme>;
  backgroundShadow?: "dark" | "light" | "none";
  borderColor?: "dark" | "light" | "none";
  canDrag?: boolean;
}) => {
  return (
    <HoverCard
      canDrag={canDrag}
      borderColor={borderColor}
      backgroundShadow={backgroundShadow}
      open={open}
      setOpen={setOpen}
      actions={actions}
      title={title}
      body={body}
      orient={orient}
      animationManager={animationManager}
      mediaWindowStyle={mediaWindowStyle}
      constrainWidth={constrainWidth}
      canRotate={canRotate}
      cardContent={cardContent}
      overrideBodyAlign={overrideBodyAlign}
      mediaWindowSX={mediaWindowSX}
    >
      <ThreeCanvas
        scene={scene}
        obj={obj}
        camera={camera}
        cameraSettings={cameraSettings}
        onAnimate={onAnimate}
        fps={fps}
        render={render}
        onLoaded={onLoaded}
        renderer={renderer}
        onOpen={onOpen}
        transparent={transparent}
        clearColor={clearColor}
      >
        {children}
      </ThreeCanvas>
    </HoverCard>
    // </Draggable>
  );
};
